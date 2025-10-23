import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SubTask } from '../types';

type LoadingState = 'idle' | 'decomposing' | 'executing' | 'consolidating' | 'done';

interface AgentOutputDisplayProps {
  mainTask: string;
  subTasks: SubTask[];
  finalAnswer: string;
  loadingState: LoadingState;
}

const LoadingSpinner: React.FC<{ className?: string }> = ({ className = "h-5 w-5 text-white" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);

const PendingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
);

const ChevronIcon: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
);


const StatusIndicator: React.FC<{ status: SubTask['status'] }> = ({ status }) => {
    switch (status) {
        case 'pending':
            return <PendingIcon />;
        case 'reflecting':
        case 'executing':
            return <LoadingSpinner />;
        case 'completed':
            return <CheckIcon />;
        case 'error':
            return <XIcon />;
        default:
            return null;
    }
};

const SourceLink: React.FC<{ source: SubTask['sources'][0] }> = ({ source }) => {
    if (!source.web?.uri) return null;
    return (
        <a 
            href={source.web.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-white text-sm inline-flex items-center space-x-1 underline"
            title={source.web.uri}
        >
           <span>{source.web.title || source.web.uri}</span>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
        </a>
    );
};


export const AgentOutputDisplay: React.FC<AgentOutputDisplayProps> = ({ mainTask, subTasks, finalAnswer, loadingState }) => {
    const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

    useEffect(() => {
        const activeTaskIndex = subTasks.findIndex(task => task.status === 'reflecting' || task.status === 'executing');
        if (activeTaskIndex !== -1) {
            setExpandedTasks(prev => {
                if (prev.has(activeTaskIndex)) return prev;
                const newSet = new Set(prev);
                newSet.add(activeTaskIndex);
                return newSet;
            });
        }
    }, [subTasks]);

    const toggleTaskExpansion = (index: number) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <p className="text-sm font-semibold text-white uppercase tracking-wider">Main Task</p>
                <h2 className="text-2xl font-bold text-white mt-1">{mainTask}</h2>
            </div>
            
            <div className="space-y-4">
                <p className="text-sm font-semibold text-white uppercase tracking-wider">Execution Plan</p>
                
                {loadingState === 'decomposing' && (
                     <div className="flex items-center space-x-2 text-white p-4 bg-black border border-white rounded-lg">
                        <LoadingSpinner />
                        <span>Breaking down the task into steps...</span>
                    </div>
                )}
                
                {subTasks.length > 0 && (
                    <ul className="space-y-4">
                        {subTasks.map((task, index) => {
                            const isExpanded = expandedTasks.has(index);
                            return (
                                <li key={index} className="bg-black border border-white rounded-lg overflow-hidden">
                                    <div 
                                        className="p-4 flex items-start space-x-3 cursor-pointer select-none"
                                        onClick={() => toggleTaskExpansion(index)}
                                    >
                                        <div className="flex-shrink-0 pt-1">
                                            <StatusIndicator status={task.status} />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="font-semibold text-white">{index + 1}. {task.description}</p>
                                        </div>
                                        <div className="flex-shrink-0 pt-1">
                                            <ChevronIcon isExpanded={isExpanded} />
                                        </div>
                                    </div>
                                    
                                    <div className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}>
                                        <div className="pt-0 pb-4 pr-4 pl-12 space-y-4">
                                            {(task.reflection || task.status === 'reflecting' || task.status === 'executing' || task.status === 'completed' || task.status === 'error') && (
                                                <div className="pl-3 border-l-2 border-white">
                                                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">🤔 Analysis</h4>
                                                    <pre className="text-white whitespace-pre-wrap font-sans text-sm">{task.reflection || '...'}</pre>
                                                </div>
                                            )}
                                            
                                            {(task.result || task.status === 'executing' || (task.status === 'completed' && task.result) || task.status === 'error') && (
                                                <div className="pl-3 border-l-2 border-white">
                                                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">✅ Result</h4>
                                                    <div className="prose prose-sm prose-invert max-w-none 
                                                        prose-headings:text-white prose-p:text-white prose-li:text-white
                                                        prose-strong:text-white prose-a:text-white prose-a:underline hover:prose-a:text-white">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {task.result || '...'}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            )}

                                            {task.sources.length > 0 && (
                                                <div className="pl-3 border-l-2 border-white">
                                                     <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Sources</h4>
                                                     <div className="flex flex-col space-y-1">
                                                         {task.sources.map((source, i) => (
                                                             <div key={i} className="truncate">
                                                               <SourceLink source={source} />
                                                             </div>
                                                         ))}
                                                     </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
            
            {(loadingState === 'consolidating' || (loadingState === 'done' && finalAnswer)) && (
                 <div className="space-y-4">
                    <p className="text-sm font-semibold text-white uppercase tracking-wider">Final Answer</p>
                    
                    {loadingState === 'consolidating' && !finalAnswer && (
                        <div className="flex items-center space-x-2 text-white p-4 bg-black border border-white rounded-lg">
                            <LoadingSpinner />
                            <span>Synthesizing the final answer...</span>
                        </div>
                    )}
                    
                    {finalAnswer && (
                        <div className="p-4 bg-black border border-white rounded-lg">
                           <div className="prose prose-sm prose-invert max-w-none 
                                prose-headings:text-white prose-p:text-white prose-li:text-white
                                prose-strong:text-white prose-a:text-white prose-a:underline hover:prose-a:text-white">
                               <ReactMarkdown remarkPlugins={[remarkGfm]}>{finalAnswer}</ReactMarkdown>
                           </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};