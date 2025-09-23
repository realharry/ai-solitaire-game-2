import React from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedModel: string;
    onAiModelChange: (model: string) => void;
    cardBackUrl: string;
    onCardBackChange: (url: string) => void;
    selectedDifficulty: 'draw1' | 'draw3';
    onDifficultyChange: (difficulty: 'draw1' | 'draw3') => void;
}

const CARD_BACK_OPTIONS = [
    { name: 'Blue Pattern', url: 'https://i.imgur.com/DrCL3Sj.png' },
    { name: 'Red Pattern', url: 'https://i.imgur.com/7S1svsC.png' },
    { name: 'Green Pattern', url: 'https://i.imgur.com/b2q121S.png' },
    { name: 'Abstract', url: 'https://i.imgur.com/sSg1gG9.png' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    selectedModel, 
    onAiModelChange,
    cardBackUrl,
    onCardBackChange,
    selectedDifficulty,
    onDifficultyChange,
}) => {
    if (!isOpen) return null;

    const getButtonClass = (isActive: boolean) => 
        `flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${
            isActive 
            ? 'bg-primary text-primary-foreground' 
            : 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground'
        }`;

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
                    <h2 className="font-semibold tracking-tight text-lg">Settings</h2>
                    <p className="text-sm text-muted-foreground">Customize your game experience.</p>
                </div>
                
                <div className="p-6 pt-0 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Difficulty
                        </label>
                        <div className="flex space-x-2">
                           <button 
                                onClick={() => onDifficultyChange('draw1')}
                                className={getButtonClass(selectedDifficulty === 'draw1')}
                           >
                               Draw 1 (Easy)
                           </button>
                           <button 
                                onClick={() => onDifficultyChange('draw3')}
                                className={getButtonClass(selectedDifficulty === 'draw3')}
                            >
                               Draw 3 (Hard)
                           </button>
                        </div>
                         <p className="text-xs text-muted-foreground mt-2">Changing difficulty will start a new game.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Card Back Design
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {CARD_BACK_OPTIONS.map((option) => (
                                <button 
                                    key={option.url}
                                    onClick={() => onCardBackChange(option.url)}
                                    className={`rounded-md overflow-hidden transition-all duration-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${cardBackUrl === option.url ? 'ring-2 ring-primary' : 'hover:opacity-80'}`}
                                    aria-label={`Select ${option.name} card back`}
                                >
                                    <img src={option.url} alt={option.name} className="w-full h-auto object-cover aspect-[2/3]"/>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="model-select" className="block text-sm font-medium text-foreground mb-2">
                            Select AI Model
                        </label>
                        <div className="relative">
                            <select 
                                id="model-select"
                                value={selectedModel}
                                onChange={(e) => onAiModelChange(e.target.value)}
                                disabled
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                            >
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end p-6 pt-0">
                    <button 
                        onClick={onClose}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;