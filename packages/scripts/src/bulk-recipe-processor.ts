import {
  appendFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { compileRecipeSchema, DEFAULT_RECIPE_SCHEMA, recipeFromVideo } from "core";
import unzipper from "unzipper";
import { isVideoConfig, parseInputFile } from "./lib/parseInputFile.js";
import type { ProcessingError, ProcessingResult, VideoConfig } from "./lib/types.js";

const MODEL = "gemini-3-flash-preview";
const DELAY_BETWEEN_VIDEOS_MS = 15_000;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

type CliArgs = {
  inputFile: string;
  outputDir: string;
  rangeStr: string | null;
};

const DEFAULT_ARGS: CliArgs = {
  inputFile: "",
  outputDir: "./output",
  rangeStr: null,
};

type ParseState = CliArgs & { skip: number };

const parseArgs = (args: ReadonlyArray<string>): CliArgs => {
  const initial: ParseState = { ...DEFAULT_ARGS, skip: 0 };

  const result = args.reduce<ParseState>((acc, arg, i) => {
    if (acc.skip > 0) {
      return { ...acc, skip: acc.skip - 1 };
    }

    if (arg === "--range" || arg === "-r") {
      return { ...acc, rangeStr: args[i + 1] ?? null, skip: 1 };
    }

    if (arg === "--output" || arg === "-o") {
      return { ...acc, outputDir: args[i + 1] ?? "./output", skip: 1 };
    }

    if (!acc.inputFile) {
      return { ...acc, inputFile: arg };
    }

    return acc;
  }, initial);

  const { skip, ...cliArgs } = result;
  return cliArgs;
};

type Range = { start: number; end: number };

const clampRange = (range: Range, total: number): Range => ({
  start: Math.max(0, range.start),
  end: Math.min(total, range.end),
});

const parseRange = (rangeStr: string, total: number): Range => {
  if (rangeStr.includes("-")) {
    const [s, e] = rangeStr.split("-").map(Number);
    return clampRange({ start: s - 1, end: e }, total);
  }

  if (rangeStr.endsWith(":")) {
    return clampRange({ start: Number(rangeStr.slice(0, -1)) - 1, end: total }, total);
  }

  if (rangeStr.startsWith(":")) {
    return clampRange({ start: 0, end: Number(rangeStr.slice(1)) }, total);
  }

  const n = Number(rangeStr);
  return clampRange({ start: n - 1, end: n }, total);
};

const sanitizeFilename = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

const logError = (outputDir: string, url: string, errorMessage: string) => {
  const errorLogPath = join(outputDir, "_errors.log");
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${url}\n  Error: ${errorMessage}\n\n`;
  appendFileSync(errorLogPath, logLine);
};

const organizeOutput = async (
  outputDir: string,
  archivePaths: ReadonlyArray<string>,
): Promise<void> => {
  const recipesDir = join(outputDir, "recipes");
  const videosDir = join(outputDir, "videos");

  mkdirSync(recipesDir, { recursive: true });
  mkdirSync(videosDir, { recursive: true });

  for (const zipPath of archivePaths) {
    if (!existsSync(zipPath)) {
      continue;
    }

    console.log(`  Extracting: ${basename(zipPath)}`);
    const directory = await unzipper.Open.file(zipPath);

    for (const file of directory.files) {
      if (file.type === "Directory") {
        continue;
      }

      const ext = extname(file.path).toLowerCase();
      const filename = basename(file.path);

      const targetDir = ext === ".json" ? recipesDir : ext === ".mp4" ? videosDir : null;
      if (!targetDir) {
        continue;
      }

      const targetPath = join(targetDir, filename);
      await pipeline(file.stream(), createWriteStream(targetPath));
    }

    unlinkSync(zipPath);
  }
};

type ProcessVideoResult = {
  error: ProcessingError | null;
  archivePath: string | null;
};

const processVideo = async (
  config: VideoConfig,
  outputDir: string,
  apiKey: string,
  schema: string,
  index: number,
  total: number,
): Promise<ProcessVideoResult> => {
  const displayName = config.filename || config.url.slice(0, 50);
  console.log(`[${index + 1}/${total}] Processing: ${displayName}`);

  const archiveFilename = config.filename ? sanitizeFilename(config.filename) : null;
  const archivePath = archiveFilename ? join(outputDir, `${archiveFilename}.zip`) : null;

  const result = await recipeFromVideo({
    url: config.url,
    apiKey,
    schema,
    model: MODEL,
    outputFormat: "json",
    outputLanguage: config.outputLanguage,
    videoLanguage: config.videoLanguage,
    timeRange: config.timeRange,
    archive: archivePath
      ? {
          outputPath: archivePath,
          include: ["video", "result"],
          filename: archiveFilename ?? undefined,
        }
      : undefined,
  });

  if (!result.success) {
    console.log(`  Failed: ${result.error}`);
    logError(outputDir, config.url, result.error);
    return {
      error: { url: config.url, error: result.error },
      archivePath: null,
    };
  }

  if (archivePath) {
    console.log(`  Archived: ${basename(archivePath)}`);
  } else {
    const filename = `recipe-${sanitizeFilename(new URL(config.url).pathname)}-${Date.now()}.json`;
    const outputPath = join(outputDir, filename);
    const content =
      result.result.content.format === "json"
        ? JSON.stringify(result.result.content.parsed, null, 2)
        : result.result.content.parsed;

    writeFileSync(outputPath, content);
    console.log(`  Saved: ${filename}`);
  }

  return { error: null, archivePath };
};

type ProcessVideosResult = ProcessingResult & {
  archivePaths: ReadonlyArray<string>;
};

type ProcessingAcc = {
  successful: number;
  errors: ReadonlyArray<ProcessingError>;
  archivePaths: ReadonlyArray<string>;
};

const processVideos = async (
  configs: ReadonlyArray<VideoConfig>,
  outputDir: string,
  apiKey: string,
): Promise<ProcessVideosResult> => {
  const schema = await compileRecipeSchema(DEFAULT_RECIPE_SCHEMA);
  const total = configs.length;

  const processRecursive = async (
    remaining: ReadonlyArray<VideoConfig>,
    index: number,
    acc: ProcessingAcc,
  ): Promise<ProcessingAcc> => {
    if (remaining.length === 0) return acc;

    const [config, ...rest] = remaining;

    if (index > 0) {
      console.log(`  Waiting ${DELAY_BETWEEN_VIDEOS_MS / 1000}s before next video...`);
      await sleep(DELAY_BETWEEN_VIDEOS_MS);
    }

    const result = await processVideo(config, outputDir, apiKey, schema, index, total);

    const nextAcc = result.error
      ? { ...acc, errors: [...acc.errors, result.error] }
      : {
          ...acc,
          successful: acc.successful + 1,
          archivePaths: result.archivePath
            ? [...acc.archivePaths, result.archivePath]
            : acc.archivePaths,
        };

    return processRecursive(rest, index + 1, nextAcc);
  };

  const acc = await processRecursive(configs, 0, { successful: 0, errors: [], archivePaths: [] });

  return {
    successful: acc.successful,
    failed: acc.errors.length,
    errors: acc.errors,
    archivePaths: acc.archivePaths,
  };
};

const printUsage = () => {
  console.error("Usage: tsx bulk-recipe-processor.ts <input.txt> [options]");
  console.error("");
  console.error("Options:");
  console.error("  -o, --output <dir>   Output directory (default: ./output)");
  console.error("  -r, --range <range>  Process subset of recipes (1-indexed)");
  console.error("                       Examples: 5-10, 5:, :10, 5");
  console.error("");
  console.error("Input file format (semicolon-separated):");
  console.error("  video_url;filename;video_lang;output_lang;time_range");
  console.error("");
  console.error("Examples:");
  console.error("  tsx bulk-recipe-processor.ts recipes.txt");
  console.error("  tsx bulk-recipe-processor.ts recipes.txt -o ./my-output");
  console.error("  tsx bulk-recipe-processor.ts recipes.txt --range 5-10");
  console.error("  tsx bulk-recipe-processor.ts recipes.txt -r 5: -o ./output");
};

const main = async () => {
  const { inputFile, outputDir, rangeStr } = parseArgs(process.argv.slice(2));

  if (!inputFile) {
    printUsage();
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY environment variable is required");
    process.exit(1);
  }

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const parsed = parseInputFile(inputFile);
  const parseErrors = parsed.filter((item) => !isVideoConfig(item));
  const allConfigs = parsed.filter(isVideoConfig);

  if (parseErrors.length > 0) {
    console.log("Parse errors in input file:");
    for (const err of parseErrors) {
      if ("error" in err) {
        console.log(`  ${err.error}`);
      }
    }
    console.log("");
  }

  if (allConfigs.length === 0) {
    console.error("No valid video configurations found in input file");
    process.exit(1);
  }

  const range = rangeStr ? parseRange(rangeStr, allConfigs.length) : null;
  const configs = range ? allConfigs.slice(range.start, range.end) : allConfigs;

  if (range) {
    console.log(`Processing recipes ${range.start + 1}-${range.end} of ${allConfigs.length}...`);
  } else {
    console.log(`Processing ${configs.length} video(s)...`);
  }
  console.log(`Output directory: ${outputDir}`);
  console.log("");

  const result = await processVideos(configs, outputDir, apiKey);

  if (result.archivePaths.length > 0) {
    console.log("");
    console.log("Organizing output...");
    await organizeOutput(outputDir, result.archivePaths);
  }

  console.log("");
  console.log("Done!");
  console.log(`  Successful: ${result.successful}`);
  console.log(`  Failed: ${result.failed}`);

  if (result.failed > 0) {
    console.log(`  See ${join(outputDir, "_errors.log")} for details`);
  }
};

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
