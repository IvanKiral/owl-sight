import {
  appendFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
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
const DELAY_BETWEEN_VIDEOS_MS = 10_000;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

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

  const rootFiles = readdirSync(outputDir);
  for (const file of rootFiles) {
    if (extname(file).toLowerCase() === ".json" && file !== "_errors.log") {
      const srcPath = join(outputDir, file);
      const destPath = join(recipesDir, file);
      renameSync(srcPath, destPath);
    }
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
    archive: archiveFilename
      ? { outputPath: outputDir, include: ["video"], filename: archiveFilename }
      : undefined,
  });

  if (!result.success) {
    console.log(`  Failed: ${result.error}`);
    logError(outputDir, config.url, result.error);
    return { error: { url: config.url, error: result.error }, archivePath: null };
  }

  const filename = config.filename
    ? `${sanitizeFilename(config.filename)}.json`
    : `recipe-${sanitizeFilename(new URL(config.url).pathname)}-${Date.now()}.json`;

  const outputPath = join(outputDir, filename);
  const content =
    result.result.content.format === "json"
      ? JSON.stringify(result.result.content.parsed, null, 2)
      : result.result.content.parsed;

  writeFileSync(outputPath, content);
  console.log(`  Saved: ${filename}`);

  return { error: null, archivePath };
};

type ProcessVideosResult = ProcessingResult & {
  archivePaths: ReadonlyArray<string>;
};

const processVideos = async (
  configs: ReadonlyArray<VideoConfig>,
  outputDir: string,
  apiKey: string,
): Promise<ProcessVideosResult> => {
  const schema = await compileRecipeSchema(DEFAULT_RECIPE_SCHEMA);
  const errors: ProcessingError[] = [];
  const archivePaths: string[] = [];
  let successful = 0;

  for (const [index, config] of configs.entries()) {
    if (index > 0) {
      console.log(`  Waiting ${DELAY_BETWEEN_VIDEOS_MS / 1000}s before next video...`);
      await sleep(DELAY_BETWEEN_VIDEOS_MS);
    }

    const result = await processVideo(config, outputDir, apiKey, schema, index, configs.length);

    if (result.error) {
      errors.push(result.error);
    } else {
      successful++;
      if (result.archivePath) {
        archivePaths.push(result.archivePath);
      }
    }
  }

  return {
    successful,
    failed: errors.length,
    errors,
    archivePaths,
  };
};

const main = async () => {
  const inputFile = process.argv[2];
  const outputDir = process.argv[3] || "./output";

  if (!inputFile) {
    console.error("Usage: tsx bulk-recipe-processor.ts <input.txt> [output-dir]");
    console.error("");
    console.error("Input file format (semicolon-separated):");
    console.error("  video_url;filename;video_lang;output_lang;range");
    console.error("");
    console.error("Examples:");
    console.error("  https://youtube.com/watch?v=abc123");
    console.error("  https://youtube.com/watch?v=def456;pasta-carbonara");
    console.error("  https://youtube.com/watch?v=ghi789;ramen;ja;English;30:300");
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
  const configs = parsed.filter(isVideoConfig);

  if (parseErrors.length > 0) {
    console.log("Parse errors in input file:");
    for (const err of parseErrors) {
      if ("error" in err) {
        console.log(`  ${err.error}`);
      }
    }
    console.log("");
  }

  if (configs.length === 0) {
    console.error("No valid video configurations found in input file");
    process.exit(1);
  }

  console.log(`Processing ${configs.length} video(s)...`);
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
