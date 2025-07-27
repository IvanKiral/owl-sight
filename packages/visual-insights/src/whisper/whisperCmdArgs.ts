import { WhisperOptions } from "./whisperTypes.js";

export const createWhisperArgs = (
  options: WhisperOptions,
): ReadonlyArray<string> => {
  return [
    options.audioPath,
    ...(options.model ? ["--model", options.model] : []),
    ...(options.language ? ["--language", options.language] : []),
    ...(options.outputFormat ? ["--output_format", options.outputFormat] : []),
    ...(options.outputDir ? ["--output_dir", options.outputDir] : []),
    ...(options.task ? ["--task", options.task] : []),
    ...(options.device ? ["--device", options.device] : []),
    ...(options.wordTimestamps !== undefined
      ? ["--word_timestamps", options.wordTimestamps.toString()]
      : []),
    ...(options.temperature !== undefined
      ? ["--temperature", options.temperature.toString()]
      : []),
    ...(options.beamSize !== undefined
      ? ["--beam_size", options.beamSize.toString()]
      : []),
    ...(options.bestOf !== undefined
      ? ["--best_of", options.bestOf.toString()]
      : []),
    ...(options.threads !== undefined
      ? ["--threads", options.threads.toString()]
      : []),
    ...(options.fp16 !== undefined ? ["--fp16", options.fp16.toString()] : []),
    ...(options.verbose !== undefined
      ? ["--verbose", options.verbose.toString()]
      : []),
    ...(options.compressionRatioThreshold !== undefined
      ? [
          "--compression_ratio_threshold",
          options.compressionRatioThreshold.toString(),
        ]
      : []),
    ...(options.logprobThreshold !== undefined
      ? ["--logprob_threshold", options.logprobThreshold.toString()]
      : []),
    ...(options.noSpeechThreshold !== undefined
      ? ["--no_speech_threshold", options.noSpeechThreshold.toString()]
      : []),
    ...(options.initialPrompt
      ? ["--initial_prompt", options.initialPrompt]
      : []),
    ...(options.conditionOnPreviousText !== undefined
      ? [
          "--condition_on_previous_text",
          options.conditionOnPreviousText.toString(),
        ]
      : []),
  ];
};
