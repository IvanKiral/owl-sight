import prompts from "prompts";
import { type WithError, success, error } from "shared";

export const getGeminiApiKey = async (): Promise<WithError<string, string>> => {
  // 1. Check environment variable
  const envKey = process.env.OWL_RECIPE_GEMINI_API_KEY;
  if (envKey) {
    return success(envKey);
  }

  // 2. Interactive prompt
  console.log("\n🔑 Gemini API key not found in environment.");
  console.log(
    "For future use, set the OWL_RECIPE_GEMINI_API_KEY environment variable:",
  );

  const apiKeyResult = await promptForApiKey();
  return apiKeyResult;
};

const promptForApiKey = async (): Promise<WithError<string, string>> => {
  const response = await prompts({
    type: "password",
    name: "apiKey",
    message: "Enter your Gemini API key:",
    validate: (value: string) => value.length > 0 || "API key is required",
  });

  if (!response.apiKey) {
    return error("API key is required to continue");
  }

  return success(response.apiKey);
};
