import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../phaser/scenes/GameScene';

const GAME_WIDTH = 660;
const GAME_HEIGHT = 700;

interface PhaserGameProps {
    cardBackUrl: string;
    difficulty: 'draw1' | 'draw3';
}

const PhaserGame: React.FC<PhaserGameProps> = ({ cardBackUrl, difficulty }) => {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        // Create the game instance only if it doesn't exist
        if (!gameRef.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                parent: 'phaser-container',
                backgroundColor: '#059669',
                scene: [GameScene], // Add scene class, but don't auto-start
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH
                }
            };
            
            // Create and store the game instance
            gameRef.current = new Phaser.Game(config);
        }

        const game = gameRef.current;
        const scene = game.scene.getScene('GameScene') as GameScene;

        // If the scene is active, restart it with new props. Otherwise, start it.
        if (scene && scene.sys.isActive()) {
            // FIX: Use scene.scene.restart to restart a scene, not scene.sys.restart.
            scene.scene.restart({ cardBackUrl, difficulty });
        } else {
            // Wait for the 'ready' event to ensure the game is fully initialized
            game.events.once('ready', () => {
                game.scene.start('GameScene', { cardBackUrl, difficulty });
            });
        }
        
        // Define event handlers that can access the stable game instance
        const handleNewGame = () => {
             const currentScene = gameRef.current?.scene.getScene('GameScene') as GameScene;
             if(currentScene && currentScene.sys.isActive()){
                // FIX: Use currentScene.scene.restart to restart a scene, not currentScene.sys.restart.
                currentScene.scene.restart({ cardBackUrl, difficulty });
             }
        };

        const handleUndoMove = () => {
            const currentScene = gameRef.current?.scene.getScene('GameScene') as GameScene;
            if(currentScene && currentScene.sys.isActive()){
               currentScene.undoMove();
            }
        };

        // Add event listeners
        window.addEventListener('newGame', handleNewGame);
        window.addEventListener('undoMove', handleUndoMove);

        // Cleanup: remove listeners when props change or component unmounts
        return () => {
            window.removeEventListener('newGame', handleNewGame);
            window.removeEventListener('undoMove', handleUndoMove);
        };

    }, [cardBackUrl, difficulty]); // Rerun effect when props change

    // On unmount, destroy the game instance
    useEffect(() => {
        return () => {
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, []);

    return <div id="phaser-container" className="absolute inset-0" />;
};

export default PhaserGame;