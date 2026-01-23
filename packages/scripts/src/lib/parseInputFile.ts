import { readFileSync } from "node:fs";
import {
  getLanguageName,
  type TimeRange,
  WHISPER_LANGUAGES,
  type WhisperLanguage,
  type WhisperLanguageName,
} from "visual-insights";
import type { VideoConfig } from "./types.js";

const isValidLanguageCode = (code: string): code is WhisperLanguage =>
  WHISPER_LANGUAGES.includes(code as WhisperLanguage);

const VALID_LANGUAGE_NAMES = new Set(WHISPER_LANGUAGES.map(getLanguageName));

const isValidLanguageName = (name: string): name is WhisperLanguageName =>
  VALID_LANGUAGE_NAMES.has(name as WhisperLanguageName);

const parseTimeRange = (rangeStr: string): TimeRange | undefined => {
  if (!rangeStr) {
    return undefined;
  }

  const parts = rangeStr.split(":");
  if (parts.length !== 2) {
    return undefined;
  }

  const [startStr, endStr] = parts;
  const start = startStr ? Number.parseInt(startStr, 10) : undefined;
  const end = endStr ? Number.parseInt(endStr, 10) : undefined;

  if ((start !== undefined && Number.isNaN(start)) || (end !== undefined && Number.isNaN(end))) {
    return undefined;
  }

  return { start, end };
};

const parseLine = (line: string, lineNumber: number): VideoConfig | { error: string } => {
  const parts = line.split(";").map((p) => p.trim());
  const [url, filename, videoLang, outputLang, range] = parts;

  if (!url) {
    return { error: `Line ${lineNumber}: Missing URL` };
  }

  const isUrl = url.startsWith("http://") || url.startsWith("https://");
  if (!isUrl) {
    return { error: `Line ${lineNumber}: Invalid URL format` };
  }

  const videoLanguage = videoLang && isValidLanguageCode(videoLang) ? videoLang : undefined;
  const outputLanguage: WhisperLanguageName =
    outputLang && isValidLanguageName(outputLang) ? outputLang : "English";

  const timeRange = range ? parseTimeRange(range) : undefined;

  return {
    url,
    filename: filename || undefined,
    videoLanguage,
    outputLanguage,
    timeRange,
  };
};

export const parseInputFile = (
  filePath: string,
): ReadonlyArray<VideoConfig | { error: string; line: number }> => {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  return lines
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => line && !line.startsWith("#"))
    .map(({ line, lineNumber }) => {
      const result = parseLine(line, lineNumber);
      if ("error" in result) {
        return { error: result.error, line: lineNumber };
      }
      return result;
    });
};

export const isVideoConfig = (
  item: VideoConfig | { error: string; line: number },
): item is VideoConfig => !("error" in item);
