import { Lunar, Solar } from 'lunar-javascript';

export type Ohaeng = '木' | '火' | '土' | '金' | '水';
export type SajuData = {
  year: { ganji: string; ohaeng: Ohaeng; sibsin: string };
  month: { ganji: string; ohaeng: Ohaeng; sibsin: string };
  day: { ganji: string; ohaeng: Ohaeng; sibsin: string };
  time: { ganji: string; ohaeng: Ohaeng; sibsin: string };
  fullGanji: string[];
};

const OHAENG_MAP: Record<string, Ohaeng> = {
  '甲': '木', '乙': '木', '寅': '木', '卯': '木',
  '丙': '火', '丁': '火', '巳': '火', '午': '火',
  '戊': '土', '己': '土', '辰': '土', '戌': '土', '丑': '土', '未': '土',
  '庚': '金', '辛': '金', '申': '金', '酉': '金',
  '壬': '水', '癸': '水', '亥': '水', '子': '水',
};

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
  isLeap: boolean = false
): SajuData {
  // 1. Convert to Solar first if Lunar
  let solarYear = year;
  let solarMonth = month;
  let solarDay = day;

  if (isLunar) {
    // lunar-javascript represents a leap month with a negative month number.
    const lunar = Lunar.fromYmdHms(year, isLeap ? -month : month, day, hour, minute, 0);
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
    time: {
      ganji: timeGan + timeZhi,
      ohaeng: getOhaeng(timeGan),
      sibsin: eightChar.getTimeShiShenGan()
    },
    fullGanji: [yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, timeGan, timeZhi]
  };
}
