import type { WhisperLanguageName } from "visual-insights";
import type { OutputFormat } from "../gemini/responseUtils.js";

export type RecipePromptData =
  | {
      description: string;
      transcribedText: string;
      filename?: string;
    }
  | {
      webpageContent: string;
      articleTitle: string | null;
    };

export const AUTO_RECIPE_LANGUAGE = "auto";

export type RecipeLanguage = WhisperLanguageName | typeof AUTO_RECIPE_LANGUAGE;

const buildLanguageInstruction = (language: RecipeLanguage): string =>
  language === AUTO_RECIPE_LANGUAGE
    ? "Detect the language of the source recipe. If it is Czech, write the entire recipe in Czech; otherwise write the entire recipe in Slovak. Use natural phrasing in the chosen language; preserve meaning, tone, and intent, not literal wording."
    : `Translate it to ${language} language. Translate with natural phrasing in the target language. Preserve meaning, tone, and intent, not literal wording`;

export const createRecipePrompt = (options: {
  data: RecipePromptData;
  language: RecipeLanguage;
  schema: string;
  format: OutputFormat;
}): string =>
  `Analyze the following recipe information and extract it into a structured ${options.format} format.

Data:
${JSON.stringify(options.data, null, 2)}

If any information is not available, use null for that field.
Focus on extracting clear, actionable recipe information.
Return only valid ${options.format}, no additional text or formatting.
${buildLanguageInstruction(options.language)}
${"filename" in options.data && options.data.filename ? `The source filename is "${options.data.filename}" - if it makes sense, use this as a hint for the recipe title and component names.` : ""}
Extract and structure this information into ${options.format} with the strictly following format. Add only values specified in the schema:
${options.schema}
`;

export const markdownDescriptionInstruction = `Format the recipe description field as markdown with the following structure:

# [Recipe Name]

## Overview
Brief description of the dish (1-2 sentences)

## Key Information
- **Prep Time:** X minutes
- **Cook Time:** X minutes
- **Total Time:** X minutes
- **Servings:** X
- **Difficulty:** Easy/Medium/Hard
- **Cuisine:** [Type]

## Ingredients
### Main Ingredients
- ingredient 1
- ingredient 2
- ingredient 3

### Optional/Garnish
- optional ingredient 1
- optional ingredient 2

## Instructions
1. First step with clear action
2. Second step with temperature/time details
3. Continue with numbered steps
4. Final step and serving suggestion

## Tips & Notes
- Any special techniques or substitutions
- Storage instructions
- Serving suggestions`;
