import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRemainingRequests } from "@/lib/rate-limit";
import { generateCharacterResponse } from "@/lib/groq";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(req: NextRequest) {
    // 1. Get IP Address for Rate Limiting
    let ip = req.headers.get("x-forwarded-for") || "unknown_ip";
    if (ip.includes(',')) ip = ip.split(',')[0];

    // 2. Check Rate Limit
    const isAllowed = checkRateLimit(ip);
    const remaining = getRemainingRequests(ip);

    if (!isAllowed) {
        return NextResponse.json({
            error: "Rate limit exceeded. You can only send 20 messages per day.",
            limitReached: true
        }, { status: 429 });
    }

    try {
        const body = await req.json();
        const { message, characterId, context, history, turnstileToken } = body;

        // 3. Verify Turnstile Token
        if (process.env.TURNSTILE_SECRET_KEY) {
            if (!turnstileToken) {
                return NextResponse.json({ error: "Missing CAPTCHA token" }, { status: 400 });
            }
            const isValidToken = await verifyTurnstileToken(turnstileToken);
            if (!isValidToken) {
                return NextResponse.json({ error: "Invalid CAPTCHA token" }, { status: 403 });
            }
        }

        const apiKey = process.env.GROQ_API_KEY || "";
        if (!apiKey) {
            return NextResponse.json({ error: "Server Configuration Error: API Key missing" }, { status: 500 });
        }

        const response = await generateCharacterResponse(apiKey, characterId, message, context, history);

        return NextResponse.json({
            text: response.text,
            emotion: response.emotion,
            remaining
        });

    } catch (error) {
        console.error("[Chat API] Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
