import React, { useRef, useEffect } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../phaser/scenes/GameScene';

const GAME_WIDTH = 660;
const GAME_HEIGHT = 900;

interface PhaserGameProps {
    cardBackUrl: string;
    difficulty: 'draw1' | 'draw3';
}

const PhaserGame: React.FC<PhaserGameProps> = ({ cardBackUrl, difficulty }) => {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameRef.current) {
            return;
        }

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            parent: 'phaser-container',
            backgroundColor: '#059669',
            scene: GameScene,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };

        gameRef.current = new Phaser.Game(config);
        gameRef.current.scene.start('GameScene', { cardBackUrl, difficulty });


        const handleNewGame = () => {
            gameRef.current?.scene.getScene('GameScene')?.scene.restart({ cardBackUrl, difficulty });
        };

        const handleUndoMove = () => {
            const scene = gameRef.current?.scene.getScene('GameScene') as GameScene;
            if (scene && typeof scene.undoMove === 'function') {
                scene.undoMove();
            }
        };

        window.addEventListener('newGame', handleNewGame);
        window.addEventListener('undoMove', handleUndoMove);

        return () => {
            window.removeEventListener('newGame', handleNewGame);
            window.removeEventListener('undoMove', handleUndoMove);
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // Effect to handle changes to props after initial creation
    useEffect(() => {
        if (gameRef.current && gameRef.current.scene.isActive('GameScene')) {
            gameRef.current.scene.getScene('GameScene').scene.restart({ cardBackUrl, difficulty });
        }
    }, [cardBackUrl, difficulty]);


    return <div id="phaser-container" className="absolute inset-0" />;
};

export default PhaserGame;