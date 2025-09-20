import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { GameState, Card, PileType, Move } from './types';
import { SUITS, RANKS, CARD_WIDTH, CARD_HEIGHT, PILE_POSITIONS, STACK_OFFSET_Y, CARD_ATLAS_URL } from './constants';
import { createDeck, shuffle, dealInitialState, isMoveValid, executeMove, checkWinCondition } from './services/solitaire';
import { getHint } from './services/geminiService';
import { Header } from './components/Header';
import { HintModal } from './components/HintModal';
import { GameOverModal } from './components/GameOverModal';

// --- Global Singleton for PixiJS ---
// This pattern prevents re-initialization errors caused by React's Strict Mode
// and Vite's Hot Module Replacement (HMR) by attaching the Pixi instance
// to the global window object, ensuring it's created only once.

interface CustomWindow extends Window {
  __PIXI_APP__?: PIXI.Application;
  __PIXI_INIT_PROMISE__?: Promise<void>;
  __PIXI_CARD_TEXTURES__?: { [key: string]: PIXI.Texture };
}
declare const window: CustomWindow;

if (!window.__PIXI_APP__) {
    window.__PIXI_APP__ = new PIXI.Application();
    window.__PIXI_CARD_TEXTURES__ = {};
}
const pixiApp = window.__PIXI_APP__;
const cardTextures = window.__PIXI_CARD_TEXTURES__!;


const initializePixi = () => {
    if (window.__PIXI_INIT_PROMISE__) {
        return window.__PIXI_INIT_PROMISE__;
    }

    window.__PIXI_INIT_PROMISE__ = (async () => {
        await pixiApp.init({
            width: 1000,
            height: 800,
            backgroundColor: 0x1f2937,
            antialias: true,
        });

        // Load textures only if they haven't been loaded before.
        if (Object.keys(cardTextures).length === 0) {
            const texture = await PIXI.Assets.load(CARD_ATLAS_URL);
            const source = texture.source;
            const cardBackTexture = new PIXI.Texture({source, frame: new PIXI.Rectangle(2 * CARD_WIDTH, 4 * CARD_HEIGHT, CARD_WIDTH, CARD_HEIGHT)});
            cardTextures['back'] = cardBackTexture;

            SUITS.forEach((suit, suitIndex) => {
                RANKS.forEach((rank, rankIndex) => {
                    const key = `${rank}${suit[0]}`;
                    cardTextures[key] = new PIXI.Texture({
                        source,
                        frame: new PIXI.Rectangle(rankIndex * CARD_WIDTH, suitIndex * CARD_HEIGHT, CARD_WIDTH, CARD_HEIGHT)
                    });
                });
            });
        }
    })();
    
    return window.__PIXI_INIT_PROMISE__;
};
// --- End Singleton Setup ---

const App: React.FC = () => {
    const pixiContainer = useRef<HTMLDivElement>(null);
    const [gameState, setGameState] = useState<GameState>(dealInitialState(shuffle(createDeck())));
    const [isLoadingHint, setIsLoadingHint] = useState(false);
    const [hint, setHint] = useState<Move | null>(null);
    const [hintError, setHintError] = useState<string | null>(null);
    const [isGameWon, setIsGameWon] = useState(false);
    const [pixiReady, setPixiReady] = useState(false);
    const [score, setScore] = useState(0);
    
    const draggedObject = useRef<{ sprite: PIXI.Container, cards: Card[], from: { pileType: PileType, pileIndex: number, cardIndex: number } } | null>(null);
    const previousGameState = useRef<GameState | null>(null);


    const startNewGame = () => {
        setGameState(dealInitialState(shuffle(createDeck())));
        setHint(null);
        setHintError(null);
        setIsGameWon(false);
        setScore(0);
    };

    const handleGetHint = useCallback(async () => {
        setIsLoadingHint(true);
        setHint(null);
        setHintError(null);
        try {
            const suggestedMove = await getHint(gameState);
            if(suggestedMove) {
                setHint(suggestedMove);
            } else {
                setHintError("The AI couldn't find a valid move.");
            }
        } catch (error) {
            console.error("Error getting hint:", error);
            setHintError("Failed to get a hint from the AI. Please try again.");
        } finally {
            setIsLoadingHint(false);
        }
    }, [gameState]);
    
    const handleMove = useCallback((move: Move) => {
        const { valid, reason } = isMoveValid(gameState, move);
        if (valid) {
            let points = 0;
            if (move.type === 'move' && move.from && move.to) {
                // Moving to a foundation pile
                if (move.to.pileType === 'foundation') {
                    points += 10;
                }
                // Moving from waste to tableau
                if (move.from.pileType === 'waste' && move.to.pileType === 'tableau') {
                    points += 5;
                }
                // Penalty for moving from foundation back to tableau
                if (move.from.pileType === 'foundation' && move.to.pileType === 'tableau') {
                    points -= 10;
                }
            }
            
            const newGameState = executeMove(gameState, move);

            // Check for newly revealed tableau cards
            if (move.type === 'move' && move.from?.pileType === 'tableau') {
                const sourcePileBefore = gameState.tableau[move.from.pileIndex];
                const sourcePileAfter = newGameState.tableau[move.from.pileIndex];
                if (sourcePileAfter.length > 0 && sourcePileBefore.length > sourcePileAfter.length) {
                    const topCardAfter = sourcePileAfter[sourcePileAfter.length - 1];
                    const correspondingCardBefore = sourcePileBefore[sourcePileAfter.length - 1];
                    if (topCardAfter.faceUp && !correspondingCardBefore.faceUp) {
                         points += 5; // Card was revealed
                    }
                }
            }

            setScore(currentScore => Math.max(0, currentScore + points));
            setGameState(newGameState);
            if (checkWinCondition(newGameState)) {
                setIsGameWon(true);
            }
        } else {
            console.warn(`Invalid move attempted: ${reason}`);
            // Force a re-render to snap cards back to position
            setGameState(current => ({...current})); 
        }
    }, [gameState]);

    const handleStockClick = useCallback(() => {
       handleMove({ type: 'draw' });
    }, [handleMove]);
    
    // Effect for attaching and detaching the Pixi canvas
    useEffect(() => {
        const parentElement = pixiContainer.current;
        if (!parentElement) return;

        let isMounted = true;

        initializePixi().then(() => {
            if (isMounted && parentElement && !parentElement.contains(pixiApp.canvas)) {
                parentElement.appendChild(pixiApp.canvas);
                setPixiReady(true);
            }
        }).catch(err => console.error("Failed to initialize PixiJS", err));

        return () => {
            isMounted = false;
            if (pixiApp.canvas?.parentElement) {
                pixiApp.canvas.parentElement.removeChild(pixiApp.canvas);
            }
        };
    }, []);
    
    useEffect(() => {
        // This effect runs after the main render effect, updating the ref for the *next* render cycle.
        previousGameState.current = gameState;
    }, [gameState]);


    const onDragMove = useCallback((e: PIXI.FederatedPointerEvent) => {
        if (draggedObject.current) {
            draggedObject.current.sprite.position.copyFrom(e.global);
        }
    }, []);

    const onDragEnd = useCallback(() => {
        if (draggedObject.current) {
            pixiApp.stage.off('pointermove', onDragMove);
            const { sprite, from, cards } = draggedObject.current;
            const endPos = sprite.position;

            if(sprite.parent) {
                sprite.parent.removeChild(sprite);
            }
            sprite.destroy({children:true});

            let dropped = false;
            
            for (let i = 0; i < 4; i++) {
                const pileBounds = new PIXI.Rectangle(PILE_POSITIONS.foundations[i].x, PILE_POSITIONS.foundations[i].y, CARD_WIDTH, CARD_HEIGHT);
                if (pileBounds.contains(endPos.x, endPos.y)) {
                    handleMove({ type: 'move', from, to: { pileType: 'foundation', pileIndex: i }, cards });
                    dropped = true;
                    break;
                }
            }
            
            if (!dropped) {
                for (let i = 0; i < 7; i++) {
                    const pile = gameState.tableau[i];
                    const yOffset = pile.length > 0 ? (pile.filter(c => c.faceUp).length -1) * STACK_OFFSET_Y + pile.filter(c => !c.faceUp).length * (STACK_OFFSET_Y / 4) : 0;
                    const pileBounds = new PIXI.Rectangle(PILE_POSITIONS.tableau[i].x, PILE_POSITIONS.tableau[i].y, CARD_WIDTH, CARD_HEIGHT + yOffset);
                    if (pileBounds.contains(endPos.x, endPos.y)) {
                         handleMove({ type: 'move', from, to: { pileType: 'tableau', pileIndex: i }, cards });
                         dropped = true;
                         break;
                    }
                }
            }
            
            if (!dropped) {
                // Invalid drop, trigger a re-render which will snap cards back
                setGameState(current => ({...current})); 
            }

            draggedObject.current = null;
        }
    }, [gameState, handleMove, onDragMove]);

    const onDragStart = useCallback((e: PIXI.FederatedPointerEvent, card: Card, pileType: PileType, pileIndex: number, cardIndex: number) => {
        const originalSprite = e.currentTarget as PIXI.Sprite;
        // Find the correct container for tableau cards
        const container = originalSprite.parent;

        let draggedCards: Card[] = [];
        if (pileType === 'tableau') {
            draggedCards = gameState.tableau[pileIndex].slice(cardIndex);
        } else { // waste or foundation
            draggedCards = [card];
        }

        const spritesToMove: PIXI.Sprite[] = [];
        // The stage contains multiple containers, we need to find sprites on the correct one
        draggedCards.forEach(c => {
            const sprite = container.children.find(s => (s as any).cardData === c) as PIXI.Sprite;
            if (sprite) spritesToMove.push(sprite);
        });

        if (spritesToMove.length === 0) return;

        const dragContainer = new PIXI.Container();
        const startPos = spritesToMove[0].getGlobalPosition();
        
        spritesToMove.forEach((sprite, i) => {
            // Take the sprite from its original container
            sprite.parent.removeChild(sprite);
            dragContainer.addChild(sprite);
            // Reset position relative to the new container
            sprite.position.set(0, i * STACK_OFFSET_Y);
        });

        pixiApp.stage.addChild(dragContainer);
        dragContainer.position.copyFrom(startPos);

        draggedObject.current = {
            sprite: dragContainer,
            cards: draggedCards,
            from: { pileType, pileIndex, cardIndex }
        };

        dragContainer.alpha = 0.8;
        pixiApp.stage.on('pointermove', onDragMove);
    }, [gameState.tableau, onDragMove]);


    // Effect for rendering the game state onto the canvas
    useEffect(() => {
        if (pixiApp && pixiReady && Object.keys(cardTextures).length > 0) {
            const stage = pixiApp.stage;
            stage.removeChildren();

            const animateCardFlip = (sprite: PIXI.Sprite, finalTextureKey: string) => {
                const finalTexture = cardTextures[finalTextureKey];
                if (!finalTexture) return;

                sprite.texture = cardTextures['back'];
                const ticker = PIXI.Ticker.shared;
                const duration = 0.4;
                let elapsed = 0;

                const originalPosition = sprite.position.clone();
                sprite.anchor.set(0.5, 0.5);
                sprite.position.set(originalPosition.x + CARD_WIDTH / 2, originalPosition.y + CARD_HEIGHT / 2);

                const onUpdate = (ticker: PIXI.Ticker) => {
                    elapsed += ticker.deltaMS / 1000;
                    const progress = Math.min(elapsed / duration, 1);

                    if (progress < 0.5) {
                        sprite.scale.x = 1 - progress * 2;
                    } else {
                        if (sprite.texture !== finalTexture) {
                            sprite.texture = finalTexture;
                        }
                        sprite.scale.x = (progress - 0.5) * 2;
                    }

                    if (progress >= 1) {
                        ticker.remove(onUpdate);
                        sprite.scale.x = 1;
                        sprite.anchor.set(0, 0);
                        sprite.position.copyFrom(originalPosition);
                    }
                };
                ticker.add(onUpdate);
            };

            const justFlippedLocations = new Set<string>();
            const prevGameState = previousGameState.current;
            if (prevGameState) {
                if (gameState.waste.length > prevGameState.waste.length) {
                    justFlippedLocations.add('waste');
                }
                gameState.tableau.forEach((pile, pileIndex) => {
                    const prevPile = prevGameState.tableau[pileIndex];
                    if (pile.length > 0 && prevPile && prevPile.length > pile.length) {
                        const revealedCard = pile[pile.length - 1];
                        const prevVersionOfCard = prevPile[pile.length - 1];
                        if (revealedCard.faceUp && !prevVersionOfCard.faceUp) {
                            justFlippedLocations.add(`tableau-${pileIndex}-${pile.length - 1}`);
                        }
                    }
                });
            }


            const createPlaceholder = (x: number, y: number, text: string) => {
                const placeholder = new PIXI.Graphics();
                placeholder.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
                placeholder.stroke({ width: 2, color: 0x4b5563, alpha: 0.5 });
                placeholder.fill({ color: 0x374151, alpha: 0.2 });
                placeholder.position.set(x, y);
                const pText = new PIXI.Text({ text, style: { fontSize: 24, fill: 0x4b5563 } });
                pText.anchor.set(0.5);
                pText.position.set(CARD_WIDTH/2, CARD_HEIGHT/2);
                placeholder.addChild(pText);
                stage.addChild(placeholder);
            };

            PILE_POSITIONS.foundations.forEach((pos, i) => createPlaceholder(pos.x, pos.y, SUITS[i][0]));
            PILE_POSITIONS.tableau.forEach((pos) => createPlaceholder(pos.x, pos.y, ''));
            createPlaceholder(PILE_POSITIONS.stock.x, PILE_POSITIONS.stock.y, '♻️');
            
            // Render Stock
            const stockContainer = new PIXI.Container();
            stage.addChild(stockContainer);
            if (gameState.stock.length > 0) {
                 const sprite = new PIXI.Sprite(cardTextures['back']);
                 sprite.position.set(PILE_POSITIONS.stock.x, PILE_POSITIONS.stock.y);
                 sprite.eventMode = 'static';
                 sprite.cursor = 'pointer';
                 sprite.on('pointertap', handleStockClick);
                 stockContainer.addChild(sprite);
            }
            
            // Render Waste
            const wasteContainer = new PIXI.Container();
            stage.addChild(wasteContainer);
            if (gameState.waste.length > 0) {
                const wasteCard = gameState.waste[gameState.waste.length - 1];
                const key = `${wasteCard.rank}${wasteCard.suit[0]}`;
                const sprite = new PIXI.Sprite(cardTextures[key]);
                sprite.position.set(PILE_POSITIONS.waste.x, PILE_POSITIONS.waste.y);

                if (justFlippedLocations.has('waste')) {
                    animateCardFlip(sprite, key);
                }

                sprite.eventMode = 'static';
                sprite.cursor = 'pointer';
                (sprite as any).cardData = wasteCard;

                sprite.on('pointerdown', (e) => onDragStart(e, wasteCard, 'waste', 0, gameState.waste.length - 1));
                sprite.on('pointerup', onDragEnd);
                sprite.on('pointerupoutside', onDragEnd);
                wasteContainer.addChild(sprite);
            }
            
            // Render Foundations
            gameState.foundations.forEach((pile, pileIndex) => {
                const foundationContainer = new PIXI.Container();
                stage.addChild(foundationContainer);
                if(pile.length > 0) {
                    const topCard = pile[pile.length - 1];
                    const key = `${topCard.rank}${topCard.suit[0]}`;
                    const sprite = new PIXI.Sprite(cardTextures[key]);
                    sprite.position.set(PILE_POSITIONS.foundations[pileIndex].x, PILE_POSITIONS.foundations[pileIndex].y);
                    (sprite as any).cardData = topCard;
                    foundationContainer.addChild(sprite);
                }
            });

            // Render Tableau
            gameState.tableau.forEach((pile, pileIndex) => {
                const tableauContainer = new PIXI.Container();
                stage.addChild(tableauContainer);
                let yOffset = 0;
                pile.forEach((card, cardIndex) => {
                    const isFaceUp = card.faceUp;
                    const key = isFaceUp ? `${card.rank}${card.suit[0]}` : 'back';
                    const sprite = new PIXI.Sprite(cardTextures[key]);
                    const x = PILE_POSITIONS.tableau[pileIndex].x;
                    const y = PILE_POSITIONS.tableau[pileIndex].y + yOffset;
                    sprite.position.set(x, y);
                    
                    const locationKey = `tableau-${pileIndex}-${cardIndex}`;
                    if (isFaceUp && justFlippedLocations.has(locationKey)) {
                         animateCardFlip(sprite, key);
                    }

                    (sprite as any).cardData = card;

                    if (isFaceUp) {
                        sprite.eventMode = 'static';
                        sprite.cursor = 'pointer';
                        sprite.on('pointerdown', (e) => onDragStart(e, card, 'tableau', pileIndex, cardIndex));
                        sprite.on('pointerup', onDragEnd);
                        sprite.on('pointerupoutside', onDragEnd);
                        yOffset += STACK_OFFSET_Y;
                    } else {
                        yOffset += STACK_OFFSET_Y / 4;
                    }
                    
                    tableauContainer.addChild(sprite);
                });
            });
        }
    }, [gameState, pixiReady, handleStockClick, onDragStart, onDragEnd]);

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4 font-sans">
            <Header onNewGame={startNewGame} onGetHint={handleGetHint} isLoadingHint={isLoadingHint} score={score} />
            <div ref={pixiContainer} className="mt-4 rounded-lg overflow-hidden shadow-2xl border-4 border-gray-700"></div>
            <HintModal hint={hint} setHint={setHint} error={hintError} />
            <GameOverModal isOpen={isGameWon} onNewGame={startNewGame} />
        </div>
    );
};

export default App;