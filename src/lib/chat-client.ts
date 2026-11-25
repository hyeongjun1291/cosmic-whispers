'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    DAILY_CHAT_LIMIT, isChatReply, MAX_CHAT_BODY_BYTES, MAX_CONTEXT_LENGTH, MAX_HISTORY_MESSAGES,
    MAX_HISTORY_MESSAGE_LENGTH, type ChatRequest,
} from './chat-contract';

const CAPTCHAS_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export class ChatClientError extends Error {
    constructor(readonly status: number, message: string) {
        super(message);
    }
}

function formatRequest(input: ChatRequest): string {
    const history = input.history.slice(-MAX_HISTORY_MESSAGES).map(({ role, text }) => ({
        role, text: text.slice(0, MAX_HISTORY_MESSAGE_LENGTH),
    }));
    const data = { ...input, context: input.context.slice(0, MAX_CONTEXT_LENGTH), history };
    let body = JSON.stringify(data);
    const encoder = new TextEncoder();
    while (history.length && encoder.encode(body).length > MAX_CHAT_BODY_BYTES) {
        history.shift();
        body = JSON.stringify(data);
    }
    return body;
}

export function useChatClient(resetWidget: () => void) {
    const token = useRef<string | undefined>(undefined);
    const inFlight = useRef<AbortController | null>(null);
    const [ready, setReady] = useState(!CAPTCHAS_ENABLED);

    const setToken = useCallback((value?: string) => {
        token.current = value;
        setReady(!CAPTCHAS_ENABLED || Boolean(value));
    }, []);

    const cancel = useCallback(() => inFlight.current?.abort(), []);
    useEffect(() => cancel, [cancel]);

    const request = useCallback(async (input: Omit<ChatRequest, 'turnstileToken'>) => {
        if (inFlight.current) throw new ChatClientError(409, '이전 답변을 기다려 주세요.');
        const turnstileToken = token.current;
        if (CAPTCHAS_ENABLED && !turnstileToken) {
            throw new ChatClientError(403, '보안 확인이 준비되면 다시 보내 주세요.');
        }

        const controller = new AbortController();
        inFlight.current = controller;
        setToken();
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: formatRequest({ ...input, turnstileToken }),
                signal: controller.signal,
            });
            if (!response.ok) {
                const message = response.status === 429
                    ? `하루 대화 가능 횟수(${DAILY_CHAT_LIMIT}회)를 초과했습니다.`
                    : response.status === 403
                        ? '보안 확인이 만료됐어요. 잠시 후 다시 보내 주세요.'
                        : '지금 답변을 가져올 수 없어요. 잠시 후 다시 시도해 주세요.';
                throw new ChatClientError(response.status, message);
            }

            const data: unknown = await response.json();
            if (!isChatReply(data)) throw new ChatClientError(502, '대화 응답 형식이 올바르지 않습니다.');
            if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
            return data;
        } finally {
            inFlight.current = null;
            if (CAPTCHAS_ENABLED) resetWidget();
        }
    }, [resetWidget, setToken]);

    return { request, ready, setToken, cancel };
}
