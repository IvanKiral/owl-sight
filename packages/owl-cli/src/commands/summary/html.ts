import { summaryFromHtml } from "core";
import { WHISPER_LANGUAGES, type WhisperLanguage } from "visual-insights";
import type { CommandModule } from "yargs";
import { getGeminiApiKey } from "../../lib/gemini/geminiKey.js";
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

    const apiKeyResult = await getGeminiApiKey();
    if (!apiKeyResult.success) {
      console.error("Error getting Gemini API key:", apiKeyResult.error);
      process.exit(1);
    }

    console.log("Fetching content and generating summary...");
    const result = await summaryFromHtml({
      url: argv.url,
      apiKey: apiKeyResult.result,
      model: mapToApiModel(argv.llmModel ?? "gemini-flash-lite"),
      outputLanguage: argv.outputLanguage ?? "en",
      customPrompt: argv.customPrompt,
    });

    if (!result.success) {
      console.error("Error:", result.error);
      process.exit(1);
    }

    console.log("✨ Summary generated successfully!");

    const outputResult = handleOutput(argv.output, result.result.content);
    if (!outputResult.success) {
      console.error("Error writing output:", outputResult.error);
      process.exit(1);
    }

    console.log("\nComplete!");
  },
};
