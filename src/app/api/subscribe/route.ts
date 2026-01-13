import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
        }

        // Google Sheets Webhook URL (Apps Script)
        const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

        if (webhookUrl) {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    timestamp: new Date().toISOString(),
                    source: 'cosmic-whispers'
                })
            });
        }

        // Also log to Vercel
        console.log('[Email Subscription]', {
            email,
            timestamp: new Date().toISOString(),
            ip: req.headers.get("x-forwarded-for")?.split(',')[0] || 'unknown'
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Email API Error]', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
