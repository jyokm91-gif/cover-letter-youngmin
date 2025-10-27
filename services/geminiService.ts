import { GoogleGenAI, Type } from "@google/genai";
import type { ProofreadingResult } from '../types';

export interface GeminiCallOptions {
  useSearchGrounding?: boolean;
  useThinkingMode?: boolean;
}

export const callGemini = async (
  systemPrompt: string,
  userQuery: string,
  options: GeminiCallOptions = {}
): Promise<string> => {
    // Initialize the AI client just-in-time to ensure the API key is available.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    let modelName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: { [key: string]: any } = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools: any[] = [];

    if (options.useThinkingMode) {
        modelName = 'gemini-2.5-pro';
        config.thinkingConfig = { thinkingBudget: 32768 };
    } else if (options.useSearchGrounding) {
        modelName = 'gemini-2.5-flash';
        tools.push({ googleSearch: {} });
    } else {
        modelName = 'gemini-2.5-flash';
    }

    // FIX: Explicitly type finalConfig to allow adding the 'tools' property dynamically.
    const finalConfig: { [key: string]: any } = {
        ...config,
        systemInstruction: systemPrompt,
    };
    if (tools.length > 0) {
        finalConfig.tools = tools;
    }

    const payload = {
        model: modelName,
        contents: userQuery,
        config: finalConfig,
    };

    try {
        const response = await ai.models.generateContent(payload);
        return response.text;
    } catch (error) {
        console.error(`Error calling Gemini with model ${modelName}:`, error);
        if (error instanceof Error) {
            throw new Error(`Gemini API 호출에 실패했습니다: ${error.message}`);
        }
        throw new Error('알 수 없는 Gemini API 오류가 발생했습니다.');
    }
};

export const callProofreaderGemini = async (
    systemPrompt: string,
    textToProofread: string
): Promise<ProofreadingResult> => {
    // Initialize the AI client just-in-time to ensure the API key is available.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: textToProofread,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            original: { type: Type.STRING },
                            corrected: { type: Type.STRING },
                            reason: { type: Type.STRING },
                        },
                        required: ["original", "corrected", "reason"],
                    },
                },
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ProofreadingResult;

    } catch (error) {
        console.error("Error calling proofreader Gemini:", error);
        if (error instanceof Error) {
            throw new Error(`맞춤법 검사 API 호출에 실패했습니다: ${error.message}`);
        }
        throw new Error("알 수 없는 맞춤법 검사 API 오류가 발생했습니다.");
    }
};