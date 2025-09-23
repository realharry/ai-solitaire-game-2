
import React from 'react';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { Difficulty } from '../types';

interface DifficultySelectorProps {
    current: Difficulty;
    onChange: (difficulty: Difficulty) => void;
}
const DifficultySelector: React.FC<DifficultySelectorProps> = ({ current, onChange }) => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    return (
        <div className="space-y-2">
            <Label className="text-center block">Difficulty</Label>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                {difficulties.map(d => (
                    <Button
                        key={d}
                        onClick={() => onChange(d)}
                        variant={current === d ? 'default' : 'ghost'}
                        className="!h-8 text-xs capitalize transition-all duration-150"
                    >
                        {d}
                    </Button>
                ))}
            </div>
        </div>
    );
};


interface ControlsProps {
    onNewGame: () => void;
    onGetHint: () => void;
    isHintLoading: boolean;
    difficulty: Difficulty;
    onDifficultyChange: (difficulty: Difficulty) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ 
    onNewGame, onGetHint, isHintLoading, difficulty, onDifficultyChange,
    onUndo, onRedo, canUndo, canRedo
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-4">
            <h2 className="text-lg font-semibold text-center">Game Controls</h2>
            <DifficultySelector current={difficulty} onChange={onDifficultyChange} />
            <div className="grid grid-cols-2 gap-2">
                <Button onClick={onUndo} disabled={!canUndo}>Undo</Button>
                <Button onClick={onRedo} disabled={!canRedo}>Redo</Button>
            </div>
            <Button onClick={onNewGame} className="w-full">
                New Game
            </Button>
            <Button onClick={onGetHint} className="w-full" disabled={isHintLoading}>
                {isHintLoading ? (
                    <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Thinking...
                    </div>
                ) : "Get AI Hint"}
            </Button>
        </div>
    );
};