import { useState, useEffect } from 'react';
import { Settings, Moon, Sun } from 'lucide-react';
import AvatarDisplay from './components/AvatarDisplay';
import Waveform from './components/Waveform';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
        <AvatarDisplay />

        <div className="w-full space-y-6">
          <Waveform progress={0.3} />

          <div className="text-center font-mono text-lg tracking-widest text-gray-500 dark:text-gray-400">
            <span className="text-gray-800 dark:text-white font-medium">0:54</span>
            <span className="mx-2 opacity-50">/</span>
            <span>4:50</span>
          </div>
        </div>

        <div className="subtitle-fade text-gray-700 dark:text-gray-300">
          transposing chorus from Aflat to Gsharp…
        </div>
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
