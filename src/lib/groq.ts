import Groq from 'groq-sdk';
import { CHARACTERS } from './characters';

export interface ChatResponse {
    text: string;
    emotion: 'default' | 'angry' | 'smile' | 'frust';
}

export async function generateCharacterResponse(
    apiKey: string,
    characterId: string,
    userMessage: string,
    sajuSummary: string,
    history: { role: 'user' | 'model'; text: string; emotion?: string }[]
): Promise<ChatResponse> {
    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

    const character = CHARACTERS[characterId] || CHARACTERS['cheongsan'];

    const basePersona = character.persona.replace('{{saju_info}}', sajuSummary);

    const systemInstruction = `
${basePersona}

[IMPORTANT OUTPUT RULE]
You must respond in valid JSON format ONLY. Do not add any markdown formatting or explanations.
The JSON structure must be:
{
  "text": "Your response text here",
  "emotion": "one of: default, angry, smile, frust"
}

- "default": Normal, calm, or serious.
- "angry": Angry, annoyed, or intense.
- "smile": Happy, amused, or seductive.
- "frust": Frustrated, sad, or confused.
`;

    // History mapping: Just use text to keep context simple
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemInstruction },
        ...history.map(h => ({
            role: (h.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
            content: h.text
        })),
        { role: 'user', content: userMessage }
    ];

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: 'moonshotai/kimi-k2-instruct-0905',
            temperature: 0.7,
            max_completion_tokens: 4096,
            response_format: { type: 'json_object' }
        });

        const rawContent = chatCompletion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(rawContent);

        return {
            text: parsed.text || "...",
            emotion: parsed.emotion || 'default'
        };
    } catch (e) {
        console.error("JSON Parse Error or API Error", e);
        // Fallback if model fails to output JSON (or if model is strictly plain text)
        // We can try to guess or just default
        return {
            text: "...",
            emotion: 'default'
        };
    }
}
