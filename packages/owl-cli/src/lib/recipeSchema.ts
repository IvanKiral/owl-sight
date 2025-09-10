import { match } from "ts-pattern";
import { APP_NAME, SCHEMA_FILENAME } from "./constants/app.js";
import path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";
import { DEFAULT_RECIPE_SCHEMA } from "./constants/defaultRecipeSchema.js";

const getUserConfigDirectory = () => {
  const platform = process.platform;
  const env = process.env;

  return match(platform)
    .with("linux", () => {
      const base = env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
      return path.join(base, APP_NAME);
    })
    .with("darwin", () => {
      return path.join(os.homedir(), "Library", "Application Support", APP_NAME);
    })
    .with("win32", () => {
      const base = env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
      return path.join(base, APP_NAME);
    })
    .otherwise(() => {
      return path.join(os.homedir(), ".config", APP_NAME);
    });
};

const userRecipeConfigSchemaPath = path.join(getUserConfigDirectory(), SCHEMA_FILENAME);

export const resolveRecipeSchema = async () => {
  if (!(await fs.stat(userRecipeConfigSchemaPath))) {
    await fs.mkdir(path.dirname(userRecipeConfigSchemaPath), { recursive: true });
    await fs.writeFile(
      userRecipeConfigSchemaPath,
      JSON.stringify(DEFAULT_RECIPE_SCHEMA, null, 2),
      "utf8",
    );
  }

  const raw = await fs.readFile(userRecipeConfigSchemaPath, "utf8");
  return { path: userRecipeConfigSchemaPath, schema: JSON.parse(raw) };
};
