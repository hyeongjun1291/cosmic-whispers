const CHAT_HISTORY = 'cosmic_history';
const CHAT_EPISODES = 'cosmic_episodes';
export const LAST_VISIT = 'cosmic_last_visit';

export function readBrowserData(key: string): unknown {
    try {
        return JSON.parse(localStorage.getItem(key) ?? 'null') as unknown;
    } catch {
        return null;
    }
}

export function clearChatHistory(storage: Pick<Storage, 'removeItem'>): void {
    storage.removeItem(CHAT_HISTORY);
    storage.removeItem(CHAT_EPISODES);
}

export function resetBrowserData(storage: Pick<Storage, 'removeItem'>): void {
    clearChatHistory(storage);
    for (const key of ['cosmic_user', 'cosmic_character', 'cosmic_affection', LAST_VISIT]) {
        storage.removeItem(key);
    }
}
