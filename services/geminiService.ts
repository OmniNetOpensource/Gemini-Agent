import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { 
    DECOMPOSITION_PROMPT_TEMPLATE, 
    DECOMPOSITION_RESPONSE_SCHEMA,
    REFLECTION_PROMPT_TEMPLATE,
    EXECUTION_PROMPT_TEMPLATE,
    CONSOLIDATION_PROMPT_TEMPLATE
} from '../constants';
import type { SubTask } from "../types";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

export async function decomposeTask(task: string): Promise<string[]> {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: [{ parts: [{ text: DECOMPOSITION_PROMPT_TEMPLATE(task) }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: DECOMPOSITION_RESPONSE_SCHEMA,
            }
        });

        const jsonStr = response.text.trim();
        const parsed = JSON.parse(jsonStr);
        
        if (parsed && Array.isArray(parsed.subTasks)) {
            return parsed.subTasks;
        }

        throw new Error("Failed to parse sub-tasks from API response.");

    } catch (error) {
        console.error("Error decomposing task:", error);
        throw new Error("Failed to decompose task with Gemini API.");
    }
}

export async function* reflectOnSubTaskStream(mainTask: string, subTasks: SubTask[], currentTaskIndex: number): AsyncGenerator<GenerateContentResponse> {
    const prompt = REFLECTION_PROMPT_TEMPLATE(mainTask, subTasks, currentTaskIndex);
    
    try {
        const result = await ai.models.generateContentStream({
            model: model,
            contents: [{ parts: [{ text: prompt }] }],
        });

        for await (const chunk of result) {
            yield chunk;
        }

    } catch (error) {
        console.error("Error reflecting on sub-task:", error);
        throw new Error("Failed to get response from Gemini API for sub-task reflection.");
    }
}


export async function* executeSubTaskStream(mainTask: string, subTasks: SubTask[], currentTaskIndex: number): AsyncGenerator<GenerateContentResponse> {
    const prompt = EXECUTION_PROMPT_TEMPLATE(mainTask, subTasks, currentTaskIndex);
    
    try {
        const result = await ai.models.generateContentStream({
            model: model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                tools: [{googleSearch: {}}],
            }
        });

        for await (const chunk of result) {
            yield chunk;
        }

    } catch (error) {
        console.error("Error executing sub-task:", error);
        throw new Error("Failed to get response from Gemini API for sub-task.");
    }
}

export async function* consolidateResultsStream(mainTask: string, subTasks: SubTask[]): AsyncGenerator<GenerateContentResponse> {
    const prompt = CONSOLIDATION_PROMPT_TEMPLATE(mainTask, subTasks);
    
    try {
        const result = await ai.models.generateContentStream({
            model: model,
            contents: [{ parts: [{ text: prompt }] }],
        });

        for await (const chunk of result) {
            yield chunk;
        }
    } catch (error) {
        console.error("Error consolidating results:", error);
        throw new Error("Failed to consolidate results with Gemini API.");
    }
}
