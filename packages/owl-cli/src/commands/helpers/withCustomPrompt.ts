import type { Argv } from "yargs";

export const yargsWithCustomPrompt = <T>(yargs: Argv<T>) => {
  return yargs.option("custom-prompt", {
    alias: "cp",
    describe: "Custom prompt text to use instead of default prompt",
    type: "string",
  });
};
