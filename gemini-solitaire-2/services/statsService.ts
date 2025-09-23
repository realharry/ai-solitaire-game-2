
import { GameStats } from '../types';

const STATS_KEY = 'solitaire-ai-stats';

export const getStats = (): GameStats => {
    try {
        const storedStats = localStorage.getItem(STATS_KEY);
        if (storedStats) {
            const parsed = JSON.parse(storedStats);
            // Basic validation
            if (typeof parsed.gamesPlayed === 'number' && typeof parsed.gamesWon === 'number' && typeof parsed.totalTimePlayed === 'number') {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Failed to read stats from localStorage:", error);
    }
    return {
        gamesPlayed: 0,
        gamesWon: 0,
        totalTimePlayed: 0,
    };
};

const saveStats = (stats: GameStats) => {
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (error) {
        console.error("Failed to save stats to localStorage:", error);
    }
};

export const updateStatsOnGameEnd = (isWin: boolean, timeElapsed: number): GameStats => {
    const stats = getStats();
    stats.gamesPlayed += 1;
    if (isWin) {
        stats.gamesWon += 1;
    }
    stats.totalTimePlayed += timeElapsed;
    saveStats(stats);
    return stats;
};

export const resetStats = (): GameStats => {
    const newStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalTimePlayed: 0,
    };
    saveStats(newStats);
    return newStats;
};
