import { Lunar } from 'lunar-javascript';

export interface MeihuaResult {
    upper: number;
    lower: number;
    line: number;
    originalHex: string; // Name of Original Hexagram
    mutualHex: string;   // Name of Mutual Hexagram (Ho-Gwae)
    changedHex: string;  // Name of Changed Hexagram (Byeon-Gwae)
    meaning: string;
    // Visualization Data (1 = Yang/Solid, 0 = Yin/Broken)
    // Bottom-to-Top order for drawing usually, but array index 0=Bottom or Top? 
    // Trigram standard: Bottom, Middle, Top.
    upperTrigram: number[];
    lowerTrigram: number[];
    resultParam: {
        // Full 6 lines for each stage could be useful
        original: number[];
        changed: number[];
        // [NEW] Detailed Structure for UI
        structure?: {
            original: {
                upperId: number;
                lowerId: number;
                upperName: string;
                lowerName: string;
            };
            changed: {
                upperId: number;
                lowerId: number;
                upperName: string;
                lowerName: string;
            };
        };
    }
}

const TRIGRAMS = ['건(하늘)', '태(연못)', '리(불)', '진(우뢰)', '손(바람)', '감(물)', '간(산)', '곤(땅)'];

// Binary representation (Bottom -> Top)
// 1 = Yang (Solid), 0 = Yin (Broken)
const TRIGRAM_LINES: Record<number, number[]> = {
    1: [1, 1, 1], // Geon (Heaven) ☰
    2: [1, 1, 0], // Tae (Lake) ☱
    3: [1, 0, 1], // Ri (Fire) ☲
    4: [1, 0, 0], // Jin (Thunder) ☳
    5: [0, 1, 1], // Son (Wind) ☴
    6: [0, 1, 0], // Gam (Water) ☵
    7: [0, 0, 1], // Gan (Mountain) ☶
    8: [0, 0, 0]  // Gon (Earth) ☷
};

export function castIChing(): MeihuaResult {
    const now = new Date();
    // @ts-expect-error -- lunar-javascript type definition
    const lunar = Lunar.fromDate(now);

    const year = lunar.getYear();
    const month = lunar.getMonth();
    const day = lunar.getDay();
    // Hour Branch Index (1-12). 00-01 is Ja (1), 01-03 is Chuk (2)...
    const hour = Math.floor((now.getHours() + 1) / 2) + 1;

    // Meihua Logic:
    let upper = (year + month + day) % 8;
    if (upper === 0) upper = 8;

    let lower = (year + month + day + hour) % 8;
    if (lower === 0) lower = 8;

    let line = (year + month + day + hour) % 6;
    if (line === 0) line = 6;

    const upperName = TRIGRAMS[upper - 1];
    const lowerName = TRIGRAMS[lower - 1];

    // Formatting Lines
    const upperLines = TRIGRAM_LINES[upper];
    const lowerLines = TRIGRAM_LINES[lower];

    // Full Hexagram (Bottom -> Top: Lower Trigram then Upper Trigram)
    const originalHexLines = [...lowerLines, ...upperLines];

    // Change Line (Line index is 1-based, usually counted from Bottom)
    // Flip the bit at line - 1
    const changedHexLines = [...originalHexLines];
    changedHexLines[line - 1] = changedHexLines[line - 1] === 1 ? 0 : 1;

    // Calculate Changed Trigrams
    // Split changedHexLines into Lower (0-2) and Upper (3-5)
    // Be careful: array is [Line1, Line2, Line3, Line4, Line5, Line6]
    // where Line1 is Bottom.
    // Lower = [0, 1, 2], Upper = [3, 4, 5]

    // Helper to find Trigram Index from [1,0,1]
    const findTrigramIndex = (lines: number[]) => {
        // TRIGRAM_LINES values are arrays.
        for (const [key, val] of Object.entries(TRIGRAM_LINES)) {
            if (val[0] === lines[0] && val[1] === lines[1] && val[2] === lines[2]) {
                return parseInt(key);
            }
        }
        return 8; // Default Gon
    };

    const changedLowerLines = changedHexLines.slice(0, 3);
    const changedUpperLines = changedHexLines.slice(3, 6);

    const changedLower = findTrigramIndex(changedLowerLines);
    const changedUpper = findTrigramIndex(changedUpperLines);

    const changedLowerName = TRIGRAMS[changedLower - 1];
    const changedUpperName = TRIGRAMS[changedUpper - 1];

    return {
        upper,
        lower,
        line,
        originalHex: `상괘:${upperName} / 하괘:${lowerName}`,
        mutualHex: "내면의 흐름(호괘)",
        changedHex: `${line}효 변동`,
        meaning: `[매화역수 계산]\n시간: ${year}년 ${month}월 ${day}일 ${hour}시진\n괘상: 위는 ${upperName}, 아래는 ${lowerName}입니다.\n동효: ${line}번째 효가 변합니다.`,
        upperTrigram: upperLines,
        lowerTrigram: lowerLines,
        resultParam: {
            original: originalHexLines,
            changed: changedHexLines,
            // [NEW] Detailed Structure for UI
            structure: {
                original: {
                    upperId: upper,
                    lowerId: lower,
                    upperName: upperName,
                    lowerName: lowerName
                },
                changed: {
                    upperId: changedUpper,
                    lowerId: changedLower,
                    upperName: changedUpperName,
                    lowerName: changedLowerName
                }
            }
        }
    };
}
