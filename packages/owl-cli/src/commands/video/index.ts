import type { CommandModule } from "yargs";
import { extractCommand } from "./extract.js";

export const videoCommand: CommandModule = {
  command: "video <command>",
  describe: "Video data extraction commands",
  builder: (yargs) => {
    return yargs.command(extractCommand).demandCommand(1, "Please specify a video command");
  },
  handler: () => {
    // This will be handled by subcommands
  },
};
