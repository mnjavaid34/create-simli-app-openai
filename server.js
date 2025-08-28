const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Store active conversations
const conversations = new Map();

// WebSocket server for Eleven Labs integration
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  let conversationHistory = [];
  let conversationId = Date.now().toString();
  conversations.set(conversationId, { history: conversationHistory, ws: ws });
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'audio') {
        // Handle audio input from client
        console.log('Received audio data');
        
        // For now, we'll simulate transcription
        // In a real implementation, you'd use a speech-to-text service
        const userMessage = "Hello, how are you?"; // Placeholder
        
        // Add user message to conversation history
        conversationHistory.push({
          role: 'user',
          parts: [{ text: userMessage }]
        });
        
        // Generate response with Gemini
        const response = await generateGeminiResponse(conversationHistory, data.initialPrompt);
        
        // Add assistant response to history
        conversationHistory.push({
          role: 'model',
          parts: [{ text: response }]
        });
        
        // Generate speech with Eleven Labs
        const audioData = await generateElevenLabsSpeech(response, data.voiceId);
        
        // Send response back to client
        ws.send(JSON.stringify({
          type: 'response',
          text: response,
          audio: audioData,
          userMessage: userMessage
        }));
        
      } else if (data.type === 'text') {
        // Handle text input
        conversationHistory.push({
          role: 'user',
          parts: [{ text: data.text }]
        });
        
        const response = await generateGeminiResponse(conversationHistory, data.initialPrompt);
        
        conversationHistory.push({
          role: 'model',
          parts: [{ text: response }]
        });
        
        const audioData = await generateElevenLabsSpeech(response, data.voiceId);
        
        ws.send(JSON.stringify({
          type: 'response',
          text: response,
          audio: audioData,
          userMessage: data.text
        }));
      }
      
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    conversations.delete(conversationId);
  });
});

async function generateGeminiResponse(history, systemPrompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Prepare the conversation with system prompt
    const conversation = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model',
        parts: [{ text: "I understand. I'll follow these instructions." }]
      },
      ...history.slice(-10) // Keep last 10 messages for context
    ];
    
    const chat = model.startChat({
      history: conversation.slice(0, -1)
    });
    
    const result = await chat.sendMessage(history[history.length - 1].parts[0].text);
    return result.response.text();
    
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate response');
  }
}

async function generateElevenLabsSpeech(text, voiceId) {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Eleven Labs API error: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
    
  } catch (error) {
    console.error('Eleven Labs API error:', error);
    throw new Error('Failed to generate speech');
  }
}

// REST API endpoints
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    const audioData = await generateElevenLabsSpeech(text, voiceId);
    res.json({ audio: audioData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, systemPrompt } = req.body;
    
    const conversationHistory = [
      ...history,
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];
    
    const response = await generateGeminiResponse(conversationHistory, systemPrompt);
    
    res.json({ 
      response: response,
      history: [
        ...conversationHistory,
        {
          role: 'model',
          parts: [{ text: response }]
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`WebSocket server running on port 8080`);
});
