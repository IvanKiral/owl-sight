#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { doctorCommand } from "./commands/doctor/doctor.js";
import { recipeCommand } from "./commands/recipe/index.js";
import { summaryCommand } from "./commands/summary/index.js";
import { videoCommand } from "./commands/video/index.js";

const cli = yargs(hideBin(process.argv))
  .scriptName("owl-cli")
  .usage("$0 <command> [options]")
  .command(recipeCommand)
  .command(summaryCommand)
  .command(videoCommand)
  .command(doctorCommand)
  .demandCommand(1, "Please specify a command")
  .strict()
  .help()
  .alias("h", "help")
  .version()
  .alias("v", "version")
  .fail((msg, err, yargs) => {
    if (err) {
      console.error("Error:", err.message);
      process.exit(1); // real error
    }

    // msg is something like "Please specify a command"
    console.error(msg);
    console.log();
    yargs.showHelp();

    // 🟢 Exit with 0 instead of 1 to signal a clean/helpful outcome
    process.exit(0);
  });

// Parse arguments
await cli.parse();
