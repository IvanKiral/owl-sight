// biome-ignore lint/performance/noBarrelFile: We use barrel files to export multiple functions from the same file

// lib exports
export { callGemini } from "./lib/gemini/gemini.js";
export {
  deserializeGeminiResponse,
  addUrlToResponse,
  stripMarkdownCodeFences,
  type OutputFormat,
  type DeserializedGeminiOutput,
} from "./lib/gemini/responseUtils.js";

export {
  createRecipePrompt,
  markdownDescriptionInstruction,
  type RecipePromptData,
} from "./lib/prompts/recipePrompt.js";

export {
  createCookieConfig,
  type CookieConfigOptions,
} from "./lib/config/cookieConfig.js";

// features exports
export {
  recipeFromVideo,
  type RecipeFromVideoOptions,
  type RecipeResult,
} from "./features/recipe/fromVideo.js";
