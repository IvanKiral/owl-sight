import type { Argv } from "yargs";

export const yargsWithRecipeSchema = <T>(yargs: Argv<T>) => {
  return yargs.option("recipe-schema", {
    describe: "Path to the recipe schema file",
    type: "string",
    default: "recipe-schema.json",
  });
};
