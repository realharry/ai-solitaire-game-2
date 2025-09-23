import Phaser from 'phaser';
import { Suit, Rank, Card, CardColor, RANK_VALUES } from '../../types';

const CARD_WIDTH = 80;
const CARD_HEIGHT = 112;
const CARD_CORNER_RADIUS = 6;
const Y_OFFSET = 20;

const DEPTHS = {
    BG: 0,
    ZONE: 1,
    CARD: 10,
    DRAGGED_CARD: 1000
};

interface GameState {
    tableauPiles: Card[][];
    foundationPiles: Card[][];
    stockPile: Card[];
    wastePile: Card[];
}

interface GameStats {
    gamesPlayed: number;
    gamesWon: number;
    currentStreak: number;
    bestStreak: number;
}

// --- Stats Helper Functions ---
const STATS_KEY = 'solitaireStats';

const getStats = (): GameStats => {
    const statsJson = localStorage.getItem(STATS_KEY);
    if (statsJson) {
        return JSON.parse(statsJson);
    }
    return { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, bestStreak: 0 };
};

const saveStats = (stats: GameStats) => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};
// -----------------------------


class CardGameObject extends Phaser.GameObjects.Container {
    cardData: Card;
    faceUpGfx: Phaser.GameObjects.Graphics;
    faceDownImage: Phaser.GameObjects.Image;
    rankText: Phaser.GameObjects.Text;
    suitText: Phaser.GameObjects.Text;
    shadowGfx: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number, cardData: Card) {
        super(scene, x, y);
        this.cardData = cardData;
        this.setSize(CARD_WIDTH, CARD_HEIGHT);
        
        // FIX: The hit area must be centered on the container's origin to match the visuals.
        // The container's origin (0,0) is its center, and graphics are drawn relative to it.
        const hitArea = new Phaser.Geom.Rectangle(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT);
        this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        this.shadowGfx = this.scene.add.graphics();
        this.shadowGfx.fillStyle(0x000000, 0.4);
        this.shadowGfx.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
        this.shadowGfx.setPosition(4, 4);
        this.shadowGfx.setAlpha(0);
        this.add(this.shadowGfx);

        this.faceDownImage = this.createCardBack();
        this.add(this.faceDownImage);

        const { graphics, rankText, suitText } = this.createCardFace();
        this.faceUpGfx = graphics;
        this.rankText = rankText;
        this.suitText = suitText;
        this.add(this.faceUpGfx);
        this.add(this.rankText);
        this.add(this.suitText);

        this.flip(cardData.isFaceUp, true);

        scene.add.existing(this);
    }

    createCardBack() {
        const img = this.scene.add.image(0, 0, 'cardBack');
        img.setDisplaySize(CARD_WIDTH, CARD_HEIGHT);
        img.setOrigin(0.5);
        return img;
    }

    createCardFace() {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xf8fafc, 1); // Slate-50 (off-white)
        graphics.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
        graphics.lineStyle(2, 0x1e293b, 1);
        graphics.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);

        const cardColor = (this.cardData.suit === Suit.Hearts || this.cardData.suit === Suit.Diamonds) ? '#ef4444' : '#1e293b'; // red-500, slate-800
        
        const rankText = this.scene.add.text(-CARD_WIDTH / 2 + 8, -CARD_HEIGHT / 2 + 5, this.cardData.rank, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: cardColor,
            fontStyle: 'bold'
        });

        const suitText = this.scene.add.text(0, 0, this.cardData.suit, {
            fontFamily: 'Arial',
            fontSize: '40px',
            color: cardColor,
        }).setOrigin(0.5);

        return { graphics, rankText, suitText };
    }

    flip(isFaceUp: boolean, instant: boolean = false) {
        this.cardData.isFaceUp = isFaceUp;
        this.scene.input.setDraggable(this, isFaceUp);

        if (instant) {
            this.faceUpGfx.setVisible(isFaceUp);
            this.rankText.setVisible(isFaceUp);
            this.suitText.setVisible(isFaceUp);
            this.faceDownImage.setVisible(!isFaceUp);
            this.scaleX = 1;
            return;
        }

        this.scene.tweens.add({
            targets: this,
            scaleX: 0,
            ease: 'Linear',
            duration: 100,
            onComplete: () => {
                this.faceUpGfx.setVisible(isFaceUp);
                this.rankText.setVisible(isFaceUp);
                this.suitText.setVisible(isFaceUp);
                this.faceDownImage.setVisible(!isFaceUp);
                this.scene.tweens.add({
                    targets: this,
                    scaleX: 1,
                    ease: 'Linear',
                    duration: 100,
                });
            }
        });
    }

    setDragging(isDragging: boolean) {
        if (isDragging) {
            this.scene.tweens.add({
                targets: this,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
            this.scene.tweens.add({
                targets: this.shadowGfx,
                alpha: 1,
                duration: 100
            });
        } else {
            this.scene.tweens.add({
                targets: this,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
            this.scene.tweens.add({
                targets: this.shadowGfx,
                alpha: 0,
                duration: 100
            });
        }
    }
}

export class GameScene extends Phaser.Scene {
    private deck: Card[] = [];
    private tableauPiles: CardGameObject[][] = [];
    private foundationPiles: CardGameObject[][] = [];
    private stockPile: CardGameObject[] = [];
    private wastePile: CardGameObject[] = [];

    private tableauZones: Phaser.GameObjects.Zone[] = [];
    private foundationZones: Phaser.GameObjects.Zone[] = [];
    private highlightedObjects: Phaser.GameObjects.Graphics[] = [];
    
    private history: GameState[] = [];
    private cardBackUrl: string = 'https://i.imgur.com/DrCL3Sj.png';
    private gameWasWon: boolean = false;
    private difficulty: 'draw1' | 'draw3' = 'draw1';

    private draggedStack: { cards: CardGameObject[], originalPositions: {x: number, y: number}[] } | null = null;
    private boundDispatchGameState: () => void;
    
    constructor() {
        super('GameScene');
        this.boundDispatchGameState = this.dispatchGameState.bind(this);
    }

    init(data: { cardBackUrl?: string; difficulty?: 'draw1' | 'draw3' }) {
        this.cardBackUrl = data.cardBackUrl || this.cardBackUrl;
        this.difficulty = data.difficulty || this.difficulty;
        
        if (this.textures.exists('cardBack')) {
            this.textures.remove('cardBack');
        }
    }

    preload() {
        this.load.image('cardBack', this.cardBackUrl);
        const audioBaseUrl = 'https://assets.kenney.nl/assets/';
        this.load.audio('deal', [`${audioBaseUrl}card-sounds/card-slide-1.ogg`, `${audioBaseUrl}card-sounds/card-slide-1.mp3`]);
        this.load.audio('place', [`${audioBaseUrl}card-sounds/card-place-1.ogg`, `${audioBaseUrl}card-sounds/card-place-1.mp3`]);
        this.load.audio('win', [`${audioBaseUrl}ui-audio/audio/success-1.ogg`, `${audioBaseUrl}ui-audio/audio/success-1.mp3`]);
        this.load.audio('undo', [`${audioBaseUrl}ui-audio/audio/switch-1.ogg`, `${audioBaseUrl}ui-audio/audio/switch-1.mp3`]);
        this.load.audio('shuffle', [`${audioBaseUrl}card-sounds/card-shove-1.ogg`, `${audioBaseUrl}card-sounds/card-shove-1.mp3`]);
    }

    create() {
        this.cameras.main.setBackgroundColor('#059669');
        this.createGameZones();
        this.createDeck();
        this.dealCards();
        this.setupDragListeners();

        window.addEventListener('getGameState', this.boundDispatchGameState);
    }

    shutdown() {
        window.removeEventListener('getGameState', this.boundDispatchGameState);
        if (this.draggedStack) {
            this.draggedStack.cards.forEach(c => { if(c.active) c.setDragging(false) });
        }
        this.draggedStack = null;
        this.clearHighlights();
        // FIX: Cancel all pending timers from this scene to prevent "zombie" callbacks
        // from firing after the scene has been destroyed on a restart, which causes a crash.
        this.time.removeAllEvents();
    }
    
    private playSound(key: string) {
        // Defensive check to prevent crashes if audio files fail to load
        if (this.sound.get(key)) {
            this.sound.play(key);
        } else {
            console.warn(`Audio key "${key}" not found in cache.`);
        }
    }
    
    private createGameZones() {
        // FIX: Clear arrays to ensure a clean state on scene restart.
        this.tableauZones = [];
        this.foundationZones = [];

        const width = Number(this.sys.game.config.width);
        const xMargin = (width - (7 * CARD_WIDTH) - (6 * 10)) / 2;

        for (let i = 0; i < 4; i++) {
            const x = width - xMargin - CARD_WIDTH / 2 - i * (CARD_WIDTH + 10);
            const y = Y_OFFSET + CARD_HEIGHT / 2;
            const FDN_ZONE_HEIGHT = CARD_HEIGHT + 20;
            this.foundationZones[i] = this.add.zone(x, y, CARD_WIDTH, FDN_ZONE_HEIGHT).setRectangleDropZone(CARD_WIDTH, FDN_ZONE_HEIGHT);
            const outline = this.add.graphics().setDepth(DEPTHS.BG);
            outline.lineStyle(2, 0xffffff, 0.2);
            outline.strokeRoundedRect(x - CARD_WIDTH / 2, y - CARD_HEIGHT/2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
        }
        
        const stockX = xMargin + CARD_WIDTH / 2;
        const stockY = Y_OFFSET + CARD_HEIGHT / 2;
        const stockZone = this.add.zone(stockX, stockY, CARD_WIDTH, CARD_HEIGHT).setRectangleDropZone(CARD_WIDTH, CARD_HEIGHT)
            .setName('stock')
            .setInteractive()
            .on('pointerdown', () => this.dealFromStock());
        const stockOutline = this.add.graphics().setDepth(DEPTHS.BG);
        stockOutline.lineStyle(2, 0xffffff, 0.2);
        stockOutline.strokeRoundedRect(stockX - CARD_WIDTH / 2, stockY - CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
        this.add.text(stockX, stockY, '♻️', { fontSize: '32px' }).setOrigin(0.5).disableInteractive();

        for (let i = 0; i < 7; i++) {
            const x = xMargin + CARD_WIDTH / 2 + i * (CARD_WIDTH + 10);
            const y = Y_OFFSET + CARD_HEIGHT + 20;
            // The zone is positioned at the top of the pile and grows downwards.
            this.tableauZones[i] = this.add.zone(x, y, CARD_WIDTH, 1200).setRectangleDropZone(CARD_WIDTH, 1200);
            this.tableauZones[i].setOrigin(0.5, 0); // Align to top center
        }
    }

    private createDeck() {
        this.deck = [];
        const suits = Object.values(Suit);
        const ranks = Object.values(Rank);
        for (const suit of suits) {
            for (const rank of ranks) {
                this.deck.push({ suit, rank, isFaceUp: false });
            }
        }
        Phaser.Utils.Array.Shuffle(this.deck);
    }

    private dealCards() {
        const stats = getStats();
        if (!this.gameWasWon && stats.gamesPlayed > 0) {
            stats.currentStreak = 0;
        }
        stats.gamesPlayed++;
        saveStats(stats);
        this.gameWasWon = false;

        [...this.tableauPiles, ...this.foundationPiles, this.stockPile, this.wastePile].flat().forEach(c => c.destroy());
        this.tableauPiles = Array.from({ length: 7 }, () => []);
        this.foundationPiles = Array.from({ length: 4 }, () => []);
        this.wastePile = [];
        
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const cardData = this.deck.pop()!;
                const card = new CardGameObject(this, 0, 0, cardData);
                if (j === i) {
                    card.flip(true, true);
                }
                this.tableauPiles[j].push(card);
            }
        }
        this.stockPile = this.deck.map(cardData => new CardGameObject(this, 0, 0, cardData));
        this.stockPile.forEach(card => card.on('pointerdown', () => this.dealFromStock()));
        this.deck = [];
        this.layoutAllCards();

        this.history = [];
        this.saveState();
        this.time.delayedCall(500, () => this.checkForAutoMoves());
    }
    
    private layoutAllCards() {
        const width = Number(this.sys.game.config.width);
        const xMargin = (width - (7 * CARD_WIDTH) - (6 * 10)) / 2;
        
        this.tableauPiles.forEach((pile) => {
            pile.forEach((card, j) => {
                card.setDepth(DEPTHS.CARD + j);
            });
        });

        this.wastePile.forEach((card, i) => {
             card.setDepth(DEPTHS.CARD + i);
        });

        this.stockPile.forEach((card, i) => {
            card.setDepth(DEPTHS.CARD + i);
        });

        this.foundationPiles.flat().forEach((card, i) => card.setDepth(DEPTHS.CARD + i));
        
        const stockX = xMargin + CARD_WIDTH / 2;
        const stockY = Y_OFFSET + CARD_HEIGHT / 2;

        this.tableauPiles.forEach((pile, i) => {
            const pileX = xMargin + CARD_WIDTH / 2 + i * (CARD_WIDTH + 10);
            if (pile.length === 0) {
                // If pile is empty, draw an outline.
                // FIX: Add a check for `this.tableauZones[i].active` to prevent accessing properties
                // of a destroyed game object during a scene restart race condition.
                if (this.tableauZones[i] && this.tableauZones[i].active && this.tableauZones[i].data && !this.tableauZones[i].data.has('outline')) {
                    const outline = this.add.graphics().setDepth(DEPTHS.BG);
                    outline.lineStyle(2, 0xffffff, 0.2);
                    outline.strokeRoundedRect(pileX - CARD_WIDTH / 2, Y_OFFSET + CARD_HEIGHT + 20, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
                    this.tableauZones[i].data.set('outline', outline);
                }
            } else {
                 // FIX: Add a check for `this.tableauZones[i].active`
                 if (this.tableauZones[i] && this.tableauZones[i].active && this.tableauZones[i].data && this.tableauZones[i].data.has('outline')) {
                    this.tableauZones[i].data.get('outline').destroy();
                    this.tableauZones[i].data.remove('outline');
                 }
            }
            pile.forEach((card, j) => {
                card.setPosition(pileX, Y_OFFSET + CARD_HEIGHT + 20 + j * 35);
            });
        });
        
        this.stockPile.forEach((card) => {
            card.setPosition(stockX, stockY);
        });
        
        const wasteX = xMargin + CARD_WIDTH / 2 + (CARD_WIDTH + 10);
        this.wastePile.forEach((card, i) => {
            const isTopCard = i === this.wastePile.length - 1;
            this.input.setDraggable(card, isTopCard);
            if (this.difficulty === 'draw3' && this.wastePile.length > 1) {
                const displayIndex = Math.max(0, this.wastePile.length - 3);
                card.setPosition(wasteX + (i - displayIndex) * 20, stockY);
                card.setVisible(i >= displayIndex);
            } else {
                card.setPosition(wasteX, stockY);
            }
        });

        this.foundationPiles.forEach((pile, i) => {
            const pileX = width - xMargin - CARD_WIDTH / 2 - i * (CARD_WIDTH + 10);
            pile.forEach(card => card.setPosition(pileX, stockY));
        });
    }

    private dealFromStock() {
        if (this.gameWasWon) return;
        let stateChanged = false;
        if (this.stockPile.length > 0) {
            this.playSound('deal');
            const numToDeal = this.difficulty === 'draw1' ? 1 : Math.min(3, this.stockPile.length);
            for (let i = 0; i < numToDeal; i++) {
                const card = this.stockPile.pop()!;
                card.off('pointerdown');
                card.flip(true, true);
                this.wastePile.push(card);
            }
            stateChanged = true;
        } else if (this.wastePile.length > 0) {
            this.playSound('shuffle');
            this.stockPile = this.wastePile.reverse();
            this.wastePile = [];
            this.stockPile.forEach(card => {
                card.flip(false, true);
                card.off('pointerdown').on('pointerdown', () => this.dealFromStock());
            });
            stateChanged = true;
        }
        
        if (stateChanged) {
            this.layoutAllCards();
            this.saveState();
            this.time.delayedCall(250, () => this.checkForAutoMoves());
        }
    }

    private setupDragListeners() {
        this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: CardGameObject) => {
            let fromPile: CardGameObject[] | undefined;
            let fromIndex = -1;

            for (const pile of this.tableauPiles) {
                const index = pile.indexOf(gameObject);
                if (index !== -1) {
                    fromPile = pile;
                    fromIndex = index;
                    break;
                }
            }

            if (fromPile) {
                const cards = fromPile.slice(fromIndex);
                this.draggedStack = {
                    cards,
                    originalPositions: cards.map(c => ({ x: c.x, y: c.y }))
                };
                this.draggedStack.cards.forEach((c, i) => {
                    c.setDepth(DEPTHS.DRAGGED_CARD + i);
                    c.setDragging(true);
                });
            } else if (this.wastePile.includes(gameObject) && this.wastePile.indexOf(gameObject) === this.wastePile.length - 1) {
                 this.draggedStack = {
                    cards: [gameObject],
                    originalPositions: [{x: gameObject.x, y: gameObject.y }]
                 };
                 gameObject.setDepth(DEPTHS.DRAGGED_CARD);
                 gameObject.setDragging(true);
            } else {
                this.draggedStack = null;
                return;
            }

            this.highlightValidMoves(this.draggedStack.cards[0]);
        });

        this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: CardGameObject, dragX: number, dragY: number) => {
            if (this.draggedStack && gameObject.active) {
                 this.draggedStack.cards.forEach((card, i) => {
                    const originalPos = this.draggedStack!.originalPositions[i];
                    card.x = dragX + (originalPos.x - this.draggedStack!.originalPositions[0].x);
                    card.y = dragY + (originalPos.y - this.draggedStack!.originalPositions[0].y);
                });
            }
        });

        this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: CardGameObject, dropped: boolean) => {
            if (this.draggedStack) {
                this.draggedStack.cards.forEach((c, i) => {
                    const pile = this.tableauPiles.find(p => p.includes(c));
                    c.setDepth(DEPTHS.CARD + (pile ? pile.indexOf(c) : i));
                    c.setDragging(false)
                });

                if (!dropped) {
                    this.draggedStack.cards.forEach((card, i) => {
                        this.tweens.add({
                            targets: card,
                            x: this.draggedStack!.originalPositions[i].x,
                            y: this.draggedStack!.originalPositions[i].y,
                            ease: 'Power1',
                            duration: 200
                        });
                    });
                }
                this.draggedStack = null;
            }
            this.clearHighlights();
        });

        this.input.on('drop', (pointer: Phaser.Input.Pointer, gameObject: CardGameObject, dropZone: Phaser.GameObjects.Zone) => {
             if (this.draggedStack) {
                this.handleCardDrop(this.draggedStack.cards[0], dropZone);
             }
        });
    }
    
    private handleCardDrop(card: CardGameObject, dropZone: Phaser.GameObjects.Zone) {
         let fromPile: CardGameObject[] | undefined;
         let fromIndex = -1;

         if (this.wastePile.includes(card)) {
            fromPile = this.wastePile;
            fromIndex = fromPile.indexOf(card);
         } else {
             for (const pile of this.tableauPiles) {
                 if (pile.includes(card)) {
                     fromPile = pile;
                     fromIndex = pile.indexOf(card);
                     break;
                 }
             }
         }

         if(!fromPile || !this.draggedStack) { this.layoutAllCards(); return; }
         
         const handleValidMove = () => {
            this.playSound('place');
            const cardsToMove = fromPile!.splice(fromIndex);
            if (fromPile !== this.wastePile && fromPile.length > 0) {
                 const newTopCard = fromPile[fromPile.length - 1];
                 if (!newTopCard.cardData.isFaceUp) {
                     newTopCard.flip(true);
                 }
            }
            return cardsToMove;
         }

         const foundationIndex = this.foundationZones.indexOf(dropZone);
         if (foundationIndex !== -1 && this.draggedStack.cards.length === 1) {
             const foundationPile = this.foundationPiles[foundationIndex];
             if (this.isValidFoundationMove(card, foundationPile)) {
                 const [movedCard] = handleValidMove();
                 foundationPile.push(movedCard);
                 
                 const width = Number(this.sys.game.config.width);
                 const xMargin = (width - (7 * CARD_WIDTH) - (6 * 10)) / 2;
                 const stockY = Y_OFFSET + CARD_HEIGHT / 2;
                 const pileX = width - xMargin - CARD_WIDTH / 2 - foundationIndex * (CARD_WIDTH + 10);
                 
                 this.tweens.add({
                    targets: movedCard,
                    x: pileX,
                    y: stockY,
                    ease: 'Power1',
                    duration: 200,
                    onComplete: () => {
                        this.saveState();
                        this.checkWinCondition();
                        this.time.delayedCall(250, () => this.checkForAutoMoves());
                    }
                 });
                 return;
             }
         }

         const tableauIndex = this.tableauZones.indexOf(dropZone);
         if (tableauIndex !== -1) {
             const tableauPile = this.tableauPiles[tableauIndex];
             if (this.isValidTableauMove(card, tableauPile)) {
                 const movedCards = handleValidMove();
                 tableauPile.push(...movedCards);
                 this.layoutAllCards();
                 this.saveState();
                 this.time.delayedCall(250, () => this.checkForAutoMoves());
                 return;
             }
         }
         
        this.draggedStack.cards.forEach((c, i) => {
            if (c.active) {
                this.tweens.add({
                    targets: c,
                    x: this.draggedStack!.originalPositions[i].x,
                    y: this.draggedStack!.originalPositions[i].y,
                    ease: 'Power1',
                    duration: 200
                });
            }
        });
    }

    private getCardColor(suit: Suit): CardColor {
        return (suit === Suit.Hearts || suit === Suit.Diamonds) ? CardColor.Red : CardColor.Black;
    }
    
    private isValidFoundationMove(card: CardGameObject, pile: CardGameObject[]): boolean {
        const topCard = pile[pile.length - 1];
        if (!topCard) {
            return card.cardData.rank === Rank.Ace;
        } else {
            return card.cardData.suit === topCard.cardData.suit && RANK_VALUES[card.cardData.rank] === RANK_VALUES[topCard.cardData.rank] + 1;
        }
    }
    
    private isValidTableauMove(card: CardGameObject, pile: CardGameObject[]): boolean {
        const topCard = pile[pile.length - 1];
        if (!topCard) {
            return card.cardData.rank === Rank.King;
        } else {
            const topCardColor = this.getCardColor(topCard.cardData.suit);
            const movedCardColor = this.getCardColor(card.cardData.suit);
            return topCardColor !== movedCardColor && RANK_VALUES[card.cardData.rank] === RANK_VALUES[topCard.cardData.rank] - 1;
        }
    }
    
    private clearHighlights() {
        this.highlightedObjects.forEach(h => h.destroy());
        this.highlightedObjects = [];
    }
    
    private addHighlight(x: number, y: number, width: number, height: number) {
        const highlight = this.add.graphics().setDepth(DEPTHS.DRAGGED_CARD + 100);
        highlight.lineStyle(4, 0xfef08a, 0.8); // Yellow-200 glow
        highlight.strokeRoundedRect(x - width / 2, y - height / 2, width, height, CARD_CORNER_RADIUS + 2);
        this.highlightedObjects.push(highlight);
    }
    
    private highlightValidMoves(draggedCard: CardGameObject) {
        this.clearHighlights();

        if (this.draggedStack && this.draggedStack.cards.length === 1) {
            this.foundationPiles.forEach((pile, index) => {
                if (this.isValidFoundationMove(draggedCard, pile)) {
                    const zone = this.foundationZones[index];
                    this.addHighlight(zone.x, zone.y, zone.width, zone.input.hitArea.height);
                }
            });
        }

        this.tableauPiles.forEach((pile, index) => {
            if (this.isValidTableauMove(draggedCard, pile)) {
                if (pile.length > 0) {
                    const topCard = pile[pile.length - 1];
                    this.addHighlight(topCard.x, topCard.y, topCard.width, topCard.height);
                } else {
                    const zone = this.tableauZones[index];
                    const yPos = Y_OFFSET + CARD_HEIGHT + 20 + CARD_HEIGHT / 2;
                    this.addHighlight(zone.x, yPos, CARD_WIDTH, CARD_HEIGHT);
                }
            }
        });
    }

    private checkForAutoMoves() {
        if (!this.sys.isActive() || this.gameWasWon) return;

        let moveFound = false;
        let cardToMove: CardGameObject | undefined;
        let fromPile: CardGameObject[] | undefined;
        let toFoundationPile: CardGameObject[] | undefined;
        let foundationIndex = -1;

        const wasteCard = this.wastePile[this.wastePile.length - 1];
        if (wasteCard) {
            for (let i = 0; i < this.foundationPiles.length; i++) {
                if (this.isValidFoundationMove(wasteCard, this.foundationPiles[i])) {
                    cardToMove = wasteCard;
                    fromPile = this.wastePile;
                    toFoundationPile = this.foundationPiles[i];
                    foundationIndex = i;
                    moveFound = true;
                    break;
                }
            }
        }

        if (!moveFound) {
            for (const tableauPile of this.tableauPiles) {
                const topCard = tableauPile[tableauPile.length - 1];
                if (topCard && topCard.cardData.isFaceUp) {
                    for (let i = 0; i < this.foundationPiles.length; i++) {
                        if (this.isValidFoundationMove(topCard, this.foundationPiles[i])) {
                            cardToMove = topCard;
                            fromPile = tableauPile;
                            toFoundationPile = this.foundationPiles[i];
                            foundationIndex = i;
                            moveFound = true;
                            break;
                        }
                    }
                }
                if (moveFound) break;
            }
        }

        if (moveFound && cardToMove && fromPile && toFoundationPile) {
            this.playSound('place');

            fromPile.pop();
            toFoundationPile.push(cardToMove);

            const isTableauPile = this.tableauPiles.some(p => p === fromPile);
            if (isTableauPile && fromPile.length > 0) {
                const newTop = fromPile[fromPile.length - 1];
                if (!newTop.cardData.isFaceUp) {
                    newTop.flip(true);
                }
            }

            this.saveState();
            this.checkWinCondition();

            const width = Number(this.sys.game.config.width);
            const xMargin = (width - (7 * CARD_WIDTH) - (6 * 10)) / 2;
            const stockY = Y_OFFSET + CARD_HEIGHT / 2;
            const pileX = width - xMargin - CARD_WIDTH / 2 - foundationIndex * (CARD_WIDTH + 10);
            
            this.tweens.add({
                targets: cardToMove,
                x: pileX,
                y: stockY,
                ease: 'Power1',
                duration: 200,
                onComplete: () => {
                    this.time.delayedCall(100, () => this.checkForAutoMoves());
                }
            });
        }
    }

    private playWinAnimation() {
        const allCards = [...this.foundationPiles].flat();
        Phaser.Utils.Array.Shuffle(allCards);

        allCards.forEach((card, index) => {
            this.time.delayedCall(index * 25, () => {
                const originalY = card.y;
                const tween = this.tweens.add({
                    targets: card,
                    y: originalY - 20,
                    ease: 'Quad.easeOut',
                    duration: 200,
                    yoyo: true,
                });

                if (index === allCards.length - 1) {
                    tween.on('complete', () => {
                         const winText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'You Win!', {
                            fontSize: '64px',
                            color: '#fff',
                            fontStyle: 'bold',
                            backgroundColor: '#0008'
                        }).setOrigin(0.5).setScale(0).setDepth(DEPTHS.DRAGGED_CARD + 200);
    
                        this.tweens.add({
                            targets: winText,
                            scale: 1,
                            ease: 'Bounce.easeOut',
                            duration: 500
                        });
                    });
                }
            });
        });
    }

    private checkWinCondition() {
        if (this.gameWasWon) {
            return;
        }
        const totalFoundationCards = this.foundationPiles.reduce((acc, pile) => acc + pile.length, 0);
        if (totalFoundationCards === 52) {
            this.gameWasWon = true;
            this.playSound('win');
            const stats = getStats();
            stats.gamesWon++;
            stats.currentStreak++;
            stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
            saveStats(stats);
            this.playWinAnimation();
        }
    }

    private saveState() {
        const state: GameState = {
            tableauPiles: this.tableauPiles.map(pile => pile.map(card => ({...card.cardData}))),
            foundationPiles: this.foundationPiles.map(pile => pile.map(card => ({...card.cardData}))),
            stockPile: this.stockPile.map(card => ({...card.cardData})),
            wastePile: this.wastePile.map(card => ({...card.cardData})),
        };
        this.history.push(JSON.parse(JSON.stringify(state)));
    }

    public undoMove() {
        if (this.history.length <= 1) { 
            return;
        }

        if (this.draggedStack) {
            this.draggedStack.cards.forEach((card, i) => {
                 if (card.active) {
                    const originalPos = this.draggedStack!.originalPositions[i];
                    card.x = originalPos.x;
                    card.y = originalPos.y;
                    card.setDragging(false);
                }
            });
            this.draggedStack = null;
            this.clearHighlights();
        }
        
        this.playSound('undo');
        this.history.pop();
        const lastState = this.history[this.history.length - 1];
        if (lastState) {
            this.restoreState(lastState);
        }
    }
    
    private restoreState(state: GameState) {
        [...this.tableauPiles, ...this.foundationPiles, ...this.stockPile, ...this.wastePile]
            .flat()
            .forEach(cardGO => cardGO.destroy());
    
        this.tableauPiles = Array.from({ length: 7 }, () => []);
        this.foundationPiles = Array.from({ length: 4 }, () => []);
        this.stockPile = [];
        this.wastePile = [];
    
        state.tableauPiles.forEach((pileData, i) => {
            pileData.forEach(cd => {
                const cardGO = new CardGameObject(this, 0, 0, cd);
                this.tableauPiles[i].push(cardGO);
            });
        });
    
        state.foundationPiles.forEach((pileData, i) => {
            pileData.forEach(cd => {
                const cardGO = new CardGameObject(this, 0, 0, cd);
                this.foundationPiles[i].push(cardGO);
            });
        });
        
        state.stockPile.forEach(cd => {
            const cardGO = new CardGameObject(this, 0, 0, cd);
            this.stockPile.push(cardGO);
        });
        this.stockPile.forEach(card => card.on('pointerdown', () => this.dealFromStock()));
        
        state.wastePile.forEach(cd => {
            const cardGO = new CardGameObject(this, 0, 0, cd);
            this.wastePile.push(cardGO);
        });
    
        this.layoutAllCards();
        this.time.delayedCall(250, () => this.checkForAutoMoves());
    }
    
    private cardToString(card: {cardData: Card}, faceUpOverride: boolean = false): string {
        if (!card.cardData.isFaceUp && !faceUpOverride) return 'Face Down';
        const rankMap: { [key in Rank]: string } = { 'A': 'Ace', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10', 'J': 'Jack', 'Q': 'Queen', 'K': 'King' };
        const suitMap: { [key in Suit]: string } = { '♠': 'Spades', '♥': 'Hearts', '♦': 'Diamonds', '♣': 'Clubs' };
        return `${rankMap[card.cardData.rank]} of ${suitMap[card.cardData.suit]}`;
    }

    private dispatchGameState() {
        let stateString = "Foundations:\n";
        this.foundationPiles.forEach((pile, i) => {
            const suit = pile.length > 0 ? this.cardToString(pile[0]).split(' of ')[1] : ['Spades', 'Hearts', 'Diamonds', 'Clubs'][i];
            stateString += `- ${suit}: ${pile.length > 0 ? this.cardToString(pile[pile.length - 1]) : 'Empty'}\n`;
        });
        
        stateString += "\nTableau:\n";
        this.tableauPiles.forEach((pile, i) => {
            stateString += `- Pile ${i + 1}: ${pile.length === 0 ? 'Empty' : pile.map(c => this.cardToString(c)).join(', ')}\n`;
        });
        
        stateString += `\nStock: ${this.stockPile.length} cards remaining.\n`;
        
        stateString += `Waste: ${this.wastePile.length > 0 ? this.cardToString(this.wastePile[this.wastePile.length - 1]) : 'Empty'}\n`;

        window.dispatchEvent(new CustomEvent('gameState', { detail: stateString }));
    }
}