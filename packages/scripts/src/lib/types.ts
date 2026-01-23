import type { TimeRange, WhisperLanguage, WhisperLanguageName } from "visual-insights";

export type VideoConfig = {
  readonly url: string;
  readonly filename?: string;
  readonly videoLanguage?: WhisperLanguage;
  readonly outputLanguage: WhisperLanguageName;
  readonly timeRange?: TimeRange;
};

export type ProcessingResult = {
  readonly successful: number;
  readonly failed: number;
  readonly errors: ReadonlyArray<ProcessingError>;
};

export type ProcessingError = {
  readonly url: string;
  readonly error: string;
};
