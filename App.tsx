import React, { useState, useCallback, useEffect } from 'react';
import { TaskInputForm } from './components/TaskInputForm';
import { AgentOutputDisplay } from './components/AgentOutputDisplay';
import { decomposeTask, reflectOnSubTaskStream, executeSubTaskStream, consolidateResultsStream } from './services/geminiService';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import type { SubTask } from './types';
import type { GroundingChunk } from '@google/genai';

type LoadingState = 'idle' | 'decomposing' | 'executing' | 'consolidating' | 'done';

const App: React.FC = () => {
  const [mainTask, setMainTask] = useState<string>('');
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [finalAnswer, setFinalAnswer] = useState<string>('');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const resetState = () => {
    setMainTask('');
    setSubTasks([]);
    setFinalAnswer('');
    setLoadingState('idle');
    setError(null);
    setIsExecuting(false);
  };

  const handleTaskSubmit = useCallback(async (task: string) => {
    if (!task.trim() || loadingState !== 'idle') return;

    resetState();
    setMainTask(task);
    setLoadingState('decomposing');

    try {
      const decomposed = await decomposeTask(task);
      setSubTasks(decomposed.map(desc => ({
        description: desc,
        status: 'pending',
        reflection: '',
        result: '',
        sources: []
      })));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to decompose the task.');
      setLoadingState('idle');
    }
  }, [loadingState]);

  useEffect(() => {
    const executeAllTasksSequentially = async () => {
      const hasPendingTasks = subTasks.some(t => t.status === 'pending');
      if (!hasPendingTasks || isExecuting) {
        return;
      }

      setIsExecuting(true);
      setLoadingState('executing');

      let tasksForContext = [...subTasks];

      for (let i = 0; i < tasksForContext.length; i++) {
        // Phase 1: Reflection
        try {
          setSubTasks(prev => prev.map((task, index) =>
            index === i ? { ...task, status: 'reflecting' } : task
          ));

          const reflectionStream = reflectOnSubTaskStream(mainTask, tasksForContext, i);
          let currentReflection = '';
          for await (const chunk of reflectionStream) {
            currentReflection += chunk.text;
            setSubTasks(prev => {
              const newTasks = [...prev];
              newTasks[i] = { ...newTasks[i], reflection: currentReflection };
              return newTasks;
            });
          }
          tasksForContext[i] = { ...tasksForContext[i], reflection: currentReflection };
        } catch (err) {
            const errorMessage = `Reflection failed: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
            setError(errorMessage);
            setSubTasks(prev => prev.map((task, index) =>
              index === i ? { ...task, status: 'error', result: errorMessage } : task
            ));
            setIsExecuting(false);
            return;
        }

        // Phase 2: Execution
        try {
          setSubTasks(prev => prev.map((task, index) =>
            index === i ? { ...task, status: 'executing' } : task
          ));
          
          const executionStream = executeSubTaskStream(mainTask, tasksForContext, i);
          let currentTaskResult = '';
          let currentTaskSources: GroundingChunk[] = [];

          for await (const chunk of executionStream) {
            currentTaskResult += chunk.text;
            
            const newChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (newChunks) {
              const existingUris = new Set(currentTaskSources.map(s => s.web?.uri));
              const uniqueNewChunks = newChunks.filter(c => c.web?.uri && !existingUris.has(c.web.uri));
              if (uniqueNewChunks.length > 0) {
                currentTaskSources.push(...uniqueNewChunks);
              }
            }

            setSubTasks(prev => {
              const newTasks = [...prev];
              newTasks[i] = {
                ...newTasks[i],
                result: currentTaskResult,
                sources: [...currentTaskSources]
              };
              return newTasks;
            });
          }

          tasksForContext[i] = {
            ...tasksForContext[i],
            result: currentTaskResult,
            sources: currentTaskSources,
            status: 'completed'
          };
          
          setSubTasks(prev => prev.map((task, index) =>
            index === i ? { ...tasksForContext[i] } : task
          ));

        } catch (err) {
          const errorMessage = `Execution failed: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
          setError(errorMessage);
          setSubTasks(prev => prev.map((task, index) =>
            index === i ? { ...task, status: 'error', result: errorMessage } : task
          ));
          setIsExecuting(false);
          return; // Stop execution on error
        }
      }

      setLoadingState('consolidating');
      setIsExecuting(false);
    };

    executeAllTasksSequentially();
  }, [subTasks, mainTask, isExecuting]);


  useEffect(() => {
    const consolidate = async () => {
        if (loadingState !== 'consolidating') return;

        try {
            const stream = consolidateResultsStream(mainTask, subTasks);
            for await (const chunk of stream) {
                setFinalAnswer(prev => prev + chunk.text);
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to consolidate the final answer.');
        } finally {
            setLoadingState('done');
        }
    };
    consolidate();
  }, [loadingState, mainTask, subTasks]);


  const isLoading = loadingState !== 'idle' && loadingState !== 'done';

  return (
    <div className="min-h-screen bg-black font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
        <div className="bg-black border border-white rounded-2xl shadow-2xl shadow-black/50 flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto p-4 md:p-6">
            {error && (
              <div className="bg-black border border-white text-white p-4 rounded-lg mb-4">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
              </div>
            )}
            {mainTask ? (
              <AgentOutputDisplay
                mainTask={mainTask}
                subTasks={subTasks}
                finalAnswer={finalAnswer}
                loadingState={loadingState}
              />
            ) : (
              <WelcomeScreen />
            )}
          </div>
          <div className="border-t border-white p-4 md:p-6 bg-black">
            <TaskInputForm onSubmit={handleTaskSubmit} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;