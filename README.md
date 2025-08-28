# Create Simli App (Gemini + ElevenLabs)
This starter is an example of how to create a composable Simli interaction that runs in a Next.js app using Google Gemini 2.0 Flash for AI responses and ElevenLabs for custom voice synthesis.

 ## Usage
 1. Rename .env_sample to .env and paste your API keys: [SIMLI-API-KEY](https://www.simli.com/profile), [GOOGLE-AI-API-KEY](https://aistudio.google.com/), and [ELEVENLABS-API-KEY](https://elevenlabs.io/) <br/> If you want to try Simli but don't have API access to these third parties, ask in Discord and we can help you out with that ([Discord Link](https://discord.gg/yQx49zNF4d)). 
```js
NEXT_PUBLIC_SIMLI_API_KEY="SIMLI-API-KEY"
GOOGLE_AI_API_KEY="GOOGLE-AI-API-KEY"  
ELEVENLABS_API_KEY="ELEVENLABS-API-KEY"
``` 

2. Install packages
```bash
npm install
```

3. Run (this starts both the backend server and Next.js frontend)
```bash
npm start
```

4. Customize your avatar's face, voice, and prompt by editing app/page.tsx.
```js
const avatar = {
  name: "Frank",
  elevenlabs_voice_id: "pNInz6obpgDQGcFmaJgB", // Replace with your preferred ElevenLabs voice ID
  simli_faceid: "d8f9306d-7de9-45f6-80c5-b65314b7ed09",
  initialPrompt: "You are a helpful AI assistant named Frank. You are friendly and concise in your responses. Your task is to help users with any questions they might have.",
};
```

## Features
- **AI Conversation**: Powered by Google Gemini 2.0 Flash
- **Custom Voice**: Uses ElevenLabs for high-quality voice synthesis
- **Speech Recognition**: Browser-based speech-to-text
- **Real-time Avatar**: Simli provides lip-sync and facial animation
- **WebSocket Communication**: Real-time bidirectional communication

## Getting ElevenLabs Voice IDs
1. Go to [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
2. Choose a voice you like
3. Copy the Voice ID from the voice details
4. Replace `elevenlabs_voice_id` in the avatar configuration

## Characters
You can swap out the character by finding one that you like in the [docs](https://docs.simli.com/introduction), or [create your own](https://app.simli.com/) 

![alt text](media/image.png) ![alt text](media/image-4.png) ![alt text](media/image-2.png) ![alt text](media/image-3.png) ![alt text](media/image-5.png) ![alt text](media/image-6.png)

## Deploy on Vercel
An easy way to deploy your avatar interaction to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme). 
