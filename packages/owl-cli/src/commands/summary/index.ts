import type { CommandModule } from "yargs";
import { videoCommand } from "./videoUrl.js";
import { htmlCommand } from "./html.js";

export const summaryCommand: CommandModule = {
  command: "summary <command>",
  describe: "Summary extraction commands",
  builder: (yargs) => {
    return yargs
      .command(videoCommand)
      .command(htmlCommand)
      .demandCommand(1, "Please specify a summary command");
  },
  handler: () => {
    // This will be handled by subcommands
  },
};
