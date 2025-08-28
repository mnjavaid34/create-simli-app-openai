# Setup Instructions for Simli + Gemini + ElevenLabs

## 🚀 Quick Setup

### 1. API Keys Required
You need to obtain API keys from three services:

**Simli API Key:**
- Go to [Simli Dashboard](https://app.simli.ai/)
- Sign up/Login and navigate to Profile/Settings
- Copy your API key

**Google AI API Key (for Gemini 2.0 Flash):**
- Go to [Google AI Studio](https://aistudio.google.com/)
- Create a new project or use existing one
- Generate an API key
- Make sure Gemini API is enabled

**ElevenLabs API Key:**
- Go to [ElevenLabs](https://elevenlabs.io/)
- Sign up/Login and navigate to your profile
- Generate an API key
- Note: You can use the free tier for testing

### 2. Environment Setup
Update your `.env` file with the API keys:
```bash
NEXT_PUBLIC_SIMLI_API_KEY="your_simli_api_key_here"
GOOGLE_AI_API_KEY="your_google_ai_api_key_here"
ELEVENLABS_API_KEY="your_elevenlabs_api_key_here"
```

### 3. Voice Selection
The app uses ElevenLabs voice ID `pNInz6obpgDQGcFmaJgB` (Adam voice) by default.

To change the voice:
1. Browse [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
2. Find a voice you like
3. Copy its Voice ID
4. Replace `elevenlabs_voice_id` in `app/page.tsx`

Popular voice options:
- `pNInz6obpgDQGcFmaJgB` - Adam (default)
- `21m00Tcm4TlvDq8ikWAM` - Rachel
- `AZnzlk1XvdvUeBnXmlld` - Domi
- `EXAVITQu4vr4xnSDxMaL` - Bella

### 4. Avatar Face Selection
The app uses Simli face ID `d8f9306d-7de9-45f6-80c5-b65314b7ed09` by default.

To change the avatar:
1. Go to [Simli Dashboard](https://app.simli.ai/)
2. Choose or create a new face
3. Copy the Face ID
4. Replace `simli_faceid` in `app/page.tsx`

### 5. Running the Application

Install dependencies:
```bash
npm install
```

**Single Command to Start Everything:**
```bash
npm start
```

This single command will start:
- Backend server on `http://localhost:3001`
- WebSocket server on `ws://localhost:8080`  
- Next.js frontend on `http://localhost:3000`

**Alternative Commands:**
- `npm run dev:all` - Same as above, alternative command
- `npm run start-server` - Start only the backend server
- `npm run start-ui` - Start only the frontend (Next.js)
- `npm run dev` - Start only Next.js development server

### 6. Browser Requirements
- Use Chrome or Edge for best speech recognition
- Allow microphone access when prompted
- Ensure you're on HTTPS or localhost for speech recognition

## 🔧 Troubleshooting

### "Speech recognition not supported"
- Use Chrome or Edge browser
- Ensure microphone permissions are granted
- Try refreshing the page

### "Failed to connect to server"
- Make sure the backend server is running (`node server.js`)
- Check that ports 3001 and 8080 are not blocked
- Verify your API keys are correctly set in `.env`

### Avatar not loading
- Check Simli API key is valid
- Verify the face ID exists in your Simli dashboard
- Check browser console for detailed error messages

### No voice output
- Verify ElevenLabs API key is working
- Check that the voice ID exists
- Ensure browser audio permissions are granted

## 🎯 Customization

### Personality Prompt
Edit the `initialPrompt` in `app/page.tsx` to change the AI's personality:
```typescript
initialPrompt: "You are [character description]. You [behavioral instructions]."
```

### Voice Settings
Modify the ElevenLabs request in `server.js` to adjust voice parameters:
```javascript
voice_settings: {
  stability: 0.5,        // 0-1, higher = more stable
  similarity_boost: 0.5  // 0-1, higher = more similar to original
}
```

### Gemini Model
The app uses `gemini-2.0-flash-exp` by default. You can change it in `server.js`:
```javascript
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
```

## 📚 Documentation Links
- [Simli Documentation](https://docs.simli.ai/)
- [Google Gemini API](https://ai.google.dev/)
- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
