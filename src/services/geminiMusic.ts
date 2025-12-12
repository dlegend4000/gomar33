import { GoogleGenAI } from "@google/genai";

export interface MusicGenerationConfig {
  bpm?: number;
  temperature?: number;
  density?: number;
  brightness?: number;
  guidance?: number;
  audioFormat?: string;
  sampleRateHz?: number;
}

export interface WeightedPrompt {
  text: string;
  weight: number;
}

export class GeminiMusicService {
  private client: GoogleGenAI;
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying: boolean = false;
  private nextStartTime: number = 0;
  private gainNode: GainNode | null = null;
  private sessionClosed: boolean = false;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({
      apiKey,
      apiVersion: "v1alpha",
    });
  }

  async ensureConnected() {
    // If session is closed or null, reconnect
    if (!this.session || this.sessionClosed) {
      console.log("Session closed or null, reconnecting...");
      this.sessionClosed = false;
      this.session = null; // Clear old session
      await this.connect();
    }
  }

  async connect() {
    // Don't reconnect if already connected and not closed
    if (this.session && !this.sessionClosed) {
      console.log("Already connected and session is active");
      return;
    }

    this.sessionClosed = false;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log("AudioContext created, state:", this.audioContext.state);

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0; // Full volume
      this.gainNode.connect(this.audioContext.destination);
      console.log("Gain node created and connected");
    }

    // Resume audio context if suspended (needed for Chrome autoplay policy)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
      console.log("AudioContext resumed, new state:", this.audioContext.state);
    }

    // Debug: Check what's available in the client
    console.log("Client object:", this.client);
    console.log("Client keys:", Object.keys(this.client));

    if (!(this.client as any).live) {
      console.error("client.live does NOT exist!");
      throw new Error("Live API not available in this SDK version");
    }

    console.log("✓ client.live exists");
    console.log("client.live keys:", Object.keys((this.client as any).live));

    if (!(this.client as any).live.music) {
      console.error("client.live.music does NOT exist!");
      throw new Error("Music API not available in this SDK version");
    }

    console.log("✓ client.live.music exists!");

    if (typeof (this.client as any).live.music.connect !== 'function') {
      console.error("client.live.music.connect is NOT a function!");
      throw new Error("Music connect method not available");
    }

    console.log("✓ client.live.music.connect is a function");
    console.log("\nAttempting to connect to Lyria RealTime...");

    try {
      this.session = await (this.client as any).live.music.connect({
        model: "models/lyria-realtime-exp",
        callbacks: {
          onmessage: (message: any) => {
            console.log("✓ Received message:", message);
            if (message.setupComplete) {
              console.log("✓ Setup complete!");
            }
            if (message.serverContent?.audioChunks) {
              console.log("✓ Received audio chunks:", message.serverContent.audioChunks.length);
              for (const chunk of message.serverContent.audioChunks) {
                this.handleAudioChunk(chunk.data);
              }
            }
          },
          onerror: (error: any) => {
            console.error("✗ Music session error:", error);
            console.error("Error type:", typeof error);
            console.error("Error details:", JSON.stringify(error, null, 2));
          },
          onclose: (event: any) => {
            console.log("Lyria RealTime stream closed.");
            console.log("Close event:", event);
            console.log("Close code:", event?.code);
            console.log("Close reason:", event?.reason);
            console.log("Was clean:", event?.wasClean);
            this.sessionClosed = true;
          },
        },
      });

      console.log("✓ Gemini Music session connected successfully!");
      console.log("Session object:", this.session);
    } catch (error) {
      console.error("✗ Failed to connect to Lyria:", error);
      throw error;
    }
  }

  private async handleAudioChunk(base64Data: string) {
    if (!this.audioContext) return;

    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to AudioBuffer
      // PCM16 is 16-bit signed integer, 2 channels (stereo), 48000 Hz sample rate (per Gemini docs)
      const pcm16Data = new Int16Array(bytes.buffer);
      const numSamples = pcm16Data.length / 2; // 2 channels

      // Create AudioBuffer
      const audioBuffer = this.audioContext.createBuffer(
        2,      // 2 channels (stereo)
        numSamples,
        48000   // sample rate - Gemini outputs at 48kHz
      );

      // Convert Int16 PCM to Float32 for Web Audio API
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = audioBuffer.getChannelData(1);

      for (let i = 0; i < numSamples; i++) {
        // PCM16 is interleaved: [L, R, L, R, ...]
        leftChannel[i] = pcm16Data[i * 2] / 32768.0;      // Left channel
        rightChannel[i] = pcm16Data[i * 2 + 1] / 32768.0; // Right channel
      }

      this.audioQueue.push(audioBuffer);
      console.log("Audio buffer added, queue length:", this.audioQueue.length, "duration:", audioBuffer.duration);

      // Start playback if not already playing
      if (!this.isPlaying) {
        this.playNextBuffer();
      }
    } catch (error) {
      console.error("Error decoding audio chunk:", error);
    }
  }

  private playNextBuffer() {
    if (!this.audioContext || !this.gainNode || this.audioQueue.length === 0) {
      this.isPlaying = false;
      console.log("Playback stopped, queue empty or context not ready");
      return;
    }

    // Ensure AudioContext is running
    if (this.audioContext.state === "suspended") {
      console.log("AudioContext suspended, attempting to resume...");
      this.audioContext.resume().then(() => {
        console.log("AudioContext resumed from playback");
        this.playNextBuffer(); // Retry after resume
      });
      return;
    }

    this.isPlaying = true;
    const buffer = this.audioQueue.shift()!;
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    // Schedule playback
    const currentTime = this.audioContext.currentTime;
    const startTime = Math.max(currentTime, this.nextStartTime);

    try {
      source.start(startTime);
      this.nextStartTime = startTime + buffer.duration;
      console.log("✓ Playing buffer at", startTime.toFixed(2), "duration:", buffer.duration.toFixed(2), "next at:", this.nextStartTime.toFixed(2));
    } catch (error) {
      console.error("Error starting audio source:", error);
    }

    // Schedule next buffer
    source.onended = () => {
      this.playNextBuffer();
    };
  }

  async setPrompts(prompts: WeightedPrompt[]) {
    await this.ensureConnected();

    await this.session.setWeightedPrompts({
      weightedPrompts: prompts,
    });
    console.log("Prompts updated:", prompts);
  }

  async setConfig(config: MusicGenerationConfig) {
    await this.ensureConnected();

    await this.session.setMusicGenerationConfig({
      musicGenerationConfig: {
        bpm: config.bpm ?? 120,
        temperature: config.temperature ?? 1.0,
        density: config.density,
        brightness: config.brightness,
        guidance: config.guidance ?? 4.0,
        // audioFormat and sampleRateHz are not valid fields - the API handles these automatically
      },
    });
    console.log("Config updated:", config);
  }

  async play() {
    await this.ensureConnected();

    // Ensure AudioContext is running before starting playback
    if (this.audioContext && this.audioContext.state === "suspended") {
      await this.audioContext.resume();
      console.log("AudioContext resumed before play, state:", this.audioContext.state);
    }

    await this.session.play();
    console.log("Music generation started, AudioContext state:", this.audioContext?.state);
  }

  async pause() {
    if (!this.session) {
      throw new Error("Session not connected. Call connect() first.");
    }

    await this.session.pause();
    console.log("Music generation paused");
  }

  async stop() {
    if (!this.session) {
      throw new Error("Session not connected. Call connect() first.");
    }

    // Use pause instead of stop to keep the connection alive
    await this.session.pause();
    this.audioQueue = [];
    this.isPlaying = false;
    this.nextStartTime = 0; // Reset timing
    console.log("Music generation paused (connection kept alive)");
  }

  async resetContext() {
    if (!this.session) {
      throw new Error("Session not connected. Call connect() first.");
    }

    await this.session.resetContext();
    console.log("Context reset");
  }

  async disconnect() {
    if (this.session) {
      try {
        // Just pause, don't destroy the session
        await this.session.pause();
        console.log("Gemini Music session paused (keeping connection alive)");
      } catch (error) {
        console.error("Error pausing session:", error);
      }
      // Don't set session to null - keep it alive for reuse
    }

    // Don't close AudioContext either - it can be reused
    console.log("Disconnect called (connection kept alive for reuse)");
  }

  async forceDisconnect() {
    // Use this only when you really want to close everything
    if (this.session) {
      try {
        await this.session.pause();
      } catch (error) {
        console.error("Error during force disconnect:", error);
      }
      this.session = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    console.log("Gemini Music session fully disconnected");
  }
}
