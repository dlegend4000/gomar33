import { useState, useEffect } from "react";
import { Settings, Moon, Sun } from "lucide-react";
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import Waveform from "./components/Waveform";
import SpeechRecognition from "./components/SpeechRecognition";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body && !e.repeat) {
        e.preventDefault();
        setIsRecording(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        setIsRecording(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 min-h-screen flex flex-col items-center justify-between p-6 transition-colors duration-300">
      <header className="w-full max-w-4xl flex justify-between items-center py-4">
        <div className="text-sm font-medium opacity-60 dark:opacity-40 tracking-wider">
          Gomar33
        </div>
        <button className="p-2 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-gray-500 dark:text-gray-400">
          <Settings size={24} />
        </button>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-2xl relative">
        <div className="w-64 h-64 mb-8">
          <VoicePoweredOrb
            enableVoiceControl={isRecording}
            className="rounded-full shadow-none"
          />
        </div>

        <div className="w-full space-y-6">
          <Waveform progress={0.3} />

          <div className="text-center font-mono text-lg tracking-widest text-gray-500 dark:text-gray-400">
            <span className="text-gray-800 dark:text-white font-medium">
              0:54
            </span>
            <span className="mx-2 opacity-50">/</span>
            <span>4:50</span>
          </div>
        </div>

        <SpeechRecognition />
      </main>

      <footer className="w-full max-w-4xl flex justify-between items-center py-8 px-4 sm:px-0" />

      <div className="absolute top-4 right-4 sm:right-8">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
}

export default App;
