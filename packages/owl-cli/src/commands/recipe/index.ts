import type { CommandModule } from "yargs";
import { videoCommand } from "./videoUrl.js";
import { htmlCommand } from "./html.js";

export const recipeCommand: CommandModule = {
  command: "recipe <command>",
  describe: "Recipe extraction commands",
  builder: (yargs) => {
    return yargs
      .command(videoCommand)
      .command(htmlCommand)
      .demandCommand(1, "Please specify a recipe command");
  },
  handler: () => {
    // This will be handled by subcommands
  },
};
