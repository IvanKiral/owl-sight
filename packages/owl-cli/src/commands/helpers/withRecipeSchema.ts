import type { Argv } from "yargs";
import type { WhisperLanguageName } from "visual-insights";
import { compileFromFile } from "json-schema-to-typescript";
import path from "node:path";
import {
  type OutputFormat,
  markdownDescriptionInstruction,
  createRecipePrompt,
  type RecipePromptData,
} from "core";
import { resolveDefaultRecipeSchema } from "../../lib/recipeSchema.js";
import { success, error, type WithError } from "shared";

export const yargsWithRecipeSchema = <T>(yargs: Argv<T>) =>
  yargs.option("recipe-schema", {
    describe: "Path to the recipe schema file",
    type: "string",
  });

export const getRecipeSchema = async (
  format: OutputFormat,
  recipeSchemaPath?: string,
): Promise<WithError<string, string>> => {
  try {
    if (format === "markdown") {
      return success(markdownDescriptionInstruction);
    }

    const schema = recipeSchemaPath
      ? await compileFromFile(path.resolve(recipeSchemaPath))
      : await (async () => {
          const schemaResult = await resolveDefaultRecipeSchema();
          if (!schemaResult.success) {
            throw new Error(`Error resolving recipe schema: ${schemaResult.error}`);
          }
          return schemaResult.result.schema;
        })();

    return success(schema);
  } catch (err) {
    return error(`Failed to get recipe schema: ${err instanceof Error ? err.message : String(err)}`);
  }
};

export const handleRecipePrompt = async (options: {
  data: RecipePromptData;
  recipeSchemaPath?: string;
  outputLanguage: WhisperLanguageName;
  format: OutputFormat;
}) => {
  try {
    const schemaResult = await getRecipeSchema(options.format, options.recipeSchemaPath);
    if (!schemaResult.success) {
      return schemaResult;
    }

    const prompt = createRecipePrompt({
      data: options.data,
      language: options.outputLanguage,
      schema: schemaResult.result,
      format: options.format,
    });

    return success(prompt);
  } catch (err) {
    return error(
      `Failed to create recipe prompt: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
};
