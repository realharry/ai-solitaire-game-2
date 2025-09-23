
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, Move, Difficulty } from '../types';

const serializeGameState = (state: GameState): string => {
    const foundations = state.foundation.map((p, i) => `F${i+1}: ${p.map(c => c.id).join(', ')}`).join('; ');
    const tableaus = state.tableau.map((p, i) => `T${i+1}: ${p.map(c => c.faceUp ? c.id : '??').join(', ')}`).join('; ');
    const stock = `Stock: ${state.stock.length} cards face down`;
    const waste = `Waste: ${state.waste.map(c => c.id).join(', ') || 'empty'}`;
    return `Foundations: {${foundations}}. Tableaus: {${tableaus}}. ${stock}. Waste: {${waste}}`;
};


export const getHint = async (gameState: GameState, modelName: string, difficulty: Difficulty): Promise<{ move: Move, reason: string } | null> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
        throw new Error("API key is not configured. Cannot get hint.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const difficultyRules = {
        easy: "Draw 1 card from stock. Infinite redeals.",
        medium: "Draw 3 cards from stock. Infinite redeals. Only the top card of the waste is playable.",
        hard: "Draw 3 cards from stock. Limited redeals. Only the top card of the waste is playable."
    };

    const prompt = `
You are an expert Klondike Solitaire player. Your goal is to suggest the single best possible move to help the user win.
The game state is provided below. Cards are identified by Rank and Suit (e.g., 'KH' is King of Hearts, '5D' is 5 of Diamonds). '??' represents a face-down card.

Current Difficulty: ${difficulty} (${difficultyRules[difficulty]})

Game Rules:
1. Tableau piles build down by alternating colors (e.g., a black 7 on a red 8).
2. Foundation piles build up by suit, from Ace to King.
3. Only a King can move to an empty tableau space.
4. Any face-up card in a tableau pile can be moved, along with all cards on top of it.
5. The top card of the waste pile is available to play.
6. The primary goal is to move cards to the foundation piles. A secondary goal is to reveal face-down cards in the tableau.

Current Game State:
${serializeGameState(gameState)}

Analyze the game state and suggest the best move. Respond ONLY with a JSON object that strictly follows the provided schema. Do not add any extra text, explanations, or markdown formatting outside of the JSON object.
`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            reason: { 
                type: Type.STRING,
                description: "A brief explanation of why this is the best move." 
            },
            move: {
                type: Type.OBJECT,
                description: "The details of the suggested move.",
                properties: {
                    from: {
                        type: Type.OBJECT,
                        properties: {
                            pile: { type: Type.STRING, description: "Can be 'tableau', 'foundation', 'stock', or 'waste'."},
                            pileIndex: { type: Type.INTEGER, description: "0-based index for 'tableau' or 'foundation' piles." },
                        }
                    },
                    to: {
                        type: Type.OBJECT,
                        properties: {
                            pile: { type: Type.STRING, description: "Can be 'tableau' or 'foundation'."},
                            pileIndex: { type: Type.INTEGER, description: "0-based index for 'tableau' or 'foundation' piles." },
                        }
                    },
                    cards: {
                        type: Type.ARRAY,
                        description: "An array of cards being moved. For waste pile moves, this will be one card.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                suit: { type: Type.STRING },
                                rank: { type: Type.STRING },
                                faceUp: { type: Type.BOOLEAN }
                            }
                        }
                    }
                }
            }
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2
            }
        });

        const jsonText = response.text.trim();
        const hintData = JSON.parse(jsonText);
        
        // Basic validation
        if (hintData && hintData.move && hintData.reason) {
            return hintData as { move: Move, reason: string };
        }
        return null;

    } catch (error) {
        console.error("Error fetching hint from Gemini API:", error);
        throw new Error("The AI service failed to provide a valid hint.");
    }
};
