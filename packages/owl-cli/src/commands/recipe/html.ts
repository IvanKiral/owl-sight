import { getWebpageData, WHISPER_LANGUAGES } from "visual-insights";
import type { WhisperLanguage } from "visual-insights";
import type { CommandModule } from "yargs";
import { getGeminiApiKey } from "../../lib/geminiKey.js";
import { createWebRecipePrompt } from "../../lib/webRecipePrompt.js";
import { callGemini } from "../../lib/gemini.js";
import { compose } from "../helpers/commandOptionsComposer.js";
import { yargsWithRecipeSchema } from "../helpers/withRecipeSchema.js";
import { resolveDefaultRecipeSchema } from "../../lib/recipeSchema.js";
import { compileFromFile } from "json-schema-to-typescript";
import { handleOutput, yargsWithOutput } from "../helpers/withOutput.js";
import path from "node:path";

type HtmlRecipeOptions = {
  url: string;
  outputLanguage?: WhisperLanguage;
  recipeSchema?: string;
  output: string;
};

export const htmlCommand: CommandModule<
  Record<string, unknown>,
  HtmlRecipeOptions
> = {
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
          .example(
            "$0 recipe html https://example.com/recipe",
            "Extract recipe from webpage"
          )
          .example(
            "$0 recipe html https://example.com/recipe --output-language es",
            "Extract recipe and output in Spanish"
          )
          .example(
            "$0 recipe html https://example.com/recipe --recipe-schema ./custom.json",
            "Extract recipe with custom schema"
          ),
      yargsWithRecipeSchema,
      yargsWithOutput
    )(yargs);
  },

  handler: async (argv) => {
    console.log("🌐 Processing webpage:", argv.url);

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

    const typeScriptRecipeSchema = argv.recipeSchema
      ? await compileFromFile(path.resolve(argv.recipeSchema))
      : await (async () => {
          const schemaResult = await resolveDefaultRecipeSchema();
          if (!schemaResult.success) {
            console.error("Error resolving recipe schema:", schemaResult.error);
            process.exit(1);
          }
          return schemaResult.result.schema;
        })();

    const prompt = createWebRecipePrompt({
      webpageContent: result.result.textContent,
      title: result.result.metadata.title,
      language: argv.outputLanguage ?? "en",
      schema: typeScriptRecipeSchema,
    });

    console.log("Generating recipe...");
    const geminiResult = await callGemini(
      apiKeyResult.result,
      "gemini-2.0-flash-001",
      prompt
    );

    if (!geminiResult.success) {
      console.error("Error calling Gemini API:", geminiResult.error);
      process.exit(1);
    }

    console.log("✨ Recipe generated successfully!");
    try {
      const cleaned = stripMarkdownCodeFences(geminiResult.result.text);
      const recipe = JSON.parse(cleaned);
      const outputResult = handleOutput(
        argv.output,
        JSON.stringify(recipe, null, 2)
      );
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

const stripMarkdownCodeFences = (text: string): string => {
  const trimmed = text.trim();

  return trimmed.replace("```json", "").replace("```", "");
};
