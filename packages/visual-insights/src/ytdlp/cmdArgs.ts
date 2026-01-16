import type { AudioFormat, AudioQuality, FormatSelection } from "./ytdlpAudioTypes.js";
import type { MergeOutputFormat, VideoQualityOptions } from "./ytdlpVideoTypes.js";

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

export type SupportedBrowser = (typeof SUPPORTED_BROWSERS)[number];

// Keyring options for Linux Chromium decryption
export const KEYRINGS = ["basictext", "gnomekeyring", "kwallet", "kwallet5", "kwallet6"] as const;

export type Keyring = (typeof KEYRINGS)[number];

export type TimeRange = {
  readonly start?: number;
  readonly end?: number;
};

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

export type VideoExtractionArgs = CommonExtractionArgs & {
  quality?: VideoQualityOptions;
  format?: string;
  mergeOutputFormat?: MergeOutputFormat;
  downloadSection?: TimeRange;
};

const createCookieArgs = (cookies?: CookieConfig): ReadonlyArray<string> => {
  if (!cookies) {
    return [];
  }

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

    ...(options.verbose !== undefined ? ["--verbose", options.verbose ? "True" : "False"] : []),
    ...(options.quiet ? ["--quiet"] : []),

    ...(options.writeInfoJson ? ["--write-info-json"] : []),

    ...createCookieArgs(options.cookies),

    "-o",
    options.outputPath,
  ];
};

export const buildVideoFormatString = (quality: VideoQualityOptions): string => {
  const height = quality.maxHeight ?? 1080;
  const fps = quality.maxFps ?? 30;
  const vcodec = quality.preferredVideoCodec ?? "av01";
  const acodec = quality.preferredAudioCodec ?? "opus";

  const fallbackCodec = vcodec === "av01" ? "vp9" : "av01";

  // Format selection with fallback priority (left to right):
  // 1. Preferred codec video-only stream
  // 2. Fallback codec video + preferred audio codec
  // 3. Any best available format
  return [
    `bv*[height<=${height}][fps<=${fps}][vcodec^=${vcodec}]+ba`,
    `bv*[height<=${height}][fps<=${fps}][vcodec^=${fallbackCodec}]+ba[acodec^=${acodec}]`,
    "best",
  ].join("/");
};

const createDownloadSectionArg = (section?: TimeRange): ReadonlyArray<string> => {
  if (!section) {
    return [];
  }
  const start = section.start ?? 0;
  const end = section.end ?? "inf";
  return ["--download-sections", `*${start}-${end}`];
};

export const createYtDlpExtractVideoArgs = (
  options: VideoExtractionArgs,
): ReadonlyArray<string> => {
  const formatString = options.format ?? buildVideoFormatString(options.quality ?? {});

  return [
    "-f",
    formatString,
    "--merge-output-format",
    options.mergeOutputFormat ?? "mp4",

    "--restrict-filenames",
    "--no-playlist",

    ...createDownloadSectionArg(options.downloadSection),

    ...(options.verbose !== undefined ? ["--verbose", options.verbose ? "True" : "False"] : []),
    ...(options.quiet ? ["--quiet"] : []),

    ...(options.writeInfoJson ? ["--write-info-json"] : []),

    ...createCookieArgs(options.cookies),

    "-o",
    options.outputPath,
  ];
};
