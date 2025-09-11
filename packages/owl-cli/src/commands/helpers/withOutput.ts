import type { Argv } from "yargs";
import fs from "node:fs";
import path from "node:path";
import { success, error } from "shared";

export const yargsWithOutput = <T>(yargs: Argv<T>) => {
  return yargs.option("output", {
    alias: "o",
    describe: "Output file path, or '-' for stdout",
    type: "string",
    default: "-", // Default to stdout
  });
};

export const handleOutput = (outputArg: string, output: string) => {
  const outputStream =
    outputArg === "-" ? process.stdout : fs.createWriteStream(outputArg);
  try {
    outputStream.write(output);

    if (outputArg !== "-") {
      console.log(`Recipe written to ${path.resolve(outputArg)}`);
    }
    return success(true);
  } catch (err) {
    return error(
      `Failed to write output: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
};
