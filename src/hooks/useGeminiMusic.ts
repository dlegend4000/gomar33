import { useState, useEffect, useRef, useCallback } from "react";
import { GeminiMusicService, WeightedPrompt, MusicGenerationConfig } from "@/services/geminiMusic";

export const useGeminiMusic = (apiKey: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef<GeminiMusicService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize service instance (but don't connect yet)
  useEffect(() => {
    if (!apiKey) {
      setError("Gemini API key is required");
      console.error("No API key provided to useGeminiMusic");
      return;
    }

    console.log("Creating Gemini Music service instance with API key:", apiKey.substring(0, 10) + "...");
    serviceRef.current = new GeminiMusicService(apiKey);
    setIsInitialized(true);

    return () => {
      if (serviceRef.current) {
        console.log("Cleaning up Gemini Music service...");
        serviceRef.current.disconnect();
      }
    };
  }, [apiKey]);

  // Connect on demand
  const connect = useCallback(async () => {
    if (!serviceRef.current) {
      setError("Service not initialized");
      return;
    }

    if (isConnected) {
      console.log("Already connected to Gemini Music");
      return;
    }

    try {
      console.log("Connecting to Gemini Music API...");
      await serviceRef.current.connect();

      console.log("✓ Successfully connected to Gemini Music!");
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error("Failed to connect to Gemini Music:", err);
      console.error("Error details:", {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        error: err
      });
      setError(err instanceof Error ? err.message : "Failed to connect");
      setIsConnected(false);
    }
  }, [isConnected]);

  const updatePrompts = useCallback(async (prompts: WeightedPrompt[]) => {
    if (!serviceRef.current) {
      setError("Service not initialized");
      return;
    }

    try {
      await serviceRef.current.setPrompts(prompts);
      setError(null);
    } catch (err) {
      console.error("Failed to update prompts:", err);
      setError(err instanceof Error ? err.message : "Failed to update prompts");
    }
  }, []);

  const updateConfig = useCallback(async (config: MusicGenerationConfig) => {
    if (!serviceRef.current) {
      setError("Service not initialized");
      return;
    }

    try {
      await serviceRef.current.setConfig(config);
      setError(null);
    } catch (err) {
      console.error("Failed to update config:", err);
      setError(err instanceof Error ? err.message : "Failed to update config");
    }
  }, []);

  const startGeneration = useCallback(async () => {
    if (!serviceRef.current) {
      setError("Service not initialized");
      return;
    }

    try {
      await serviceRef.current.play();
      setIsGenerating(true);
      setError(null);
    } catch (err) {
      console.error("Failed to start generation:", err);
      setError(err instanceof Error ? err.message : "Failed to start generation");
    }
  }, []);

  const pauseGeneration = useCallback(async () => {
    if (!serviceRef.current) {
      setError("Service not initialized");
      return;
    }

    try {
      await serviceRef.current.pause();
      setIsGenerating(false);
      setError(null);
    } catch (err) {
      console.error("Failed to pause generation:", err);
      setError(err instanceof Error ? err.message : "Failed to pause generation");
    }
  }, []);

  const stopGeneration = useCallback(async () => {
    if (!serviceRef.current) {
      setError("Service not initialized");
      return;
    }

    try {
      await serviceRef.current.stop();
      setIsGenerating(false);
      setError(null);
    } catch (err) {
      console.error("Failed to stop generation:", err);
      setError(err instanceof Error ? err.message : "Failed to stop generation");
    }
  }, []);

  const resetContext = useCallback(async () => {
    if (!serviceRef.current) {
      setError("Service not initialized");
      return;
    }

    try {
      await serviceRef.current.resetContext();
      setError(null);
    } catch (err) {
      console.error("Failed to reset context:", err);
      setError(err instanceof Error ? err.message : "Failed to reset context");
    }
  }, []);

  return {
    isConnected,
    isGenerating,
    error,
    isInitialized,
    connect,
    updatePrompts,
    updateConfig,
    startGeneration,
    pauseGeneration,
    stopGeneration,
    resetContext,
  };
};
