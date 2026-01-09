import { describe, expect, it } from "vitest";
import { createWhisperArgs } from "../../src/whisper/whisperCmdArgs.js";
import type { WhisperOptions } from "../../src/whisper/whisperTypes.js";
import {
	type AudioExtractionArgs,
	createYtDlpExtractAudioArgs,
} from "../../src/ytdlp/cmdArgs.js";

describe("Command Arguments Creation", () => {
	describe("createWhisperArgs", () => {
		it("should create minimal args with only required audioPath", () => {
			const options: WhisperOptions = {
				audioPath: "/path/to/audio.m4a",
			};

			const result = createWhisperArgs(options);

			expect(result).toEqual(["/path/to/audio.m4a"]);
		});

		it("should create comprehensive args with all optional parameters and edge cases", () => {
			const options: WhisperOptions = {
				audioPath: "/path/to/complex audio file.wav",
				model: "large-v3",
				language: "en",
				outputFormat: "json",
				outputDir: "/output/directory",
				task: "translate",
				device: "cuda",
				wordTimestamps: true,
				temperature: 0.0,
				beamSize: 5,
				bestOf: 3,
				threads: 8,
				fp16: false,
				verbose: true,
				compressionRatioThreshold: 2.4,
				logprobThreshold: -1.0,
				noSpeechThreshold: 0.6,
				initialPrompt: "This is a test prompt with special chars: !@#$%",
				conditionOnPreviousText: false,
			};

			const result = createWhisperArgs(options);

			expect(result).toEqual([
				"/path/to/complex audio file.wav",
				"--model",
				"large-v3",
				"--language",
				"en",
				"--output_format",
				"json",
				"--output_dir",
				"/output/directory",
				"--task",
				"translate",
				"--device",
				"cuda",
				"--word_timestamps",
				"true",
				"--temperature",
				"0",
				"--beam_size",
				"5",
				"--best_of",
				"3",
				"--threads",
				"8",
				"--fp16",
				"false",
				"--verbose",
				"true",
				"--compression_ratio_threshold",
				"2.4",
				"--logprob_threshold",
				"-1",
				"--no_speech_threshold",
				"0.6",
				"--initial_prompt",
				"This is a test prompt with special chars: !@#$%",
				"--condition_on_previous_text",
				"false",
			]);
		});
	});

	describe("createYtDlpExtractAudioArgs", () => {
		it("should create minimal args with only required outputPath", () => {
			const options: AudioExtractionArgs = {
				outputPath: "/path/to/output.m4a",
			};

			const result = createYtDlpExtractAudioArgs(options);

			expect(result).toEqual([
				"--extract-audio",
				"--restrict-filenames",
				"--no-playlist",
				"-o",
				"/path/to/output.m4a",
			]);
		});

		it("should create comprehensive args with all options and edge cases", () => {
			const options: AudioExtractionArgs = {
				outputPath: "/complex path/with spaces/audio file.%(ext)s",
				format: "bestaudio[abr>=128]",
				audioFormat: "mp3",
				audioQuality: 320,
				writeInfoJson: true,
				verbose: true,
				quiet: false,
			};

			const result = createYtDlpExtractAudioArgs(options);

			expect(result).toEqual([
				"--extract-audio",
				"-f",
				"bestaudio[abr>=128]",
				"--audio-format",
				"mp3",
				"--audio-quality",
				"320",
				"--restrict-filenames",
				"--no-playlist",
				"--verbose",
				"True",
				"--write-info-json",
				"-o",
				"/complex path/with spaces/audio file.%(ext)s",
			]);
		});
	});
});
