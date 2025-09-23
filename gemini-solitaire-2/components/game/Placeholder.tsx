import React from 'react';
// FIX: Use a namespace import because the CDN bundle does not provide named exports.
import * as ReactPixiLegacy from '@pixi/react-legacy';
import * as PIXI from 'pixi.js';

interface PlaceholderProps {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    isHighlighted?: boolean;
    highlightColor?: number;
}

export const Placeholder: React.FC<PlaceholderProps> = ({ x, y, width, height, text, isHighlighted, highlightColor = 0x00FFFF }) => {
    const draw = React.useCallback((g: PIXI.Graphics) => {
        g.clear();
        if (isHighlighted) {
            g.lineStyle(4, highlightColor, 1);
        } else {
            g.lineStyle(2, 0xFFFFFF, 0.2);
        }
        g.beginFill(0xFFFFFF, 0.05);
        g.drawRoundedRect(0, 0, width, height, 10);
        g.endFill();
    }, [width, height, isHighlighted, highlightColor]);
    
    const textStyle: Partial<PIXI.TextStyle> = { fontSize: 24, fill: '#FFFFFF', fontFamily: 'Arial' };

    return (
        <ReactPixiLegacy.Graphics x={x} y={y} draw={draw}>
            <ReactPixiLegacy.Text 
                text={text}
                anchor={0.5}
                x={width / 2}
                y={height / 2}
                style={textStyle}
                alpha={0.3}
            />
        </ReactPixiLegacy.Graphics>
    );
};