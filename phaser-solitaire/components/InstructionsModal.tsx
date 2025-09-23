import React from 'react';

interface InstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-card border border-border rounded-lg shadow-lg w-full max-w-lg text-card-foreground"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col space-y-1.5 p-6">
                    <h2 className="font-semibold tracking-tight text-lg">How to Play Solitaire (Klondike)</h2>
                    <p className="text-sm text-muted-foreground">
                        The goal is to move all 52 cards to the four <strong className="text-sky-400">Foundation</strong> piles.
                    </p>
                </div>
                
                <div className="p-6 pt-0 text-sm max-h-[60vh] overflow-y-auto pr-3 space-y-4">
                    <div>
                        <h3 className="font-semibold text-foreground mb-2">The Board</h3>
                        <ul className="list-disc list-outside space-y-1 pl-4 text-muted-foreground">
                            <li><strong>Tableau:</strong> The main playing area with seven piles of cards.</li>
                            <li><strong>Foundations:</strong> Four empty piles where you build suits up from Ace to King.</li>
                            <li><strong>Stock:</strong> The face-down deck. Click to deal cards to the Waste.</li>
                            <li><strong>Waste:</strong> Face-up cards from the Stock. The top card is playable.</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-2">Gameplay Rules</h3>
                        <ul className="list-disc list-outside space-y-1 pl-4 text-muted-foreground">
                            <li><strong>Tableau Building:</strong> Piles are built down in alternating colors (e.g., black 7 on red 8).</li>
                            <li><strong>Moving Stacks:</strong> You can move ordered, face-up stacks of cards between tableau piles.</li>
                            <li><strong>Empty Piles:</strong> Only a King can be moved to an empty tableau spot.</li>
                            <li><strong>Foundation Building:</strong> Build from Ace to King for each suit.</li>
                            <li><strong>Stock Reset:</strong> Clicking an empty Stock pile will return all Waste cards to it.</li>
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-semibold text-foreground mb-2">Winning</h3>
                        <p className="text-muted-foreground">You win when all 52 cards are moved to the foundations.</p>
                    </div>
                </div>

                <div className="flex items-center justify-end p-6 pt-0">
                    <button 
                        onClick={onClose}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        Got It!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstructionsModal;