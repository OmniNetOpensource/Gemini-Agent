import React from 'react';

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 9.5 7h-3A2.5 2.5 0 0 1 4 4.5v0A2.5 2.5 0 0 1 6.5 2h3Z" />
        <path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v0A2.5 2.5 0 0 1 14.5 7h-3a2.5 2.5 0 0 1-2.5-2.5v0A2.5 2.5 0 0 1 11.5 2h3Z" />
        <path d="M12 12a2.5 2.5 0 0 1 2.5 2.5v0A2.5 2.5 0 0 1 12 17h0a2.5 2.5 0 0 1-2.5-2.5v0A2.5 2.5 0 0 1 12 12Z" />
        <path d="M4.5 9.5A2.5 2.5 0 0 1 7 12v0a2.5 2.5 0 0 1-2.5 2.5h-2A2.5 2.5 0 0 1 0 12v0A2.5 2.5 0 0 1 2.5 9.5h2Z" />
        <path d="M17.5 9.5A2.5 2.5 0 0 1 20 12v0a2.5 2.5 0 0 1-2.5 2.5h-2a2.5 2.5 0 0 1-2.5-2.5v0a2.5 2.5 0 0 1 2.5-2.5h2Z" />
        <path d="M8 19a2.5 2.5 0 0 1 2.5 2.5v0a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5v0A2.5 2.5 0 0 1 6 19h2Z" />
        <path d="M16 19a2.5 2.5 0 0 1 2.5 2.5v0a2.5 2.5 0 0 1-2.5 2.5h-2a2.5 2.5 0 0 1-2.5-2.5v0a2.5 2.5 0 0 1 2.5-2.5h2Z" />
    </svg>
);


export const Header: React.FC = () => {
    return (
        <header className="container mx-auto p-4 md:p-6 flex items-center justify-center">
            <div className="flex items-center space-x-3">
                <BrainIcon />
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Intelligent Task Agent
                </h1>
            </div>
        </header>
    );
};