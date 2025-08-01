import type {
  AudioFormat,
  AudioQuality,
  FormatSelection,
} from "./ytdlpAudioTypes.js";

// Supported browsers for cookie extraction
export const SUPPORTED_BROWSERS = [
  "brave",
  "chrome",
  "chromium",
  "edge",
  "firefox",
  "opera",
  "safari",
  "vivaldi",
  "whale",
] as const;

export type SupportedBrowser = typeof SUPPORTED_BROWSERS[number];

// Keyring options for Linux Chromium decryption
export const KEYRINGS = [
  "basictext",
  "gnomekeyring",
  "kwallet",
  "kwallet5",
  "kwallet6",
] as const;

export type Keyring = typeof KEYRINGS[number];

// Cookie configuration options
export type CookieConfig =
  | {
      type: "browser";
      browser: SupportedBrowser;
      profile?: string;
      keyring?: Keyring;
    }
  | { type: "file"; path: string }
  | undefined;

// Common options that can be shared between audio and video extraction
export type CommonExtractionArgs = {
  outputPath: string;
  writeInfoJson?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  cookies?: CookieConfig;
};

export type AudioExtractionArgs = CommonExtractionArgs & {
  audioFormat?: AudioFormat;
  audioQuality?: AudioQuality;
  format?: FormatSelection;
};

const createCookieArgs = (cookies?: CookieConfig): ReadonlyArray<string> => {
  if (!cookies) return [];

  if (cookies.type === "file") {
    return ["--cookies", cookies.path];
  }

  const { browser, keyring, profile } = cookies;
  const browserSpec = `${browser}${keyring ? `+${keyring}` : ""}${profile ? `:${profile}` : ""}`;

  return ["--cookies-from-browser", browserSpec];
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

    // Cookie arguments
    ...createCookieArgs(options.cookies),

    // Output path (required)
    "-o",
    options.outputPath,
  ];
};
