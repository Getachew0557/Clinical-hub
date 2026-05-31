import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.chat import ChatRequest, ChatResponse
from app.core.rag import rag_manager
from app.core.llm import llm_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="DocBot System Chatbot",
    description="Advanced RAG-powered navigation assistant for the Clinical Hub AI health system.",
    version="2.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_CHATBOT_PROMPT = """You are DocBot, the platform navigation assistant for Clinical Hub.

USER QUESTION: {user_query}

PLATFORM KNOWLEDGE:
{platform_knowledge_base}

RESPONSE RULES:
1. Be direct and concise - answer the question immediately without lengthy introductions
2. Do NOT repeat "I am DocBot" or introduce yourself in every response
3. Provide step-by-step instructions with exact menu names when applicable
4. Use bullet points (•) for multi-step instructions
5. Use emojis to make responses attractive: ✅ 📋 🔍 💡 🎯 ⚡ 📝
6. Do NOT use markdown formatting like **bold** or *italic* - use plain text with emojis instead
7. Keep responses under 200 words when possible
8. If medical question: "For medical inquiries, please consult with a doctor directly or use the AI Clinical Assistant. I'm here to help navigate the platform."
9. Role-specific: Mention if instructions differ by role (Patient, Doctor, Receptionist, Admin)

Answer directly and concisely with emojis and bullet points."""

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # RAG: Retrieve relevant information using vector search
        platform_kb = rag_manager.retrieve(request.message)
        
        # Prepare prompt
        prompt = SYSTEM_CHATBOT_PROMPT.format(
            user_query=request.message,
            platform_knowledge_base=platform_kb
        )
        
        # Generate response using Gemini
        ai_response = llm_client.generate(prompt)
        
        return ChatResponse(
            response=ai_response,
            context_used=platform_kb
        )
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error occurred while processing your request.")

@app.get("/health")
async def health():
    return {
        "status": "healthy", 
        "version": "2.0.0",
        "kb_size": len(rag_manager.knowledge_base)
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8005))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
