import React from 'react';
// FIX: Use a namespace import because the CDN bundle does not provide named exports.
import * as ReactPixiLegacy from '@pixi/react-legacy';
import { CardComponent } from './CardComponent';
import { Placeholder } from './Placeholder';
import { useSolitaireGame } from '../../hooks/useSolitaireGame';
import { playSound } from '../../services/audioService';
import { CardLocation, CardData } from '../../types';
import * as PIXI from 'pixi.js';

type SolitaireGameHook = ReturnType<typeof useSolitaireGame>;

// We only want the props that SolitaireStage actually uses from the hook
type SolitaireStageProps = Omit<SolitaireGameHook, 'newGame' | 'setDifficulty' | 'getGameState' | 'highlightMove' | 'clearHighlights' | 'playLoseSound' | 'undo' | 'redo' | 'canUndo' | 'canRedo'>;


// Layout constants
const CARD_WIDTH = 100;
const CARD_HEIGHT = 150;
const PADDING = 20;
const TABLEAU_Y_OFFSET = 30;
const WASTE_X_OFFSET = 25;

const isLocationEqual = (a: CardLocation, b: CardLocation) => {
    return a.pile === b.pile && a.pileIndex === b.pileIndex;
};

export const SolitaireStage: React.FC<SolitaireGameHook> = (game) => {
    const { tableau, foundations, stock, waste, draggingState, onDragStart, onDragMove, onDragEnd, highlightedMove, difficulty, passesLeft } = game;
    
    const onCardPointerDown = (e: PIXI.FederatedPointerEvent, card: CardData) => {
        // Pass the original event directly to the hook. It contains all necessary info.
        onDragStart(e, card);
    };

    const isCardHighlighted = (pile: 'tableau' | 'foundation' | 'stock' | 'waste', pileIndex: number | undefined, cardIndex: number | undefined, cardId: string) => {
        if (!highlightedMove) return { is: false };

        const from = highlightedMove.from;
        const to = highlightedMove.to;

        // Check if this card is the source of the move
        if (from.pile === pile && from.pileIndex === pileIndex && highlightedMove.cards[0].id === cardId) {
            return { is: true, color: 0x00FF00 }; // Green for source
        }

        // Check if this card is the destination of the move
        const targetCard = pile === 'tableau' ? tableau[pileIndex!]?.[cardIndex!] : 
                           pile === 'foundation' ? foundations[pileIndex!]?.[cardIndex!] : null;
        
        if (targetCard && isLocationEqual(to, { pile, pileIndex }) && (cardIndex === (pile === 'tableau' ? tableau[pileIndex!].length - 1 : foundations[pileIndex!].length - 1))) {
             return { is: true, color: 0x00FFFF }; // Cyan for target
        }
        
        return { is: false };
    };
    
    const isPlaceholderHighlighted = (pile: 'tableau' | 'foundation', pileIndex: number) => {
        if (!highlightedMove) return false;
        const to = highlightedMove.to;
        const targetPile = pile === 'tableau' ? tableau[pileIndex] : foundations[pileIndex];
        return isLocationEqual(to, { pile, pileIndex }) && targetPile.length === 0;
    };


    return (
        <ReactPixiLegacy.Stage 
            width={1200} height={800} 
            options={{ backgroundColor: 0x075e54, antialias: true, resolution: window.devicePixelRatio || 1 }}
            pointermove={onDragMove}
            pointerup={onDragEnd}
            pointerupoutside={onDragEnd}
        >
            {/* --- Placeholders --- */}
            <Placeholder x={PADDING} y={PADDING} width={CARD_WIDTH} height={CARD_HEIGHT} text="S" />
            <Placeholder x={PADDING + CARD_WIDTH + PADDING} y={PADDING} width={CARD_WIDTH} height={CARD_HEIGHT} text="" />
            {Array(4).fill(0).map((_, i) => (
                <Placeholder 
                    key={`found-ph-${i}`}
                    x={1200 - (4 - i) * (CARD_WIDTH + PADDING)} y={PADDING}
                    width={CARD_WIDTH} height={CARD_HEIGHT} text="A" 
                    isHighlighted={isPlaceholderHighlighted('foundation', i)}
                />
            ))}
            {Array(7).fill(0).map((_, i) => (
                <Placeholder 
                    key={`tab-ph-${i}`}
                    x={PADDING + i * (CARD_WIDTH + PADDING)} y={PADDING * 2 + CARD_HEIGHT}
                    width={CARD_WIDTH} height={CARD_HEIGHT} text="" 
                    isHighlighted={isPlaceholderHighlighted('tableau', i)}
                />
            ))}
             {difficulty === 'hard' && passesLeft !== null && (
                <ReactPixiLegacy.Text text={`Passes Left: ${Math.max(0, passesLeft - 1)}`} 
                    style={{
                        fontSize: 16,
                        fill: 0xFFFFFF,
                        fontFamily: 'Arial',
                        stroke: '#000000',
                        strokeThickness: 2,
                    }}
                    x={PADDING} y={PADDING + CARD_HEIGHT + 10}
                />
             )}

            {/* --- Cards --- */}
            <ReactPixiLegacy.Container>
                {/* Stock */}
                {stock.map((card, i) => (
                    <CardComponent key={card.id} data={card} x={PADDING} y={PADDING} onPointerDown={onCardPointerDown} onFlipped={() => playSound('flip')} />
                ))}

                {/* Waste */}
                {waste.map((card, i) => {
                    const highlight = isCardHighlighted('waste', undefined, i, card.id);
                    let xPos = PADDING + CARD_WIDTH + PADDING;
                    if(difficulty !== 'easy') {
                        const topThree = waste.slice(-3);
                        const indexInTop = topThree.findIndex(c => c.id === card.id);
                        if (indexInTop !== -1) {
                            xPos += indexInTop * WASTE_X_OFFSET;
                        } else if (waste.length > 3) {
                           // If not in top 3, stack with the first of the top 3 if it exists
                           xPos = PADDING + CARD_WIDTH + PADDING;
                        }
                    }
                    return (
                        <CardComponent key={card.id} data={card} x={xPos} y={PADDING} onPointerDown={onCardPointerDown} isHighlighted={highlight.is} highlightColor={highlight.color} onFlipped={() => playSound('flip')} />
                    );
                })}

                {/* Foundations */}
                {foundations.map((pile, i) => pile.map((card, j) => {
                     const highlight = isCardHighlighted('foundation', i, j, card.id);
                     return (
                        <CardComponent key={card.id} data={card} x={1200 - (4 - i) * (CARD_WIDTH + PADDING)} y={PADDING} onPointerDown={onCardPointerDown} isHighlighted={highlight.is} highlightColor={highlight.color} onFlipped={() => playSound('flip')} />
                     );
                }))}

                {/* Tableau */}
                {tableau.map((pile, i) => pile.map((card, j) => {
                     const highlight = isCardHighlighted('tableau', i, j, card.id);
                     return(
                        <CardComponent 
                            key={card.id} data={card} 
                            x={PADDING + i * (CARD_WIDTH + PADDING)} 
                            y={PADDING * 2 + CARD_HEIGHT + j * TABLEAU_Y_OFFSET} 
                            onPointerDown={onCardPointerDown} 
                            isHighlighted={highlight.is} highlightColor={highlight.color}
                            onFlipped={() => playSound('flip')}
                        />
                     );
                }))}

                 {/* Dragging Stack - render on top */}
                 {draggingState && draggingState.stack.map((card, i) => {
                    const cardCenter_X = draggingState.currentPosition.x - draggingState.offset.x;
                    const cardCenter_Y = draggingState.currentPosition.y - draggingState.offset.y;

                    // The CardComponent expects top-left coordinates for its x/y props.
                    // We must convert our calculated center position to top-left.
                    const x = cardCenter_X - (CARD_WIDTH / 2);
                    const y = cardCenter_Y - (CARD_HEIGHT / 2) + (i * TABLEAU_Y_OFFSET);
                    
                    return (
                       <CardComponent key={`drag-${card.id}`} data={{...card, faceUp: true}} x={x} y={y} onPointerDown={() => {}} onFlipped={() => {}} />
                    )
                 })}

            </ReactPixiLegacy.Container>
        </ReactPixiLegacy.Stage>
    );
};