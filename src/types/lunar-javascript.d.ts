declare module 'lunar-javascript' {
    export class Lunar {
        static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Lunar;
        getSolar(): Solar;
        getEightChar(): EightChar;
    }

    export class Solar {
        static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar;
        getYear(): number;
        getMonth(): number;
        getDay(): number;
        getLunar(): Lunar;
    }

    export class EightChar {
        setSect(sect: 1 | 2): void;
        getYearGan(): string;
        getYearZhi(): string;
        getMonthGan(): string;
        getMonthZhi(): string;
        getDayGan(): string;
        getDayZhi(): string;
        getTimeGan(): string;
        getTimeZhi(): string;
        getYearShiShenGan(): string;
        getMonthShiShenGan(): string;
        getDayShiShenGan(): string;
        getTimeShiShenGan(): string;
    }
}
