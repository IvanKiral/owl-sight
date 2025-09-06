import {
  getVideoData,
  WHISPER_LANGUAGES,
  SUPPORTED_BROWSERS,
  KEYRINGS,
} from "visual-insights";
import type {
  WhisperLanguage,
  SupportedBrowser,
  Keyring,
} from "visual-insights";
import type { CommandModule } from "yargs";
import { createCookieConfig } from "../../lib/cookieConfig.js";

type ExtractType = "description" | "transcription";

type VideoExtractOptions = Readonly<{
  url: string;
  extractType?: ReadonlyArray<ExtractType>;
  videoLanguage?: WhisperLanguage;
  cookiesFromBrowser?: SupportedBrowser;
  browserProfile?: string;
  keyring?: Keyring;
  cookiesFile?: string;
}>;

export const extractCommand: CommandModule<{}, VideoExtractOptions> = {
  command: "extract <url>",
  describe: "Extract data from a video URL (description, transcription, or both)",

  builder: (yargs) => {
    return yargs
      .positional("url", {
        describe: "Video URL to extract data from",
        type: "string",
        demandOption: true,
      })
      .option("extract-type", {
        describe: "Type of data to extract",
        type: "array",
        choices: ["description", "transcription"] as const,
        alias: "t",
      })
      .option("video-language", {
        describe: "Language of the video audio to improve transcription accuracy",
        type: "string",
        choices: WHISPER_LANGUAGES,
        alias: "video-lang",
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
        "$0 video extract https://youtube.com/watch?v=example",
        "Extract both description and transcription",
      )
      .example(
        "$0 video extract https://youtube.com/watch?v=example -t description",
        "Extract only video description",
      )
      .example(
        "$0 video extract https://youtube.com/watch?v=example -t transcription",
        "Extract only transcription",
      )
      .example(
        "$0 video extract https://youtube.com/watch?v=example -t description transcription",
        "Extract both description and transcription",
      )
      .example(
        "$0 video extract https://youtube.com/watch?v=example --video-language es",
        "Extract with Spanish audio language setting",
      )
      .example(
        "$0 video extract https://youtube.com/watch?v=example -c chrome",
        "Use Chrome cookies for age-restricted videos",
      );
  },

  handler: async (argv) => {
    console.log("🎬 Processing video:", argv.url);

    // Determine what to extract - default to both if not specified
    const extractTypes = argv.extractType?.length 
      ? argv.extractType
      : ["description", "transcription"];


    console.log(`📋 Extracting: ${extractTypes.join(", ")}`);

    const result = await getVideoData(argv.url, {
      ytdlpOptions: {
        cookies: createCookieConfig(argv),
      },
      whisperOptions: {
        model: "turbo",
        ...(argv.videoLanguage && { language: argv.videoLanguage }),
      },
    });

    if (!result.success) {
      console.error("Error processing video:", result.error);
      process.exit(1);
    }

    console.log("✅ Video processed successfully");

    // Build the output object
    const output = {
      description: result.result.metadata.description ?? undefined,
      transcription: result.result.transcription,
    };

    console.log("\n=== EXTRACTED DATA ===");
    console.log(JSON.stringify(output, null, 2));
    console.log("\nComplete!");
  },
};

