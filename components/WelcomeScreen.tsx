import React from 'react';

interface WelcomeScreenProps {
  // No props needed after removing examples
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="max-w-2xl">
                 <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    智能任务规划与执行助手
                </h2>
                <p className="text-white text-lg mb-8">
                    将任何复杂的目标分解成可执行的步骤。只需输入您的任务，我将为您制定计划并逐步执行。
                </p>
            </div>
        </div>
    );
};