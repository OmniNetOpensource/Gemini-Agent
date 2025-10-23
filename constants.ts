import { Type } from '@google/genai';
import type { SubTask } from './types';

export const DECOMPOSITION_PROMPT_TEMPLATE = (task: string) => `
# ROLE
You are an expert planner AI. Your job is to break down a complex user request into a series of smaller, manageable sub-tasks.

# INSTRUCTIONS
1. Analyze the user's request carefully.
2. Identify the logical sequence of steps needed to accomplish the goal.
3. The steps should be concrete actions.
4. Output these steps as a JSON array of strings.
5. Do NOT perform the tasks, only define the steps.
6. The tasks should be in English.

# USER REQUEST
"${task}"

# OUTPUT (JSON Array of Strings)
`;

export const DECOMPOSITION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    subTasks: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        description: 'A clear, actionable sub-task.'
      }
    }
  },
  required: ['subTasks']
};

export const REFLECTION_PROMPT_TEMPLATE = (mainTask: string, subTasks: SubTask[], currentTaskIndex: number) => {
  const completedTasksHistory = subTasks
    .filter((_, index) => index < currentTaskIndex)
    .map((task, index) => `
---
Sub-task ${index + 1}: ${task.description}
Result: ${task.result}
---
`).join('\n');

  return `
# MAIN GOAL
The user wants to accomplish the following task: "${mainTask}"

# TASK PLAN
We have broken down the main goal into these sub-tasks:
${subTasks.map((task, index) => `${index + 1}. ${task.description}`).join('\n')}

# CONTEXT FROM PREVIOUS WORK
We have already completed the following tasks and have these results:
${completedTasksHistory || "No tasks have been completed yet."}

# CURRENT TASK
Your current task is: "${subTasks[currentTaskIndex].description}"

# YOUR JOB
You are a reflective AI. Your job is to think about the **current task** before executing it.
1.  **Analyze**: What is the core question of this task?
2.  **Identify Gaps**: What information is missing? What do I need to find out?
3.  **Formulate a Plan**: What specific questions should I ask? What search terms should I use?

This is a planning step. **DO NOT** execute the task or provide the final answer for it. Just output your brief analysis and action plan.

# REFLECTION AND PLAN
`;
};


export const EXECUTION_PROMPT_TEMPLATE = (mainTask: string, subTasks: SubTask[], currentTaskIndex: number) => {
  const completedTasksHistory = subTasks
    .filter((_, index) => index < currentTaskIndex)
    .map((task, index) => `
---
Sub-task ${index + 1}: ${task.description}
Analysis: ${task.reflection}
Result: ${task.result}
---
`).join('\n');

  return `
# MAIN GOAL
The user wants to accomplish the following task: "${mainTask}"

# TASK PLAN
We have broken down the main goal into these sub-tasks:
${subTasks.map((task, index) => `${index + 1}. ${task.description}`).join('\n')}

# CONTEXT FROM PREVIOUS WORK
We have already completed the following tasks and have these results:
${completedTasksHistory || "No tasks have been completed yet."}

# CURRENT TASK
Your job is to execute ONLY the following sub-task. Use the available tools if necessary.
**Current Sub-task to execute: "${subTasks[currentTaskIndex].description}"**

# ANALYSIS
We have already analyzed this task and formulated the following plan:
"${subTasks[currentTaskIndex].reflection}"

# INSTRUCTIONS
Based on the analysis, execute the task now. Provide a detailed and complete result for this specific step. Be concise but thorough.

# OUTPUT
Provide the result of executing the current sub-task.
`;
};

export const CONSOLIDATION_PROMPT_TEMPLATE = (mainTask: string, subTasks: SubTask[]) => {
  const completedTasksHistory = subTasks.map((task, index) => `
---
Sub-task ${index + 1}: ${task.description}
Analysis:
${task.reflection}
Result:
${task.result}
---
`).join('\n');

  return `
# ROLE
You are a summarization AI. Your job is to synthesize the results of a multi-step task execution into a final, comprehensive answer for the user.

# MAIN GOAL
The user's original request was: "${mainTask}"

# COMPLETED WORK
The following sub-tasks were executed, and here are their results and the analysis that led to them:
${completedTasksHistory}

# INSTRUCTIONS
1. Review all the sub-task results and analysis.
2. Synthesize them into a single, cohesive, and well-formatted final answer that directly addresses the user's main goal.
3. Use markdown for formatting (headings, lists, bolding).
4. Do not mention the sub-tasks or analysis steps in the final output; just present the consolidated information as a complete answer.

# FINAL ANSWER
`;
};
