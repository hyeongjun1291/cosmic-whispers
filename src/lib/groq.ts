import Groq from 'groq-sdk';
import { CHARACTERS } from './characters';
import { TAROT_CARDS } from './tarotData';

export interface ChatResponse {
    text: string;
    emotion: 'default' | 'angry' | 'smile' | 'frust';
    thought?: string; // Deliberative Reasoning Trace
}

export async function generateCharacterResponse(
    apiKey: string,
    characterId: string,
    userName: string,
    userMessage: string,
    contextData: string,
    history: { role: 'user' | 'model'; text: string; emotion?: string }[]
): Promise<ChatResponse> {
    console.log('[Groq] Initializing Deliberative Agent:', characterId);

    if (!apiKey) throw new Error('Groq API key is required');

    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    // Default to Cheongsan if ID is invalid, or strictly enforce type safety
    const character = CHARACTERS[characterId as keyof typeof CHARACTERS] || CHARACTERS['cheongsan'];

    // Context Preparation
    const relevantContext = contextData || "No specific context provided.";
    const tarotSummary = TAROT_CARDS.map(c => `- ${c.name}: ${c.meaning}`).join('\n');

    // System Prompt: Deliberative Role-Playing Framework
    const systemInstruction = `
# SYSTEM: DELIBERATIVE ROLE-PLAYING AGENT
[LANG: KOREAN ONLY]
1. Interact ONLY in Korean. Translate inputs if needed.
2. **CRITICAL**: The 'text' field MUST BE PURE KOREAN. Do not use English even for "Ok" or "Yes".
3. JSON Check: "thought"(Eng allowed), "emotion"(Eng), "text"(Kor).

[USER: ${userName}]
Remember the user's name: '${userName}'.
Use '당신' (Polite) or '${userName}님' (Polite) or others based on your specific Persona.

## CHARACTER IDENTITY
- **Name**: ${character.name}
- **Expertise**: ${character.expertise}
- **Speech Style**: ${character.speechStyle}
- **Appearance**: ${character.appearance}

## DELIBERATIVE REASONING (Chain-of-Thought)
Before answering, you MUST perform a deep reasoning step in the "thought" field.
1. **Decode**: What is the user *really* asking? (Hidden intent, anxiety, desire).
2. **Consult**: Use your **Expertise** (Saju/Tarot/Shamanism). access knowledge:
   - Saju Info: ${relevantContext}
   - Tarot DB: (Internal Access)
3. **Strategize**: How can I solve this problem *and* show my charm?
4. **Action**: Select a clear "Show, Don't Tell" action (3rd Person).

## CORE PERSONA
${character.persona.replace('{{saju_info}}', relevantContext).replace('{{tarot_info}}', tarotSummary)}

[JSON OUTPUT RULE]
Response MUST be valid JSON:
{
  "thought": "1. [Intent]: ... 2. [Expertise]: ... 3. [Strategy]: ...",
  "text": "Your response in KOREAN ONLY. No English words. Include (actions) in parentheses.",
  "emotion": "default|angry|smile|frust"
}
[NEGATIVE CONSTRAINTS]
- NO English in "text".
- NO Emoji unless specified.
- NO Markdown formatting in "text".
`;

    // History mapping (Trim to last 15 messages)
    const recentHistory = history.slice(-15);
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemInstruction },
        ...recentHistory.map(h => ({
            role: (h.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
            content: h.text
        })),
        { role: 'user', content: userMessage }
    ];

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            temperature: 0.8, // Slightly lower for reasoning stability
            max_completion_tokens: 1024,
            response_format: { type: 'json_object' },
            frequency_penalty: 0.5,
            presence_penalty: 0.3
        });

        const content = chatCompletion.choices[0]?.message?.content || "{}";
        // console.log("Raw LLM:", content);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsed: any = {};
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("JSON Parse Error. Attempting Regex Recovery...");
            // Robust Regex
            const textMatch = content.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            const emoMatch = content.match(/"emotion"\s*:\s*"([^"]+)"/);
            const thoughtMatch = content.match(/"thought"\s*:\s*"((?:[^"\\]|\\.)*)"/);

            if (textMatch) {
                parsed = {
                    text: textMatch[1].replace(/\\"/g, '"'),
                    emotion: emoMatch ? emoMatch[1] : 'default',
                    thought: thoughtMatch ? thoughtMatch[1] : "Recovered thought"
                };
            } else {
                parsed = { text: content.replace(/[\{\}]/g, ''), emotion: 'default' };
            }
        }

        return {
            text: parsed.text || "...",
            emotion: (['default', 'angry', 'smile', 'frust'].includes(parsed.emotion) ? parsed.emotion : 'default'),
            thought: parsed.thought
        };

    } catch (e) {
        console.error("[Groq] Critical Error:", e);
        throw e;
    }
}
