import { handleChat } from '@/lib/chat-handler';
import { generateCharacterResponse } from '@/lib/groq';
import { consumeChatQuota, getRateLimitKey, hasDistributedRateLimit } from '@/lib/rate-limit';
import { isProductionTurnstileConfigured, verifyTurnstileToken } from '@/lib/turnstile';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    const production = process.env.NODE_ENV === 'production';
    const apiKey = process.env.GROQ_API_KEY;
    const secret = process.env.TURNSTILE_SECRET_KEY;

    const configured = Boolean(apiKey) && (!production || (
        hasDistributedRateLimit() && isProductionTurnstileConfigured(secret, process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
    ));

    return handleChat(request, {
        configured,
        verifyToken: secret ? token => verifyTurnstileToken(token, secret) : undefined,
        quota: () => consumeChatQuota(getRateLimitKey(request.headers, process.env.VERCEL === '1')),
        generate: input => {
            if (!apiKey) throw new Error('Missing model credentials');
            return generateCharacterResponse(apiKey, input);
        },
    });
}
