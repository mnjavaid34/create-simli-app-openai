import IconSparkleLoader from "@/media/IconSparkleLoader";
import React, { useCallback, useRef, useState, useEffect } from "react";
import { SimliClient } from "simli-client";
import VideoBox from "./Components/VideoBox";
import cn from "./utils/TailwindMergeAndClsx";

interface SimliGeminiProps {
  simli_faceid: string;
  elevenlabs_voice_id: string;
  initialPrompt: string;
  onStart: () => void;
  onClose: () => void;
  showDottedFace: boolean;
}

const simliClient = new SimliClient();

const SimliGemini: React.FC<SimliGeminiProps> = ({
  simli_faceid,
  elevenlabs_voice_id,
  initialPrompt,
  onStart,
  onClose,
  showDottedFace,
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarVisible, setIsAvatarVisible] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [userMessage, setUserMessage] = useState("...");
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  // Refs for various components and states
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isFirstRun = useRef(true);
  const recognitionRef = useRef<any>(null);

  /**
   * Initializes the Simli client with the provided configuration.
   */
  const initializeSimliClient = useCallback(() => {
    if (videoRef.current && audioRef.current) {
      const SimliConfig = {
        apiKey: process.env.NEXT_PUBLIC_SIMLI_API_KEY,
        faceID: simli_faceid,
        handleSilence: true,
        maxSessionLength: 6000, // in seconds
        maxIdleTime: 6000, // in seconds
        videoRef: videoRef.current,
        audioRef: audioRef.current,
        enableConsoleLogs: true,
      };

      simliClient.Initialize(SimliConfig as any);
      console.log("Simli Client initialized");
    }
  }, [simli_faceid]);

  /**
   * Initializes WebSocket connection for Gemini + Eleven Labs
   */
  const initializeWebSocket = useCallback(() => {
    try {
      console.log("Initializing WebSocket connection...");
      websocketRef.current = new WebSocket('ws://localhost:8080');
      
      websocketRef.current.onopen = () => {
        console.log("WebSocket connected");
        initializeSpeechRecognition();
      };
      
      websocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleServerResponse(data);
      };
      
      websocketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Failed to connect to server");
      };
      
      websocketRef.current.onclose = () => {
        console.log("WebSocket disconnected");
      };
      
    } catch (error: any) {
      console.error("Error initializing WebSocket:", error);
      setError(`Failed to initialize connection: ${error.message}`);
    }
  }, []);

  /**
   * Initialize speech recognition
   */
  const initializeSpeechRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setUserMessage(finalTranscript);
          sendMessageToServer(finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
      
      recognitionRef.current.onend = () => {
        if (isRecording) {
          recognitionRef.current?.start();
        }
      };
      
      setIsRecording(true);
      recognitionRef.current.start();
      console.log("Speech recognition started");
    } else {
      console.warn("Speech recognition not supported");
      setError("Speech recognition not supported in this browser");
    }
  }, [isRecording]);

  /**
   * Send message to server via WebSocket
   */
  const sendMessageToServer = useCallback((message: string) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'text',
        text: message,
        initialPrompt: initialPrompt,
        voiceId: elevenlabs_voice_id,
        history: conversationHistory
      }));
    }
  }, [initialPrompt, elevenlabs_voice_id, conversationHistory]);

  /**
   * Handle response from server
   */
  const handleServerResponse = useCallback((data: any) => {
    if (data.type === 'response') {
      console.log("Received response from server:", data.text);
      
      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: data.userMessage },
        { role: 'assistant', content: data.text }
      ]);
      
      // Convert base64 audio to ArrayBuffer and send to Simli
      if (data.audio) {
        const binaryString = atob(data.audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Convert MP3 to PCM for Simli
        convertMp3ToPcm(bytes.buffer).then((pcmData) => {
          if (pcmData) {
            simliClient?.sendAudioData(pcmData as any);
            console.log("Sent audio to Simli");
          }
        });
      }
    } else if (data.type === 'error') {
      console.error("Server error:", data.message);
      setError(data.message);
    }
  }, []);

  /**
   * Convert MP3 audio to PCM for Simli
   */
  const convertMp3ToPcm = async (mp3ArrayBuffer: ArrayBuffer): Promise<Int16Array | null> => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const audioBuffer = await audioContextRef.current.decodeAudioData(mp3ArrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert to 16kHz if needed
      let resampledData: Float32Array = channelData;
      if (audioBuffer.sampleRate !== 16000) {
        resampledData = resampleAudio(channelData, audioBuffer.sampleRate, 16000);
      }
      
      // Convert to Int16Array
      const pcmData = new Int16Array(resampledData.length);
      for (let i = 0; i < resampledData.length; i++) {
        pcmData[i] = Math.max(-32768, Math.min(32767, Math.floor(resampledData[i] * 32768)));
      }
      
      return pcmData;
    } catch (error) {
      console.error("Error converting MP3 to PCM:", error);
      return null;
    }
  };

  /**
   * Resample audio data
   */
  const resampleAudio = (inputData: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array => {
    if (inputSampleRate === outputSampleRate) {
      return inputData;
    }
    
    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.floor(inputData.length / ratio);
    const outputData = new Float32Array(outputLength);
    
    for (let i = 0; i < outputLength; i++) {
      const sourceIndex = i * ratio;
      const lowerIndex = Math.floor(sourceIndex);
      const upperIndex = Math.min(lowerIndex + 1, inputData.length - 1);
      const fraction = sourceIndex - lowerIndex;
      
      outputData[i] = inputData[lowerIndex] * (1 - fraction) + inputData[upperIndex] * fraction;
    }
    
    return outputData;
  };

  /**
   * Starts speech recognition
   */
  const startRecording = useCallback(() => {
    if (recognitionRef.current && !isRecording) {
      setIsRecording(true);
      recognitionRef.current.start();
      console.log("Started recording");
    }
  }, [isRecording]);

  /**
   * Stops speech recognition
   */
  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      setIsRecording(false);
      recognitionRef.current.stop();
      console.log("Stopped recording");
    }
  }, [isRecording]);

  /**
   * Handles starting the interaction.
   */
  const handleStart = useCallback(async () => {
    console.log("Starting interaction...");
    setIsLoading(true);
    setError("");
    onStart();

    try {
      console.log("Starting...");
      initializeSimliClient();
      eventListenerSimli();
      await simliClient?.start();
    } catch (error: any) {
      console.error("Error starting interaction:", error);
      setError(`Error starting interaction: ${error.message}`);
    } finally {
      setIsAvatarVisible(true);
      setIsLoading(false);
    }
  }, [onStart]);

  /**
   * Handles stopping the interaction, cleaning up resources and resetting states.
   */
  const handleStop = useCallback(() => {
    console.log("Stopping interaction...");
    setIsLoading(false);
    setError("");
    stopRecording();
    setIsAvatarVisible(false);
    simliClient?.close();
    
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    }
    
    setConversationHistory([]);
    onClose();
    console.log("Interaction stopped");
  }, [stopRecording]);

  /**
   * Simli Event listeners
   */
  const eventListenerSimli = useCallback(() => {
    if (simliClient) {
      simliClient?.on("connected", () => {
        console.log("SimliClient connected");
        // Initialize WebSocket connection
        initializeWebSocket();
      });

      simliClient?.on("disconnected", () => {
        console.log("SimliClient disconnected");
        if (websocketRef.current) {
          websocketRef.current.close();
        }
        if (audioContextRef.current) {
          audioContextRef.current?.close();
        }
      });
    }
  }, [initializeWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <>
      <div
        className={`transition-all duration-300 ${showDottedFace ? "h-0 overflow-hidden" : "h-auto"
          }`}
      >
        <VideoBox video={videoRef} audio={audioRef} />
      </div>
      <div className="flex flex-col items-center">
        {error && (
          <div className="text-red-500 text-sm mb-4 p-2 bg-red-50 rounded">
            {error}
          </div>
        )}
        {isRecording && (
          <div className="text-green-500 text-sm mb-2">
            🎤 Listening... Say something!
          </div>
        )}
        {userMessage !== "..." && (
          <div className="text-gray-600 text-sm mb-2">
            You said: "{userMessage}"
          </div>
        )}
        {!isAvatarVisible ? (
          <button
            onClick={handleStart}
            disabled={isLoading}
            className={cn(
              "w-full h-[52px] mt-4 disabled:bg-[#343434] disabled:text-white disabled:hover:rounded-[100px] bg-simliblue text-white py-3 px-6 rounded-[100px] transition-all duration-300 hover:text-black hover:bg-white hover:rounded-sm",
              "flex justify-center items-center"
            )}
          >
            {isLoading ? (
              <IconSparkleLoader className="h-[20px] animate-loader" />
            ) : (
              <span className="font-abc-repro-mono font-bold w-[164px]">
                Start Conversation
              </span>
            )}
          </button>
        ) : (
          <>
            <div className="flex items-center gap-4 w-full">
              <button
                onClick={handleStop}
                className={cn(
                  "mt-4 group text-white flex-grow bg-red hover:rounded-sm hover:bg-white h-[52px] px-6 rounded-[100px] transition-all duration-300"
                )}
              >
                <span className="font-abc-repro-mono group-hover:text-black font-bold w-[164px] transition-all duration-300">
                  Stop Conversation
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SimliGemini;
