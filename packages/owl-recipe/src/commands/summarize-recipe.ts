import { getVideoData, WHISPER_LANGUAGES } from "visual-insights";
import type { WhisperLanguage } from "visual-insights";
import type { CommandModule } from "yargs";

interface SummarizeRecipeOptions {
  url: string;
  language?: WhisperLanguage;
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
        .option("language", {
          describe: "Language of the video audio for transcription",
          type: "string",
          choices: WHISPER_LANGUAGES,
          alias: "l",
        } as const)
        .example(
          "$0 summarize-recipe https://youtube.com/watch?v=example",
          "Summarize recipe from YouTube video",
        )
        .example(
          "$0 summarize-recipe https://youtube.com/watch?v=example -l es",
          "Summarize Spanish recipe from YouTube video",
        );
    },

    handler: async (argv) => {
      const result = await getVideoData(argv.url, {
        ytdlpOptions: {
          quiet: true,
        },
        whisperOptions: {
          verbose: "False",
          ...(argv.language && { language: argv.language }),
        },
      });

      if (!result.success) {
        console.error("Error processing video:", result.error);
        process.exit(1);
      }

      console.log("\n=== TRANSCRIPTION ===");
      console.log(result.result.transcription);

      console.log("\n=== DESCRIPTION ===");
      console.log(result.result.metadata.description);

      console.log("\nComplete!");
    },
  };
