import type { WhisperLanguageName } from "visual-insights";

export type SummaryPromptVideoData = {
  readonly type: "video";
  readonly transcribedText: string;
  readonly description: string;
};

export type SummaryPromptHtmlData = {
  readonly type: "html";
  readonly webpageContent: string;
  readonly articleTitle: string | null;
};

export type SummaryPromptData = SummaryPromptVideoData | SummaryPromptHtmlData;

export type SummaryPromptOptions = {
  readonly data: SummaryPromptData;
  readonly language: WhisperLanguageName;
  readonly customPrompt?: string;
};

const formatDataSection = (data: SummaryPromptData): string => {
  const dataWithoutType =
    data.type === "video"
      ? { transcribedText: data.transcribedText, description: data.description }
      : { webpageContent: data.webpageContent, articleTitle: data.articleTitle };

  return `Data:
${JSON.stringify(dataWithoutType, null, 2)}`;
};

const defaultPromptTemplate = (dataSection: string, language: WhisperLanguageName): string =>
  `Analyze the following content and create a comprehensive notes in markdown format.

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

Please translate the entire text to ${language} language.
Return only the markdown content, no additional text or formatting markers.`;

export const createSummaryPrompt = (options: SummaryPromptOptions): string => {
  const dataSection = formatDataSection(options.data);

  return options.customPrompt
    ? `${options.customPrompt}

    Please translate the entire text to ${options.language} language.
${dataSection}`
    : defaultPromptTemplate(dataSection, options.language);
};
