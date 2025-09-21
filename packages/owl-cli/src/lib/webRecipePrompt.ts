import type { WhisperLanguage } from "visual-insights";

export const createWebRecipePrompt = (options: {
  webpageContent: string;
  title: string | null;
  language: WhisperLanguage;
  schema: string;
}): string => {
  return `Analyze the following webpage content and extract recipe information into a structured JSON format.

${options.title ? `Article Title: ${options.title}\n` : ""}
Article Content:
${options.webpageContent}

Please extract and structure this information into JSON with the strictly following format. Add only values specified in the schema:
${options.schema}

Instructions:
- Extract only recipe-related information from the article
- If any information is not available, use null for that field
- Focus on extracting clear, actionable recipe information
- Ignore any non-recipe content like ads, navigation, or author stories
- Return only valid JSON, no additional text or formatting
- CRITICAL: translate the recipe to ${options.language} language`;
};
