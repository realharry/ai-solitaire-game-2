import React from 'react';

interface HintPanelProps {
    onGetHint: () => void;
    onOpenSettings: () => void;
    hint: string;
    isLoading: boolean;
    error: string;
}

const HintPanel: React.FC<HintPanelProps> = ({ onGetHint, onOpenSettings, hint, isLoading, error }) => {
    return (
        <div className="p-4 bg-background border-t border-border">
            <div className="w-full">
                <div className="flex items-start justify-between mb-3 space-x-3">
                    <div className="flex-grow">
                        <div className="h-12 flex items-center justify-center p-2 bg-secondary rounded-md text-center">
                            {error && <p className="text-destructive text-sm">{error}</p>}
                            {hint && <p className="text-sky-400 text-sm animate-pulse">{hint}</p>}
                            {!isLoading && !error && !hint && <p className="text-muted-foreground text-sm">Click "Get AI Hint" for a suggestion.</p>}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onGetHint}
                            disabled={isLoading}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-teal-500 text-white hover:bg-teal-600 h-12 px-5"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Getting Hint...
                                </div>
                            ) : 'Get AI Hint'}
                        </button>
                        <button 
                            onClick={onOpenSettings} 
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-12 w-12 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                            aria-label="Open settings"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HintPanel;