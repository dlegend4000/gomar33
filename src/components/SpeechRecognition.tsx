import { useState, useEffect, useRef } from "react";

const SpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const textRef = useRef<HTMLDivElement>(null);

  console.log(transcript);

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
    </div>
  );
};

export default SpeechRecognition;
