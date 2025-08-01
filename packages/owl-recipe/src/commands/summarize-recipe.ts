import {
  getVideoData,
  WHISPER_LANGUAGES,
  SUPPORTED_BROWSERS,
  KEYRINGS,
} from "visual-insights";
import type {
  WhisperLanguage,
  CookieConfig,
  SupportedBrowser,
  Keyring,
} from "visual-insights";
import type { CommandModule, ArgumentsCamelCase } from "yargs";

interface SummarizeRecipeOptions {
  url: string;
  language?: WhisperLanguage;
  cookiesFromBrowser?: SupportedBrowser;
  browserProfile?: string;
  keyring?: Keyring;
  cookiesFile?: string;
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
        .option("cookies-from-browser", {
          describe:
            "Browser to extract cookies from (for age-restricted or private videos)",
          type: "string",
          choices: SUPPORTED_BROWSERS,
          alias: "c",
          conflicts: "cookies-file",
        })
        .option("browser-profile", {
          describe: "Browser profile to use",
          type: "string",
          alias: "p",
          implies: "cookies-from-browser",
        })
        .option("keyring", {
          describe: "Keyring for Linux Chromium decryption",
          type: "string",
          choices: KEYRINGS,
          implies: "cookies-from-browser",
        })
        .option("cookies-file", {
          describe: "Path to Netscape-formatted cookies file",
          type: "string",
          alias: "f",
          conflicts: ["cookies-from-browser", "browser-profile", "keyring"],
        })
        .example(
          "$0 summarize-recipe https://youtube.com/watch?v=example",
          "Summarize recipe from YouTube video",
        )
        .example(
          "$0 summarize-recipe https://youtube.com/watch?v=example -l es",
          "Summarize Spanish recipe from YouTube video",
        )
        .example(
          "$0 summarize-recipe https://youtube.com/watch?v=example -c chrome",
          "Use Chrome cookies for age-restricted videos",
        )
        .example(
          "$0 summarize-recipe https://youtube.com/watch?v=example -c firefox -p Work",
          "Use Firefox Work profile cookies",
        );
    },

    handler: async (argv) => {
      const result = await getVideoData(argv.url, {
        ytdlpOptions: {
          quiet: true,
          cookies: createCookieConfig(argv),
        },
        whisperOptions: {
          verbose: "False",
          model: "turbo",
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

const createCookieConfig = (
  argv: ArgumentsCamelCase<SummarizeRecipeOptions>,
): CookieConfig => {
  if (argv.cookiesFile) {
    return { type: "file", path: argv.cookiesFile };
  }
  if (argv.cookiesFromBrowser) {
    return {
      type: "browser",
      browser: argv.cookiesFromBrowser,
      profile: argv.browserProfile,
      keyring: argv.keyring,
    };
  }
  return undefined;
};
