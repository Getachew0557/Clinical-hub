import { getGeminiModel } from '../config/gemini.js';

/**
 * Analyze Diagnosis Assisted by AI
 */
export const analyzeDiagnosis = async (req, res) => {
    try {
        const { symptoms, history, clinicalNotes } = req.body;

        const model = getGeminiModel();
        const prompt = `
            You are a professional dental clinical assistant.
            Analyze the following patient data and provide a preliminary diagnosis summary and key focus areas for the dentist.
            
            Symptoms: ${symptoms}
            History: ${history}
            Clinical Notes: ${clinicalNotes}
            
            Provide the response in clear, concise bullet points for a medical professional.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({
            analysis: text,
            provider: 'Google Gemini',
            model: process.env.MODEL_NAME
        });
    } catch (error) {
        console.error('AI Analysis Error:', error);
        res.status(500).json({ message: 'AI Analysis failed', error: error.message });
    }
};

/**
 * Suggest Treatment Plans
 */
export const suggestTreatment = async (req, res) => {
    try {
        const { diagnosis, patientProfile } = req.body;

        const model = getGeminiModel();
        const prompt = `
            Based on the following diagnosis: "${diagnosis}" 
            and patient profile: "${patientProfile}",
            suggest a prioritized dental treatment plan. Include common procedures, estimated urgency, and post-op care advice.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({
            suggestions: text,
            provider: 'Google Gemini'
        });
    } catch (error) {
        res.status(500).json({ message: 'Treatment suggestion failed', error: error.message });
    }
};

/**
 * General Clinical Assistant Chat
 */
export const aiChat = async (req, res) => {
    try {
        const { message, context } = req.body;

        const model = getGeminiModel();
        const chat = model.startChat({
            history: context || [],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ response: text });
    } catch (error) {
        res.status(500).json({ message: 'AI Chat failed', error: error.message });
    }
};
