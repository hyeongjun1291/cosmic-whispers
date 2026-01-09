import { Lunar, Solar, EightChar } from 'lunar-javascript';

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

export function calculateSaju(
  year: number,
  month: number,
  day: number,
  hour: number,
  isLunar: boolean = false,
  isLeap: boolean = false
): SajuData {
  let solar: Solar;
  if (isLunar) {
    // @ts-ignore
    const lunar = Lunar.fromYmdHms(year, month, day, hour, 0, 0);
    solar = lunar.getSolar();
  } else {
    // @ts-ignore
    solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
  }

  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  // Set time removed (handled by initialization)

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
