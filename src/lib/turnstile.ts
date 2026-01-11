export async function verifyTurnstileToken(token: string): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
        console.error("Server Error: TURNSTILE_SECRET_KEY is not set.");
        return false;
    }

    // Cloudflare 테스트 키 처리 (항상 통과)
    const TEST_SECRET_KEYS = [
        '1x0000000000000000000000000000000AA',
        '2x0000000000000000000000000000000AA',
        '3x0000000000000000000000000000000AA'
    ];

    if (TEST_SECRET_KEYS.includes(secretKey)) {
        console.log('[Turnstile] Using test key - auto pass');
        return true;
    }

    try {
        const formData = new FormData();
        formData.append('secret', secretKey);
        formData.append('response', token);

        const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        });

        const outcome = await result.json();
        console.log('[Turnstile] Verification result:', outcome.success);
        return outcome.success;
    } catch (e) {
        console.error("Turnstile Verification Error:", e);
        return false;
    }
}
