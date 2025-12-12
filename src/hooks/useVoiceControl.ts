import { useState, useRef, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

interface UseVoiceControlReturn {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
}

interface UseVoiceControlProps {
  onToolCall: (toolName: string, args: Record<string, any>) => void;
}

export function useVoiceControl({ onToolCall }: UseVoiceControlProps): UseVoiceControlReturn {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const { user } = useUser();

  // Parse transcript locally (fallback when backend is unavailable)
  const parseTranscriptLocally = useCallback((transcriptText: string) => {
    const lowerTranscript = transcriptText.toLowerCase().trim();
    const toolCalls: Array<{ name: string; arguments: Record<string, any> }> = [];

    // Tempo/Speed commands
    if (
      lowerTranscript.includes("slow down") || 
      lowerTranscript.includes("slow it down") ||
      lowerTranscript.includes("slow the tempo") ||
      lowerTranscript.includes("slow down the tempo") ||
      lowerTranscript.includes("decrease tempo") ||
      lowerTranscript.includes("reduce tempo") ||
      lowerTranscript.includes("slower")
    ) {
      let rate = 0.8;
      if (lowerTranscript.includes("a lot") || lowerTranscript.includes("much")) {
        rate = 0.6;
      } else if (lowerTranscript.includes("little") || lowerTranscript.includes("bit")) {
        rate = 0.9;
      }
      toolCalls.push({ name: "adjust_tempo", arguments: { rate } });
    } else if (
      lowerTranscript.includes("speed up") || 
      lowerTranscript.includes("speed it up") ||
      lowerTranscript.includes("faster") ||
      lowerTranscript.includes("increase tempo") ||
      lowerTranscript.includes("faster tempo") ||
      lowerTranscript.includes("speed up the tempo")
    ) {
      let rate = 1.3;
      if (lowerTranscript.includes("a lot") || lowerTranscript.includes("much")) {
        rate = 1.6;
      } else if (lowerTranscript.includes("little") || lowerTranscript.includes("bit")) {
        rate = 1.15;
      }
      toolCalls.push({ name: "adjust_tempo", arguments: { rate } });
    }
    // Pitch commands
    else if (
      lowerTranscript.includes("change pitch") ||
      lowerTranscript.includes("change my pitch") ||
      lowerTranscript.includes("adjust pitch") ||
      lowerTranscript.includes("modify pitch")
    ) {
      let pitch = 1.1;
      if (lowerTranscript.includes("higher") || lowerTranscript.includes("up") || lowerTranscript.includes("increase")) {
        pitch = lowerTranscript.includes("a lot") || lowerTranscript.includes("much") ? 1.4 : 1.2;
      } else if (lowerTranscript.includes("lower") || lowerTranscript.includes("down") || lowerTranscript.includes("decrease")) {
        pitch = lowerTranscript.includes("a lot") || lowerTranscript.includes("much") ? 0.6 : 0.8;
      }
      toolCalls.push({ name: "adjust_pitch", arguments: { pitch } });
    } else if (
      lowerTranscript.includes("higher pitch") || 
      lowerTranscript.includes("pitch up") ||
      lowerTranscript.includes("increase pitch") ||
      lowerTranscript.includes("raise pitch")
    ) {
      let pitch = 1.2;
      if (lowerTranscript.includes("a lot") || lowerTranscript.includes("much")) {
        pitch = 1.5;
      } else if (lowerTranscript.includes("little") || lowerTranscript.includes("bit")) {
        pitch = 1.1;
      }
      toolCalls.push({ name: "adjust_pitch", arguments: { pitch } });
    } else if (
      lowerTranscript.includes("lower pitch") || 
      lowerTranscript.includes("pitch down") ||
      lowerTranscript.includes("decrease pitch") ||
      lowerTranscript.includes("drop pitch")
    ) {
      let pitch = 0.8;
      if (lowerTranscript.includes("a lot") || lowerTranscript.includes("much")) {
        pitch = 0.6;
      } else if (lowerTranscript.includes("little") || lowerTranscript.includes("bit")) {
        pitch = 0.9;
      }
      toolCalls.push({ name: "adjust_pitch", arguments: { pitch } });
    }
    // Playback controls
    else if (lowerTranscript.includes("play") || lowerTranscript.includes("start")) {
      toolCalls.push({ name: "play_audio", arguments: {} });
    } else if (lowerTranscript.includes("pause") || lowerTranscript.includes("stop")) {
      toolCalls.push({ name: "pause_audio", arguments: {} });
    }

    return toolCalls;
  }, []);

  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      setError(null);

      // If we have a transcript, try to parse it locally first (works without backend)
      if (transcript) {
        const toolCalls = parseTranscriptLocally(transcript);
        if (toolCalls.length > 0) {
          // Execute tool calls locally
          for (const toolCall of toolCalls) {
            onToolCall(toolCall.name, toolCall.arguments || {});
          }
          setIsProcessing(false);
          return; // Successfully processed locally
        }
      }

      // Try backend if local parsing didn't work
      try {
        // Convert blob to base64
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer))
        );

        // Get the API URL (use localhost for dev, production URL for prod)
        const apiUrl = import.meta.env.DEV
          ? 'http://localhost:5001/gomar33-cc75d/us-central1/processVoiceCommand'
          : 'https://us-central1-gomar33-cc75d.cloudfunctions.net/processVoiceCommand';

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioData: base64Audio,
            transcript: transcript, // Send the Web Speech API transcript
            userId: user?.id || 'anonymous',
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Update transcript from backend response
        if (data.transcript) {
          setTranscript(data.transcript);
        }

        if (data.success && data.toolCalls) {
          // Execute each tool call
          for (const toolCall of data.toolCalls) {
            onToolCall(toolCall.name, toolCall.arguments || {});
          }
        }
      } catch (backendErr: any) {
        // If backend fails, fall back to local parsing
        console.log('Backend unavailable, using local parsing:', backendErr.message);
        if (transcript) {
          const toolCalls = parseTranscriptLocally(transcript);
          if (toolCalls.length > 0) {
            for (const toolCall of toolCalls) {
              onToolCall(toolCall.name, toolCall.arguments || {});
            }
          } else {
            setError('No command recognized. Try: "slow down", "speed up", "change pitch", "play", or "pause"');
          }
        } else {
          setError('No transcript available. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Error processing voice command:', err);
      setError(err.message || 'Failed to process voice command');
    } finally {
      setIsProcessing(false);
    }
  }, [onToolCall, user, transcript, parseTranscriptLocally]);

  // Store processAudioChunk in a ref to avoid circular dependency
  const processAudioChunkRef = useRef(processAudioChunk);
  useEffect(() => {
    processAudioChunkRef.current = processAudioChunk;
  }, [processAudioChunk]);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      setTranscript(''); // Clear previous transcript
      
      // Initialize Web Speech API for real-time transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Update transcript with both interim and final results
          setTranscript(finalTranscript + interimTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          // Don't stop listening on error, just log it
        };

        recognition.onend = () => {
          // Restart recognition if still listening
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognition.start();
            } catch (e) {
              // Recognition already started or error
            }
          }
        };

      recognitionRef.current = recognition;
      recognition.start();
      }
      
      isListeningRef.current = true;
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: 'audio/webm;codecs=opus' 
          });
          // Use ref to get latest version without dependency
          await processAudioChunkRef.current(audioBlob);
          audioChunksRef.current = [];
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);

      // Auto-stop after 5 seconds of silence or manual stop
      // For now, we'll record in chunks
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsListening(false);
        }
      }, 5000);

    } catch (err: any) {
      console.error('Error starting voice recording:', err);
      setError(err.message || 'Failed to access microphone');
      setIsListening(false);
    }
  }, []); // Remove processAudioChunk dependency

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsListening(false);
  }, []);

  return {
    isListening,
    isProcessing,
    transcript,
    startListening,
    stopListening,
    error,
  };
}

