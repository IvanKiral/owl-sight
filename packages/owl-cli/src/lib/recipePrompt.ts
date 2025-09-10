import type { WhisperLanguage } from "visual-insights";

export const createRecipePrompt = (options: {
  description: string;
  transcribedText: string;
  language: WhisperLanguage;
  schema: string;
}): string => {
  return `Analyze the following recipe information and extract it into a structured JSON format.

Video Description:
${options.description}

Transcribed Audio:
${options.transcribedText}

Please extract and structure this information into JSON with the following format:
${options.schema}

If any information is not available, use null for that field.
Focus on extracting clear, actionable recipe information.
Return only valid JSON, no additional text or formatting.
Please translate it to ${options.language} language.`;
};
