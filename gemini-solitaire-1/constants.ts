
import { Suit, Rank } from './types';

export const CARD_WIDTH = 73;
export const CARD_HEIGHT = 98;
export const STACK_OFFSET_Y = 30;
export const HORIZONTAL_SPACING = 20;

export const SUITS: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const RANK_VALUES: { [key in Rank]: number } = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};

const TOP_ROW_Y = 20;
const BOTTOM_ROW_Y = TOP_ROW_Y + CARD_HEIGHT + 40;

export const PILE_POSITIONS = {
  stock: { x: 20, y: TOP_ROW_Y },
  waste: { x: 20 + CARD_WIDTH + HORIZONTAL_SPACING, y: TOP_ROW_Y },
  foundations: Array.from({ length: 4 }).map((_, i) => ({
    x: 20 + (CARD_WIDTH + HORIZONTAL_SPACING) * (3 + i),
    y: TOP_ROW_Y
  })),
  tableau: Array.from({ length: 7 }).map((_, i) => ({
    x: 20 + (CARD_WIDTH + HORIZONTAL_SPACING) * i,
    y: BOTTOM_ROW_Y
  }))
};

export const CARD_ATLAS_URL = 'https://raw.githubusercontent.com/packtpublishing/html5-games-development-by-example/master/chapter04/cards.png';
