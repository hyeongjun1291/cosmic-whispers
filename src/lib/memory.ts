import { readBrowserData } from './browser-data';
import { isRecord } from './chat-contract';

export interface Episode {
    id: number;
    timestamp: number;
    dateString: string;
    userText: string;
    aiText: string;
    emotion: string;
    delta: number;
}

const STORAGE_KEY = 'cosmic_episodes';

export const saveEpisode = (userText: string, aiText: string, emotion: string, delta: number) => {
    if (typeof window === 'undefined') return;

    const newEpisode: Episode = {
        id: Date.now(),
        timestamp: Date.now(),
        dateString: new Date().toLocaleString(),
        userText,
        aiText,
        emotion,
        delta
    };

    const existing = getEpisodes();
    const updated = [newEpisode, ...existing].slice(0, 20); // Keep last 20
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getEpisodes = (): Episode[] => {
    if (typeof window === 'undefined') return [];
    const data = readBrowserData(STORAGE_KEY);
    return Array.isArray(data) ? data.filter((item): item is Episode =>
        isRecord(item) && typeof item.id === 'number' && typeof item.timestamp === 'number'
        && typeof item.dateString === 'string' && typeof item.userText === 'string'
        && typeof item.aiText === 'string' && typeof item.emotion === 'string'
        && typeof item.delta === 'number' && Number.isFinite(item.delta),
    ) : [];
};

export const getRelevantEpisodes = (limit: number = 3): string => {
    const episodes = getEpisodes();
    if (episodes.length === 0) return "";

    // Prefer recent episodes with an absolute delta of at least two.
    const significant = episodes.filter(e => Math.abs(e.delta) >= 2);
    const target = significant.length > 0 ? significant : episodes;

    return target.slice(0, limit).map(e =>
        `- [${e.dateString}] User: "${e.userText}" -> AI: "${e.aiText}" (Emotion: ${e.emotion})`
    ).join('\n');
};
