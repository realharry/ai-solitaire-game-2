
import React from 'react';

interface GameOverModalProps {
  isOpen: boolean;
  onNewGame: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ isOpen, onNewGame }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Congratulations!</h2>
        <p className="text-slate-300 mb-6">You've won the game!</p>
        <button
          onClick={onNewGame}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
          bg-cyan-500 text-slate-900 hover:bg-cyan-600 h-10 px-4 py-2"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};
