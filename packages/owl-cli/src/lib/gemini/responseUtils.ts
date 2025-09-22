export const stripMarkdownCodeFences = (text: string): string => {
  return text.trim().replace("```json", "").replace("```", "");
};
