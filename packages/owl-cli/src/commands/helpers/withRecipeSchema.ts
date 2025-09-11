import type { Argv } from "yargs";
import type { WhisperLanguage } from "visual-insights";
import { compileFromFile } from "json-schema-to-typescript";
import path from "node:path";
import { createRecipePrompt } from "../../lib/recipePrompt.js";
import { resolveDefaultRecipeSchema } from "../../lib/recipeSchema.js";
import { success, error } from "shared";

export const yargsWithRecipeSchema = <T>(yargs: Argv<T>) => {
  return yargs.option("recipe-schema", {
    describe: "Path to the recipe schema file",
    type: "string",
  });
};

export const handleRecipePrompt = async (options: {
  recipeSchemaPath?: string;
  transcribedText: string;
  description: string;
  outputLanguage: WhisperLanguage;
}) => {
  try {
    const typeScriptRecipeSchema = options.recipeSchemaPath
      ? await compileFromFile(path.resolve(options.recipeSchemaPath))
      : await (async () => {
          const schemaResult = await resolveDefaultRecipeSchema();
          if (!schemaResult.success) {
            throw new Error(`Error resolving recipe schema: ${schemaResult.error}`);
          }
          return schemaResult.result.schema;
        })();

    const prompt = createRecipePrompt({
      description: options.description,
      transcribedText: options.transcribedText,
      language: options.outputLanguage,
      schema: typeScriptRecipeSchema,
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
