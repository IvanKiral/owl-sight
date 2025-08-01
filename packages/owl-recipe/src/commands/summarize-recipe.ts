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
import { getGeminiApiKey } from "../lib/geminiKey.js";
import { createRecipePrompt } from "../lib/recipePrompt.js";
import { callGemini } from "../lib/gemini.js";

interface SummarizeRecipeOptions {
  url: string;
  videoLanguage?: WhisperLanguage;
  outputLanguage?: WhisperLanguage;
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
        .option("video-language", {
          describe: "Language of the video audio for transcription",
          type: "string",
          choices: WHISPER_LANGUAGES,
          alias: "video-lang",
        } as const)
        .option("output-language", {
          describe: "Language for the generated recipe output",
          type: "string",
          choices: WHISPER_LANGUAGES,
          alias: "output-lang",
          default: "en",
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
          "$0 summarize-recipe https://youtube.com/watch?v=example --video-language es",
          "Transcribe Spanish video, output in English",
        )
        .example(
          "$0 summarize-recipe https://youtube.com/watch?v=example --output-language es",
          "Transcribe English video, output in Spanish",
        )
        .example(
          "$0 summarize-recipe https://youtube.com/watch?v=example --video-lang es --output-lang fr",
          "Transcribe Spanish video, output in French",
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
          ...(argv.videoLanguage && { language: argv.videoLanguage }),
        },
      });

      if (!result.success) {
        console.error("Error processing video:", result.error);
        process.exit(1);
      }

      // Get Gemini API key
      const apiKeyResult = await getGeminiApiKey();
      if (!apiKeyResult.success) {
        console.error("Error getting Gemini API key:", apiKeyResult.error);
        process.exit(1);
      }

      // Create recipe prompt
      const prompt = createRecipePrompt(
        result.result.metadata.description ?? "",
        result.result.transcription,
        argv.outputLanguage || "en",
      );

      // Call Gemini API
      const geminiResult = await callGemini(
        apiKeyResult.result,
        "gemini-2.0-flash-001",
        prompt,
      );

      if (!geminiResult.success) {
        console.error("Error calling Gemini API:", geminiResult.error);
        process.exit(1);
      }

      console.log("\n=== STRUCTURED RECIPE ===");
      try {
        const recipe = JSON.parse(geminiResult.result.text);
        console.log(JSON.stringify(recipe, null, 2));
      } catch (parseError) {
        console.log("Raw response (could not parse as JSON):");
        console.log(geminiResult.result.text);
      }

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
