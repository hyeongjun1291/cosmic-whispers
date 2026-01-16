import { Lunar } from 'lunar-javascript';

export interface ShamanResult {
    star: string;      // e.g., "5-Yellow Earth" (Optional in Random Mode)
    flagColor: string; // e.g., "Yellow"
    flagName: string;  // e.g., "황기"
    meaning: string;
    direction: string; // e.g., "Center"
    description: string; // Detailed meaning
}

export const OBANGGI_FLAGS = [
    {
        color: 'blue',
        name: '청기 (靑旗)',
        direction: '동방 (East)',
        meaning: '우환과 근심이 사라지는 길조',
        description: '막혀있던 일들이 시원하게 뚫리며, 새로운 시작을 알리는 맑은 기운입니다. 이동수나 변화에 아주 좋습니다.'
    },
    {
        color: 'red',
        name: '적기 (赤旗)',
        direction: '남방 (South)',
        meaning: '재물과 복이 들어오는 대길',
        description: '불타오르는 열정처럼 재물운과 문서운이 강하게 들어옵니다. 다만, 너무 과하면 다툼이 있을 수 있으니 차분함도 필요합니다.'
    },
    {
        color: 'white',
        name: '백기 (白旗)',
        direction: '서방 (West)',
        meaning: '조상님의 도우심과 명예',
        description: '깨끗하고 성스러운 기운입니다. 윗사람이나 조상님의 도움(음덕)으로 뜻밖의 성취를 이룰 수 있는 아주 귀한 점괘입니다.'
    },
    {
        color: 'black', // Using Black/Green/Blue variably in Shamans, but usually Black/Green. Let's use Green for General Obanggi standard in this app context or Black (Water)? 
        // Standard Obang: Blue(East), Red(South), White(West), Black(North), Yellow(Center). 
        // Some systems use Green instead of Blue. 
        // Let's stick to the user request: "황, 백, 적, 녹, 청". 
        // Wait, User asked for "Green(Nok)" AND "Blue(Cheong)"? 
        // Usually Cheong is Blue/Green. 
        // If user specifically said "Nok(Green)" and "Cheong(Blue)", they might mean the 5 colors including Green?
        // Let's map standard 5: Blue(East), Red(South), White(West), Black(North), Yellow(Center).
        // BUT user prompt said: "황(Yellow), 백(White), 적(Red), 녹(Green), 청(Blue)".
        // This is 5 colors. I will follow USER REQUEST strictness.
        color: 'green',
        name: '녹기 (綠旗)',
        direction: '동남방?', // Custom interpretation if distinguishing form Cheong
        meaning: '안정과 평화를 되찾는 시기',
        description: '푸르른 숲처럼 마음의 안정을 찾고, 건강이 회복되는 기운입니다. 서두르지 말고 천천히 나아가면 길합니다.'
    },
    {
        color: 'yellow',
        name: '황기 (黃旗)',
        direction: '중앙 (Center)',
        meaning: '중심을 잡는 제왕의 기운',
        description: '사방의 기운을 아우르는 강력한 힘입니다. 사람들을 이끄는 리더십이 발휘되며, 흔들리지 않는 굳건함을 상징합니다.'
    }
];

// Fallback / legacy date-based
export function drawObanggi(): ShamanResult {
    return drawRandomObanggi();
}

export function drawRandomObanggi(): ShamanResult {
    const randomIndex = Math.floor(Math.random() * OBANGGI_FLAGS.length);
    const flag = OBANGGI_FLAGS[randomIndex];

    return {
        star: 'Random',
        flagColor: flag.color,
        flagName: flag.name,
        meaning: flag.meaning,
        direction: flag.direction,
        description: flag.description
    };
}
