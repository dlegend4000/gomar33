// Simple test script to verify Gemini SDK works
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY not found in environment");
  process.exit(1);
}

console.log("API Key loaded:", apiKey.substring(0, 10) + "...");

const client = new GoogleGenAI({
  apiKey,
  apiVersion: "v1alpha",
});

console.log("Client created successfully");
console.log("Client methods:", Object.keys(client));

// Try to check if live.music exists
if (client.live) {
  console.log("✓ client.live exists");
  console.log("live methods:", Object.keys(client.live));

  if (client.live.music) {
    console.log("✓ client.live.music exists");
    console.log("music methods:", Object.keys(client.live.music));

    // Check if connect method exists
    if (typeof client.live.music.connect === 'function') {
      console.log("✓ client.live.music.connect is a function");

      // Try to connect
      console.log("\nAttempting to connect to Lyria RealTime...");
      try {
        const session = await client.live.music.connect({
          model: "models/lyria-realtime-exp",
          callbacks: {
            onmessage: (message) => {
              console.log("✓ Received message:", message);
            },
            onerror: (error) => {
              console.error("✗ Session error:", error);
            },
            onclose: () => {
              console.log("Session closed");
            },
          },
        });
        console.log("✓ Session connected successfully!");
        console.log("Session object:", session);
        console.log("Session methods:", Object.keys(session));

        // Disconnect after testing
        setTimeout(() => {
          console.log("\nTest complete, exiting...");
          process.exit(0);
        }, 2000);
      } catch (error) {
        console.error("✗ Failed to connect:", error.message);
        console.error("Error details:", error);
        process.exit(1);
      }
    } else {
      console.error("✗ client.live.music.connect is NOT a function");
    }
  } else {
    console.error("✗ client.live.music does NOT exist");
  }
} else {
  console.error("✗ client.live does NOT exist");
}
