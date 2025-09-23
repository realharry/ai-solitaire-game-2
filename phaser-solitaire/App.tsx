import React, { useState, useEffect, useCallback } from 'react';
import PhaserGame from './components/PhaserGame';
import HintPanel from './components/HintPanel';
import SettingsModal from './components/SettingsModal';
import InstructionsModal from './components/InstructionsModal';
import StatsModal from './components/StatsModal';
import { getHint } from './services/geminiService';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<string>('');
    const [hint, setHint] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);
    const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
    const [aiModel, setAiModel] = useState<string>('gemini-2.5-flash');
    const [cardBackUrl, setCardBackUrl] = useState<string>('https://i.imgur.com/DrCL3Sj.png');
    const [difficulty, setDifficulty] = useState<'draw1' | 'draw3'>('draw1');

    const handleGameState = useCallback((event: Event) => {
        const customEvent = event as CustomEvent<string>;
        setGameState(customEvent.detail);
    }, []);

    useEffect(() => {
        window.addEventListener('gameState', handleGameState);
        return () => {
            window.removeEventListener('gameState', handleGameState);
        };
    }, [handleGameState]);

    useEffect(() => {
        if (gameState) {
            fetchHint();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState]);


    const fetchHint = async () => {
        if (!gameState) return;
        setIsLoading(true);
        setError('');
        setHint('');
        try {
            const hintText = await getHint(gameState, aiModel);
            setHint(hintText);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setGameState(''); // Reset game state to allow fetching new hint for the same state if needed
        }
    };

    const handleGetHint = () => {
        window.dispatchEvent(new CustomEvent('getGameState'));
    };

    const handleNewGame = () => {
        window.dispatchEvent(new CustomEvent('newGame'));
        setHint('');
        setError('');
    }

    const handleUndo = () => {
        window.dispatchEvent(new CustomEvent('undoMove'));
    };

    return (
        <div className="w-full h-full bg-background flex flex-col font-sans overflow-hidden">
            <header className="p-4 z-10 flex justify-between items-center flex-shrink-0 border-b border-border">
                <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-bold text-foreground tracking-wider">AI Solitaire</h1>
                    <button 
                        onClick={() => setIsInstructionsOpen(true)} 
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 w-10 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        aria-label="How to play"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                     <button 
                        onClick={() => setIsStatsOpen(true)} 
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 w-10 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        aria-label="View stats"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </button>
                </div>
                 <div className="flex items-center space-x-2">
                    <button 
                        onClick={handleUndo}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        aria-label="Undo last move"
                    >
                        Undo
                    </button>
                    <button 
                        onClick={handleNewGame}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        New Game
                    </button>
                </div>
            </header>

            <main className="flex-grow relative">
                <PhaserGame cardBackUrl={cardBackUrl} difficulty={difficulty} />
            </main>
            
            <footer className="flex-shrink-0 z-10">
                <HintPanel 
                    onGetHint={handleGetHint}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    hint={hint}
                    isLoading={isLoading}
                    error={error}
                />
            </footer>

            <InstructionsModal 
                isOpen={isInstructionsOpen}
                onClose={() => setIsInstructionsOpen(false)}
            />
            
            <StatsModal
                isOpen={isStatsOpen}
                onClose={() => setIsStatsOpen(false)}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                selectedModel={aiModel}
                onAiModelChange={setAiModel}
                cardBackUrl={cardBackUrl}
                onCardBackChange={setCardBackUrl}
                selectedDifficulty={difficulty}
                onDifficultyChange={setDifficulty}
            />
        </div>
    );
};

export default App;