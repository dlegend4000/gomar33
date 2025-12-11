import { useState, useEffect } from 'react';
import { Settings, Moon, Sun } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import AvatarDisplay from './components/AvatarDisplay';
import Waveform from './components/Waveform';
import { AnimatedFolder } from './components/ui/3d-folder';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const { isSignedIn, user } = useUser();

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
        <div className="flex items-center gap-4">
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  footer: { display: 'none' }
                }
              }}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton 
              mode="modal"
              appearance={{
                elements: {
                  footer: { display: 'none' }
                }
              }}
            >
              <button className="px-4 py-2 rounded-lg bg-black hover:bg-gray-900 text-white transition-colors">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <button className="p-2 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-gray-500 dark:text-gray-400">
            <Settings size={24} />
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-2xl relative">
        <SignedIn>
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
        </SignedIn>

        <SignedOut>
          <div className="flex items-center justify-center w-full">
            <AnimatedFolder
              title="Gomar"
              subtitle="music at the speed of thought"
              projects={[
                { 
                  id: "1", 
                  image: "https://plus.unsplash.com/premium_photo-1723489242223-865b4a8cf7b8?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", 
                  title: "Lumnia" 
                },
                { 
                  id: "2", 
                  image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2128&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", 
                  title: "Prism" 
                },
                { 
                  id: "3", 
                  image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", 
                  title: "Vertex" 
                },
              ]}
            />
          </div>
        </SignedOut>
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
