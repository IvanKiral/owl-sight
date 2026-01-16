import { type OutputFormat, recipeFromHtml } from "core";
import { WHISPER_LANGUAGES, type WhisperLanguage } from "visual-insights";
import type { CommandModule } from "yargs";
import { getGeminiApiKey } from "../../lib/gemini/geminiKey.js";
import { compose } from "../helpers/commandOptionsComposer.js";
import {
  mapToApiModel,
  type UserFacingModel,
  yargsWithModel,
} from "../helpers/withLlmModelSchema.js";
import { handleOutput, yargsWithOutput } from "../helpers/withOutput.js";
import { yargsWithOutputFormat } from "../helpers/withOutputFormat.js";
import { getRecipeSchema, yargsWithRecipeSchema } from "../helpers/withRecipeSchema.js";

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

    const apiKeyResult = await getGeminiApiKey();
    if (!apiKeyResult.success) {
      console.error("Error getting Gemini API key:", apiKeyResult.error);
      process.exit(1);
    }

    const schemaResult = await getRecipeSchema(outputFormat, argv.recipeSchema);
    if (!schemaResult.success) {
      console.error("Error getting recipe schema:", schemaResult.error);
      process.exit(1);
    }

    console.log("Fetching content and generating recipe...");
    const result = await recipeFromHtml({
      url: argv.url,
      apiKey: apiKeyResult.result,
      model: mapToApiModel(argv.llmModel ?? "gemini-flash-lite"),
      schema: schemaResult.result,
      outputFormat,
      outputLanguage: argv.outputLanguage ?? "en",
    });

    if (!result.success) {
      console.error("Error:", result.error);
      process.exit(1);
    }

    console.log("✨ Recipe generated successfully!");

    const outputString =
      result.result.content.format === "json"
        ? JSON.stringify(result.result.content.parsed, null, 2)
        : result.result.content.parsed;

    const outputResult = handleOutput(argv.output, outputString);
    if (!outputResult.success) {
      console.error("Error writing output:", outputResult.error);
      process.exit(1);
    }

    console.log("\nComplete!");
  },
};
