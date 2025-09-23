
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/Dialog';
import { Button } from './ui/Button';
import { GameStatus } from '../types';

interface GameEndDialogProps {
    status: GameStatus;
    onNewGame: () => void;
    elapsedTime: number;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

export const GameEndDialog: React.FC<GameEndDialogProps> = ({ status, onNewGame, elapsedTime }) => {
    if (status !== 'won' && status !== 'lost') return null;

    const isWon = status === 'won';
    const title = isWon ? "Congratulations!" : "Time's Up!";
    const description = isWon 
        ? `You've won the game in ${formatTime(elapsedTime)}.`
        : "You ran out of time. Better luck next time!";

    return (
        <Dialog open={true}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={onNewGame}>Play Again</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
