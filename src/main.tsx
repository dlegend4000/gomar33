import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Conditional Clerk wrapper component
function AppWrapper() {
  if (!PUBLISHABLE_KEY) {
    console.warn("⚠️ VITE_CLERK_PUBLISHABLE_KEY is not set - running without authentication");
    // Render app without Clerk - Clerk components will need to handle this gracefully
    return <App />;
  }

  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        elements: {
          footer: { display: 'none' }
        }
      }}
    >
      <App />
    </ClerkProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>
);
