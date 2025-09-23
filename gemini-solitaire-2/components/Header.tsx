
import React from 'react';

interface HeaderProps {
    remainingTime: number;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

export const Header: React.FC<HeaderProps> = ({ remainingTime }) => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary dark:text-primary-foreground">
                Solitaire AI Assistant
            </h1>
            <div className="flex items-center space-x-4">
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Time Left
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 text-2xl font-mono p-2 rounded-md w-28 text-center">
                    {formatTime(remainingTime)}
                </div>
            </div>
        </header>
    );
};
