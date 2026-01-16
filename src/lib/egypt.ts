import { getWesternState } from './astrology';

export interface SoulWeight {
    mg: number;      // Milligrams (Physical weight representation)
    verdict: string;
    reaction: string;
    calcDetail: string;
    level: 'light' | 'balanced' | 'heavy';
}

// Keywords for "Language Mass"
// Expanded Lexicon with Weights
const WEIGHT_DICT: Record<string, number> = {
    // [Extreme Heaviness] - Life/Death, Existential Crisis
    "죽음": 100, "자살": 100, "절망": 80, "파산": 90, "이혼": 70, "암": 80,
    "death": 100, "suicide": 100, "despair": 80, "hopeless": 90,

    // [High Heaviness] - Deep Emotional Pain
    "고통": 50, "슬픔": 40, "우울": 45, "괴로": 40, "미움": 30, "증오": 40,
    "pain": 50, "sad": 40, "depress": 45,

    // [Medium Heaviness] - Daily Stress
    "빋": 20, "돈": 15, "걱정": 10, "불안": 15, "짜증": 10, "피곤": 5, "힘들": 10,
    "debt": 20, "money": 15, "worry": 10, "stress": 15,

    // [Lightness] - Positive Vibes
    "사랑": -20, "행복": -20, "기쁨": -15, "감사": -10, "웃음": -10, "희망": -25,
    "love": -20, "happy": -20, "joy": -15, "thanks": -10, "hope": -25
};

// Intensity Multipliers (Adverbs)
const INTENSITY_MULTIPLIERS = [
    { word: "너무", scale: 1.5 },
    { word: "진짜", scale: 1.2 },
    { word: "정말", scale: 1.2 },
    { word: "미치", scale: 2.0 }, // 미치겠네
    { word: "죽겠", scale: 2.0 }, // 힘들어 죽겠네
    { word: "very", scale: 1.5 },
    { word: "too", scale: 1.5 }
];

function getNumerologyNumber(str: string): number {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
        sum += str.charCodeAt(i);
    }
    while (sum > 9) {
        sum = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
    }
    return sum;
}

function calculateLanguageMass(text: string): number {
    let mass = 0;

    // 1. Text Length Factor (Base physical weight of thoughts)
    // Capped to avoid infinite weight just by spamming
    mass += Math.min(text.length * 0.2, 20);

    // 2. Keyword Analysis
    Object.entries(WEIGHT_DICT).forEach(([word, weight]) => {
        if (text.includes(word)) {
            let instanceWeight = weight;

            // Check for intensity multipliers nearby (simple inclusion check for now)
            INTENSITY_MULTIPLIERS.forEach(mod => {
                if (text.includes(mod.word)) {
                    // If modifier exists, amplify the emotional words
                    // (Global amplifier for simplicity in this version)
                    instanceWeight *= 1.2;
                }
            });

            mass += instanceWeight;
        }
    });

    return mass;
}

export function weighWorry(userName: string, worryText: string): SoulWeight {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}`;

    // 1. Base Soul Weight (Numerology)
    const nameNum = getNumerologyNumber(userName);
    const dateNum = getNumerologyNumber(dateStr);
    const destiny = (nameNum + dateNum) % 9 + 1;

    // Base weight: 10mg ~ 28mg (2mg * destiny)
    // Reduced base weight to let words matter more
    let totalMg = 10 + (destiny * 2);

    // 2. Language Mass (NLP Heuristic)
    const langMass = calculateLanguageMass(worryText);
    totalMg += langMass;

    // 3. Cosmic Correction
    const astro = getWesternState(now);
    let cosmicDetail = "";

    if (astro.mercuryRetro) {
        totalMg += 15; // Increased penalty logic
        cosmicDetail += " [수성 역행 +15mg/혼란]";
    }

    // 5. Bounds & Logic
    // Ensure min weight (Soul always has weight)
    if (totalMg < 1) totalMg = 1.0;

    // Categorize
    let level: 'light' | 'balanced' | 'heavy' = 'balanced';
    let verdict = "";
    let reaction = "";

    if (totalMg < 30) {
        level = 'light';
        verdict = "깃털보다 가벼움 (치유된 영혼)";
        reaction = "네 마음은 지금 순수한 빛과 같다냥. 이 가벼움을 즐겨라냥.";
    } else if (totalMg <= 70) {
        level = 'balanced';
        verdict = "깃털과 수평 (삶의 무게)";
        reaction = "적당한 무게는 삶을 지탱하는 힘이다냥. 잘 버티고 있구나냥.";
    } else {
        level = 'heavy';
        verdict = "깃털보다 무거움 (심연의 짐)";
        reaction = "어이쿠... 이건 혼자 들기 너무 무겁다냥. 내가 잠시 곁에 있어주겠다냥. 😿";
    }

    return {
        mg: parseFloat(totalMg.toFixed(1)),
        verdict,
        reaction,
        calcDetail: `운명수(${10 + destiny * 2}) + 언어질량(${langMass.toFixed(1)}) + 우주보정${cosmicDetail ? cosmicDetail : '(없음)'}`,
        level
    };
}

// Deprecated original function wrapper for backward compatibility if needed, 
// or simple replacement for explicit 'weighSoul' without worry.
export function weighSoul(userName: string): SoulWeight {
    return weighWorry(userName, "나의 존재");
}
