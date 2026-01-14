export interface Episode {
    id: number;
    timestamp: number;
    dateString: string;
    userText: string;
    aiText: string;
    emotion: string;
}

const STORAGE_KEY = 'cosmic_episodes';

export const saveEpisode = (userText: string, aiText: string, emotion: string) => {
    if (typeof window === 'undefined') return;

    const newEpisode: Episode = {
        id: Date.now(),
        timestamp: Date.now(),
        dateString: new Date().toLocaleString(),
        userText,
        aiText,
        emotion
    };

    const existing = getEpisodes();
    const updated = [newEpisode, ...existing].slice(0, 20); // Keep last 20
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log('[Memory] Episode Saved:', newEpisode);
};

export const getEpisodes = (): Episode[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

export const getRelevantEpisodes = (limit: number = 3): string => {
    const episodes = getEpisodes();
    if (episodes.length === 0) return "";

    // Simple strategy: Just get the most recent ones as we removed significance (delta)
    const target = episodes;

    return target.slice(0, limit).map(e =>
        `- [${e.dateString}] User: "${e.userText}" -> AI: "${e.aiText}" (Emotion: ${e.emotion})`
    ).join('\n');
};
