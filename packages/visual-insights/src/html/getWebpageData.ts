import type { WebpageOptions, WebpageDataResult } from "./webpageTypes.js";
import { getWebpageContent } from "./getWebpageContent.js";
import { extractArticle } from "./extractArticle.js";

export const getWebpageData = async (
  url: string,
  options?: WebpageOptions
): Promise<WebpageDataResult> => {
  const contentResult = await getWebpageContent(url, options);
  
  if (!contentResult.success) {
    return contentResult;
  }

  return extractArticle(contentResult.result, url);
};