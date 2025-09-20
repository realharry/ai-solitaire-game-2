import React from 'react';

interface HeaderProps {
    onNewGame: () => void;
    onGetHint: () => void;
    isLoadingHint: boolean;
    score: number;
}

const Button: React.FC<React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>> = ({ children, className, ...props }) => (
    <button
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
        bg-slate-800 text-slate-50 hover:bg-slate-700 h-10 px-4 py-2 ${className}`}
        {...props}
    >
        {children}
    </button>
);


export const Header: React.FC<HeaderProps> = ({ onNewGame, onGetHint, isLoadingHint, score }) => {
    return (
        <header className="w-full max-w-5xl flex justify-between items-center p-2 rounded-lg bg-gray-800/50">
            <h1 className="text-2xl font-bold tracking-tight text-white">
                Solitaire <span className="text-cyan-400">AI</span>
            </h1>
            <div className="flex items-center gap-6">
                <div className="text-xl font-semibold text-white">
                    Score: <span className="font-bold text-amber-400 tabular-nums tracking-wider">{score}</span>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={onNewGame}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                        New Game
                    </Button>
                    <Button onClick={onGetHint} disabled={isLoadingHint}>
                        {isLoadingHint ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Thinking...
                            </>
                        ) : (
                            <>
                               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="m12 19-7-7 7-7"/><path d="M19 19-7-7 7 7"/></svg>
                               Get Hint
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </header>
    );
};