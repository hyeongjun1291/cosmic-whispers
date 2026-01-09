declare module 'lunar-javascript' {
    export class Lunar {
        static fromYmd(year: number, month: number, day: number): Lunar;
        getSolar(): Solar;
        getEightChar(): EightChar;
    }

    export class Solar {
        static fromYmd(year: number, month: number, day: number): Solar;
        getLunar(): Lunar;
    }

    export class EightChar {
        setTimeGanIndex(index: number): void;
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
