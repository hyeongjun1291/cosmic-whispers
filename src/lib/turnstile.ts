import { isRecord } from './chat-contract';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TEST_SECRET_KEYS = new Set([
    '1x0000000000000000000000000000000AA',
    '2x0000000000000000000000000000000AA',
    '3x0000000000000000000000000000000AA',
]);

export function isProductionTurnstileConfigured(secret?: string, siteKey?: string): boolean {
    return Boolean(secret && !TEST_SECRET_KEYS.has(secret)
        && siteKey && !/^[123]x0{20,}/.test(siteKey));
}

export async function verifyTurnstileToken(token: string, secretKey: string): Promise<boolean> {
    const result = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        body: new URLSearchParams({ secret: secretKey, response: token }),
        signal: AbortSignal.timeout(4000),
    });
    if (!result.ok) throw new Error('Turnstile service unavailable');
    const outcome: unknown = await result.json();
    return isRecord(outcome) && outcome.success === true;
}
