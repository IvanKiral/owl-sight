import {
  getVideoData,
  WHISPER_LANGUAGES,
  SUPPORTED_BROWSERS,
  KEYRINGS,
  getLanguageName,
} from "visual-insights";
import type { WhisperLanguage, SupportedBrowser, Keyring } from "visual-insights";
import type { CommandModule } from "yargs";
import { getGeminiApiKey } from "../../lib/gemini/geminiKey.js";
import { callGemini } from "../../lib/gemini/gemini.js";
import { deserializeGeminiResponse, addUrlToResponse } from "../../lib/gemini/responseUtils.js";
import { createCookieConfig } from "../../lib/cookieConfig.js";
import { compose } from "../helpers/commandOptionsComposer.js";
import { handleOutput, yargsWithOutput } from "../helpers/withOutput.js";
import {
  yargsWithModel,
  mapToApiModel,
  type UserFacingModel,
} from "../helpers/withLlmModelSchema.js";
import { createSummaryPrompt } from "../../lib/prompts/summaryPrompt.js";

type VideoSummaryOptions = {
  url: string;
  videoLanguage?: WhisperLanguage;
  outputLanguage?: WhisperLanguage;
  cookiesFromBrowser?: SupportedBrowser;
  browserProfile?: string;
  keyring?: Keyring;
  cookiesFile?: string;
  output: string;
  llmModel?: UserFacingModel;
};

export const videoCommand: CommandModule<Record<string, unknown>, VideoSummaryOptions> = {
  command: "video-url <url>",
  describe: "Summarize content from a video URL",

  builder: (yargs) => {
    return compose(
      (y) =>
        y
          .positional("url", {
            describe: "Video URL to summarize",
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
            describe: "Language for the generated summary output",
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
            "$0 summary video-url https://youtube.com/watch?v=example",
            "Summarize content from YouTube video",
          )
          .example(
            "$0 summary video-url https://youtube.com/watch?v=example --video-language es",
            "Transcribe Spanish video, output summary in English",
          )
          .example(
            "$0 summary video-url https://youtube.com/watch?v=example --output-language es",
            "Transcribe English video, output summary in Spanish",
          )
          .example(
            "$0 summary video-url https://youtube.com/watch?v=example --video-lang es --output-lang fr",
            "Transcribe Spanish video, output summary in French",
          )
          .example(
            "$0 summary video-url https://youtube.com/watch?v=example -c chrome",
            "Use Chrome cookies for age-restricted videos",
          )
          .example(
            "$0 summary video-url https://youtube.com/watch?v=example -c firefox -p Work",
            "Use Firefox Work profile cookies",
          ),
      yargsWithOutput,
      yargsWithModel,
    )(yargs);
  },

  handler: async (argv) => {
    console.log("📹 Processing video:", argv.url);

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

    console.log("✅ Video transcribed successfully");

    const prompt = createSummaryPrompt({
      data: {
        transcribedText: result.result.transcription,
        description: result.result.metadata.description ?? "",
      },
      language: getLanguageName(argv.outputLanguage || "en"),
    });

    const apiKeyResult = await getGeminiApiKey();
    if (!apiKeyResult.success) {
      console.error("Error getting Gemini API key:", apiKeyResult.error);
      process.exit(1);
    }

    console.log("Generating summary...");
    const geminiResult = await callGemini(
      apiKeyResult.result,
      mapToApiModel(argv.llmModel ?? "gemini-flash-lite"),
      prompt,
    );

    if (!geminiResult.success) {
      console.error("Error calling Gemini API:", geminiResult.error);
      process.exit(1);
    }

    console.log("✨ Summary generated successfully!");
    try {
      const deserializedResult = deserializeGeminiResponse(geminiResult.result.text, "markdown");
      if (!deserializedResult.success) {
        throw new Error(deserializedResult.error);
      }

      const resultWithUrl = addUrlToResponse(deserializedResult.result, argv.url);
      const outputString = resultWithUrl.parsed as string;

      const outputResult = handleOutput(argv.output, outputString);
      if (!outputResult.success) {
        throw new Error(outputResult.error);
      }
    } catch (parseError) {
      console.log("Raw response (error processing):", parseError);
      console.log(geminiResult.result.text);
      process.exit(1);
    }

    console.log("\nComplete!");
  },
};
