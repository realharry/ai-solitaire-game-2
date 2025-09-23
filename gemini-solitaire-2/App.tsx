
import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { AIPanel } from './components/AIPanel';
import { GameEndDialog } from './components/GameEndDialog';
import { StatsPanel } from './components/StatsPanel';
import { getHint } from './services/aiService';
import { getStats, updateStatsOnGameEnd, resetStats } from './services/statsService';
import { GameState, Move, GameStatus, GameStats, Difficulty } from './types';
import { useSolitaireGame } from './hooks/useSolitaireGame';
import { SolitaireStage } from './components/game/SolitaireStage';

const GAME_DURATION = 600; // 10 minutes in seconds

const App: React.FC = () => {
    const [status, setStatus] = useState<GameStatus>('playing');
    const [remainingTime, setRemainingTime] = useState(GAME_DURATION);
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
    const [isAIThinking, setIsAIThinking] = useState(false);
    const [aiHint, setAiHint] = useState<{ move: Move; reason: string } | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiModel, setAiModel] = useState('gemini-2.5-flash');
    const [stats, setStats] = useState<GameStats>(() => getStats());

    const onGameWin = useCallback(() => setStatus('won'), []);
    const { 
        newGame, setDifficulty, difficulty, getGameState, highlightMove, 
        clearHighlights, playLoseSound, undo, redo, canUndo, canRedo, ...gameProps 
    } = useSolitaireGame({ onGameWin });

    const handleNewGame = useCallback(() => {
        newGame();
        setStatus('playing');
        setRemainingTime(GAME_DURATION);
        setAiHint(null);
        setAiError(null);
    }, [newGame]);

    const handleDifficultyChange = useCallback((newDifficulty: Difficulty) => {
        setDifficulty(newDifficulty);
    }, [setDifficulty]);

    // This effect now just calls newGame once when the game hook is ready.
    useEffect(() => {
        handleNewGame();
    }, [handleNewGame]);

    useEffect(() => {
        if (status !== 'playing') {
            return;
        }

        const timerId = setInterval(() => {
            setRemainingTime(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timerId);
                    setStatus('lost');
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [status]);
    
    useEffect(() => {
        if (status === 'won' || status === 'lost') {
            if(status === 'lost') playLoseSound();
            const timeElapsed = GAME_DURATION - remainingTime;
            const newStats = updateStatsOnGameEnd(status === 'won', timeElapsed);
            setStats(newStats);
        }
    }, [status, remainingTime, playLoseSound]);

    const handleGetHint = async () => {
        setIsAIThinking(true);
        setAiHint(null);
        setAiError(null);
        setIsAIPanelOpen(true);

        try {
            const gameState: GameState = getGameState();
            const hint = await getHint(gameState, aiModel, difficulty);

            if (hint && hint.move && hint.reason) {
                setAiHint(hint);
                highlightMove(hint.move);
            } else {
                setAiError("The AI couldn't find a valid move or the response was invalid.");
            }
        } catch (error) {
            console.error("Error getting hint:", error);
            setAiError(`Failed to get a hint. ${error instanceof Error ? error.message : 'Unknown error.'}`);
        } finally {
            setIsAIThinking(false);
        }
    };
    
    const handleResetStats = useCallback(() => {
        const newStats = resetStats();
        setStats(newStats);
    }, []);
    
    const elapsedTime = GAME_DURATION - remainingTime;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center p-4 font-sans">
            <div className="w-full max-w-7xl">
                <Header remainingTime={remainingTime} />
                <main className="mt-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div 
                            className="rounded-lg shadow-2xl overflow-hidden mx-auto"
                            style={{ width: '1200px', height: '800px', maxWidth: '100vw', backgroundColor: '#075e54' }}
                        >
                           <SolitaireStage 
                                difficulty={difficulty}
                                newGame={newGame}
                                setDifficulty={setDifficulty}
                                getGameState={getGameState}
                                highlightMove={highlightMove}
                                clearHighlights={clearHighlights}
                                playLoseSound={playLoseSound}
                                undo={undo}
                                redo={redo}
                                canUndo={canUndo}
                                canRedo={canRedo}
                                {...gameProps} 
                            />
                        </div>
                        <div className="w-full lg:w-64 flex-shrink-0">
                           <Controls 
                                onNewGame={handleNewGame} 
                                onGetHint={handleGetHint} 
                                isHintLoading={isAIThinking}
                                difficulty={difficulty}
                                onDifficultyChange={handleDifficultyChange}
                                onUndo={undo}
                                onRedo={redo}
                                canUndo={canUndo}
                                canRedo={canRedo}
                            />
                            <StatsPanel stats={stats} onReset={handleResetStats} />
                            {isAIPanelOpen && (
                                <AIPanel 
                                    isLoading={isAIThinking} 
                                    hint={aiHint}
                                    error={aiError}
                                    model={aiModel}
                                    setModel={setAiModel}
                                    onClose={() => {
                                        setIsAIPanelOpen(false);
                                        clearHighlights();
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </main>
            </div>
            <GameEndDialog
                status={status}
                onNewGame={handleNewGame}
                elapsedTime={elapsedTime}
            />
        </div>
    );
};

export default App;