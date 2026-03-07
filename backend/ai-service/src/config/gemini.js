import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Initialize the Gemini model
 */
export const getGeminiModel = () => {
    return genAI.getGenerativeModel({ model: process.env.MODEL_NAME || "gemini-3-flash-preview" });
};

export default genAI;
