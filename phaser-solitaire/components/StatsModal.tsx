import React, { useState, useEffect } from 'react';

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface GameStats {
    gamesPlayed: number;
    gamesWon: number;
    currentStreak: number;
    bestStreak: number;
}

const STATS_KEY = 'solitaireStats';

const getStats = (): GameStats => {
    const statsJson = localStorage.getItem(STATS_KEY);
    if (statsJson) {
        return JSON.parse(statsJson);
    }
    return { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, bestStreak: 0 };
};

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
    const [stats, setStats] = useState<GameStats>(getStats());

    useEffect(() => {
        if (isOpen) {
            setStats(getStats());
        }
    }, [isOpen]);

    const handleReset = () => {
        const resetStats = { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, bestStreak: 0 };
        localStorage.setItem(STATS_KEY, JSON.stringify(resetStats));
        setStats(resetStats);
    };

    if (!isOpen) return null;

    const winPercentage = stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(0) : 0;

    const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
        <div className="bg-secondary p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        </div>
    );

    return (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-card border border-border rounded-lg shadow-lg w-full max-w-sm text-card-foreground"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col space-y-1.5 p-6">
                    <h2 className="font-semibold tracking-tight text-lg">Statistics</h2>
                    <p className="text-sm text-muted-foreground">Your performance and winning streaks.</p>
                </div>
                
                <div className="p-6 pt-0">
                    <div className="grid grid-cols-2 gap-4">
                        <StatItem label="Played" value={stats.gamesPlayed} />
                        <StatItem label="Won" value={stats.gamesWon} />
                        <StatItem label="Win %" value={`${winPercentage}%`} />
                        <StatItem label="Current Streak" value={stats.currentStreak} />
                        <div className="col-span-2">
                            <StatItem label="Best Streak" value={stats.bestStreak} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-6 pt-2">
                     <button 
                        onClick={handleReset}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
                    >
                        Reset Stats
                    </button>
                    <button 
                        onClick={onClose}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatsModal;