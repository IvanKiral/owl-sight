import { addUrlToResponse, callGemini, deserializeGeminiResponse } from "core";
import {
  getLanguageName,
  getWebpageData,
  WHISPER_LANGUAGES,
  type WhisperLanguage,
} from "visual-insights";
import type { CommandModule } from "yargs";
import { getGeminiApiKey } from "../../lib/gemini/geminiKey.js";
import { createSummaryPrompt } from "../../lib/prompts/summaryPrompt.js";
import { compose } from "../helpers/commandOptionsComposer.js";
import { yargsWithCustomPrompt } from "../helpers/withCustomPrompt.js";
import {
  mapToApiModel,
  type UserFacingModel,
  yargsWithModel,
} from "../helpers/withLlmModelSchema.js";
import { handleOutput, yargsWithOutput } from "../helpers/withOutput.js";

type HtmlSummaryOptions = {
  url: string;
  outputLanguage?: WhisperLanguage;
  output: string;
  llmModel?: UserFacingModel;
  customPrompt?: string;
};

export const htmlCommand: CommandModule<Record<string, unknown>, HtmlSummaryOptions> = {
  command: "html <url>",
  describe: "Extract a summary from a webpage URL",

  builder: (yargs) => {
    return compose(
      (y) =>
        y
          .positional("url", {
            describe: "Webpage URL to summarize",
            type: "string",
            demandOption: true,
          })
          .option("output-language", {
            describe: "Language for the generated summary output",
            type: "string",
            choices: WHISPER_LANGUAGES,
            alias: "output-lang",
            default: "en",
          } as const)
          .example("$0 summary html https://example.com/article", "Extract summary from webpage")
          .example(
            "$0 summary html https://example.com/article --output-language es",
            "Extract summary and output in Spanish",
          ),
      yargsWithOutput,
      yargsWithModel,
      yargsWithCustomPrompt,
    )(yargs);
  },

  handler: async (argv) => {
    console.log("📄 Processing webpage:", argv.url);

    const result = await getWebpageData(argv.url);

    if (!result.success) {
      console.error("Error processing webpage:", result.error);
      process.exit(1);
    }

    console.log("✅ Webpage content extracted successfully");

    const apiKeyResult = await getGeminiApiKey();
    if (!apiKeyResult.success) {
      console.error("Error getting Gemini API key:", apiKeyResult.error);
      process.exit(1);
    }

    const prompt = createSummaryPrompt({
      data: {
        webpageContent: result.result.textContent,
        articleTitle: result.result.metadata.title,
      },
      language: getLanguageName(argv.outputLanguage ?? "en"),
      customPrompt: argv.customPrompt,
    });

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
