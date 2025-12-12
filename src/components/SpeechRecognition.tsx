import { useState, useEffect, useRef } from "react";
import { useGeminiMusic } from "@/hooks/useGeminiMusic";

interface SpeechRecognitionProps {
  onTranscriptChange?: (transcript: string) => void;
}

const SpeechRecognition = ({ onTranscriptChange }: SpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Get Gemini API key from environment variable
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  // Log API key status (first few chars only for security)
  useEffect(() => {
    if (apiKey) {
      console.log("Gemini API key loaded:", apiKey.substring(0, 10) + "...");
    } else {
      console.error("VITE_GEMINI_API_KEY not found in environment variables!");
    }
  }, [apiKey]);

  const {
    isConnected,
    isGenerating,
    error: musicError,
    isInitialized,
    connect,
    updatePrompts,
    updateConfig,
    startGeneration,
    stopGeneration,
    resetContext,
  } = useGeminiMusic(apiKey);

  // Connect when user starts listening (presses spacebar)
  useEffect(() => {
    if (isListening && isInitialized && !isConnected && !musicError) {
      console.log("User started recording, connecting to Gemini Music...");
      connect();
    }
  }, [isListening, isInitialized, isConnected, musicError, connect]);

  // Log connection status
  useEffect(() => {
    console.log(
      "Music connection status - isConnected:",
      isConnected,
      "isGenerating:",
      isGenerating
    );
  }, [isConnected, isGenerating]);

  // Track the last processed transcript to avoid re-triggering
  const lastProcessedTranscriptRef = useRef<string>("");

  // Update music prompts when transcript changes - but only when user finishes speaking
  useEffect(() => {
    console.log("Transcript effect triggered:", {
      transcript,
      isConnected,
      isGenerating,
      isListening,
      transcriptLength: transcript.trim().length,
      lastProcessed: lastProcessedTranscriptRef.current,
    });

    // Only start generation when user finishes speaking (releases spacebar)
    // AND we haven't already processed this exact transcript
    if (
      transcript &&
      isConnected &&
      !isListening &&
      transcript.trim().length > 0 &&
      transcript !== lastProcessedTranscriptRef.current
    ) {
      console.log(
        "User finished speaking, starting music generation with transcript:",
        transcript
      );
      lastProcessedTranscriptRef.current = transcript; // Mark as processed
      const prompts = [{ text: transcript, weight: 1.0 }];

      // Stop and reset for new generation
      const startNewGeneration = async () => {
        try {
          if (isGenerating) {
            console.log(
              "Stopping previous generation and resetting context..."
            );
            await stopGeneration();
            await resetContext();
            // Give it a moment to clean up
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          console.log("Setting prompts...");
          await updatePrompts(prompts);

          console.log("Prompts set, now setting config...");
          await updateConfig({
            bpm: 120,
            temperature: 1.0,
            density: 0.7,
            brightness: 0.6,
          });

          console.log("Config set, now starting generation...");
          await startGeneration();

          console.log("✓ Music generation started successfully!");
        } catch (error) {
          console.error("Error in music generation flow:", error);
          // Reset the processed transcript on error so user can retry
          lastProcessedTranscriptRef.current = "";
        }
      };

      startNewGeneration();
    } else if (!isListening && transcript.trim().length === 0) {
      console.log("Conditions not met: empty transcript");
    } else if (isListening) {
      console.log("User is still speaking, waiting...");
    } else if (transcript === lastProcessedTranscriptRef.current) {
      console.log("Already processed this transcript, skipping...");
    }
  }, [
    transcript,
    isConnected,
    isListening,
    isGenerating,
    updatePrompts,
    updateConfig,
    startGeneration,
    stopGeneration,
    resetContext,
  ]);

  // Notify parent component of transcript changes
  useEffect(() => {
    if (onTranscriptChange) {
      onTranscriptChange(transcript);
    }
  }, [transcript, onTranscriptChange]);

  useEffect(() => {
    // Initialize speech recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        console.log("Started");
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // Scroll to show the end of the text
        if (textRef.current) {
          const container = textRef.current.parentElement;
          if (container) {
            container.scrollLeft = textRef.current.scrollWidth;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        isListeningRef.current = false;
      };

      recognitionRef.current.onend = () => {
        console.log("Ended");
        setIsListening(false);
        isListeningRef.current = false;
      };
    }

    // Handle spacebar
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body && !e.repeat) {
        e.preventDefault();
        if (!isListeningRef.current && recognitionRef.current) {
          console.log("Starting recognition");
          isListeningRef.current = true;
          try {
            recognitionRef.current.start();
          } catch (error: any) {
            // If already started, just ignore the error
            if (error.name !== "InvalidStateError") {
              console.error("Error starting:", error);
            }
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (isListeningRef.current && recognitionRef.current) {
          console.log("Stopping recognition");
          isListeningRef.current = false;
          try {
            recognitionRef.current.stop();
          } catch (error: any) {
            // Ignore errors when stopping
            if (error.name !== "InvalidStateError") {
              console.error("Error stopping:", error);
            }
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log("Cleanup");
        }
      }
    };
  }, []);

  return (
    <div className="teleprompter-container mt-8">
      <div
        ref={textRef}
        className="teleprompter-text text-gray-700 dark:text-gray-300"
      >
        {transcript || " "}
      </div>
      {isListening && (
        <div className="listening-indicator">
          <div className="pulse-dot"></div>
        </div>
      )}
      {/* Enable Audio Button - Chrome autoplay policy workaround */}
      {/* {!audioEnabled && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex gap-2">
          <button
            onClick={async () => {
              // Test audio with a beep
              const ctx = new (window.AudioContext ||
                (window as any).webkitAudioContext)();
              const oscillator = ctx.createOscillator();
              const gainNode = ctx.createGain();

              oscillator.connect(gainNode);
              gainNode.connect(ctx.destination);

              oscillator.frequency.value = 440; // A4 note
              gainNode.gain.value = 0.3;

              oscillator.start();
              oscillator.stop(ctx.currentTime + 0.2);

              await ctx.resume();
              setAudioEnabled(true);
              console.log(
                "Audio test beep played, enabled by user interaction"
              );
            }}
            className="font-medium px-4 py-2 bg-white/20 rounded hover:bg-white/30"
          >
            🔊 Test Audio (Beep)
          </button>
          <button
            onClick={async () => {
              setAudioEnabled(true);
              console.log("Audio enabled (no test)");
            }}
            className="font-medium px-4 py-2 bg-white/20 rounded hover:bg-white/30"
          >
            Skip Test
          </button>
        </div> 
      )}*/}

      {/* Debug info */}
      <div className="fixed top-20 left-4 bg-black/80 text-white px-4 py-2 rounded-lg text-xs space-y-1 max-w-xs">
        {/* <div>API Key: {apiKey ? "✓ Loaded" : "✗ Missing"}</div> */}
        <div>Connected: {isConnected ? "✓ Yes" : "✗ No"}</div>
        <div>Generating: {isGenerating ? "✓ Yes" : "✗ No"}</div>
        {/* <div>Audio: {audioEnabled ? "✓ Enabled" : "✗ Disabled"}</div> */}
        <div>
          Transcript:{" "}
          {transcript ? transcript.substring(0, 30) + "..." : "Empty"}
        </div>
        {musicError && <div className="text-red-400">Error: {musicError}</div>}
      </div>

      {musicError && (
        <div className="fixed bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg text-sm">
          Music Error: {musicError}
        </div>
      )}
      {isConnected && isGenerating && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg text-sm">
          🎵 Generating music...
        </div>
      )}
    </div>
  );
};

export default SpeechRecognition;
