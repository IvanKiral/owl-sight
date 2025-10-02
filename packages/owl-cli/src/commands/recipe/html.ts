import { getWebpageData, WHISPER_LANGUAGES } from "visual-insights";
import { type WhisperLanguage, getLanguageName } from "visual-insights";
import type { CommandModule } from "yargs";
import { getGeminiApiKey } from "../../lib/gemini/geminiKey.js";
import { callGemini } from "../../lib/gemini/gemini.js";
import { deserializeGeminiResponse, addUrlToResponse } from "../../lib/gemini/responseUtils.js";
import { compose } from "../helpers/commandOptionsComposer.js";
import { handleRecipePrompt, yargsWithRecipeSchema } from "../helpers/withRecipeSchema.js";
import { handleOutput, yargsWithOutput } from "../helpers/withOutput.js";
import { yargsWithOutputFormat } from "../helpers/withOutputFormat.js";
import type { OutputFormat } from "../../lib/constants/output.js";
import {
  yargsWithModel,
  mapToApiModel,
  type UserFacingModel,
} from "../helpers/withLlmModelSchema.js";

type HtmlRecipeOptions = {
  url: string;
  outputLanguage?: WhisperLanguage;
  recipeSchema?: string;
  output: string;
  outputFormat?: OutputFormat;
  llmModel?: UserFacingModel;
};

export const htmlCommand: CommandModule<Record<string, unknown>, HtmlRecipeOptions> = {
  command: "html <url>",
  describe: "Extract a recipe from a webpage URL",

  builder: (yargs) => {
    return compose(
      (y) =>
        y
          .positional("url", {
            describe: "Webpage URL containing the recipe",
            type: "string",
            demandOption: true,
          })
          .option("output-language", {
            describe: "Language for the generated recipe output",
            type: "string",
            choices: WHISPER_LANGUAGES,
            alias: "output-lang",
            default: "en",
          } as const)
          .example("$0 recipe html https://example.com/recipe", "Extract recipe from webpage")
          .example(
            "$0 recipe html https://example.com/recipe --output-language es",
            "Extract recipe and output in Spanish",
          )
          .example(
            "$0 recipe html https://example.com/recipe --recipe-schema ./custom.json",
            "Extract recipe with custom schema",
          ),
      yargsWithRecipeSchema,
      yargsWithOutput,
      yargsWithOutputFormat,
      yargsWithModel,
    )(yargs);
  },

  handler: async (argv) => {
    console.log("🌐 Processing webpage:", argv.url);

    const outputFormat = argv.outputFormat ?? "json";

    const result = await getWebpageData(argv.url);

    if (!result.success) {
      console.error("Error processing webpage:", result.error);
      process.exit(1);
    }

    console.log("✅ Webpage content extracted successfully");

    const apiKeyResult = await getGeminiApiKey();
    if (!apiKeyResult.success) {
      console.error("Error getting Gemini API key:", apiKeyResult.error);
      process.exit(1);
    }

    const promptResult = await handleRecipePrompt({
      recipeSchemaPath: argv.recipeSchema,
      data: {
        webpageContent: result.result.textContent,
        articleTitle: result.result.metadata.title,
      },
      outputLanguage: getLanguageName(argv.outputLanguage || "en"),
      format: outputFormat,
    });

    if (!promptResult.success) {
      console.error("Error creating recipe prompt:", promptResult.error);
      process.exit(1);
    }

    console.log("Generating recipe...");
    const geminiResult = await callGemini(
      apiKeyResult.result,
      mapToApiModel(argv.llmModel ?? "gemini-flash-lite"),
      promptResult.result,
    );

    if (!geminiResult.success) {
      console.error("Error calling Gemini API:", geminiResult.error);
      process.exit(1);
    }

    console.log("✨ Recipe generated successfully!");
    try {
      const deserializedResult = deserializeGeminiResponse(geminiResult.result.text, outputFormat);
      if (!deserializedResult.success) {
        throw new Error(deserializedResult.error);
      }

      const resultWithUrl = addUrlToResponse(deserializedResult.result, argv.url);
      const outputString = resultWithUrl.format === "json"
        ? JSON.stringify(resultWithUrl.parsed, null, 2)
        : resultWithUrl.parsed;

      const outputResult = handleOutput(argv.output, outputString);
      if (!outputResult.success) {
        throw new Error(outputResult.error);
      }
    } catch (parseError) {
      console.log("Raw response (could not parse as JSON):", parseError);
      console.log(geminiResult.result.text);
      process.exit(1);
    }

    console.log("\nComplete!");
  },
};
