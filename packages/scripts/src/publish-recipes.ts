import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { cancel, confirm, isCancel } from "@clack/prompts";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { insertRecipe, markDoneByUrl } from "./lib/d1Inbox.js";
import { uploadMedia } from "./lib/r2.js";

type RecipeFolder = {
  readonly slug: string;
  readonly dir: string;
  readonly recipeJsonPath: string;
  readonly videoPath: string | null;
  readonly thumbnailPath: string | null;
};

const findFile = (dir: string, predicate: (name: string) => boolean): string | null => {
  const match = readdirSync(dir).find(predicate);
  return match ? join(dir, match) : null;
};

const readRecipeFolders = (recipesDir: string): ReadonlyArray<RecipeFolder> => {
  if (!existsSync(recipesDir)) {
    return [];
  }

  return readdirSync(recipesDir)
    .map((name) => join(recipesDir, name))
    .filter((path) => statSync(path).isDirectory())
    .map((dir): RecipeFolder => {
      const slug = basename(dir);
      const recipeJsonPath =
        findFile(dir, (name) => name === `${slug}.json`) ??
        findFile(dir, (name) => name === "recipe.json") ??
        findFile(dir, (name) => name.endsWith(".json") && name !== "meta.json");

      return {
        slug,
        dir,
        recipeJsonPath: recipeJsonPath ?? "",
        videoPath: findFile(dir, (name) => name.endsWith(".mp4")),
        thumbnailPath: findFile(dir, (name) => name.endsWith(".jpg")),
      };
    })
    .filter((folder) => folder.recipeJsonPath !== "");
};

const publishFolder = async (folder: RecipeFolder): Promise<void> => {
  const data = readFileSync(folder.recipeJsonPath, "utf-8");
  const parsed = JSON.parse(data) as { source_url?: string };

  if (folder.videoPath) {
    await uploadMedia(`videos/${folder.slug}.mp4`, folder.videoPath, "video/mp4");
  }

  if (folder.thumbnailPath) {
    await uploadMedia(`thumbnails/${folder.slug}.jpg`, folder.thumbnailPath, "image/jpeg");
  }

  await insertRecipe(folder.slug, data);

  if (parsed.source_url) {
    await markDoneByUrl(parsed.source_url);
  }

  rmSync(folder.dir, { recursive: true, force: true });
};

const main = async (): Promise<void> => {
  const argv = await yargs(hideBin(process.argv))
    .scriptName("publish-recipes")
    .usage("$0 [options]")
    .option("input", {
      alias: "i",
      describe: "Directory holding the reviewed recipes",
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

  const recipesDir = join(argv.input, "recipes");
  const folders = readRecipeFolders(recipesDir);

  if (folders.length === 0) {
    console.log(`No recipes to publish in ${recipesDir}`);
    return;
  }

  console.log(`Found ${folders.length} recipe(s) to publish:`);
  for (const folder of folders) {
    const assets = [folder.videoPath ? "video" : null, folder.thumbnailPath ? "thumb" : null]
      .filter(Boolean)
      .join(", ");
    console.log(`  - ${folder.slug}${assets ? ` (${assets})` : ""}`);
  }

  if (!argv.yes) {
    const proceed = await confirm({
      message: `Publish ${folders.length} recipe(s) to cookmark?`,
      initialValue: true,
    });
    if (isCancel(proceed) || !proceed) {
      cancel("Aborted.");
      return;
    }
  }

  const outcomes = [];
  for (const folder of folders) {
    try {
      console.log(`Publishing ${folder.slug}...`);
      await publishFolder(folder);
      outcomes.push({ slug: folder.slug, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  Failed: ${message}`);
      outcomes.push({ slug: folder.slug, success: false });
    }
  }

  const published = outcomes.filter((outcome) => outcome.success).length;

  console.log("");
  console.log("Done!");
  console.log(`  Published: ${published}`);
  console.log(`  Failed: ${outcomes.length - published}`);
};

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
