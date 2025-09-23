import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
// FIX: Use a namespace import because the CDN bundle does not provide named exports.
import * as ReactPixiLegacy from '@pixi/react-legacy';
import * as PIXI from 'pixi.js';
import { CardData, Suit, Rank } from '../../types';

const CARD_WIDTH = 100;
const CARD_HEIGHT = 150;
const RADIUS = 10;

// Custom hook for smooth position tweening
const useAnimatedPosition = (targetX: number, targetY: number) => {
    const pos = useRef({ x: targetX, y: targetY });
    const [renderPos, setRenderPos] = useState({ x: targetX, y: targetY });
    const speed = 0.15;

    useEffect(() => {
        pos.current = { x: targetX, y: targetY };
    }, [targetX, targetY]);

    ReactPixiLegacy.useTick((ticker) => {
        const dx = pos.current.x - renderPos.x;
        const dy = pos.current.y - renderPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
            const newX = renderPos.x + dx * speed * ticker.speed;
            const newY = renderPos.y + dy * speed * ticker.speed;
            setRenderPos({ x: newX, y: newY });
        } else if (renderPos.x !== pos.current.x || renderPos.y !== pos.current.y) {
            setRenderPos({ x: pos.current.x, y: pos.current.y });
        }
    });
    
    return renderPos;
};

const CardBack = memo((props: any) => {
    const draw = useCallback((g: PIXI.Graphics) => {
        g.clear();
        g.beginFill(0x1a3a6b);
        g.lineStyle(2, 0xffffff, 1);
        g.drawRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, RADIUS);
        g.endFill();
        g.beginFill(0x2a5a9a, 0.5);
        g.drawRoundedRect(5, 5, CARD_WIDTH - 10, CARD_HEIGHT - 10, RADIUS - 2);
        g.endFill();
    }, []);
    return <ReactPixiLegacy.Graphics draw={draw} {...props} />;
});

// Returns a plain style object, which is safer for @pixi/react
const textStyle = (color: number | string): Partial<PIXI.TextStyle> => ({
    fontFamily: 'Arial',
    fontSize: 20,
    fill: color,
    fontWeight: 'bold'
});

const CardFront = memo(({ data, ...props }: { data: CardData; [key: string]: any }) => {
    const isRed = data.suit === Suit.Hearts || data.suit === Suit.Diamonds;
    const textColor = isRed ? '#D10000' : '#000000';
    const suitSymbols: Record<Suit, string> = { 'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠' };

    const style = textStyle(textColor);
    const mainSuitStyle: Partial<PIXI.TextStyle> = { ...style, fontSize: 50 };

    const draw = useCallback((g: PIXI.Graphics) => {
        g.clear();
        g.beginFill(0xffffff);
        g.lineStyle(2, 0x333333, 1);
        g.drawRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, RADIUS);
        g.endFill();
    }, []);

    return (
        <ReactPixiLegacy.Graphics draw={draw} {...props}>
            <ReactPixiLegacy.Text text={data.rank} style={style} x={10} y={5} />
            <ReactPixiLegacy.Text text={suitSymbols[data.suit]} style={style} x={10} y={30} />
            <ReactPixiLegacy.Text text={suitSymbols[data.suit]} style={mainSuitStyle} anchor={0.5} x={CARD_WIDTH / 2} y={CARD_HEIGHT / 2} />
            <ReactPixiLegacy.Text text={data.rank} style={style} anchor={1} rotation={Math.PI} x={CARD_WIDTH - 10} y={CARD_HEIGHT - 5} />
        </ReactPixiLegacy.Graphics>
    );
});

const Highlight = memo(({ color = 0x00FF00 }: { color?: number }) => {
    const draw = useCallback((g: PIXI.Graphics) => {
        g.clear();
        g.lineStyle(4, color, 1);
        g.drawRoundedRect(-2, -2, CARD_WIDTH + 4, CARD_HEIGHT + 4, RADIUS);
    }, [color]);
    return <ReactPixiLegacy.Graphics draw={draw} />;
});


interface CardComponentProps {
    data: CardData;
    x: number;
    y: number;
    onPointerDown: (e: PIXI.FederatedPointerEvent, data: CardData) => void;
    isHighlighted?: boolean;
    highlightColor?: number;
    onFlipped: () => void;
}

export const CardComponent: React.FC<CardComponentProps> = ({ data, x, y, onPointerDown, isHighlighted, highlightColor, onFlipped }) => {
    const { faceUp } = data;
    const pos = useAnimatedPosition(x, y);
    
    // Flip animation state
    const [scaleX, setScaleX] = useState(faceUp ? 1 : -1);
    const targetScaleX = useRef(faceUp ? 1 : -1);
    const midFlipSoundPlayed = useRef(true);

    useEffect(() => {
        targetScaleX.current = faceUp ? 1 : -1;
        midFlipSoundPlayed.current = false;
    }, [faceUp]);

    ReactPixiLegacy.useTick((ticker) => {
        const speed = 0.2 * ticker.speed;
        if (Math.abs(scaleX - targetScaleX.current) > 0.01) {
            const newScale = scaleX + (targetScaleX.current - scaleX) * speed;
            if (!midFlipSoundPlayed.current && Math.sign(scaleX) !== Math.sign(newScale)) {
                onFlipped();
                midFlipSoundPlayed.current = true;
            }
            setScaleX(newScale);
        } else if (scaleX !== targetScaleX.current) {
            setScaleX(targetScaleX.current);
        }
    });

    const isCurrentlyFaceUp = scaleX > 0;

    return (
        <ReactPixiLegacy.Container 
            x={pos.x + (CARD_WIDTH / 2)}
            y={pos.y + (CARD_HEIGHT / 2)}
            pivot={{ x: CARD_WIDTH / 2, y: CARD_HEIGHT / 2 }}
            scale={{ x: scaleX, y: 1 }}
            interactive={true} 
            cursor="pointer"
            pointerdown={(e) => onPointerDown(e, data)}
        >
            <CardBack visible={!isCurrentlyFaceUp} />
            <CardFront data={data} visible={isCurrentlyFaceUp} />
            {isHighlighted && <Highlight color={highlightColor} />}
        </ReactPixiLegacy.Container>
    );
};