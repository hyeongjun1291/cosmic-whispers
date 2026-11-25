import {
    isRecord, MAX_CAPTCHA_LENGTH, MAX_CHAT_BODY_BYTES, MAX_CONTEXT_LENGTH, MAX_HISTORY_MESSAGES,
    MAX_HISTORY_MESSAGE_LENGTH, MAX_MESSAGE_LENGTH, MAX_USER_NAME_LENGTH,
    type ChatMessage, type ChatRequest,
} from './chat-contract';
import { CHARACTERS } from './characters';

export class ChatRequestError extends Error {
    constructor(readonly status: 400 | 413 | 415) {
        super('Invalid chat request');
    }
}

export async function readChatJson(request: Request): Promise<unknown> {
    const mediaType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (mediaType !== 'application/json') throw new ChatRequestError(415);

    const size = request.headers.get('content-length');
    if (size !== null && Number(size) > MAX_CHAT_BODY_BYTES) throw new ChatRequestError(413);
    if (!request.body) throw new ChatRequestError(400);

    const reader = request.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let total = 0;
    let text = '';
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > MAX_CHAT_BODY_BYTES) throw new ChatRequestError(413);
            text += decoder.decode(value, { stream: true });
        }
        return JSON.parse(text + decoder.decode()) as unknown;
    } catch (error) {
        void reader.cancel().catch(() => undefined);
        if (error instanceof ChatRequestError) throw error;
        throw new ChatRequestError(400);
    } finally {
        reader.releaseLock();
    }
}

export function parseChatRequest(value: unknown): ChatRequest | null {
    if (!isRecord(value)) return null;
    const { message, characterId, userName, context, history, affectionScore, turnstileToken } = value;
    if (typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE_LENGTH
        || typeof characterId !== 'string' || !Object.hasOwn(CHARACTERS, characterId)
        || typeof userName !== 'string' || !userName.trim() || userName.length > MAX_USER_NAME_LENGTH
        || typeof context !== 'string' || context.length > MAX_CONTEXT_LENGTH
        || typeof affectionScore !== 'number' || !Number.isInteger(affectionScore)
        || affectionScore < 0 || affectionScore > 100
        || (turnstileToken !== undefined && (typeof turnstileToken !== 'string'
            || !turnstileToken.trim() || turnstileToken.length > MAX_CAPTCHA_LENGTH))
        || !Array.isArray(history) || history.length > MAX_HISTORY_MESSAGES) return null;

    const validatedHistory: ChatMessage[] = [];
    for (const item of history) {
        if (!isRecord(item) || (item.role !== 'user' && item.role !== 'model')
            || typeof item.text !== 'string' || !item.text.trim()
            || item.text.length > MAX_HISTORY_MESSAGE_LENGTH) return null;
        validatedHistory.push({ role: item.role, text: item.text });
    }

    return { message: message.trim(), characterId, userName: userName.trim(), context,
        history: validatedHistory, affectionScore, turnstileToken };
}
