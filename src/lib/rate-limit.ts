type RateLimitStore = {
    [key: string]: {
        count: number;
        lastReset: number;
    };
};

// In-memory store (Resets on restart)
const globalRateLimitStore: RateLimitStore = {};

export function checkRateLimit(identifier: string, limit: number = 1000): boolean {
    const now = Date.now();
    const today = new Date(now).setHours(0, 0, 0, 0);

    if (!globalRateLimitStore[identifier]) {
        globalRateLimitStore[identifier] = { count: 1, lastReset: today };
        return true;
    }

    const userData = globalRateLimitStore[identifier];

    // Reset if it's a new day
    if (userData.lastReset < today) {
        userData.count = 1;
        userData.lastReset = today;
        return true;
    }

    if (userData.count >= limit) {
        return false;
    }

    userData.count++;
    return true;
}

export function getRemainingRequests(identifier: string, limit: number = 1000): number {
    const userData = globalRateLimitStore[identifier];
    if (!userData) return limit;

    const now = Date.now();
    const today = new Date(now).setHours(0, 0, 0, 0);

    if (userData.lastReset < today) return limit;

    return Math.max(0, limit - userData.count);
}
