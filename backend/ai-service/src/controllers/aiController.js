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
            Analyze the following patient data for a dentist:
            
            - Symptoms: ${symptoms}
            - Patient Medical History: ${history}
            - Current Clinical Notes: ${clinicalNotes}
            
            Provide a response with the following sections in Markdown:
            ### 1. Preliminary Assessment
            ### 2. Risk Factors
            ### 3. Areas of Concern
            ### 4. Recommended Next Steps for the Dentist
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
            You are an expert dental treatment planner.
            Based on the following diagnosis: "${diagnosis}" 
            and patient profile details (Age, Blood Group, Active status): "${patientProfile}",
            suggest a prioritized dental treatment plan. 
            
            Structure your response with:
            - **Primary Procedure**: [What should be done first]
            - **Secondary Procedures**: [Additional work]
            - **Estimated Urgency**: [Routine/Urgent/Emergency]
            - **Post-Op Instructions**: [Key advice for the patient]
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
 * Public Landing Page Chatbot (Unprotected)
 */
export const publicChat = async (req, res) => {
    try {
        const { message, history } = req.body;

        // In SDK v0.21+, systemInstruction should be passed when getting the model
        const model = getGeminiModel("You are the friendly AI assistant for 'Clinical Hub', a modern dental clinic. You answer questions about clinic hours (8 AM - 6 PM), services (Scaling, Implants, Braces, Whitening), and location. NEVER give specific medical prescriptions. Always be polite and encourage users to book an appointment through our website. If asked for medical advice, gently decline and suggest seeing a dentist.");

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ response: text });
    } catch (error) {
        console.error('Public AI Chat Error:', error);
        res.status(500).json({ message: 'AI Chat unavailable', error: error.message });
    }
};

/**
 * General Clinical Assistant Chat (Protected for Staff)
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
