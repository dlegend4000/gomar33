/**
 * Lyria Music Helper
 * Manages Lyria RealTime music session with voice command integration
 */

import { GoogleGenAI } from "@google/genai";
import type { WeightedPrompt, MusicConfig } from "./musicLogic";
import { decode, decodeAudioData } from "./lyriaAudio";

export type PlaybackState = "stopped" | "playing" | "loading" | "paused";

interface LyriaAudioChunk {
	data: string;
}

interface LyriaFilteredPrompt {
	text?: string;
	filteredReason?: string;
}

interface LyriaServerMessage {
	setupComplete?: boolean;
	filteredPrompt?: LyriaFilteredPrompt;
	serverContent?: {
		audioChunks?: LyriaAudioChunk[];
	};
}

export class LyriaMusicHelper extends EventTarget {
	private apiKey: string;
	private session: any | null = null;
	private sessionPromise: Promise<any> | null = null;

	private connectionError = true;
	private filteredPrompts = new Set<string>();
	private nextStartTime = 0;
	private bufferTime = 2;

	public readonly audioContext: AudioContext;
	private outputNode: GainNode;
	private playbackState: PlaybackState = "stopped";

	private currentPrompts: WeightedPrompt[] = [];
	private currentConfig: MusicConfig = {};
	private playbackStartTime: number = 0;
	private totalPlaybackTime: number = 0;
	private timeUpdateInterval: number | null = null;

	constructor(apiKey: string) {
		super();
		this.apiKey = apiKey;
		this.audioContext = new AudioContext({ sampleRate: 48000 });
		this.outputNode = this.audioContext.createGain();
	}

	private async getSession(): Promise<any> {
		if (!this.sessionPromise) this.sessionPromise = this.connect();
		return this.sessionPromise;
	}

	private async connect(): Promise<any> {
		const genAI = new GoogleGenAI({ apiKey: this.apiKey, apiVersion: 'v1alpha' });

		this.sessionPromise = genAI.live.music.connect({
			model: "lyria-realtime-exp",
			callbacks: {
				onmessage: async (e: any) => {
					// Handle setup complete
					if (e.setupComplete) {
						this.connectionError = false;
					}
					// Handle filtered prompts
					if (e.filteredPrompt) {
						const filteredText = e.filteredPrompt.text || "";
						this.filteredPrompts.add(filteredText);
						this.dispatchEvent(
							new CustomEvent("filtered-prompt", { detail: e.filteredPrompt })
						);
					}
					// Handle audio chunks
					if (e.serverContent?.audioChunks) {
						await this.processAudioChunks(e.serverContent.audioChunks);
					}
				},
				onerror: () => {
					this.connectionError = true;
					this.stop();
					this.dispatchEvent(
						new CustomEvent("error", {
							detail: "Connection error, please restart audio.",
						})
					);
				},
				onclose: () => {
					this.connectionError = true;
					this.stop();
					this.dispatchEvent(
						new CustomEvent("error", {
							detail: "Connection closed, please restart audio.",
						})
					);
				},
			},
		});

		return this.sessionPromise;
	}

	private setPlaybackState(state: PlaybackState) {
		this.playbackState = state;
		this.dispatchEvent(
			new CustomEvent("playback-state-changed", { detail: state })
		);

		// Track playback time
		if (state === "playing") {
			if (this.playbackStartTime === 0) {
				this.playbackStartTime = this.audioContext.currentTime;
			}
			this.startTimeTracking();
		} else if (state === "paused") {
			if (this.playbackStartTime > 0) {
				this.totalPlaybackTime += this.audioContext.currentTime - this.playbackStartTime;
				this.playbackStartTime = 0;
			}
			this.stopTimeTracking();
		} else if (state === "stopped") {
			this.totalPlaybackTime = 0;
			this.playbackStartTime = 0;
			this.stopTimeTracking();
		}
	}

	private startTimeTracking() {
		if (this.timeUpdateInterval) return;
		
		this.timeUpdateInterval = window.setInterval(() => {
			if (this.playbackState === "playing" && this.playbackStartTime > 0) {
				const currentTime = this.totalPlaybackTime + (this.audioContext.currentTime - this.playbackStartTime);
				this.dispatchEvent(
					new CustomEvent("playback-time-updated", { detail: currentTime })
				);
			}
		}, 100); // Update every 100ms
	}

	private stopTimeTracking() {
		if (this.timeUpdateInterval) {
			clearInterval(this.timeUpdateInterval);
			this.timeUpdateInterval = null;
		}
	}

	public getCurrentTime(): number {
		if (this.playbackState === "playing" && this.playbackStartTime > 0) {
			return this.totalPlaybackTime + (this.audioContext.currentTime - this.playbackStartTime);
		}
		return this.totalPlaybackTime;
	}

	private async processAudioChunks(audioChunks: LyriaAudioChunk[]) {
		if (this.playbackState === "paused" || this.playbackState === "stopped")
			return;

		const audioBuffer = await decodeAudioData(
			decode(audioChunks[0].data),
			this.audioContext,
			48000,
			2
		);

		const source = this.audioContext.createBufferSource();
		source.buffer = audioBuffer;
		source.connect(this.outputNode);

		if (this.nextStartTime === 0) {
			this.nextStartTime = this.audioContext.currentTime + this.bufferTime;
			setTimeout(() => {
				this.setPlaybackState("playing");
			}, this.bufferTime * 1000);
		}

		if (this.nextStartTime < this.audioContext.currentTime) {
			this.setPlaybackState("loading");
			this.nextStartTime = 0;
			return;
		}

		source.start(this.nextStartTime);
		this.nextStartTime += audioBuffer.duration;
	}

	public async setWeightedPrompts(
		prompts: WeightedPrompt[],
		config?: MusicConfig
	) {
		// Validate prompts first
		if (!prompts || prompts.length === 0) {
			this.dispatchEvent(
				new CustomEvent("error", {
					detail: "No prompts provided. Please provide at least one prompt.",
				})
			);
			return;
		}

		// Preserve current playback state and time tracking before updating prompts
		const wasPlaying = this.playbackState === "playing";
		const wasPaused = this.playbackState === "paused";
		// Preserve time tracking state - don't let it reset during modification
		// If we're playing, save the current time to ensure continuity
		const timeBeforeUpdate = wasPlaying ? this.getCurrentTime() : 0;
		const hadActiveTimeTracking = wasPlaying && this.playbackStartTime > 0;

		this.currentPrompts = prompts;
		if (config) {
			this.currentConfig = { ...this.currentConfig, ...config };
		}

		// Filter out prompts with weight 0 and filtered prompts
		const activePrompts = prompts.filter(
			(p) => !this.filteredPrompts.has(p.text) && p.weight !== 0
		);

		if (activePrompts.length === 0) {
			this.dispatchEvent(
				new CustomEvent("error", {
					detail: "There needs to be at least one active prompt to play. All prompts were filtered or have weight 0.",
				})
			);
			this.pause();
			return;
		}

		// Check if session exists and is valid, or if there was a connection error
		// If session is null or connection had an error, create a new session
		if (!this.session || this.connectionError) {
			// Reset session state before creating new connection
			this.session = null;
			this.sessionPromise = null;
			this.connectionError = false;
			this.session = await this.getSession();
		}

		try {
			const requestParams: any = {
				weightedPrompts: activePrompts.map((p) => ({
					text: p.text,
					weight: p.weight,
				})),
			};

			// Add config parameters if specified
			if (config?.bpm) requestParams.bpm = config.bpm;
			if (config?.density !== undefined) requestParams.density = config.density;
			if (config?.brightness !== undefined)
				requestParams.brightness = config.brightness;
			if (config?.temperature !== undefined)
				requestParams.temperature = config.temperature;
			if (config?.scale) requestParams.scale = config.scale;

			// IMPORTANT: Don't change playback state during async operation
			// This ensures time tracking continues uninterrupted
			try {
				await this.session.setWeightedPrompts(requestParams);
			} catch (wsError: any) {
				// If WebSocket is closed or in invalid state, reset and retry once
				if (wsError.message?.includes("CLOSING") || wsError.message?.includes("CLOSED") || 
				    wsError.message?.includes("WebSocket") || this.connectionError) {
					console.warn("⚠️ WebSocket error, resetting connection:", wsError.message);
					// Reset session and try again
					this.session = null;
					this.sessionPromise = null;
					this.connectionError = false;
					this.session = await this.getSession();
					// Retry once
					await this.session.setWeightedPrompts(requestParams);
				} else {
					// Re-throw if it's a different error
					throw wsError;
				}
			}
			
			// Restore playback state and time tracking if it was playing before
			// This ensures the timer continues counting without interruption
			if (wasPlaying) {
				// If time tracking was interrupted (state changed or startTime reset), restore it
				if (this.playbackStartTime === 0 && hadActiveTimeTracking) {
					// Time tracking was stopped during the async operation, restore it
					// Calculate elapsed time during the operation
					const elapsedTime = this.audioContext.currentTime - (this.totalPlaybackTime > 0 ? this.totalPlaybackTime : 0);
					this.totalPlaybackTime = timeBeforeUpdate;
					this.playbackStartTime = this.audioContext.currentTime;
				} else if (this.playbackStartTime === 0 && this.totalPlaybackTime === 0) {
					// No time tracking at all, start from preserved time
					this.totalPlaybackTime = timeBeforeUpdate;
					this.playbackStartTime = this.audioContext.currentTime;
				}
				// If playbackStartTime > 0, time tracking is still active, no need to change
				
				// CRITICAL: Ensure state is "playing" and time tracking is active
				// This ensures the timer continues counting
				if (this.playbackState !== "playing") {
					// State changed during async operation, restore it
					this.setPlaybackState("playing");
				} else {
					// State is still playing, just ensure time tracking interval is running
					this.startTimeTracking();
				}
			} else if (wasPaused && this.playbackState !== "paused") {
				// If we were paused, ensure we stay paused
				this.setPlaybackState("paused");
			}
		} catch (e: any) {
			this.dispatchEvent(
				new CustomEvent("error", { detail: e.message || "Failed to set prompts" })
			);
			this.pause();
		}
	}

	public async play() {
		this.setPlaybackState("loading");
		
		// Connect session if not already connected or if there was a connection error
		if (!this.session || this.connectionError) {
			// Reset session state before creating new connection
			this.session = null;
			this.sessionPromise = null;
			this.connectionError = false;
			this.session = await this.getSession();
		}

		// Note: Prompts should be set before calling play() via setWeightedPrompts()
		// This method just starts playback after session is connected

		this.audioContext.resume();
		try {
			this.session.play();
		} catch (wsError: any) {
			// If WebSocket is closed, reset and retry
			if (wsError.message?.includes("CLOSING") || wsError.message?.includes("CLOSED") || 
			    wsError.message?.includes("WebSocket")) {
				console.warn("⚠️ WebSocket error on play(), resetting connection:", wsError.message);
				this.session = null;
				this.sessionPromise = null;
				this.connectionError = false;
				this.session = await this.getSession();
				this.session.play();
			} else {
				throw wsError;
			}
		}
		this.outputNode.connect(this.audioContext.destination);
		this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
		this.outputNode.gain.linearRampToValueAtTime(
			1,
			this.audioContext.currentTime + 0.1
		);
	}

	public pause() {
		if (this.session) {
			try {
				this.session.pause();
			} catch (wsError: any) {
				// Ignore WebSocket errors when pausing - connection might already be closed
				if (!wsError.message?.includes("CLOSING") && !wsError.message?.includes("CLOSED")) {
					console.warn("⚠️ Error pausing session:", wsError.message);
				}
			}
		}
		this.setPlaybackState("paused");
		this.outputNode.gain.setValueAtTime(1, this.audioContext.currentTime);
		this.outputNode.gain.linearRampToValueAtTime(
			0,
			this.audioContext.currentTime + 0.1
		);
		this.nextStartTime = 0;
		this.outputNode = this.audioContext.createGain();
	}

	public stop() {
		if (this.session) {
			try {
				this.session.stop();
			} catch (wsError: any) {
				// Ignore WebSocket errors when stopping - connection might already be closed
				if (!wsError.message?.includes("CLOSING") && !wsError.message?.includes("CLOSED")) {
					console.warn("⚠️ Error stopping session:", wsError.message);
				}
			}
		}
		this.setPlaybackState("stopped");
		this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
		this.outputNode.gain.linearRampToValueAtTime(
			1,
			this.audioContext.currentTime + 0.1
		);
		this.nextStartTime = 0;
		this.session = null;
		this.sessionPromise = null;
		this.connectionError = false;
		this.totalPlaybackTime = 0;
		this.playbackStartTime = 0;
		this.stopTimeTracking();
	}

	public async playPause() {
		switch (this.playbackState) {
			case "playing":
				return this.pause();
			case "paused":
			case "stopped":
				return this.play();
			case "loading":
				return this.stop();
		}
	}

	public getPlaybackState(): PlaybackState {
		return this.playbackState;
	}
}
