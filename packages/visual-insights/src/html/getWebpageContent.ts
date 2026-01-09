import { error, success, type WithError } from "shared";
import type { WebpageOptions } from "./webpageTypes.js";

export const getWebpageContent = async (
  url: string,
  options?: WebpageOptions,
): Promise<WithError<string, string>> => {
  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      ...options?.headers,
    };

    const controller = new AbortController();
    const timeout = options?.timeout ?? 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("text/html")) {
      return error(`Expected HTML content, got: ${contentType}`);
    }

    const html = await response.text();
    return success(html);
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        return error("Request timeout");
      }
      return error(err.message);
    }
    return error("Unknown error occurred");
  }
};
