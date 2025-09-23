
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Label } from './ui/Label';
import { Select } from './ui/Select';
import { Move } from '../types';

interface AIPanelProps {
    isLoading: boolean;
    hint: { move: Move; reason: string } | null;
    error: string | null;
    model: string;
    setModel: (model: string) => void;
    onClose: () => void;
}

const MoveDescription: React.FC<{ move: Move }> = ({ move }) => {
    const fromDesc = `${move.from.pile} ${move.from.pileIndex !== undefined ? move.from.pileIndex + 1 : ''}`.trim();
    const toDesc = `${move.to.pile} ${move.to.pileIndex !== undefined ? move.to.pileIndex + 1 : ''}`.trim();
    const cardDesc = move.cards.length > 1 ? `${move.cards.length} cards starting with ${move.cards[0].id}` : `card ${move.cards[0].id}`;

    return (
        <p className="text-sm font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
            Move {cardDesc} from <span className="font-semibold">{fromDesc}</span> to <span className="font-semibold">{toDesc}</span>.
        </p>
    );
}

export const AIPanel: React.FC<AIPanelProps> = ({ isLoading, hint, error, model, setModel, onClose }) => {
    return (
        <Card className="mt-4 relative">
             <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <CardHeader>
                <CardTitle>AI Assistant</CardTitle>
                <CardDescription>Get strategic advice for your next move.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="ai-model">AI Model</Label>
                    <Select id="ai-model" value={model} onChange={(e) => setModel(e.target.value)}>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        {/* The following are for UI demonstration purposes as per prompt interpretation */}
                        <option value="gemini-1.5-pro-latest" disabled>Gemini 1.5 Pro (Not Available)</option>
                        <option value="mock-ai-model" disabled>Mock AI (Not Available)</option>
                    </Select>
                </div>

                {isLoading && (
                     <div className="flex items-center justify-center p-4">
                        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-3">AI is thinking...</span>
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {hint && (
                    <div className="space-y-3">
                        <div>
                           <h4 className="font-semibold">Suggested Move:</h4>
                           <MoveDescription move={hint.move} />
                        </div>
                         <div>
                           <h4 className="font-semibold">Reasoning:</h4>
                           <p className="text-sm text-muted-foreground">{hint.reason}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
