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
				onmessage: async (e: LyriaServerMessage) => {
					if (e.setupComplete) {
						this.connectionError = false;
					}
					if (e.filteredPrompt) {
						this.filteredPrompts.add(e.filteredPrompt.text || "");
						this.dispatchEvent(
							new CustomEvent("filtered-prompt", { detail: e.filteredPrompt })
						);
					}
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
					detail: "There needs to be at least one active prompt to play.",
				})
			);
			this.pause();
			return;
		}

		// Don't send if we haven't connected yet
		if (!this.session) return;

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

			await this.session.setWeightedPrompts(requestParams);
		} catch (e: any) {
			this.dispatchEvent(
				new CustomEvent("error", { detail: e.message || "Failed to set prompts" })
			);
			this.pause();
		}
	}

	public async play() {
		this.setPlaybackState("loading");
		this.session = await this.getSession();

		// Set initial prompts and config
		if (this.currentPrompts.length > 0) {
			await this.setWeightedPrompts(this.currentPrompts, this.currentConfig);
		}

		this.audioContext.resume();
		this.session.play();
		this.outputNode.connect(this.audioContext.destination);
		this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
		this.outputNode.gain.linearRampToValueAtTime(
			1,
			this.audioContext.currentTime + 0.1
		);
	}

	public pause() {
		if (this.session) this.session.pause();
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
		if (this.session) this.session.stop();
		this.setPlaybackState("stopped");
		this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
		this.outputNode.gain.linearRampToValueAtTime(
			1,
			this.audioContext.currentTime + 0.1
		);
		this.nextStartTime = 0;
		this.session = null;
		this.sessionPromise = null;
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
