import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resetBrowserData } from '../src/lib/browser-data';
import { DAILY_CHAT_LIMIT, MAX_CHAT_BODY_BYTES, getAffectionScore } from '../src/lib/chat-contract';
import { handleChat } from '../src/lib/chat-handler';
import { parseChatRequest } from '../src/lib/chat-validation';
import { parseModelReply, recoverModelReply } from '../src/lib/model-reply';
import { createLocalRateLimiter, getRateLimitKey } from '../src/lib/rate-limit';
import { isProductionTurnstileConfigured, verifyTurnstileToken } from '../src/lib/turnstile';

const input = {
    message: '안녕하세요',
    characterId: 'zion',
    userName: '테스트',
    context: 'Selected Tarot Card: The Fool',
    history: [{ role: 'model', text: '카드를 골라주세요' }],
    affectionScore: 0,
};

function request(body: unknown = input): Request {
    return new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
}

const modelReply = { text: '반가워요', emotion: 'smile', affectionScore: 2 } as const;
const allow = async () => ({ allowed: true, remaining: 19, reset: Date.now() + 60_000 });
const generate = async () => modelReply;

test('keeps zero affection and validates character IDs and history shape', () => {
    assert.equal(getAffectionScore(0), 0);
    assert.equal(getAffectionScore(null), 30);
    assert.equal(parseChatRequest(input)?.affectionScore, 0);
    assert.equal(parseChatRequest({ ...input, characterId: 'unknown' }), null);
    assert.equal(parseChatRequest({ ...input, history: [{ role: 'system', text: 'test' }] }), null);
    assert.equal(parseChatRequest({ ...input, history: Array(16).fill(input.history[0]) }), null);
    assert.equal(parseChatRequest({ ...input, affectionScore: 101 }), null);
});

test('validates model fields and handles malformed or null responses', () => {
    assert.deepEqual(parseModelReply(JSON.stringify(modelReply)), modelReply);
    assert.deepEqual(parseModelReply('{"text":42,"emotion":"other","affectionScore":12}'),
        { text: '...', emotion: 'default', affectionScore: 0 });
    assert.deepEqual(parseModelReply('null'), { text: '...', emotion: 'default', affectionScore: 0 });
    assert.deepEqual(parseModelReply('원문 대사'), { text: '원문 대사', emotion: 'default', affectionScore: 0 });
});

test('recovers an escaped dialogue string from a provider validation failure', () => {
    const text = '그가 "안녕"이라고 말했다.\n다음 줄';
    assert.deepEqual(recoverModelReply({
        error: { code: 'json_validate_failed', failed_generation: '{"text":' + JSON.stringify(text) },
    }), { text, emotion: 'default', affectionScore: 0 });
    assert.equal(recoverModelReply({ error: { code: 'other' } }), null);
});

test('resets history and episodic memory together and leaves unrelated storage intact', () => {
    const data = new Set(['cosmic_user', 'cosmic_history', 'cosmic_character', 'cosmic_affection',
        'cosmic_episodes', 'cosmic_last_visit', 'other_app']);
    resetBrowserData({ removeItem: key => { data.delete(key); } });
    assert.deepEqual([...data], ['other_app']);
});

test('only uses a valid client IP from the configured platform', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.1', 'x-vercel-forwarded-for': '203.0.113.2' });
    assert.equal(getRateLimitKey(headers, false), 'shared');
    assert.notEqual(getRateLimitKey(headers, true), 'shared');
    assert.equal(getRateLimitKey(new Headers({ 'x-forwarded-for': '203.0.113.1' }), true), 'shared');
    assert.equal(getRateLimitKey(new Headers({ 'x-vercel-forwarded-for': 'bad-value' }), true), 'shared');
});

test('limits local calls to 20 per key and resets at UTC midnight', () => {
    let now = Date.UTC(2026, 10, 25, 23, 59);
    const limit = createLocalRateLimiter(() => now);
    for (let i = 0; i < DAILY_CHAT_LIMIT; i++) {
        const quota = limit('reader-a');
        assert.equal(quota.allowed, true);
        assert.equal(quota.remaining, DAILY_CHAT_LIMIT - i - 1);
    }
    assert.equal(limit('reader-a').allowed, false);
    assert.equal(limit('reader-b').allowed, true);
    now = Date.UTC(2026, 10, 26);
    assert.equal(limit('reader-a').remaining, 19);
});

test('production rejects missing and dummy CAPTCHA configuration', () => {
    assert.equal(isProductionTurnstileConfigured(undefined, 'example-site-key'), false);
    assert.equal(isProductionTurnstileConfigured('1x0000000000000000000000000000000AA', 'example-site-key'), false);
    assert.equal(isProductionTurnstileConfigured('example-secret', 'example-site-key'), true);
});

test('sends CAPTCHA verification to Cloudflare and treats rejection as false', async t => {
    const fetchStub = t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, init?: RequestInit) => {
        assert.equal(String(url), 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
        assert.equal(init?.method, 'POST');
        assert.ok(init?.body instanceof URLSearchParams);
        assert.equal(init.body.get('response'), 'mocked-token');
        return Response.json({ success: false });
    });
    assert.equal(await verifyTurnstileToken('mocked-token', 'mocked-secret'), false);
    assert.equal(fetchStub.mock.callCount(), 1);
});

test('rejects unconfigured, malformed and oversized API requests before external calls', async () => {
    const stop = async (): Promise<never> => assert.fail('external service was called');
    const dependencies = { configured: true, verifyToken: stop, quota: stop, generate: stop };
    assert.equal((await handleChat(request(), { ...dependencies, configured: false })).status, 503);
    assert.equal((await handleChat(request({ ...input, message: '   ' }), dependencies)).status, 400);
    const large = request('가'.repeat(MAX_CHAT_BODY_BYTES));
    assert.equal(large.headers.has('content-length'), false);
    assert.equal((await handleChat(large, dependencies)).status, 413);
});

test('requires a valid CAPTCHA before quota or model access', async () => {
    const stop = async (): Promise<never> => assert.fail('quota or model was called');
    const dependencies = { configured: true, verifyToken: async () => false, quota: stop, generate: stop };
    assert.equal((await handleChat(request(), dependencies)).status, 400);
    assert.equal((await handleChat(request({ ...input, turnstileToken: 'mocked-token' }), dependencies)).status, 403);
});

test('returns Retry-After on rate-limit rejection and never calls the model', async () => {
    const response = await handleChat(request(), {
        configured: true,
        quota: async () => ({ allowed: false, remaining: 0, reset: Date.now() + 60_000 }),
        generate: async () => assert.fail('model was called'),
    });
    assert.equal(response.status, 429);
    assert.ok(Number(response.headers.get('retry-after')) > 0);
});

test('fails closed when quota storage fails, and keeps provider errors out of the response', async () => {
    const quotaError = await handleChat(request(), {
        configured: true,
        quota: async () => { throw new Error('private Redis error'); },
        generate: async () => assert.fail('model was called'),
    });
    assert.equal(quotaError.status, 503);
    assert.deepEqual(await quotaError.json(), { error: 'Chat unavailable' });

    const modelError = await handleChat(request(), {
        configured: true, quota: allow,
        generate: async () => { throw new Error('private provider error'); },
    });
    assert.equal(modelError.status, 502);
    assert.deepEqual(await modelError.json(), { error: 'Model provider unavailable' });
});

test('returns a validated request to the model and marks the reply no-store', async () => {
    const response = await handleChat(request(), {
        configured: true, quota: allow,
        generate: async value => {
            assert.equal(value.affectionScore, 0);
            return generate();
        },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { ...modelReply, remaining: 19 });
});
