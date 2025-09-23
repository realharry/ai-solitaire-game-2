
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { GameStats } from '../types';

interface StatsPanelProps {
    stats: GameStats;
    onReset: () => void;
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, onReset }) => {
    const winRate = stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) : '0.0';
    const avgTime = stats.gamesPlayed > 0 ? formatTime(stats.totalTimePlayed / stats.gamesPlayed) : '00:00';

    return (
        <Card className="mt-4">
            <CardHeader className="p-4">
                <CardTitle className="text-lg text-center">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Games Played:</span>
                    <span className="font-semibold">{stats.gamesPlayed}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Games Won:</span>
                    <span className="font-semibold">{stats.gamesWon}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Win Rate:</span>
                    <span className="font-semibold">{winRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg. Time:</span>
                    <span className="font-semibold font-mono">{avgTime}</span>
                </div>
                <Button onClick={onReset} className="w-full mt-3 !h-8 text-xs" variant="outline">
                    Reset Stats
                </Button>
            </CardContent>
        </Card>
    );
};
