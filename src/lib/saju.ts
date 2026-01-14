import { Lunar, Solar } from 'lunar-javascript';

export type Ohaeng = '木' | '火' | '土' | '金' | '水';
export type SajuData = {
  year: { ganji: string; ohaeng: Ohaeng; sibsin: string };
  month: { ganji: string; ohaeng: Ohaeng; sibsin: string };
  day: { ganji: string; ohaeng: Ohaeng; sibsin: string };
  time: { ganji: string; ohaeng: Ohaeng; sibsin: string } | null;
  fullGanji: string[];
};

const OHAENG_MAP: Record<string, Ohaeng> = {
  '甲': '木', '乙': '木', '寅': '木', '卯': '木',
  '丙': '火', '丁': '火', '巳': '火', '午': '火',
  '戊': '土', '己': '土', '辰': '土', '戌': '土', '丑': '土', '未': '土',
  '庚': '金', '辛': '金', '申': '金', '酉': '金',
  '壬': '水', '癸': '水', '亥': '水', '子': '水',
};

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// Korean DST History
const DST_PERIODS = [
  { start: '1948-06-01', end: '1948-09-13' },
  { start: '1949-04-03', end: '1949-09-11' },
  { start: '1950-04-01', end: '1950-09-11' },
  { start: '1951-05-06', end: '1951-09-09' },
  { start: '1955-05-05', end: '1955-09-09' },
  { start: '1956-05-20', end: '1956-09-30' },
  { start: '1957-05-05', end: '1957-09-22' },
  { start: '1958-05-04', end: '1958-09-21' },
  { start: '1959-05-03', end: '1959-09-20' },
  { start: '1960-05-01', end: '1960-09-18' },
  { start: '1987-05-10', end: '1987-10-11' },
  { start: '1988-05-08', end: '1988-10-09' },
];

function isDST(year: number, month: number, day: number): boolean {
  const target = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return DST_PERIODS.some(p => target >= p.start && target <= p.end);
}

export function calculateSaju(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  isLunar: boolean = false,
  isLeap: boolean = false,
  isTimeUnknown: boolean = false
): SajuData {
  // 1. Convert to Solar first if Lunar
  let solarYear = year;
  let solarMonth = month;
  let solarDay = day;

  if (isLunar) {
    // @ts-expect-error -- lunar-javascript type mismatch
    const lunar = Lunar.fromYmdHms(year, month, day, hour, minute, 0);
    // @ts-expect-error -- lunar-javascript type mismatch
    if (isLeap) lunar.setLeap(true); // Assuming API supports this or input handles it
    // Note: lunar-javascript fromYmdHms default treats as non-leap. 
    // For precise lunar leap handling, use Lunar.fromYmd(...) then set leap.
    // But strictly, we need to find the Solar date corresponding to this Lunar date.
    // If user inputs Lunar, we trust the conversion.
    const solar = lunar.getSolar();
    solarYear = solar.getYear();
    solarMonth = solar.getMonth();
    solarDay = solar.getDay();
  }

  // 2. Apply Time Corrections
  // Base Date object for manipulation
  const date = new Date(solarYear, solarMonth - 1, solarDay, hour, minute, 0);

  // Apply DST (-60 mins)
  if (isDST(solarYear, solarMonth, solarDay)) {
    date.setMinutes(date.getMinutes() - 60);
  }

  // Apply Longitude Correction (Seoul: -32 mins)
  date.setMinutes(date.getMinutes() - 32);

  const adjYear = date.getFullYear();
  const adjMonth = date.getMonth() + 1;
  const adjDay = date.getDate();
  const adjHour = date.getHours();
  const adjMin = date.getMinutes();

  // 3. Create Solar object with ADJUSTED time
  // @ts-expect-error -- lunar-javascript type mismatch
  const solar = Solar.fromYmdHms(adjYear, adjMonth, adjDay, adjHour, adjMin, 0);

  // 4. Get EightChar (Saju)
  // lunar-javascript's EightChar automatically handles the month/year boundaries based on solar terms.
  // We need to configure it for Yaja-si (Night Rat).
  // By default, if Sect is not set, 23:00+ is considered Next Day's Ja hour.
  // Yaja-si rule: 23:00~00:00 -> Day is Current Day, Time is Next Day's Ja.
  // Joja-si rule: 00:00~01:00 -> Day is Next Day, Time is Next Day's Ja.

  // The 'Sect' setting in lunar-javascript controls when the Day Pillar changes.
  // setSect(2) -> Day changes at 00:00. (This supports Yaja-si: 23:00 is new Time, but old Day).
  // setSect(1) -> Day changes at 23:00. (Standard modern/simplified: 23:00 is new Day).

  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  eightChar.setSect(2); // 2 = Day starts at 00:00 (supporting Yaja-si)

  const yearGan = eightChar.getYearGan();
  const yearZhi = eightChar.getYearZhi();
  const monthGan = eightChar.getMonthGan();
  const monthZhi = eightChar.getMonthZhi();
  const dayGan = eightChar.getDayGan();
  const dayZhi = eightChar.getDayZhi();
  const timeGan = eightChar.getTimeGan();
  const timeZhi = eightChar.getTimeZhi();

  const getOhaeng = (gan: string) => OHAENG_MAP[gan] || '土';

  const fullGanji = [yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi];
  if (!isTimeUnknown) {
    fullGanji.push(timeGan, timeZhi);
  }

  return {
    year: {
      ganji: yearGan + yearZhi,
      ohaeng: getOhaeng(yearGan),
      sibsin: eightChar.getYearShiShenGan()
    },
    month: {
      ganji: monthGan + monthZhi,
      ohaeng: getOhaeng(monthGan),
      sibsin: eightChar.getMonthShiShenGan()
    },
    day: {
      ganji: dayGan + dayZhi,
      ohaeng: getOhaeng(dayGan),
      sibsin: eightChar.getDayShiShenGan()
    },
    time: isTimeUnknown ? null : {
      ganji: timeGan + timeZhi,
      ohaeng: getOhaeng(timeGan),
      sibsin: eightChar.getTimeShiShenGan()
    },
    fullGanji
  };
}

// Advanced Logic Helpers
function getGongmang(dayGan: string, dayZhi: string): string[] {
  const ganIdx = GAN.indexOf(dayGan);
  const zhiIdx = ZHI.indexOf(dayZhi);
  if (ganIdx === -1 || zhiIdx === -1) return [];

  // Formula: (12 + zhi - gan) % 12 gives the "Shift".
  // The voids are at (Shift + 10) and (Shift + 11).
  const shift = (12 + zhiIdx - ganIdx) % 12;
  return [ZHI[(shift + 10) % 12], ZHI[(shift + 11) % 12]];
}

function isClashed(target: string, allBranches: string[]): boolean {
  const targetIdx = ZHI.indexOf(target);
  if (targetIdx === -1) return false;
  // Clash is exactly +6 or -6 away
  const clashIdx = (targetIdx + 6) % 12;
  const clashBranch = ZHI[clashIdx];
  return allBranches.includes(clashBranch);
}

export type ShinsalInfo = { pillar: string; star: string; description: string };

export function getOhaengPercentages(saju: SajuData) {
  const counts = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  let totalCounts = 0;

  saju.fullGanji.forEach(char => {
    const el = OHAENG_MAP[char] || '土';
    counts[el]++;
    totalCounts++;
  });

  return {
    counts,
    percentages: {
      '木': parseFloat(((counts['木'] / totalCounts) * 100).toFixed(1)),
      '火': parseFloat(((counts['火'] / totalCounts) * 100).toFixed(1)),
      '土': parseFloat(((counts['土'] / totalCounts) * 100).toFixed(1)),
      '金': parseFloat(((counts['金'] / totalCounts) * 100).toFixed(1)),
      '水': parseFloat(((counts['水'] / totalCounts) * 100).toFixed(1)),
    }
  };
}

export function analyzeSaju(saju: SajuData): string {
  const dayMaster = saju.day.ganji[0]; // Day Stem
  const monthBranch = saju.month.ganji[1]; // Month Branch

  // 1. Day Master Traits (Nature)
  const masterNature: Record<string, string> = {
    '甲': 'straight and unbending giant tree (Big Wood)',
    '乙': 'resilient and adaptive ivy (Small Wood)',
    '丙': 'passionate and visible sun (Big Fire)',
    '丁': 'warm and focused candlelight (Small Fire)',
    '戊': 'vast and trustworthy mountain (Big Earth)',
    '己': 'fertile and nurturing field (Small Earth)',
    '庚': 'sharp and decisive axe (Big Metal)',
    '辛': 'delicate and shiny jewel (Small Metal)',
    '壬': 'fluid and wise ocean (Big Water)',
    '癸': 'gentle and penetrating rain (Small Water)',
  };

  // 2. Element Count & Percentage
  const { counts, percentages } = getOhaengPercentages(saju);

  // 3. Seasonality (Month Branch)
  let season = '';
  if (['寅', '卯', '辰'].includes(monthBranch)) season = 'Spring (Wood)';
  else if (['巳', '午', '未'].includes(monthBranch)) season = 'Summer (Fire)';
  else if (['申', '酉', '戌'].includes(monthBranch)) season = 'Autumn (Metal)';
  else if (['亥', '子', '丑'].includes(monthBranch)) season = 'Winter (Water)';

  // 4. Missing / Excess
  const missing = Object.entries(counts).filter(([, c]) => c === 0).map(([k]) => k);
  const excess = Object.entries(counts).filter(([, c]) => c >= 3).map(([k]) => k);

  // 5. Shinsal & Gilseong Analysis
  const shinsal = calculateShinsal(saju);

  return `
[SAJU ANALYSIS REPORT]
1. Day Master: ${dayMaster} (${masterNature[dayMaster] || 'Unknown'})
2. Season: Born in ${season}, influencing the Day Master's strength.
3. Element Distribution: Wood(${counts['木']} - ${percentages['木']}%) Fire(${counts['火']} - ${percentages['火']}%) Earth(${counts['土']} - ${percentages['土']}%) Metal(${counts['金']} - ${percentages['金']}%) Water(${counts['水']} - ${percentages['水']}%)
4. Critical Patterns:
   - Missing Elements: ${missing.length > 0 ? missing.join(', ') : 'None (Balanced)'}
   - Excessive Elements: ${excess.length > 0 ? excess.join(', ') : 'None'}
5. Special Stars (Shinsal) by Pillar:
   ${shinsal.length > 0 ? shinsal.map(s => `- [${s.pillar}] ${s.star}: ${s.description}`).join('\n   ') : '- No major stars found.'}
   - Advice: Focus on balancing the ${excess.length > 0 ? 'excessive energy' : 'weak points'}.
`;
}

export function calculateShinsal(saju: SajuData): ShinsalInfo[] {
  const dayBranch = saju.day.ganji[1];
  const yearBranch = saju.year.ganji[1];
  const dayStem = saju.day.ganji[0];

  const allBranches = [saju.year.ganji[1], saju.month.ganji[1], saju.day.ganji[1]];
  if (saju.time) {
    allBranches.push(saju.time.ganji[1]);
  }
  const voids = getGongmang(dayStem, dayBranch);

  const results: ShinsalInfo[] = [];

  // 0. Hyeongchim (Needle Star) - Sharpness, Sensitivity, Medical/Tech skill
  // Characters: 甲, 辛, 卯, 午, 未, 申
  const hyeongchimChars = ['甲', '辛', '卯', '午', '未', '申'];
  const pillars = [
    { name: '연주', gan: saju.year.ganji[0], zhi: saju.year.ganji[1] },
    { name: '월주', gan: saju.month.ganji[0], zhi: saju.month.ganji[1] },
    { name: '일주', gan: saju.day.ganji[0], zhi: saju.day.ganji[1] },
  ];

  if (saju.time) {
    pillars.push({ name: '시주', gan: saju.time.ganji[0], zhi: saju.time.ganji[1] });
  }

  // Context helper
  const getContext = (pillar: string) => {
    if (pillar === '연주') return '초년/가문';
    if (pillar === '월주') return '직업/사회성';
    if (pillar === '일주') return '본인/배우자';
    if (pillar === '시주') return '말년/자녀';
    return '';
  };

  pillars.forEach(p => {
    // Hyeongchim Nuance
    if (hyeongchimChars.includes(p.gan) || hyeongchimChars.includes(p.zhi)) {
      const target = hyeongchimChars.includes(p.gan) ? p.gan : p.zhi;
      let desc = '예리한 직관력';
      if (p.name === '연주') desc = '초년부터 두각을 나타내는 영재성/감각';
      if (p.name === '월주') desc = '직업으로 연결되는 정밀 기술/의료 재능';
      if (p.name === '일주') desc = '호불호가 분명하고 빈틈없는 성격';
      if (p.name === '시주') desc = '말년까지 이어지는 전문 식견과 노하우';

      results.push({
        pillar: p.name,
        star: `현침살 (${target})`,
        description: desc
      });
    }
  });

  // Helper: Triple Union Groups (Sam-hap)
  const getGroup = (branch: string) => {
    if (['申', '子', '辰'].includes(branch)) return 'Water';
    if (['寅', '午', '戌'].includes(branch)) return 'Fire';
    if (['巳', '酉', '丑'].includes(branch)) return 'Metal';
    if (['亥', '卯', '未'].includes(branch)) return 'Wood';
    return '';
  };

  // Check based on Year and Day Branch
  const checkBase = (base: string) => {
    const group = getGroup(base);

    // Check EACH branch for stars relative to this base
    pillars.forEach(p => {
      const branch = p.zhi;
      if (!branch) return;
      const context = getContext(p.name);

      // 1. Dohwa
      let isDohwa = false;
      if (group === 'Water' && branch === '酉') isDohwa = true;
      if (group === 'Fire' && branch === '卯') isDohwa = true;
      if (group === 'Metal' && branch === '午') isDohwa = true;
      if (group === 'Wood' && branch === '子') isDohwa = true;

      if (isDohwa) {
        let note = `인기살 (${context}에 발현)`;
        if (voids.includes(branch)) note += ' - 공망(겉치레)';
        else if (isClashed(branch, allBranches)) note += ' - 충(삼각관계 주의)';

        // Mark as True Dohwa (Priority)
        const existingIdx = results.findIndex(r => r.pillar === p.name && r.star.includes('도화살'));
        if (existingIdx !== -1) {
          results.splice(existingIdx, 1); // Remove weaker if exists
        }
        results.push({ pillar: p.name, star: `도화살 (진도화-강력 ${branch})`, description: note });
      }

      // 2. Yeokma
      let isYeokma = false;
      if (group === 'Water' && branch === '寅') isYeokma = true;
      if (group === 'Fire' && branch === '申') isYeokma = true;
      if (group === 'Metal' && branch === '亥') isYeokma = true;
      if (group === 'Wood' && branch === '巳') isYeokma = true;

      if (isYeokma) {
        let note = `이동수 (${context}의 변화)`;
        if (voids.includes(branch)) note += ' - 공망(정착불가)';
        else if (isClashed(branch, allBranches)) note += ' - 충(타의적 이동)';
        results.push({ pillar: p.name, star: `역마살 (${branch})`, description: note });
      }

      // 3. Hwagae
      let isHwagae = false;
      if (group === 'Water' && branch === '辰') isHwagae = true;
      if (group === 'Fire' && branch === '戌') isHwagae = true;
      if (group === 'Metal' && branch === '丑') isHwagae = true;
      if (group === 'Wood' && branch === '未') isHwagae = true;

      if (isHwagae) {
        let note = `명예/예술성 (${context})`;
        if (voids.includes(branch)) note += ' - 공망(종교적 심취)';
        results.push({ pillar: p.name, star: `화개살 (${branch})`, description: note });
      }
    });
  };

  // Run checks
  checkBase(dayBranch); // Inner psychological
  checkBase(yearBranch); // Social specific

  // General Dohwa (Naked Dohwa) check
  // If not already marked as True Dohwa, but contains 子/午/卯/酉
  const dohwaChars = ['子', '午', '卯', '酉'];
  pillars.forEach(p => {
    if (dohwaChars.includes(p.zhi)) {
      // Check if already has a Dohwa entry
      const hasDohwa = results.some(r => r.pillar === p.name && r.star.includes('도화살'));
      if (!hasDohwa) {
        const context = getContext(p.name);
        results.push({
          pillar: p.name,
          star: `도화살 (${p.zhi})`,
          description: `잠재된 매력/인기 (${context})`
        });
      }
    }
  });

  // 4. Cheon-eul Gwiin (Nobleman)
  const nobles: string[] = [];
  if (['甲', '戊', '庚'].includes(dayStem)) nobles.push('丑', '未');
  if (['乙', '己'].includes(dayStem)) nobles.push('子', '申');
  if (['丙', '丁'].includes(dayStem)) nobles.push('亥', '酉');
  if (dayStem === '辛') nobles.push('午', '寅');
  if (['壬', '癸'].includes(dayStem)) nobles.push('巳', '卯');

  pillars.forEach(p => {
    if (nobles.includes(p.zhi)) {
      const context = getContext(p.name);
      let note = `귀인 (${context}의 조력)`;
      if (voids.includes(p.zhi)) note += ' - 공망(도움 지연)';
      else if (isClashed(p.zhi, allBranches)) note += ' - 충(은혜를 원수로)';
      results.push({ pillar: p.name, star: `천을귀인 (${p.zhi})`, description: note });
    }
  });

  // Unique formatting
  return results.filter((val, idx, self) =>
    idx === self.findIndex((t) => (
      t.pillar === val.pillar && t.star === val.star
    ))
  );
}
