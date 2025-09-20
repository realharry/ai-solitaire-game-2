
import { GameState, Card, Suit, Rank, Move, PileType } from '../types';
import { SUITS, RANKS, RANK_VALUES } from '../constants';

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({ suit, rank, faceUp: false });
    });
  });
  return deck;
};

export const shuffle = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const dealInitialState = (deck: Card[]): GameState => {
  const tableau: GameState['tableau'] = [[], [], [], [], [], [], []];
  let currentCard = 0;
  for (let i = 0; i < 7; i++) {
    for (let j = i; j < 7; j++) {
      tableau[j].push(deck[currentCard++]);
    }
  }
  tableau.forEach(pile => {
    if (pile.length > 0) {
      pile[pile.length - 1].faceUp = true;
    }
  });

  const stock = deck.slice(currentCard);
  
  return {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
  };
};

export const findCard = (state: GameState, card: Card): { pileType: PileType, pileIndex: number, cardIndex: number } | null => {
    // This is a helper, but complex to use in a stateless way. We primarily operate on moves with indices.
    return null;
}

const getCardColor = (suit: Suit): 'red' | 'black' => {
  return suit === 'Hearts' || suit === 'Diamonds' ? 'red' : 'black';
};

export const isMoveValid = (state: GameState, move: Move): { valid: boolean, reason?: string } => {
    if (move.type === 'draw') {
        return { valid: true };
    }

    if (!move.from || !move.to || !move.cards || move.cards.length === 0) return { valid: false, reason: 'Invalid move object' };

    const { from, to, cards } = move;
    const movingCard = cards[0];

    // Moving to foundation
    if (to.pileType === 'foundation') {
        if (cards.length > 1) return { valid: false, reason: 'Can only move one card to foundation' };
        const foundationPile = state.foundations[to.pileIndex];
        const foundationSuit = SUITS[to.pileIndex];
        if (movingCard.suit !== foundationSuit) return { valid: false, reason: 'Mismatched suit for foundation' };
        
        if (foundationPile.length === 0) {
            return movingCard.rank === 'A' ? { valid: true } : { valid: false, reason: 'Only Ace can start a foundation' };
        } else {
            const topCard = foundationPile[foundationPile.length - 1];
            return RANK_VALUES[movingCard.rank] === RANK_VALUES[topCard.rank] + 1 ? { valid: true } : { valid: false, reason: 'Card not in sequence for foundation' };
        }
    }

    // Moving to tableau
    if (to.pileType === 'tableau') {
        const tableauPile = state.tableau[to.pileIndex];
        if (tableauPile.length === 0) {
            return movingCard.rank === 'K' ? { valid: true } : { valid: false, reason: 'Only King can move to an empty tableau pile' };
        } else {
            const topCard = tableauPile[tableauPile.length - 1];
            if (!topCard.faceUp) return { valid: false, reason: 'Cannot move to a face-down card' };
            
            const movingColor = getCardColor(movingCard.suit);
            const topColor = getCardColor(topCard.suit);

            if (movingColor === topColor) return { valid: false, reason: 'Cannot move onto same color' };
            if (RANK_VALUES[movingCard.rank] !== RANK_VALUES[topCard.rank] - 1) return { valid: false, reason: 'Card not in descending order' };
            
            return { valid: true };
        }
    }

    return { valid: false, reason: 'Unknown move type' };
};

export const executeMove = (state: GameState, move: Move): GameState => {
    const newState = JSON.parse(JSON.stringify(state)); // Deep copy

    if (move.type === 'draw') {
        if (newState.stock.length === 0) {
            newState.stock = newState.waste.reverse();
            newState.waste = [];
            newState.stock.forEach((c: Card) => c.faceUp = false);
        } else {
            const card = newState.stock.pop();
            if (card) {
                card.faceUp = true;
                newState.waste.push(card);
            }
        }
        return newState;
    }
    
    if (!move.from || !move.to || !move.cards) return state;

    // Remove cards from source
    let sourcePile: Card[] = [];
    if(move.from.pileType === 'waste') {
        sourcePile = newState.waste;
    } else if (move.from.pileType === 'tableau') {
        sourcePile = newState.tableau[move.from.pileIndex];
    } else if (move.from.pileType === 'foundation') {
        sourcePile = newState.foundations[move.from.pileIndex];
    }

    const removedCards = sourcePile.splice(move.from.cardIndex ?? sourcePile.length - move.cards.length, move.cards.length);
    
    // Flip new top card if it's in tableau
    if (move.from.pileType === 'tableau' && sourcePile.length > 0) {
        const topCard = sourcePile[sourcePile.length - 1];
        if (!topCard.faceUp) {
            topCard.faceUp = true;
        }
    }

    // Add cards to destination
    let destPile: Card[] = [];
    if(move.to.pileType === 'foundation') {
        destPile = newState.foundations[move.to.pileIndex];
    } else if (move.to.pileType === 'tableau') {
        destPile = newState.tableau[move.to.pileIndex];
    }

    destPile.push(...removedCards);

    return newState;
};

export const checkWinCondition = (state: GameState): boolean => {
    return state.foundations.every(pile => pile.length === 13);
};
