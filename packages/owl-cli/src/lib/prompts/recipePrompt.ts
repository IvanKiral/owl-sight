import type { WhisperLanguageName } from "visual-insights";
import type { OutputFormat } from "../constants/output.js";

export type RecipePromptData =
  | {
      description: string;
      transcribedText: string;
    }
  | {
      webpageContent: string;
      articleTitle: string | null;
    };

export const createRecipePrompt = (options: {
  data: RecipePromptData;
  language: WhisperLanguageName;
  schema: string;
  format: OutputFormat;
}): string => {
  return `Analyze the following recipe information and extract it into a structured ${
    options.format
  } format.

Data:
${JSON.stringify(options.data, null, 2)}

If any information is not available, use null for that field.
Focus on extracting clear, actionable recipe information.
Return only valid ${options.format}, no additional text or formatting.
Please translate it to ${options.language} language.

Please extract and structure this information into ${
    options.format
  } with the strictly following format. Add only values specified in the schema:
${options.schema}
`;
};

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
