import type { WhisperLanguageName } from "visual-insights";

export type SummaryPromptData =
  | {
      description: string;
      transcribedText: string;
    }
  | {
      webpageContent: string;
      articleTitle: string | null;
    };

export const createSummaryPrompt = (options: {
  data: SummaryPromptData;
  language: WhisperLanguageName;
  customPrompt?: string;
}): string => {
  const dataSection = `Data:
${JSON.stringify(options.data, null, 2)}`;

  return options.customPrompt
    ? `${options.customPrompt}

    Please translate the entire text to ${options.language} language.
${dataSection}`
    : `Analyze the following content and create a comprehensive notes in markdown format.

${dataSection}

Please create a well-structured notes following this markdown format:

# [Title/Topic]

## Overview
Provide a brief 2-3 sentence notes of the main content.

## Detailed Notes
Write a comprehensive narrative notes organized by topics or sections. Include:
- Main themes and concepts
- Important details and context
- Connections between different ideas
- Notable examples or case studies

## Action Items
- Practical takeaways or lessons learned
- Recommended next steps (if applicable)
- Don't store unnecesary things like **Engagement:** Save the video for later reference and follow the creator for more tips.

## Resources
- All resources recommended (urls, apps, reosources, books ...) or topics to explore (if mentioned) in a list

Please translate the entire text to ${options.language} language.
Return only the markdown content, no additional text or formatting markers.`;
};
