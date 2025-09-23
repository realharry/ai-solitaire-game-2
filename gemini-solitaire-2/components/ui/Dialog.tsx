
import React from 'react';

const Dialog: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
            {children}
        </div>
    );
};

const DialogContent: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg ${className}`}>
        {children}
    </div>
);

const DialogHeader: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`}>{children}</div>
);

const DialogFooter: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}>{children}</div>
);

const DialogTitle: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h2>
);

const DialogDescription: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);

export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
