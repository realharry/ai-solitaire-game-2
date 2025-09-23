
import { GoogleGenAI } from "@google/genai";

const getSystemInstruction = () => `
You are an expert Solitaire (Klondike) player. Your goal is to provide the best possible move or strategic advice based on the current game state.

Game Rules:
- Goal: Move all 52 cards to the four Foundation piles, one for each suit, in ascending order from Ace to King.
- Tableau: Seven piles of cards. The top card is face up. Piles are built down in alternating colors (e.g., a black 7 on a red 8).
- Stock: The deck of remaining cards. Click to deal one card to the Waste pile.
- Waste: The top card can be played onto the Tableau or Foundations.
- Foundations: Piles are built up by suit, from Ace to King.
- Moves: You can move a single card or a valid sequence of face-up cards in the tableau. Only a King (or a sequence starting with a King) can be moved to an empty tableau pile.

Your task is to analyze the provided game state and suggest the single best move.
- Prioritize moves that uncover face-down cards in the tableau.
- Prioritize moving cards from the tableau to the foundations if possible.
- If no moves are available on the board, suggest drawing a card from the stock.
- Be concise and direct. Format your response as a clear instruction.

Example moves:
- "Move the 5 of Hearts from Tableau 3 to the 6 of Spades on Tableau 5."
- "Move the Ace of Clubs from Tableau 1 to the Foundations."
- "Draw a card from the Stock."
`;

export const getHint = async (gameState: string, modelName: string): Promise<string> => {
    try {
        if (!process.env.API_KEY) {
            throw new Error("API key not found. Please set the API_KEY environment variable.");
        }
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const prompt = `Here is the current game state:\n\n${gameState}\n\nWhat is the best move?`;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                systemInstruction: getSystemInstruction(),
                temperature: 0.2,
            },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error fetching hint from Gemini API:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            return "Error: Invalid API Key. Please check your configuration.";
        }
        return "Sorry, I couldn't get a hint right now. Please try again later.";
    }
};
