import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Initialize the Gemini model
 * @param {string} [systemInstruction] - Optional system instruction for the model
 */
export const getGeminiModel = (systemInstruction) => {
    const config = { model: process.env.MODEL_NAME || "gemini-3-flash-preview" };
    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }
    return genAI.getGenerativeModel(config);
};

export default genAI;
