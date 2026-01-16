// biome-ignore lint/performance/noBarrelFile: barrel file for public API
export {
  type ExtractType,
  extractFromVideo,
  type VideoExtractOptions,
  type VideoExtractResult,
} from "./features/extract/fromVideo.js";
export {
  type RecipeFromHtmlOptions,
  type RecipeFromVideoOptions,
  type RecipeResult,
  recipeFromHtml,
  recipeFromVideo,
} from "./features/recipe/index.js";
export {
  type SummaryFromHtmlOptions,
  type SummaryFromVideoOptions,
  type SummaryResult,
  summaryFromHtml,
  summaryFromVideo,
} from "./features/summary/index.js";
// Config
export {
  type CookieConfigOptions,
  createCookieConfig,
} from "./lib/config/cookieConfig.js";
export { callGemini } from "./lib/gemini/gemini.js";
export {
  addUrlToResponse,
  type DeserializedGeminiOutput,
  deserializeGeminiResponse,
  type OutputFormat,
  stripMarkdownCodeFences,
} from "./lib/gemini/responseUtils.js";
export {
  createRecipePrompt,
  markdownDescriptionInstruction,
  type RecipePromptData,
} from "./lib/prompts/recipePrompt.js";
export {
  createSummaryPrompt,
  type SummaryPromptData,
  type SummaryPromptHtmlData,
  type SummaryPromptOptions,
  type SummaryPromptVideoData,
} from "./lib/prompts/summaryPrompt.js";
export {
  compileRecipeSchema,
  DEFAULT_RECIPE_SCHEMA,
} from "./lib/schemas/recipeSchema.js";
