
export enum Suit {
    Hearts = 'H',
    Diamonds = 'D',
    Clubs = 'C',
    Spades = 'S'
}

export enum Rank {
    Ace = 'A', Two = '2', Three = '3', Four = '4', Five = '5', Six = '6', Seven = '7',
    Eight = '8', Nine = '9', Ten = 'T', Jack = 'J', Queen = 'Q', King = 'K'
}

export interface CardData {
    id: string;
    suit: Suit;
    rank: Rank;
    faceUp: boolean;
}

export interface GameState {
    tableau: CardData[][];
    foundation: CardData[][];
    stock: CardData[];
    waste: CardData[];
    passesLeft: number | null; // Added for history state
}

export type PileType = 'tableau' | 'foundation' | 'stock' | 'waste';

export interface CardLocation {
    pile: PileType;
    pileIndex?: number;
    cardIndex?: number; // for tableau
}

export interface Move {
    from: CardLocation;
    to: CardLocation;
    cards: CardData[];
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameStats {
    gamesPlayed: number;
    gamesWon: number;
    totalTimePlayed: number; // in seconds
}

export type Difficulty = 'easy' | 'medium' | 'hard';