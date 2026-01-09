import {
  WHISPER_LANGUAGES,
  SUPPORTED_BROWSERS,
  KEYRINGS,
  getLanguageName,
} from "visual-insights";
import type { WhisperLanguage, SupportedBrowser, Keyring } from "visual-insights";
import type { CommandModule } from "yargs";
import { recipeFromVideo, createCookieConfig, type OutputFormat } from "core";
import { getGeminiApiKey } from "../../lib/gemini/geminiKey.js";
import { compose } from "../helpers/commandOptionsComposer.js";
import { yargsWithRecipeSchema, getRecipeSchema } from "../helpers/withRecipeSchema.js";
import { handleOutput, yargsWithOutput } from "../helpers/withOutput.js";
import { yargsWithOutputFormat } from "../helpers/withOutputFormat.js";
import {
  yargsWithModel,
  mapToApiModel,
  type UserFacingModel,
} from "../helpers/withLlmModelSchema.js";

type VideoRecipeOptions = {
  url: string;
  videoLanguage?: WhisperLanguage;
  outputLanguage?: WhisperLanguage;
  cookiesFromBrowser?: SupportedBrowser;
  browserProfile?: string;
  keyring?: Keyring;
  cookiesFile?: string;
  recipeSchema?: string;
  output: string;
  outputFormat?: OutputFormat;
  llmModel?: UserFacingModel;
};

export const videoCommand: CommandModule<Record<string, unknown>, VideoRecipeOptions> = {
  command: "video-url <url>",
  describe: "Summarize a recipe from a video URL",

  builder: (yargs) => {
    return compose(
      (y) =>
        y
          .positional("url", {
            describe: "Video URL containing the recipe",
            type: "string",
            demandOption: true,
          })
          .option("video-language", {
            describe: "Language of the video audio to improve transcription accuracy",
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
            describe: "Browser to extract cookies from (for age-restricted or private videos)",
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
            "$0 recipe video https://youtube.com/watch?v=example",
            "Summarize recipe from YouTube video",
          )
          .example(
            "$0 recipe video https://youtube.com/watch?v=example --video-language es",
            "Transcribe Spanish video, output in English",
          )
          .example(
            "$0 recipe video https://youtube.com/watch?v=example --output-language es",
            "Transcribe English video, output in Spanish",
          )
          .example(
            "$0 recipe video https://youtube.com/watch?v=example --video-lang es --output-lang fr",
            "Transcribe Spanish video, output in French",
          )
          .example(
            "$0 recipe video https://youtube.com/watch?v=example -c chrome",
            "Use Chrome cookies for age-restricted videos",
          )
          .example(
            "$0 recipe video https://youtube.com/watch?v=example -c firefox -p Work",
            "Use Firefox Work profile cookies",
          ),
      yargsWithRecipeSchema,
      yargsWithOutput,
      yargsWithOutputFormat,
      yargsWithModel,
    )(yargs);
  },

  handler: async (argv) => {
    console.log("Processing video:", argv.url);

    const outputFormat: OutputFormat = argv.outputFormat ?? "json";

    const schemaResult = await getRecipeSchema(outputFormat, argv.recipeSchema);
    if (!schemaResult.success) {
      console.error("Error getting recipe schema:", schemaResult.error);
      process.exit(1);
    }

    const apiKeyResult = await getGeminiApiKey();
    if (!apiKeyResult.success) {
      console.error("Error getting Gemini API key:", apiKeyResult.error);
      process.exit(1);
    }

    console.log("Downloading and transcribing video...");

    const result = await recipeFromVideo({
      url: argv.url,
      apiKey: apiKeyResult.result,
      schema: schemaResult.result,
      model: mapToApiModel(argv.llmModel ?? "gemini-flash-lite"),
      outputFormat,
      outputLanguage: getLanguageName(argv.outputLanguage || "en"),
      videoLanguage: argv.videoLanguage,
      cookies: createCookieConfig(argv),
    });

    if (!result.success) {
      console.error("Error:", result.error);
      process.exit(1);
    }

    console.log("Recipe generated successfully!");

    const outputString =
      result.result.content.format === "json"
        ? JSON.stringify(result.result.content.parsed, null, 2)
        : result.result.content.parsed;

    const outputResult = handleOutput(argv.output, outputString);
    if (!outputResult.success) {
      console.error("Error writing output:", outputResult.error);
      process.exit(1);
    }

    console.log("\nComplete!");
  },
};
