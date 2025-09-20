


import { GoogleGenAI, Type } from "@google/genai";
import { GameState, Move, Card, Rank, Suit } from '../types';
import { SUITS } from '../constants';

const formatCard = (card: Card | undefined): string => {
    if (!card) return '[]';
    return `${card.rank}${card.suit[0]}`;
};

const formatGameStateForPrompt = (state: GameState): string => {
    let prompt = "Current Solitaire (Klondike) game state:\n";
    
    const topWasteCard = state.waste.length > 0 ? formatCard(state.waste[state.waste.length - 1]) : '[]';
    prompt += `Waste Pile: ${topWasteCard}\n`;
    prompt += `Stock Pile: ${state.stock.length} cards remaining\n`;
    
    prompt += "Foundations:\n";
    state.foundations.forEach((pile, i) => {
        const suit = ['H', 'D', 'C', 'S'][i];
        prompt += `F${i + 1} (${suit}): ${formatCard(pile[pile.length - 1])}\n`;
    });

    prompt += "Tableau:\n";
    state.tableau.forEach((pile, i) => {
        const faceUpCards = pile.filter(c => c.faceUp).map(c => formatCard(c)).join(', ');
        const faceDownCount = pile.filter(c => !c.faceUp).length;
        prompt += `T${i + 1}: [${faceDownCount} down], [${faceUpCards || 'empty'}]\n`;
    });

    return prompt;
};

export const getHint = async (gameState: GameState): Promise<Move | null> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
        throw new Error("API key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
You are an expert Klondike Solitaire player. Based on the rules and the current game state, identify the best possible next move.

**Rules:**
- Foundations build up from Ace to King in the same suit.
- Tableau builds down in alternating colors.
- A King can move to an empty tableau space.
- Only the top card of the waste pile can be moved.
- Any face-up card in a tableau pile can be moved, along with all cards on top of it.
- If the stock pile is empty, clicking it again will reset the waste pile back into the stock.

**Game State:**
${formatGameStateForPrompt(gameState)}

Your task is to respond with the single best move in JSON format. The possible move types are 'draw' (from stock to waste, or reset waste), or 'move'.
- For a 'draw' move, provide the type only.
- For a 'move', specify the card being moved and its source and destination piles.
- The most important cards to move are those that reveal face-down cards in the tableau. Prioritize these moves.
- Moving a card to a foundation is also a high priority.
- If no moves are possible, suggest 'draw'.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                // FIX: Removed `nullable: true` from schema properties to align with Gemini API guidelines.
                // The prompt instructs the model to omit fields for 'draw' moves, making them optional.
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        moveType: { type: Type.STRING, enum: ["move", "draw"] },
                        fromPile: { type: Type.STRING, enum: ["waste", "tableau", "foundation"] },
                        fromIndex: { type: Type.INTEGER },
                        toPile: { type: Type.STRING, enum: ["tableau", "foundation"] },
                        toIndex: { type: Type.INTEGER },
                        cardRank: { type: Type.STRING },
                        cardSuit: { type: Type.STRING },
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText);

        if (data.moveType === 'draw') {
            return { type: 'draw' };
        }
        
        if (data.moveType === 'move') {
            const { fromPile, fromIndex, toPile, toIndex, cardRank, cardSuit } = data;
            
            const findCardInPile = (pile: Card[], rank: Rank, suit: Suit) => {
                return pile.findIndex(c => c.rank === rank && c.suit === suit);
            };

            let fromCardIndex = -1;
            let cardsToMove: Card[] = [];

            if (fromPile === 'waste') {
                const pile = gameState.waste;
                if(pile.length > 0) {
                   cardsToMove = [pile[pile.length - 1]];
                   fromCardIndex = pile.length - 1;
                }
            } else if (fromPile === 'tableau') {
                const pile = gameState.tableau[fromIndex];
                const partialSuit = cardSuit.charAt(0).toUpperCase() + cardSuit.slice(1).toLowerCase();
                const fullSuit = SUITS.find(s => s.toLowerCase() === partialSuit.toLowerCase());
                
                if (fullSuit) {
                    const cardIdx = pile.findIndex(c => c.rank === cardRank && c.suit === fullSuit && c.faceUp);
                    if (cardIdx !== -1) {
                         cardsToMove = pile.slice(cardIdx);
                         fromCardIndex = cardIdx;
                    }
                }
            }

            if(cardsToMove.length > 0) {
                return {
                    type: 'move',
                    cards: cardsToMove,
                    from: { pileType: fromPile, pileIndex: fromIndex, cardIndex: fromCardIndex },
                    to: { pileType: toPile, pileIndex: toIndex }
                };
            }
        }
        
        return { type: 'draw' }; // Fallback if AI gives weird data

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return null;
    }
};
