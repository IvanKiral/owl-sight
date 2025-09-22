import type { WhisperLanguageName } from "visual-insights";

export const createRecipePrompt = (options: {
  description: string;
  transcribedText: string;
  language: WhisperLanguageName;
  schema: string;
}): string => {
  return `Analyze the following recipe information and extract it into a structured JSON format.

Video Description:
${options.description}

Transcribed Audio:
${options.transcribedText}

Please extract and structure this information into JSON with the strictly following format. Add only values specified in the schema:
${options.schema}

If any information is not available, use null for that field.
Focus on extracting clear, actionable recipe information.
Return only valid JSON, no additional text or formatting.
Please translate it to ${options.language} language.`;
};
