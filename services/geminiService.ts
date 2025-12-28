
import { GoogleGenAI, Type } from "@google/genai";
import type { ProofreadingResult, JobOption } from '../types';
import { integratedJobLogicString } from '../integratedJobLogic';

export interface GeminiCallOptions {
  useSearchGrounding?: boolean;
  useThinkingMode?: boolean;
}

export const callGemini = async (
  systemPrompt: string,
  userQuery: string,
  jobRole: JobOption,
  options: GeminiCallOptions = {}
): Promise<string> => {
    // Initialize the AI client just-in-time to ensure the API key is available.
    const ai = new GoogleGenAI({ apiKey: AIzaSyBYoe5XAoBnt5g1NNLIWVk5mI-lAEvY6eQ });
    
    let modelName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: { [key: string]: any } = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools: any[] = [];

    if (options.useThinkingMode) {
        // User requested Gemini 3 Pro for thinking mode for better quality
        modelName = 'gemini-3-pro-preview';
        // Max budget for gemini-3-pro-preview is 32768
        config.thinkingConfig = { thinkingBudget: 32768 };
    } else if (options.useSearchGrounding) {
        modelName = 'gemini-2.5-flash';
        tools.push({ googleSearch: {} });
    } else {
        modelName = 'gemini-2.5-flash';
    }

    const finalConfig: { [key: string]: any } = {
        ...config,
        systemInstruction: systemPrompt,
    };
    if (tools.length > 0) {
        finalConfig.tools = tools;
    }

    // Create context part for the "attached file"
    const jobLogicContextPart = {
        text: `[Context: Attached File "integratedJobLogic.txt"]\n${integratedJobLogicString}`
    };

    // Create user prompt part with selected job role
    const userPromptPart = {
        text: `[선택된 직무]: ${jobRole}\n\n${userQuery}`
    };

    const payload = {
        model: modelName,
        contents: [jobLogicContextPart, userPromptPart],
        config: finalConfig,
    };

    try {
        const response = await ai.models.generateContent(payload);
        return response.text || '';
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
    const ai = new GoogleGenAI({ apiKey: AIzaSyBYoe5XAoBnt5g1NNLIWVk5mI-lAEvY6eQ });
    
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

export const extractTextFromImage = async (
  base64ImageData: string,
  mimeType: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: AIzaSyBYoe5XAoBnt5g1NNLIWVk5mI-lAEvY6eQ });

    const imagePart = {
        inlineData: {
            data: base64ImageData,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: '이 이미지에서 모든 텍스트를 한국어로 추출해줘. 원본의 서식과 줄바꿈을 최대한 유지해줘.'
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        return response.text || '';
    } catch (error) {
        console.error('Error extracting text from image with Gemini:', error);
        if (error instanceof Error) {
            throw new Error(`이미지 텍스트 추출 API 호출에 실패했습니다: ${error.message}`);
        }
        throw new Error('알 수 없는 이미지 텍스트 추출 API 오류가 발생했습니다.');
    }
};

export const fetchJobPostingFromUrl = async (url: string): Promise<string> => {
    if (!url || !url.startsWith('http')) {
        throw new Error('유효한 URL을 입력해주세요.');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const systemPrompt = "You are an intelligent web scraper. Your task is to access the provided URL, extract the main content of the job posting, and return it as clean, formatted text. Focus on job title, company, responsibilities, qualifications, and preferred skills. Exclude irrelevant content like headers, footers, navigation bars, and advertisements.";

    const userQuery = `Please scrape the job posting from this URL: ${url}`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userQuery,
            config: {
                systemInstruction: systemPrompt,
                tools: [{ googleSearch: {} }],
            }
        });

        if (!response.text) {
            throw new Error('URL에서 채용 공고 내용을 추출하지 못했습니다. URL을 확인하거나 내용을 직접 복사하여 붙여넣어 주세요.');
        }
        
        return response.text;

    } catch (error) {
        console.error(`Error fetching job posting from URL with Gemini:`, error);
        if (error instanceof Error) {
            throw new Error(`URL에서 채용 공고를 가져오는 중 오류가 발생했습니다: ${error.message}`);
        }
        throw new Error('URL에서 채용 공고를 가져오는 중 알 수 없는 오류가 발생했습니다.');
    }
};
