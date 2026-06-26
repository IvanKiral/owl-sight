import {
  appendFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { cancel, confirm, isCancel, select, text } from "@clack/prompts";
import {
  AUTO_RECIPE_LANGUAGE,
  compileRecipeSchema,
  DEFAULT_RECIPE_SCHEMA,
  type RecipeLanguage,
  recipeFromVideo,
} from "core";
import unzipper from "unzipper";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { countPending, getPending, type InboxItem, markStatus } from "./lib/d1Inbox.js";
import {
  DEFAULT_MODEL_KEY,
  isModelKey,
  MODEL_KEYS,
  type ModelKey,
  mapToApiModel,
} from "./lib/models.js";

const MIN_DELAY_MS = 20_000;
const MAX_DELAY_MS = 30_000;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const randomDelayMs = (): number =>
  MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1));

const sanitizeSlug = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

const logError = (outputDir: string, url: string, message: string): void => {
  const timestamp = new Date().toISOString();
  appendFileSync(
    join(outputDir, "recipes", "_errors.log"),
    `[${timestamp}] ${url}\n  ${message}\n\n`,
  );
};

const extractAssets = async (zipPath: string, destDir: string, slug: string): Promise<void> => {
  const directory = await unzipper.Open.file(zipPath);

  for (const entry of directory.files) {
    const target = entry.path.endsWith(".mp4")
      ? `${slug}.mp4`
      : entry.path.endsWith(".jpg")
        ? `${slug}.jpg`
        : null;

    if (!target) {
      continue;
    }

    await pipeline(entry.stream(), createWriteStream(join(destDir, target)));
  }
};

type ProcessOutcome = { success: true; slug: string } | { success: false; error: string };

const processItem = async (
  item: InboxItem,
  outputDir: string,
  apiKey: string,
  schema: string,
  model: string,
  language: RecipeLanguage,
): Promise<ProcessOutcome> => {
  const tmpZip = join(outputDir, `.tmp-${item.id}.zip`);

  const result = await recipeFromVideo({
    url: item.url,
    apiKey,
    schema,
    model,
    outputFormat: "json",
    outputLanguage: language,
    archive: { outputPath: tmpZip, include: ["video", "thumbnail"] },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const recipe = result.result.content.parsed as { title?: string };
  const slug = recipe.title ? sanitizeSlug(recipe.title) : sanitizeSlug(new URL(item.url).pathname);
  const recipeDir = join(outputDir, "recipes", slug);
  mkdirSync(recipeDir, { recursive: true });

  writeFileSync(join(recipeDir, `${slug}.json`), JSON.stringify(recipe, null, 2));

  if (existsSync(tmpZip)) {
    await extractAssets(tmpZip, recipeDir, slug);
    unlinkSync(tmpZip);
  }

  return { success: true, slug };
};

type ProcessAcc = { successful: number; failed: number };

const processQueue = (
  items: ReadonlyArray<InboxItem>,
  outputDir: string,
  apiKey: string,
  schema: string,
  model: string,
  language: RecipeLanguage,
): Promise<ProcessAcc> => {
  const total = items.length;

  const processRecursive = async (
    remaining: ReadonlyArray<InboxItem>,
    index: number,
    acc: ProcessAcc,
  ): Promise<ProcessAcc> => {
    if (remaining.length === 0) {
      return acc;
    }

    const [item, ...rest] = remaining;

    if (index > 0) {
      const delay = randomDelayMs();
      console.log(`  Waiting ${Math.round(delay / 1000)}s before next recipe...`);
      await sleep(delay);
    }

    console.log(`[${index + 1}/${total}] ${item.url}`);
    const outcome = await processItem(item, outputDir, apiKey, schema, model, language);

    if (!outcome.success) {
      console.log(`  Failed (left in queue for retry): ${outcome.error}`);
      logError(outputDir, item.url, outcome.error);
      return processRecursive(rest, index + 1, { ...acc, failed: acc.failed + 1 });
    }

    console.log(`  Saved: recipes/${outcome.slug}`);
    await markStatus(item.id, "review");
    return processRecursive(rest, index + 1, { ...acc, successful: acc.successful + 1 });
  };

  return processRecursive(items, 0, { successful: 0, failed: 0 });
};

const ensure = <T>(value: T | symbol): T => {
  if (isCancel(value)) {
    cancel("Aborted.");
    process.exit(0);
  }
  return value;
};

const promptLimit = async (pending: number): Promise<number> => {
  const value = ensure(
    await text({
      message: `${pending} pending in queue. How many to process?`,
      initialValue: String(Math.min(pending, 5)),
      validate: (input) => {
        const parsed = Number(input);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          return "Enter a positive whole number";
        }
        return undefined;
      },
    }),
  );
  return Number(value);
};

const promptModel = async (): Promise<ModelKey> => {
  const value = ensure(
    await select({
      message: "Which model?",
      options: MODEL_KEYS.map((key) => ({ value: key, label: key, hint: mapToApiModel(key) })),
      initialValue: DEFAULT_MODEL_KEY,
    }),
  );
  return value as ModelKey;
};

const COMMON_LANGUAGES = ["Slovak", "Czech", "English"] as const;

const promptLanguage = async (): Promise<RecipeLanguage> => {
  const choice = ensure(
    await select({
      message: "Output language?",
      options: [
        { value: AUTO_RECIPE_LANGUAGE, label: "Auto (Czech → Czech, otherwise Slovak)" },
        ...COMMON_LANGUAGES.map((language) => ({ value: language, label: language })),
        { value: "__other__", label: "Other…" },
      ],
      initialValue: AUTO_RECIPE_LANGUAGE,
    }),
  );

  if (choice !== "__other__") {
    return choice as RecipeLanguage;
  }

  const custom = ensure(
    await text({
      message: "Enter the output language:",
      placeholder: "e.g. German",
      validate: (input) => (input?.trim() ? undefined : "Language is required"),
    }),
  );
  return custom as RecipeLanguage;
};

const promptConfirm = async (count: number, model: ModelKey): Promise<boolean> => {
  return ensure(
    await confirm({
      message: `Process ${count} recipe(s) with ${model}?`,
      initialValue: true,
    }),
  );
};

const main = async (): Promise<void> => {
  const argv = await yargs(hideBin(process.argv))
    .scriptName("queue-recipe")
    .usage("$0 [options]")
    .option("limit", { alias: "n", describe: "How many recipes to process", type: "number" })
    .option("model", {
      alias: "m",
      describe: "Model key",
      type: "string",
      choices: [...MODEL_KEYS],
    })
    .option("language", {
      alias: "l",
      describe: "Output language for the recipe (skips the language prompt)",
      type: "string",
    })
    .option("output", {
      alias: "o",
      describe: "Output directory",
      type: "string",
      default: "./output",
    })
    .option("yes", {
      alias: "y",
      describe: "Skip the confirmation prompt",
      type: "boolean",
      default: false,
    })
    .help()
    .parse();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY environment variable is required");
    process.exit(1);
  }

  const outputDir = argv.output;

  const pending = await countPending();
  if (pending === 0) {
    console.log("No pending recipes in the queue.");
    return;
  }

  const limit = argv.limit ?? (await promptLimit(pending));
  if (!limit || limit <= 0) {
    console.log("Nothing to process.");
    return;
  }

  const modelKey: ModelKey =
    argv.model && isModelKey(argv.model) ? argv.model : await promptModel();

  const language: RecipeLanguage = argv.language
    ? (argv.language as RecipeLanguage)
    : await promptLanguage();

  if (!argv.yes) {
    const confirmed = await promptConfirm(Math.min(limit, pending), modelKey);
    if (!confirmed) {
      console.log("Aborted.");
      return;
    }
  }

  const items = await getPending(limit);
  if (items.length === 0) {
    console.log("No pending recipes in the queue.");
    return;
  }

  mkdirSync(join(outputDir, "recipes"), { recursive: true });

  const schema = await compileRecipeSchema(DEFAULT_RECIPE_SCHEMA);

  console.log(`Processing ${items.length} recipe(s) with ${mapToApiModel(modelKey)}...`);
  console.log(`Output directory: ${join(outputDir, "recipes")}`);
  console.log("");

  const result = await processQueue(
    items,
    outputDir,
    apiKey,
    schema,
    mapToApiModel(modelKey),
    language,
  );

  console.log("");
  console.log("Done!");
  console.log(`  Saved for review: ${result.successful}`);
  console.log(`  Failed: ${result.failed}`);
};

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
