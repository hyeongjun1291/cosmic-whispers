export const DAILY_CHAT_LIMIT = 20;
export const MAX_CHAT_BODY_BYTES = 128 * 1024;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_CONTEXT_LENGTH = 12000;
export const MAX_HISTORY_MESSAGES = 15;
export const MAX_HISTORY_MESSAGE_LENGTH = 4000;
export const MAX_USER_NAME_LENGTH = 80;
export const MAX_CAPTCHA_LENGTH = 2048;
export const DEFAULT_AFFECTION = 30;

const EMOTIONS = ['default', 'angry', 'smile', 'frust'] as const;
export type Emotion = (typeof EMOTIONS)[number];

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    emotion?: Emotion;
}

export interface ChatRequest {
    message: string;
    characterId: string;
    userName: string;
    context: string;
    history: ChatMessage[];
    affectionScore: number;
    turnstileToken?: string;
}

export interface ModelReply {
    text: string;
    emotion: Emotion;
    affectionScore: number;
}

export interface ChatReply extends ModelReply {
    remaining: number;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isEmotion(value: unknown): value is Emotion {
    return EMOTIONS.some(emotion => emotion === value);
}

export function isChatReply(value: unknown): value is ChatReply {
    return isRecord(value)
        && typeof value.text === 'string' && value.text.length > 0
        && isEmotion(value.emotion)
        && typeof value.affectionScore === 'number' && Number.isInteger(value.affectionScore)
        && Math.abs(value.affectionScore) <= 5
        && typeof value.remaining === 'number' && Number.isInteger(value.remaining)
        && value.remaining >= 0;
}

export function getAffectionScore(value: unknown): number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100
        ? value : DEFAULT_AFFECTION;
}
