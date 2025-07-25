import type {
  AudioFormat,
  AudioQuality,
  FormatSelection,
} from "./ytdlpAudioTypes.js";

export type AudioExtractionArgs = {
  audioFormat?: AudioFormat;
  audioQuality?: AudioQuality;
  format?: FormatSelection;
  outputPath: string;
  writeInfoJson?: boolean;
  verbose?: boolean;
  quiet?: boolean;
};

export const createYtDlpExtractAudioArgs = (
  options: AudioExtractionArgs,
): ReadonlyArray<string> => {
  return [
    // Always extract audio
    "--extract-audio",
    ...(options.format ? ["-f", options.format] : []),
    ...(options.audioFormat ? ["--audio-format", options.audioFormat] : []),
    ...(options.audioQuality !== undefined
      ? ["--audio-quality", options.audioQuality.toString()]
      : []),

    "--restrict-filenames",
    "--no-playlist",

    ...(options.verbose !== undefined
      ? ["--verbose", options.verbose ? "True" : "False"]
      : []),
    ...(options.quiet ? ["--quiet"] : []),

    ...(options.writeInfoJson ? ["--write-info-json"] : []),

    // Output path (required)
    "-o",
    options.outputPath,
  ];
};

// Default args matching the original hardcoded values
export const createDefaultAudioArgs = (
  outputPath: string,
): ReadonlyArray<string> => {
  return createYtDlpExtractAudioArgs({
    format: "bestaudio/best",
    audioFormat: "m4a",
    audioQuality: 0,
    verbose: false,
    outputPath,
  });
};
