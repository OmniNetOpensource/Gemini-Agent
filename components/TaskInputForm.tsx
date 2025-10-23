import React, { useState, useRef, useEffect } from 'react';

interface TaskInputFormProps {
  onSubmit: (task: string) => void;
  isLoading: boolean;
}

export const TaskInputForm: React.FC<TaskInputFormProps> = ({ onSubmit, isLoading }) => {
  const [task, setTask] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(task);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const maxHeight = 200;
      // Reset height to auto to shrink it if text is deleted.
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;

      // If scrollHeight exceeds maxHeight, cap height and show scrollbar.
      if (scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      } else {
        // Otherwise, grow textarea to fit content and hide scrollbar.
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [task]);


  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        ref={textareaRef}
        value={task}
        onChange={(e) => setTask(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a complex task for the agent to execute..."
        className="w-full bg-black border border-white rounded-xl p-4 pr-16 text-white focus:ring-2 focus:ring-white focus:outline-none resize-none transition-all duration-200"
        rows={1}
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !task.trim()}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white text-black hover:bg-black hover:text-white border border-transparent hover:border-white disabled:bg-black disabled:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </form>
  );
};