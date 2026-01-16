import { type NextRequest, NextResponse } from "next/server";
import { generateCharacterResponse } from "@/lib/groq";
import { analyzeSaju } from "@/lib/saju";
import { CHARACTERS } from "@/lib/characters";

// RESTORED ARCHITECTURE
// Using src/lib/groq.ts for prompt logic.
// Logic libraries (Astrology, etc.) are currently COMMENTED OUT to prevent 500 crashes.

export async function POST(req: NextRequest) {
    console.log("[API] Chat Request - Architecture Restored");

    try {
        const body = await req.json();
        const { message, characterId, userName, history, ichingResult, obanggiResult, soulResult } = body;

        const apiKey = process.env.GROQ_API_KEY || "";
        if (!apiKey) {
            return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
        }

        // Logic Injection (Correctly using analyzeSaju for rich Korean report)
        let sajuStr = "데이터 없음";

        // [STRICT CONTEXT ISOLATION]
        // Only Taeil (and potentially specific future characters) should see the full Saju report.
        // Everyone else gets a sanitized context to prevent hallucination/leakage.
        const canAccessSaju = characterId === 'taeil';

        if (body.saju && canAccessSaju) {
            try {
                // Ensure we reconstruct any missing prototypes or just pass the raw struct 
                // as analyzeSaju expects SajuData shape.
                sajuStr = analyzeSaju(body.saju);
                console.log("[API] Generated Saju Report for Taeil:", sajuStr.substring(0, 50) + "...");
            } catch (e) {
                console.error("[API] Failed to analyze saju:", e);
                sajuStr = "사주 분석 중 오류 발생";
            }
        } else if (!canAccessSaju) {
            sajuStr = "접근 권한 없음 (This character cannot read Saju data).";
        }

        // Improved Card Detection (Handles both English legacy and new Korean format)
        // Look for recent messages from USER that contain 'Card' or '카드'
        const lastUserMsg = body.history.filter((h: any) => h.role === 'user').pop();
        const cardContext = lastUserMsg && (lastUserMsg.text.includes("Card") || lastUserMsg.text.includes("카드"))
            ? lastUserMsg.text
            : "No card selected in this turn.";

        // Build context based on permissions
        let logicContext = "";

        if (canAccessSaju) {
            logicContext = `
[USER SAJU DATA (Korean Native Report)]
${sajuStr}

[CURRENT SITUATION]
Saju Input: ${JSON.stringify(body.sajuInput) || "Unknown"}
`;
        } else if (characterId === 'claire') {
            // SPECIAL CONTEXT FOR CUCKOO (TAROT)
            logicContext = `
[TAROT SESSION CONTEXT]
The user has JUST selected a specific Tarot card. 
User's Input/Card: "${cardContext}"

[INSTRUCTION]
1. You must interpret ONLY the card mentioned above in "User's Input".
2. Do **NOT** simulate drawing a new card. The card is already on the table.
3. Interpret the meaning of that specific card for the user's situation.
`;
        } else {
            logicContext = `
[CONTEXT]
(Saju Data Hidden: Ask Taei for Saju analysis)
`;
        }

        // Common Context (Tarot/etc can be added here if needed, or filtered similarly)
        // For now, only Taeil gets the heavy Saju context.

        // [NEW] Logic Injection for Other Characters
        if (characterId === 'hyeonryeong' && ichingResult) {
            logicContext = `
[I CHING HEXAGRAM (Main Fortune)]
The user's current time-based fate calculation:
- Hexagram: ${ichingResult.originalHex} -> ${ichingResult.changedHex}
- Meaning: ${ichingResult.meaning}

[INSTRUCTION]
Interpret this Hexagram as a metaphor for the user's situation.
Use "Old Man" tone (Ha-o che). Quote the I Ching loosely.
`;
        } else if (characterId === 'hwaju' && obanggiResult) {
            logicContext = `
[OBANGGI (Shaman Flag) RESULT]
The user just pulled this flag:
- Flag: ${obanggiResult.flagName} (Color: ${obanggiResult.flagColor})
- Direction: ${obanggiResult.direction}
- Meaning: ${obanggiResult.meaning}

[INSTRUCTION]
This is a divine sign. Interpret strictly based on this flag.
Use "Shaman Girl" tone (Hwaju). Be dramatic. "Oh my! You pulled blue!"
`;
        } else if (characterId === 'anu' && soulResult) {
            logicContext = `
[SOUL WEIGHT (Numerology) RESULT]
User's spiritual weight based on Name/Date:
- Weight: ${soulResult.mg} mg
- Verdict: ${soulResult.verdict}
- Anu's Reaction: "${soulResult.reaction}"

[INSTRUCTION]
You are Anu (Cat God). React to this soul weight.
- If Light (Risk of flying away): "Too light! You need some 'heavy' love (or snacks) to stay grounded."
- If Balanced: "Perfectly balanced. Maat is pleased."
- If Heavy (Burdened): **DO NOT SCOLD.** The user is in pain.
  - Acknowledge the heaviness of their words.
  - Offer deep empathy and comfort. "I will share this weight with you."
  - Be a Tsundere: "I guess I can let you lean on my golden fur... just for today."
`;
        }

        if (!canAccessSaju) {
            let method = "Intuition";
            if (characterId === 'claire') method = "Tarot Cards";
            else if (characterId === 'hyeonryeong') method = "I Ching (Coin Toss)";
            else if (characterId === 'hwaju') method = "Shamanic Flags (Obanggi)";
            else if (characterId === 'anu') method = "Decision Making (The Gavel of Judgment)";
            else if (characterId === 'selene') method = "Astrology (Star Tasting)";

            // [Dynamic Domain Referral System]
            const domains = [
                { id: 'taeil', name: '태이', keywords: ['사주', '명리', '만세력', '팔자'], label: 'Saju' },
                { id: 'claire', name: '클레어', keywords: ['타로', '카드', '스프레드'], label: 'Tarot' },
                { id: 'hyeonryeong', name: '현령', keywords: ['주역', '매화역수', '육효', '점괘', '동전'], label: 'I Ching' },
                { id: 'hwaju', name: '화주', keywords: ['신점', '무속', '오방기', '굿', '살풀이'], label: 'Shamanism' },
                { id: 'selene', name: '셀레네', keywords: ['점성술', '별자리', '행성', '호로스코프'], label: 'Astrology' },
                { id: 'anu', name: '아누', keywords: ['결정', '선택', '판결', '골라줘', '고민'], label: 'Decision Judge' }
            ];

            const ruleList = domains
                .filter(d => d.id !== characterId)
                .map(d => `- IF user specifically mentions "${d.keywords.join(', ')}": Stop and say "That is ${d.name}'s expertise. Please ask ${d.name}."`)
                .join('\n');

            logicContext += `
[CROSS-DOMAIN REFERRAL PROTOCOL]
1. **General Topics** (Wealth, Love, Health, Daily Luck):
   - These are shared topics. ANSWER them using YOUR method ([${method}]).
   - Do NOT refer to others.

2. **Specific Restricted Keywords**:
   If the user uses these SPECIFIC DOMAIN TERMS, you must refer them:
${ruleList}

   - Example: If you are NOT Claire, and user asks for "Tarot", say "타로는 클레어에게 물어봐."
`;

        }

        const response = await generateCharacterResponse(
            apiKey,
            characterId || 'taeil',
            userName || 'Guest',
            message || "...",
            logicContext,
            history || []
        );

        return NextResponse.json({
            text: response.text,
            emotion: response.emotion,
            thought: response.thought,
            remaining: 999
        });

    } catch (error: any) {
        console.error("[Route Error]", error);
        console.error("[Route Error] Stack:", error.stack); // Added: Log stack trace
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined // Added: Include stack in dev
        }, { status: 500 });
    }
}
