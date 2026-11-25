import { isEmotion, isRecord, MAX_HISTORY_MESSAGE_LENGTH, type ModelReply } from './chat-contract';

const FALLBACK = { text: '...', emotion: 'default', affectionScore: 0 } as const;

function boundedText(value: unknown): string {
    return typeof value === 'string' && value.trim() ? value.trim().slice(0, MAX_HISTORY_MESSAGE_LENGTH) : FALLBACK.text;
}

export function parseModelReply(content: string): ModelReply {
    let parsed: unknown;
    try {
        parsed = JSON.parse(content);
    } catch {
        return { ...FALLBACK, text: boundedText(content) };
    }
    if (!isRecord(parsed)) return { ...FALLBACK };

    const delta = parsed.affectionScore;
    return {
        text: boundedText(parsed.text),
        emotion: isEmotion(parsed.emotion) ? parsed.emotion : 'default',
        affectionScore: typeof delta === 'number' && Number.isInteger(delta) && Math.abs(delta) <= 5 ? delta : 0,
    };
}

export function recoverModelReply(error: unknown): ModelReply | null {
    if (!isRecord(error) || !isRecord(error.error) || error.error.code !== 'json_validate_failed'
        || typeof error.error.failed_generation !== 'string') return null;
    // Match a complete JSON string so escaped quotes and newlines remain intact.
    const encoded = error.error.failed_generation.match(/"text"\s*:\s*("(?:[^"\\]|\\.)*")/)?.[1];
    if (!encoded) return null;
    try {
        const decoded: unknown = JSON.parse(encoded);
        return typeof decoded === 'string' && decoded.trim()
            ? { ...FALLBACK, text: boundedText(decoded) } : null;
    } catch {
        return null;
    }
}
