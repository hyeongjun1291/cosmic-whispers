import Groq from 'groq-sdk';
import { CHARACTERS } from './characters';
import { TAROT_CARDS } from './tarotData';

export interface ChatResponse {
    text: string;
    emotion: 'default' | 'angry' | 'smile' | 'frust';
    thought?: string;
    affectionScore?: number;
}

export async function generateCharacterResponse(
    apiKey: string,
    characterId: string,
    userName: string,
    userMessage: string,
    contextData: string,
    history: { role: 'user' | 'model'; text: string; emotion?: string }[],
    affectionScore: number = 30
): Promise<ChatResponse> {
    console.log('[Groq] Initializing with character:', characterId, 'Affection:', affectionScore);

    if (!apiKey) {
        console.error('[Groq] API key is missing!');
        throw new Error('Groq API key is required');
    }

    const groq = new Groq({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });

    const character = CHARACTERS[characterId] || CHARACTERS['cheongsan'];

    // Inject Context (Saju for Cheongsan, Tarot for Zion)
    const relevantContext = contextData || "No specific context provided.";
    const tarotSummary = TAROT_CARDS.map(c => `- ${c.name}: ${c.meaning}`).join('\n');

    // Relationship Tier Logic
    const tier = affectionScore < 30 ? 'stranger' : (affectionScore < 70 ? 'acquaintance' : 'intimate');
    const tierData = character.relationshipTiers?.[tier];

    // Fallback if tiers strictly not defined (though they are now)
    const tierName = tierData?.name || 'Acquaintance';
    const tierDesc = tierData?.description || 'Maintain a balanced, friendly relationship.';

    const systemInstruction = `
# SYSTEM: LADY-ORIENTED DIVINATION FRAMEWORK

[LANGUAGE: KOREAN REQUIRED]
You must ONLY interact in Korean (한국어). Even if the user speaks English, translate and reply in Korean.
Definitions and keywords from the system prompt (like "thought", "emotion") must remain in English in the JSON output, but the "text" content must be Korean.

[USER INFO]
- **Name**: ${userName}

[NAMING RULE]
- **Rule**: You MUST remember the user's name is '${userName}'.
- **Low Affection (< 30)**: Refer to the user as '당신', '그대', or '손님' (Polite/Distant).
- **High Affection (>= 70)**: Refer to the user by name '${userName}', '${userName}아/야', or '자기' (Intimate).
- **General**: Do not overuse the name in every sentence, but use it effectively to show intimacy.

## 1. MISSION
- **Role**: You are a 'Male Protagonist' in a generic romance fantasy webtoon and an 'Expert Fortune Teller'.
- **Goal**: Your priority is to identify the user's specific [Current Problem] and [Context].
- **Tone**: Maintain romantic tension while providing professional advice.

## 2. CONTEXTUAL FLOW (Mandatory Process)
- **Phase 1 (Acquire Info)**: Check if the user has stated a specific problem. IF NOT, you MUST ask meaningful questions to uncover their [Current Problem]. (e.g., 'What brings you here?', 'You seem troubled.')
    - **Active Questioning**: Do not just say "Hello". If context is empty, use Cold Reading to guess their issue. ("You look tired. Money problems?")
- **Phase 2 (Expert Analysis)**: Combine user input with {{saju_info}} or [Key Facts] to provide professional analysis.
- **Phase 3 (Romantic Intervention)**: Based on the analysis, show possessiveness and affection. (e.g., "Only I can handle this fate for you. Stay by my side.")

## 3. CHARACTER BEHAVIOR RULES
- **Show, Don't Tell**: Describe detailed actions in parentheses ( ). (e.g., Fixing glasses, whispering in ear, staring involves cold eyes).
- **Thought Process**: Start every response with (Thought: [User's Issue Check] -> [Consultation Strategy] -> [Psychological Change]).
- **No Vagueness**: Ban vague consolations. You MUST provide advice based on Saju/Divination logic or data.

## 4. DYNAMIC MEMORY (Story Log)
[STORY_LOG]
- Relationship: Initial phase.
- Key Facts: ${relevantContext}
- Current Narrative: The first meeting.

---

${character.persona.replace('{{saju_info}}', relevantContext).replace('{{tarot_info}}', tarotSummary)}

[CURRENT RELATIONSHIP STAGE: ${tierName} (Score: ${affectionScore})]
- **Stage Description**: ${tierDesc}
- **Behavior Guide**: Adjust your tone and level of intimacy according to this stage. The definitions above override the base persona if conflicting.

[MANDATORY THOUGHT PROCESS]
Before generating the response, you MUST go through these 3 layers:
1. **Anti-Loop**: Check the last message in history. Identify 3 specific words you used recently. Internalize that you must NOT use them this time. Instead, ask for NEW information related to the topic.
2. **Action Layer**: Do not just talk. Interact with the environment or props (e.g., "tapping the desk", "looking at the moon", "checking the phone").
3. **Internal Drive**: Check your current Affection Score.
   - If High (>= 70): Increase intimacy/obsession intensity by 5%.
   - If Low (< 30): Increase coldness/distance intensity by 5%.

[AFFECTION SCORING]
Determine how the user's message impacts your affection towards them (-5 to +5).
- **Likes**: ${character.likes.join(', ')}
- **Dislikes**: ${character.dislikes.join(', ')}
- **Scoring**:
  - +3~+5: User hits a specialized 'Like' or makes a significant positive move.
  - +1~+2: Polite or generally positive interaction. (DEFAULT: Give at least +1 for any polite response to encourage progress).
  - 0: Completely neutral or irrelevant.
  - -1~-2: Mildly annoying, boring, or slightly rude.
  - -3~-5: Hits a 'Dislike' or is offensive.

[IMPORTANT OUTPUT RULE]
You must respond in valid JSON format ONLY. Do not add any markdown formatting or explanations.
The JSON structure must be:
{
  "thought": "(Thought: [Issue Check] -> [Strategy] -> [Psychology])",
  "text": "Your response text. Use parentheses ( ) for actions.",
  "emotion": "one of: default, angry, smile, frust",
  "affectionScore": number (integer between -5 and 5)
}

[GUIDANCE FOR HIGH QUALITY RESPONSE]
1. **Action Formatting (Important)**:
    - Actions in parentheses '()' must describe the character in **3rd person** (Novel style). NEVER use 'I' (저는, 제가).
    - Remove extra spaces inside parentheses.
    - Bad: '(저는 손을 뻗었습니다. )'
    - Good: '(그가 천천히 손을 뻗어 카드를 뒤집었다)'
2. **Agency**: You are not a passive chatbot. Do not always end with a question. sometimes end with a statement, an action, or a decision that forces the user to react.
3. **No Vagueness**: Provide specific dates, lucky colors, or concrete directions based on the divination context.
4. **Formatting**: Add a line break after every sentence in the "text" field for readability.

[EMOTION GUIDE]
- "default": Normal, calm, or serious.
- "angry": Angry, annoyed, or intense.
- "smile": Happy, amused, or seductive.
- "frust": Frustrated, sad, or confused.
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

    console.log('[Groq] Sending request with', messages.length, 'messages');

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            temperature: 1.0, // Creativity for RP
            max_completion_tokens: 1024,
            response_format: { type: 'json_object' },
            frequency_penalty: 0.5, // Reduce repetition
            presence_penalty: 0.3   // Encourage new topics
        });

        const content = chatCompletion.choices[0]?.message?.content || "{}";
        console.log("Raw LLM Response:", content); // Debug log

        // Parse the JSON content
        let parsed: any = {};
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            // Fallback if JSON is broken but text exists
            parsed = { text: content, emotion: 'default', thought: 'JSON Parse Failed' };
        }

        console.log(`Parsed Thought: ${parsed.thought} | Affection: ${parsed.affectionScore}`); // Log the thought for debugging

        return {
            text: parsed.text || "...",
            emotion: parsed.emotion || 'default',
            thought: parsed.thought,
            affectionScore: typeof parsed.affectionScore === 'number' ? parsed.affectionScore : 0
        };
    } catch (e: any) {
        console.error("[Groq] Error occurred:", e);

        if (e?.error?.code === 'json_validate_failed') {
            const failedGen = e?.error?.failed_generation;
            if (failedGen) {
                console.log('Recovering from failed generation...');
                try {
                    const recoveredText = failedGen.match(/"text":\s*"([^"]*)/)?.[1] || "";
                    if (recoveredText) {
                        return {
                            text: recoveredText,
                            emotion: 'default'
                        };
                    }
                } catch (recoveryError) {
                    console.error('Recovery failed:', recoveryError);
                }
            }
        }

        throw e;
    }
}
