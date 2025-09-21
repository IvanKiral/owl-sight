import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { error, success, WithError } from "shared";
import type { WebpageMetadata, WebpageResult } from "./webpageTypes.js";

export const extractArticle = (
  html: string,
  url: string
): WithError<WebpageResult, string> => {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return error("Failed to extract article content from the webpage");
    }

    const metadata: WebpageMetadata = {
      title: article.title ?? null,
      byline: article.byline ?? null,
      excerpt: article.excerpt ?? null,
      siteName: article.siteName ?? null,
      publishedTime: article.publishedTime ?? null,
    };

    const result: WebpageResult = {
      content: article.content ?? "",
      textContent: article.textContent ?? "",
      metadata,
      url,
    };

    return success(result);
  } catch (err) {
    if (err instanceof Error) {
      return error(`Failed to parse HTML: ${err.message}`);
    }
    return error("Unknown error occurred while parsing HTML");
  }
};
