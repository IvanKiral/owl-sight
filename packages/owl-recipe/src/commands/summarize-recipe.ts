import { getVideoData } from "visual-insights";
import type { CommandModule } from "yargs";

interface SummarizeRecipeOptions {
  url: string;
}

export const summarizeRecipeCommand: CommandModule<{}, SummarizeRecipeOptions> =
  {
    command: "summarize-recipe <url>",
    describe: "Summarize a recipe from a video URL",

    builder: (yargs) => {
      return yargs
        .positional("url", {
          describe: "Video URL containing the recipe",
          type: "string",
          demandOption: true,
        })
        .example(
          "$0 summarize-recipe https://youtube.com/watch?v=example",
          "Summarize recipe from YouTube video",
        );
    },

    handler: async (argv) => {
      try {
        console.log("Downloading audio...");

        console.log("Transcribing audio...");

        console.log("Extracting metadata...");

        const result = await getVideoData(argv.url, {
          ytdlpOptions: {
            quiet: true,
          },
          whisperOptions: {
            verbose: "False",
          },
        });

        console.log("\n=== TRANSCRIPTION ===");
        console.log(JSON.stringify(result.transcription));

        console.log("\n=== DESCRIPTION ===");
        console.log(result.metadata.description);

        console.log("\nComplete!");
      } catch (error) {
        console.error("Error processing video:", error);
        process.exit(1);
      }
    },
  };
