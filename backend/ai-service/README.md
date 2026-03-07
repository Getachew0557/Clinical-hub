# AI Service

Backend microservice leveraging Google Gemini for AI-powered clinical assistance in the Dental Clinic System.

## Functionality
- **Assistant Diagnosis**: Analyzes symptoms and history to provide medical insights (Powered by Gemini-3-Flash).
- **Treatment Suggestions**: Suggests prioritized treatment plans based on a diagnosis.
- **Clinical Chat**: Interactive AI chat for answering dental-related medical questions.
- **Role Guards**: Restricted to medical providers (Doctors and Admins).

## 🤖 What Was Built

A cutting-edge `ai-service` running on **port 5009** for clinical assistance.

### Key Technologies
- **Google Gemini SDK**: Integrated the `gemini-3-flash-preview` model.
- **Node.js/Express**: Standard microservice architecture.

### AI Capabilities Verified ✅
- **Diagnosis Analysis**: Automated insights from symptoms.
- **Treatment Suggestions**: Context-aware planning.

---

## Roles & Permissions

| Role | Actions |
|---|---|
| **Admin** | Full access to AI analytics and clinical assistant. |
| **Doctor** | Full access to assistant diagnosis and treatment planning. |
| **Receptionist** | No access. |
| **Patient** | No access. |

## API Reference

### AI Analysis (Doctor/Admin)
- `POST /api/ai/analyze-diagnosis` -> Analyze symptoms and patient history.
- `POST /api/ai/suggest-treatment` -> Get treatment plan suggestions.
- `POST /api/ai/chat` -> Interactive medical assistance.

## Environment Variables
```env
PORT=5009
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key
MODEL_NAME=gemini-3-flash-preview
JWT_SECRET=your_jwt_secret
```

---

## 🧪 Postman Testing Guide

### STEP 1 — AI Diagnosis Analysis (Doctor)
- **Method**: `POST`
- **URL**: `http://localhost:5009/api/ai/analyze-diagnosis`
- **Auth**: `Bearer {{doctor_token}}`
- **Body (JSON)**:
  ```json
  {
    "symptoms": "Sharp pain in lower left molar when biting down",
    "history": "Previous filling in the same area 2 years ago",
    "clinicalNotes": "Slight inflammation of the surrounding gum tissue"
  }
  ```

### STEP 2 — AI Treatment Plan
- **Method**: `POST`
- **URL**: `http://localhost:5009/api/ai/suggest-treatment`
- **Body (JSON)**:
  ```json
  {
    "diagnosis": "Vertical root fracture suspected",
    "patientProfile": "45 year old male, no systemic diseases"
  }
  ```

### STEP 3 — Medical Assistant Chat
- **Method**: `POST`
- **URL**: `http://localhost:5009/api/ai/chat`
- **Body (JSON)**:
  ```json
  {
    "message": "Clinical query..."
  }
  ```
