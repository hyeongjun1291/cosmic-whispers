import { DAILY_CHAT_LIMIT, type ChatRequest, type ModelReply } from './chat-contract';
import { ChatRequestError, parseChatRequest, readChatJson } from './chat-validation';
import type { Quota } from './rate-limit';

interface ChatDependencies {
    configured: boolean;
    verifyToken?: (token: string) => Promise<boolean>;
    quota: () => Promise<Quota>;
    generate: (input: ChatRequest) => Promise<ModelReply>;
}

function errorResponse(status: number, error: string, headers?: HeadersInit): Response {
    return Response.json({ error }, { status, headers });
}

export async function handleChat(request: Request, dependencies: ChatDependencies): Promise<Response> {
    if (!dependencies.configured) return errorResponse(503, 'Chat unavailable');

    let input: ChatRequest | null;
    try {
        input = parseChatRequest(await readChatJson(request));
    } catch (error) {
        return errorResponse(error instanceof ChatRequestError ? error.status : 400, 'Invalid chat request');
    }
    if (!input) return errorResponse(400, 'Invalid chat request');

    if (dependencies.verifyToken) {
        if (!input.turnstileToken) return errorResponse(400, 'Missing CAPTCHA token');
        try {
            if (!await dependencies.verifyToken(input.turnstileToken)) {
                return errorResponse(403, 'Invalid CAPTCHA token');
            }
        } catch {
            console.error('[Chat] CAPTCHA service unavailable');
            return errorResponse(503, 'Chat unavailable');
        }
    }

    let quota: Quota;
    try {
        quota = await dependencies.quota();
    } catch {
        console.error('[Chat] Quota store unavailable');
        return errorResponse(503, 'Chat unavailable');
    }
    if (!quota.allowed) {
        const retryAfter = Math.max(1, Math.ceil((quota.reset - Date.now()) / 1000));
        return Response.json(
            { error: `Daily limit of ${DAILY_CHAT_LIMIT} requests reached`, limitReached: true },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        );
    }

    try {
        const reply = await dependencies.generate(input);
        return Response.json({ ...reply, remaining: quota.remaining }, {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch {
        console.error('[Chat] Model provider failed');
        return errorResponse(502, 'Model provider unavailable');
    }
}
