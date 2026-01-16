
export interface WesternAstroState {
    sunSign: string;
    sunEmoji: string;
    sunRuler: string;
    moonSign: string;
    moonEmoji: string;
    moonRuler: string;
    mercuryRetro: boolean; // Is Mercury Retrograde?
    description: string;
    planets?: Record<string, number>;
}

const ZODIAC = [
    { name: "염소자리 (Capricorn)", emoji: "♑", start: [12, 22], end: [1, 19], ruler: "토성 (Saturn)" },
    { name: "물병자리 (Aquarius)", emoji: "♒", start: [1, 20], end: [2, 18], ruler: "토성/천왕성 (Saturn/Uranus)" },
    { name: "물고기자리 (Pisces)", emoji: "♓", start: [2, 19], end: [3, 20], ruler: "목성/해왕성 (Jupiter/Neptune)" },
    { name: "양자리 (Aries)", emoji: "♈", start: [3, 21], end: [4, 19], ruler: "화성 (Mars)" },
    { name: "황소자리 (Taurus)", emoji: "♉", start: [4, 20], end: [5, 20], ruler: "금성 (Venus)" },
    { name: "쌍둥이자리 (Gemini)", emoji: "♊", start: [5, 21], end: [6, 21], ruler: "수성 (Mercury)" },
    { name: "게자리 (Cancer)", emoji: "♋", start: [6, 22], end: [7, 22], ruler: "달 (Moon)" },
    { name: "사자자리 (Leo)", emoji: "♌", start: [7, 23], end: [8, 22], ruler: "태양 (Sun)" },
    { name: "처녀자리 (Virgo)", emoji: "♍", start: [8, 23], end: [9, 22], ruler: "수성 (Mercury)" },
    { name: "천칭자리 (Libra)", emoji: "♎", start: [9, 23], end: [10, 22], ruler: "금성 (Venus)" },
    { name: "전갈자리 (Scorpio)", emoji: "♏", start: [10, 23], end: [11, 21], ruler: "화성/명왕성 (Mars/Pluto)" },
    { name: "사수자리 (Sagittarius)", emoji: "♐", start: [11, 22], end: [12, 21], ruler: "목성 (Jupiter)" }
];

// Mercury Retrograde Lookup Table (UTC roughly)
// 2025: Mar 15-Apr 7, Jul 18-Aug 11, Nov 9-Nov 29
// 2026: Feb 26-Mar 20, Jun 29-Jul 23, Oct 24-Nov 13
const MERCURY_RETRO_DATES = [
    { start: "2025-03-15", end: "2025-04-07" },
    { start: "2025-07-18", end: "2025-08-11" },
    { start: "2025-11-09", end: "2025-11-29" },
    { start: "2026-02-26", end: "2026-03-20" },
    { start: "2026-06-29", end: "2026-07-23" },
    { start: "2026-10-24", end: "2026-11-13" },
];

// Orbital Elements for J2000 (Approximate Mean Longitude)
// L = L0 + n * d
const ORBITS = {
    Sun: { L0: 280.460, n: 0.9856474 },
    Moon: { L0: 218.316, n: 13.176396 },
    Mercury: { L0: 252.250, n: 4.092334 },
    Venus: { L0: 181.979, n: 1.602130 },
    Mars: { L0: 355.453, n: 0.524033 },
    Jupiter: { L0: 34.404, n: 0.083085 },
    Saturn: { L0: 49.944, n: 0.033497 },
    Uranus: { L0: 313.232, n: 0.011731 },
    Neptune: { L0: 304.880, n: 0.005981 },
    Pluto: { L0: 238.928, n: 0.003975 }
};

function normalize(deg: number) {
    deg = deg % 360;
    if (deg < 0) deg += 360;
    return deg;
}

export function calculatePlanets(date: Date) {
    const j2000 = new Date('2000-01-01T12:00:00Z').getTime();
    const current = date.getTime();
    const daysSince = (current - j2000) / (1000 * 60 * 60 * 24);

    const planets: Record<string, number> = {};

    for (const [name, orbit] of Object.entries(ORBITS)) {
        planets[name] = normalize(orbit.L0 + orbit.n * daysSince);
    }
    return planets;
}

function getSignFromDegree(deg: number) {
    // 0 = Aries, 30 = Taurus ... 
    // ZODIAC array starts with Capricorn (270).
    // Aries is 0. 
    // We need to map 0-360 directly to ZODIAC logic or just find the sign.
    // Let's use standard order for checking: 
    // Aries(0), Taurus(30)...
    const index = Math.floor(deg / 30);
    // ZODIAC array: Cap(0), Aqu(1), Pis(2), Ari(3)... 
    // So Aries(0 deg) -> Index 3. 
    // Index = (floor(deg/30) + 3) % 12
    const mappedIndex = (index + 3) % 12;
    return ZODIAC[mappedIndex];
}

function checkMercuryRetro(date: Date) {
    const iso = date.toISOString().split('T')[0];
    return MERCURY_RETRO_DATES.some(p => iso >= p.start && iso <= p.end);
}

export function calculateAstroState(date: Date): WesternAstroState {
    return getWesternState(date);
}

export function getWesternState(date?: Date): WesternAstroState {
    const d = date || new Date();
    const planets = calculatePlanets(d);

    const sun = getSignFromDegree(planets.Sun);
    const moon = getSignFromDegree(planets.Moon);
    const isRetro = checkMercuryRetro(d);

    const sunRuler = (sun as any).ruler;
    const moonRuler = (moon as any).ruler;

    let desc = `[Transits]\n- Sun: ${sun.name} (Ruler: ${sunRuler})\n- Moon: ${moon.name} (Ruler: ${moonRuler})`;
    if (isRetro) {
        desc += "\n- Mercury: Retrograde ⚠️ (Communcation/Electronics Warning)";
    } else {
        desc += "\n- Mercury: Direct (Smooth flow)";
    }

    return {
        sunSign: sun.name,
        sunEmoji: sun.emoji,
        sunRuler: sunRuler,
        moonSign: moon.name,
        moonEmoji: moon.emoji,
        moonRuler: moonRuler,
        mercuryRetro: isRetro,
        description: desc,
        planets // Add this to interface if we want to consume it in UI
    };
}
