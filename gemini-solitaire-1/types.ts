
export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export type Pile = Card[];

export interface GameState {
  stock: Pile;
  waste: Pile;
  foundations: [Pile, Pile, Pile, Pile];
  tableau: [Pile, Pile, Pile, Pile, Pile, Pile, Pile];
}

export type PileType = 'stock' | 'waste' | 'foundation' | 'tableau';

export interface CardLocation {
    pileType: PileType;
    pileIndex: number;
    cardIndex?: number; // Optional as some piles are just LIFO
}

export interface Move {
    type: 'move' | 'draw';
    from?: CardLocation;
    to?: CardLocation;
    cards?: Card[];
}
