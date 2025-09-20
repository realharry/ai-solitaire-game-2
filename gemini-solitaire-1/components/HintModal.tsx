
import React from 'react';
import { Move } from '../types';

interface HintModalProps {
    hint: Move | null;
    setHint: (hint: Move | null) => void;
    error: string | null;
}

const formatMove = (move: Move): string => {
    if (move.type === 'draw') {
        return "Draw a card from the stock pile.";
    }
    if (move.type === 'move' && move.cards && move.from && move.to) {
        const cardName = `${move.cards[0].rank} of ${move.cards[0].suit}`;
        const fromPile = `${move.from.pileType} pile ${move.from.pileType === 'waste' ? '' : move.from.pileIndex + 1}`;
        const toPile = `${move.to.pileType} pile ${move.to.pileIndex + 1}`;
        return `Move the ${cardName} from ${fromPile} to ${toPile}.`;
    }
    return "The AI provided an incomplete move suggestion.";
}

export const HintModal: React.FC<HintModalProps> = ({ hint, setHint, error }) => {
    if (!hint && !error) return null;

    const closeModal = () => {
        setHint(null);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center"
            onClick={closeModal}
        >
            <div 
                className="relative z-50 w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col space-y-4 text-center sm:text-left">
                    <h2 className="text-lg font-semibold text-white">
                        {error ? "Hint Error" : "AI Suggestion"}
                    </h2>
                    <div className="text-sm text-slate-400">
                        {error ? (
                            <p className="text-red-400">{error}</p>
                        ) : hint ? (
                            <p>{formatMove(hint)}</p>
                        ) : null}
                    </div>
                </div>
                 <button 
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>
        </div>
    );
};
