import type { WhisperLanguage } from "visual-insights";

export const createRecipePrompt = (
  description: string,
  transcribedText: string,
  language: WhisperLanguage,
): string => {
  return `Analyze the following recipe information and extract it into a structured JSON format.

Video Description:
${description}

Transcribed Audio:
${transcribedText}

Please extract and structure this information into JSON with the following format:
{
    "title": "Recipe title",
    "description": "Brief description",
    "prep_time": "Preparation time",
    "cook_time": "Cooking time",
    "total_time": "Total time",
    "servings": "Number of servings",
    "ingredients": [
        {
            "name": "ingredient name",
            "amount": "quantity",
            "unit": "unit of measurement"
        }
    ],
    "instructions": [
        "Step 1 instruction",
        "Step 2 instruction"
    ],
    "tags": ["tag1", "tag2"],
    "difficulty": "easy/medium/hard",
    "cuisine": "Type of cuisine"
}

If any information is not available, use null for that field.
Focus on extracting clear, actionable recipe information.
Return only valid JSON, no additional text or formatting.
Please translate it to ${language} language.`;
};
