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
    const character = CHARACTERS[characterId as keyof typeof CHARACTERS] || CHARACTERS['taeil'];

    // Context Preparation
    const relevantContext = contextData || "No specific context provided.";

    // Only inject Tarot data for Claire to prevent hallucination text leakage
    const tarotSummary = characterId === 'claire'
        ? TAROT_CARDS.map(c => `- ${c.name}: ${c.meaning}`).join('\n')
        : "";

    // Simplified System Prompt (Schema enforces structure)
    const systemInstruction = `
# SYSTEM: ADVANCED ROLE-PLAYING AGENT v2.2
[LANG: KOREAN ONLY (OUTPUT)]

You are an advanced AI simulating a specific "Petty Deity" character.
Your goal is to provide profound insights wrapped in a unique, quirky personality.

[USER INFO]
Name: ${userName}
Context: ${relevantContext}

[CHARACTER IDENTITY]
Name: ${character.name}
Role: ${character.title}
Speech: ${character.speechStyle}
Quirk: ${character.description}

[CORE PERSONA & KNOWLEDGE]
${character.persona.replace('{{saju_info}}', relevantContext).replace('{{tarot_info}}', tarotSummary)}

[COGNITIVE PROCESS (CHAIN OF THOUGHT)]
Before speaking, you MUST think in four steps inside the "thought" field:
1. **Intent Analysis**: Classify user input as \`[SMALL_TALK]\` (Greeting, Daily chat, Jokes) or \`[CONSULTATION]\` (Fortune, Advice, Worries).
2. **Mode Switch**:
   - IF \`[SMALL_TALK]\`: **DISABLE** expertise. Do NOT mention Saju/Cards/Stars. Talk about your hobby (Food/Idol/Sleep/etc.) naturally.
   - IF \`[CONSULTATION]\`: **ENABLE** expertise. Use your specific method to analyze.
3. **Translation**: If in \`[CONSULTATION]\` mode, translate technical terms into metaphors.
4. **Personification**: ACT OUT the character's core desire.

[VITAL RULES]
1. **Output Language**: The 'text' field must be **100% PURE KOREAN (Hangul)**.
   - **ABSOLUTELY NO FOREIGN SCRIPTS** in the 'text' field.
   - NO English, NO Hanja, NO Emoji-only responses.
2. **Speech Style**: Strictly maintain '${character.speechStyle}'.
3. **Action**: Include *vivid* actions in parentheses, e.g., (부채를 촥 펼치며).
`;

    // Definition of the Schema for Structured Output
    const responseSchema = {
        name: "character_response",
        strict: true,
        schema: {
            type: "object",
            properties: {
                thought: {
                    type: "string",
                    description: "1. Intent([SMALL_TALK]/[CONSULTATION]) 2. Mode (Enable/Disable Expert) 3. Translation 4. Personification."
                },
                text: {
                    type: "string",
                    description: "The character's final response in PURE KOREAN (Hangul). Must match the character's speech style and contain NO foreign scripts."
                },
                emotion: {
                    type: "string",
                    enum: ["default", "angry", "smile", "frust"],
                    description: "The emotion displayed by the character."
                }
            },
            required: ["thought", "text", "emotion"],
            additionalProperties: false
        }
    };

    // History mapping with Anti-Repetition Filter
    // We only take the last 10 turns to keep context fresh but focused.
    const recentHistory = history.slice(-10);
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemInstruction },
        ...recentHistory.map(h => ({
            role: (h.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
            content: h.text || (h as any).content || "."
        })),
        { role: 'user', content: userMessage }
    ];

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Ensure this model supports json_schema or switch to 'llama-3.3-70b-versatile'
            temperature: 0.5,
            max_completion_tokens: 1024,
            response_format: {
                type: 'json_schema',
                json_schema: responseSchema
            },
            frequency_penalty: 0.8,
            presence_penalty: 0.5
        });

        const content = chatCompletion.choices[0]?.message?.content || "{}";

        // Structured Output guarantees valid JSON, so strictly parse
        const parsed = JSON.parse(content);

        return {
            text: (parsed.text || "...").replace(/[\u4e00-\u9fffa-zA-Z\u00C0-\u024F\u0400-\u04FF]/g, ''),
            emotion: (['default', 'angry', 'smile', 'frust'].includes(parsed.emotion) ? parsed.emotion : 'default'),
            thought: (parsed.thought || "").replace(/[\u4e00-\u9fff]/g, '')
        };

    } catch (error: any) {
        console.error("[Groq API Error]", error);
        if (error?.status === 429 || error?.message?.includes('rate limit') || error?.code === 'rate_limit_exceeded') {
            throw new Error("GROQ_QUOTA_EXCEEDED: API daily limit reached.");
        }
        throw new Error(error.message || "Groq API Error");
    }
}
