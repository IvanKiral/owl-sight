import type { Argv } from "yargs";
import type { WhisperLanguage, WhisperLanguageName } from "visual-insights";
import { compileFromFile } from "json-schema-to-typescript";
import path from "node:path";
import {
  createRecipePrompt,
  markdownDescriptionInstruction,
  RecipePromptData,
} from "../../lib/prompts/recipePrompt.js";
import { resolveDefaultRecipeSchema } from "../../lib/recipeSchema.js";
import { success, error } from "shared";
import { OutputFormat } from "../../lib/constants/output.js";

export const yargsWithRecipeSchema = <T>(yargs: Argv<T>) => {
  return yargs.option("recipe-schema", {
    describe: "Path to the recipe schema file",
    type: "string",
  });
};

export const handleRecipePrompt = async (options: {
  data: RecipePromptData;
  recipeSchemaPath?: string;
  outputLanguage: WhisperLanguageName;
  format: OutputFormat;
}) => {
  try {
    const typeScriptRecipeSchema = await getRecipeSchema(
      options.format,
      options.recipeSchemaPath
    );

    const prompt = createRecipePrompt({
      data: options.data,
      language: options.outputLanguage,
      schema: typeScriptRecipeSchema,
      format: options.format,
    });

    return success(prompt);
  } catch (err) {
    return error(
      `Failed to create recipe prompt: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
};

const getRecipeSchema = async (
  format: OutputFormat,
  recipeSchemaPath?: string
) => {
  if (format === "markdown") {
    return markdownDescriptionInstruction;
  }

  return recipeSchemaPath
    ? await compileFromFile(path.resolve(recipeSchemaPath))
    : await (async () => {
        const schemaResult = await resolveDefaultRecipeSchema();
        if (!schemaResult.success) {
          throw new Error(
            `Error resolving recipe schema: ${schemaResult.error}`
          );
        }
        return schemaResult.result.schema;
      })();
};
