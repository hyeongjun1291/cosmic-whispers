
import { analyzeSaju, calculateSaju } from '../src/lib/saju';

// Mock Input (Based on User's likely usage or standard date)
const year = 2026;
const month = 1; // January
const day = 15;
const hour = 14;
const minute = 30;

const sajuData = calculateSaju(year, month, day, hour, minute);

console.log("--- RAW SAJU DATA CAN BE COMPLEX, SKIPPING ---");
console.log("--- ANALYZE SAJU OUTPUT (KOREAN REPORT) ---");
try {
    const report = analyzeSaju(sajuData);
    console.log(report);
} catch (e) {
    console.error("Error analyzing saju:", e);
}
