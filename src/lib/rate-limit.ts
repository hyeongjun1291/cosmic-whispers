import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { DAILY_CHAT_LIMIT } from './chat-contract';

const DAY_MS = 86_400_000;

export interface Quota {
    allowed: boolean;
    remaining: number;
    reset: number;
}

export function getRateLimitKey(headers: Headers, vercel: boolean): string {
    const ip = vercel ? headers.get('x-vercel-forwarded-for')?.trim() : undefined;
    return ip && isIP(ip) ? createHash('sha256').update(ip).digest('hex') : 'shared';
}

export function createLocalRateLimiter(now = Date.now) {
    let day = -1;
    const counts = new Map<string, number>();
    return (key: string): Quota => {
        const currentDay = Math.floor(now() / DAY_MS);
        if (day !== currentDay) {
            counts.clear();
            day = currentDay;
        }
        const count = counts.get(key) ?? 0;
        const allowed = count < DAILY_CHAT_LIMIT;
        if (allowed) counts.set(key, count + 1);
        return {
            allowed,
            remaining: Math.max(0, DAILY_CHAT_LIMIT - count - (allowed ? 1 : 0)),
            reset: (currentDay + 1) * DAY_MS,
        };
    };
}

const localLimit = createLocalRateLimiter();
let distributedLimit: Ratelimit | undefined;

export function hasDistributedRateLimit(): boolean {
    return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function consumeChatQuota(key: string): Promise<Quota> {
    if (!hasDistributedRateLimit()) {
        if (process.env.NODE_ENV === 'production') throw new Error('Missing chat quota store');
        return localLimit(key);
    }

    distributedLimit ??= new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.fixedWindow(DAILY_CHAT_LIMIT, '1 d'),
        prefix: `cosmic-whispers:chat:${process.env.VERCEL_ENV ?? process.env.NODE_ENV}`,
        timeout: 2500,
        analytics: false,
        ephemeralCache: false,
    });
    const quota = await distributedLimit.limit(key);
    if (quota.reason === 'timeout') throw new Error('Chat quota store timed out');

    return { allowed: quota.success, remaining: quota.remaining, reset: quota.reset };
}
