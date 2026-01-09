import type { WithError } from "shared";

export type WebpageOptions = {
  headers?: Record<string, string>;
  timeout?: number;
};

export type WebpageMetadata = {
  title: string | null;
  byline: string | null;
  excerpt: string | null;
  siteName: string | null;
  publishedTime: string | null;
};

export type WebpageResult = {
  content: string;
  textContent: string;
  metadata: WebpageMetadata;
  url: string;
};

export type WebpageDataResult = WithError<WebpageResult, string>;
