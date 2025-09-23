import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CardData, GameState, Suit, Rank, Difficulty, Move, CardLocation } from '../types';
import { playSound } from '../services/audioService';
import * as PIXI from 'pixi.js';

interface UseSolitaireGameProps {
    onGameWin: () => void;
}

interface DragState {
    card: CardData;
    stack: CardData[];
    originalPosition: { pile: 'waste' | 'tableau' | 'foundation', pileIndex: number };
    pointerId: number;
    offset: { x: number, y: number };
    currentPosition: { x: number, y: number };
}

// --- Helper Functions ---
const getRankValue = (rank: Rank): number => {
    const values: Record<Rank, number> = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13 };
    return values[rank];
};

const getCardColor = (suit: Suit): 'red' | 'black' => {
    return (suit === Suit.Hearts || suit === Suit.Diamonds) ? 'red' : 'black';
};

const createDeck = (): CardData[] => {
    const deck: CardData[] = [];
    const suits = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];
    const ranks = [Rank.Ace, Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ id: `${rank}${suit}`, suit, rank, faceUp: false });
        }
    }
    return deck;
};

export const useSolitaireGame = ({ onGameWin }: UseSolitaireGameProps) => {
    const [tableau, setTableau] = useState<CardData[][]>(Array(7).fill([]));
    const [foundations, setFoundations] = useState<CardData[][]>(Array(4).fill([]));
    const [stock, setStock] = useState<CardData[]>([]);
    const [waste, setWaste] = useState<CardData[]>([]);
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [passesLeft, setPassesLeft] = useState<number | null>(null);
    const [draggingState, setDraggingState] = useState<DragState | null>(null);
    const [highlightedMove, setHighlightedMove] = useState<Move | null>(null);
    const [undoHistory, setUndoHistory] = useState<GameState[]>([]);
    const [redoHistory, setRedoHistory] = useState<GameState[]>([]);
    const [lastClick, setLastClick] = useState<{ cardId: string, time: number }>({ cardId: '', time: 0 });
    
    const deck = useMemo(createDeck, []);

    // Create a ref to hold the current game state for stable callbacks
    const currentStateRef = useRef<GameState | null>(null);
    useEffect(() => {
        currentStateRef.current = {
            tableau,
            foundation: foundations,
            stock,
            waste,
            passesLeft,
        };
    }, [tableau, foundations, stock, waste, passesLeft]);
    
    const getFullGameState = useCallback((): GameState => {
        // Deep copy from the ref to prevent mutation issues in the history.
        return JSON.parse(JSON.stringify(currentStateRef.current!));
    }, []);
    
    const saveStateToHistory = useCallback(() => {
        setUndoHistory(history => [...history, getFullGameState()]);
        setRedoHistory([]); // Any new move clears the redo history
    }, [getFullGameState]);
    
    const restoreGameState = useCallback((state: GameState) => {
        setTableau(state.tableau);
        setFoundations(state.foundation);
        setStock(state.stock);
        setWaste(state.waste);
        setPassesLeft(state.passesLeft);
    }, []);

    const undo = useCallback(() => {
        if (undoHistory.length === 0) return;
        const currentState = getFullGameState();
        const prevState = undoHistory[undoHistory.length - 1];
        
        setRedoHistory(history => [...history, currentState]);
        setUndoHistory(history => history.slice(0, -1));
        restoreGameState(prevState);
        playSound('undo');
    }, [undoHistory, getFullGameState, restoreGameState]);
    
    const redo = useCallback(() => {
        if (redoHistory.length === 0) return;
        const currentState = getFullGameState();
        const nextState = redoHistory[redoHistory.length - 1];
        
        setUndoHistory(history => [...history, currentState]);
        setRedoHistory(history => history.slice(0, -1));
        restoreGameState(nextState);
        playSound('redo');
    }, [redoHistory, getFullGameState, restoreGameState]);

    const newGame = useCallback(() => {
        // Shuffle the deck
        const shuffledDeck = [...deck];
        for (let i = shuffledDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
        }
        shuffledDeck.forEach(c => c.faceUp = false);

        // Deal to tableau
        const newTableau: CardData[][] = Array(7).fill(0).map(() => []);
        let currentCardIndex = 0;
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                newTableau[j].push(shuffledDeck[currentCardIndex++]);
            }
        }
        newTableau.forEach(pile => {
            if (pile.length > 0) pile[pile.length - 1].faceUp = true;
        });

        const newStock = shuffledDeck.slice(currentCardIndex);
        
        setTableau(newTableau);
        setFoundations(Array(4).fill([]));
        setStock(newStock);
        setWaste([]);
        setDraggingState(null);
        setHighlightedMove(null);
        setUndoHistory([]);
        setRedoHistory([]);

        if (difficulty === 'hard') {
            setPassesLeft(2); // One initial pass + one redeal
        } else {
            setPassesLeft(null);
        }

        // Sound effect for dealing
        newTableau.flat().forEach((_, index) => {
            setTimeout(() => playSound('deal'), index * 30);
        });

    }, [deck, difficulty]);

    // Effect to start a new game automatically when the difficulty changes.
    const isInitialMount = useRef(true);
    useEffect(() => {
        // The App component triggers the very first newGame, so we skip the initial mount.
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        newGame();
    }, [difficulty, newGame]);


    const drawFromStock = useCallback(() => {
        saveStateToHistory();
        if (stock.length > 0) {
            const numToDraw = difficulty === 'easy' ? 1 : 3;
            const drawn = stock.slice(-numToDraw).reverse();
            drawn.forEach(c => c.faceUp = true);
            setStock(s => s.slice(0, -numToDraw));
            setWaste(w => [...w, ...drawn]);
            playSound('move');
        } else if (waste.length > 0) {
            if (difficulty === 'hard') {
                if (passesLeft !== null && passesLeft <= 1) {
                    playSound('invalid');
                    // Revert the history save because this was an invalid move
                    setUndoHistory(h => h.slice(0, -1));
                    return;
                }
                setPassesLeft(p => p! - 1);
            }
            const newStock = [...waste].reverse();
            newStock.forEach(c => c.faceUp = false);
            setStock(newStock);
            setWaste([]);
            newStock.forEach((_, i) => setTimeout(() => playSound('deal'), i * 30));
        } else {
             // Revert the history save if nothing happened
             setUndoHistory(h => h.slice(0, -1));
        }
    }, [difficulty, stock.length, waste.length, passesLeft, saveStateToHistory]);
    
    const executeMove = useCallback((stack: CardData[], from: CardLocation, to: CardLocation) => {
        saveStateToHistory();
        // --- Remove from source ---
        if (from.pile === 'waste') {
            setWaste(w => w.slice(0, -stack.length));
        } else if (from.pile === 'foundation' && from.pileIndex !== undefined) {
            setFoundations(f => f.map((p, i) => i === from.pileIndex ? p.slice(0, -stack.length) : p));
        } else if (from.pile === 'tableau' && from.pileIndex !== undefined) {
            setTableau(t => t.map((p, i) => {
                if (i !== from.pileIndex) return p;
                const newPile = p.slice(0, -stack.length);
                if (newPile.length > 0 && !newPile[newPile.length - 1].faceUp) {
                    newPile[newPile.length - 1].faceUp = true;
                    playSound('flip');
                }
                return newPile;
            }));
        }

        // --- Add to destination ---
        if (to.pile === 'foundation' && to.pileIndex !== undefined) {
            setFoundations(f => f.map((p, i) => i === to.pileIndex ? [...p, ...stack] : p));
        } else if (to.pile === 'tableau' && to.pileIndex !== undefined) {
            setTableau(t => t.map((p, i) => i === to.pileIndex ? [...p, ...stack] : p));
        }
        playSound('move');
    }, [saveStateToHistory]);

    const isValidFoundationMove = (card: CardData, pile: CardData[]): boolean => {
        const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
        if (!topCard) return card.rank === Rank.Ace;
        return card.suit === topCard.suit && getRankValue(card.rank) === getRankValue(topCard.rank) + 1;
    };
    
    const isValidTableauMove = (card: CardData, topCard: CardData | null): boolean => {
        if (!topCard) return card.rank === Rank.King;
        return getCardColor(card.suit) !== getCardColor(topCard.suit) &&
               getRankValue(card.rank) === getRankValue(topCard.rank) - 1;
    };

    const handleCardDoubleClick = useCallback((card: CardData) => {
        const current = currentStateRef.current;
        if (!current) return;

        const { waste, tableau, foundation } = current;
        
        const isTopWaste = waste.length > 0 && waste[waste.length - 1].id === card.id;
        const tableauPileIndex = tableau.findIndex(p => p.length > 0 && p[p.length - 1].id === card.id);
        const isTopTableau = tableauPileIndex !== -1;

        if (!isTopWaste && !isTopTableau) return;

        for (let i = 0; i < foundation.length; i++) {
            if (isValidFoundationMove(card, foundation[i])) {
                const from: CardLocation = isTopWaste ? { pile: 'waste' } : { pile: 'tableau', pileIndex: tableauPileIndex };
                const to: CardLocation = { pile: 'foundation', pileIndex: i };
                executeMove([card], from, to);
                return;
            }
        }
    }, [executeMove]);
    
    const onDragStart = useCallback((event: PIXI.FederatedPointerEvent, card: CardData) => {
        const now = Date.now();
        if (lastClick.cardId === card.id && now - lastClick.time < 300) {
            handleCardDoubleClick(card);
            setLastClick({ cardId: '', time: 0 });
            return;
        }
        setLastClick({ cardId: card.id, time: now });

        const current = currentStateRef.current;
        if (!current) return;
        
        if (!card.faceUp) {
            if (current.stock.length > 0 && current.stock[current.stock.length - 1].id === card.id) {
                drawFromStock();
            }
            return;
        }
        
        let stack: CardData[] = [];
        let originalPosition: DragState['originalPosition'] | null = null;

        const wasteIndex = current.waste.indexOf(card);
        if (wasteIndex !== -1) {
             // FIX: Only the top card of the waste pile is ever playable, regardless of difficulty.
             if (wasteIndex === current.waste.length - 1) {
                stack = [card];
                originalPosition = { pile: 'waste', pileIndex: wasteIndex };
             } else {
                 return; // Not the top card, not playable
             }
        } else {
            for (let i = 0; i < current.tableau.length; i++) {
                const cardIndex = current.tableau[i].findIndex(c => c.id === card.id);
                if (cardIndex !== -1) {
                    stack = current.tableau[i].slice(cardIndex);
                    originalPosition = { pile: 'tableau', pileIndex: i };
                    break;
                }
            }
        }

        if (stack.length > 0 && originalPosition) {
            setDraggingState({
                card,
                stack,
                originalPosition,
                pointerId: event.pointerId,
                offset: { x: event.global.x - event.currentTarget.x, y: event.global.y - event.currentTarget.y },
                currentPosition: { x: event.global.x, y: event.global.y }
            });
        }
    }, [lastClick, handleCardDoubleClick, drawFromStock]);

    const onDragMove = useCallback((event: PIXI.FederatedPointerEvent) => {
        if (draggingState && event.pointerId === draggingState.pointerId) {
            setDraggingState(d => d ? { ...d, currentPosition: { x: event.global.x, y: event.global.y } } : null);
        }
    }, [draggingState]);

    const onDragEnd = useCallback(() => {
        if (!draggingState) return;
        
        const current = currentStateRef.current;
        if (!current) {
            setDraggingState(null);
            return;
        }

        const { stack, originalPosition } = draggingState;
        const dropPosition = draggingState.currentPosition;
        let moveSuccessful = false;

        const PADDING = 20;
        const CARD_WIDTH = 100;
        const CARD_HEIGHT = 150;
        const TABLEAU_Y_OFFSET = 30;
        const screenWidth = 1200;

        for (let i = 0; i < current.foundation.length; i++) {
            const foundationX = screenWidth - (4 - i) * (CARD_WIDTH + PADDING);
            const foundationY = PADDING;
            if (dropPosition.x > foundationX && dropPosition.x < foundationX + CARD_WIDTH &&
                dropPosition.y > foundationY && dropPosition.y < foundationY + CARD_HEIGHT) {
                if (stack.length === 1 && isValidFoundationMove(stack[0], current.foundation[i])) {
                    executeMove(stack, { pile: originalPosition.pile, pileIndex: originalPosition.pileIndex }, { pile: 'foundation', pileIndex: i });
                    moveSuccessful = true;
                    break;
                }
            }
        }

        if (!moveSuccessful) {
            for (let i = 0; i < current.tableau.length; i++) {
                const pile = current.tableau[i];
                const lastCard = pile.length > 0 ? pile[pile.length - 1] : null;
                const tableauX = PADDING + i * (CARD_WIDTH + PADDING);
                const pileHeight = lastCard ? (CARD_HEIGHT + (pile.length - 1) * TABLEAU_Y_OFFSET) : CARD_HEIGHT;
                const tableauY = PADDING * 2 + CARD_HEIGHT;
                 if (dropPosition.x > tableauX && dropPosition.x < tableauX + CARD_WIDTH &&
                    dropPosition.y > tableauY && dropPosition.y < tableauY + pileHeight) {
                    if (isValidTableauMove(stack[0], lastCard)) {
                        executeMove(stack, { pile: originalPosition.pile, pileIndex: originalPosition.pileIndex }, { pile: 'tableau', pileIndex: i });
                        moveSuccessful = true;
                        break;
                    }
                }
            }
        }
        
        if (!moveSuccessful) playSound('invalid');
        setDraggingState(null);
    }, [draggingState, executeMove]);

    useEffect(() => {
        const totalInFoundations = foundations.reduce((sum, pile) => sum + pile.length, 0);
        if (totalInFoundations === 52) {
            playSound('win');
            onGameWin();
        }
    }, [foundations, onGameWin]);

    const setDifficultyCb = useCallback((d: Difficulty) => setDifficulty(d), []);
    const highlightMoveCb = useCallback((move: Move) => setHighlightedMove(move), []);
    const clearHighlightsCb = useCallback(() => setHighlightedMove(null), []);
    const playLoseSoundCb = useCallback(() => playSound('lose'), []);
    
    const canUndo = undoHistory.length > 0;
    const canRedo = redoHistory.length > 0;

    return {
        tableau,
        foundations,
        stock,
        waste,
        difficulty,
        passesLeft,
        draggingState,
        highlightedMove,
        newGame: newGame,
        setDifficulty: setDifficultyCb,
        onDragStart,
        onDragMove,
        onDragEnd,
        getGameState: getFullGameState,
        highlightMove: highlightMoveCb,
        clearHighlights: clearHighlightsCb,
        playLoseSound: playLoseSoundCb,
        undo,
        redo,
        canUndo,
        canRedo,
    };
};