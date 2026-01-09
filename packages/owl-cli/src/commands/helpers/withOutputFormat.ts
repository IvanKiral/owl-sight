import type { Argv } from "yargs";
import { OUTPUT_FORMATS } from "../../lib/constants/output.js";

export const yargsWithOutputFormat = <T>(yargs: Argv<T>) => {
  return yargs.option("output-format", {
    describe: "Output format can be json or markdown",
    type: "string",
    choices: OUTPUT_FORMATS,
    default: "json",
  } as const);
};
