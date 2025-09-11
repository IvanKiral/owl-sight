import { match } from "ts-pattern";
import { APP_NAME, SCHEMA_FILENAME } from "./constants/app.js";
import path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";
import { DEFAULT_RECIPE_SCHEMA } from "./constants/defaultRecipeSchema.js";
import { compileFromFile } from "json-schema-to-typescript";
import { type WithError, success, error } from "shared";

const getUserConfigDirectory = () => {
  const platform = process.platform;
  const env = process.env;

  return match(platform)
    .with("linux", () => {
      const base = env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
      return path.join(base, APP_NAME);
    })
    .with("darwin", () => {
      return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        APP_NAME
      );
    })
    .with("win32", () => {
      const base = env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
      return path.join(base, APP_NAME);
    })
    .otherwise(() => {
      return path.join(os.homedir(), ".config", APP_NAME);
    });
};

const fileExists = async (path: string): Promise<WithError<boolean, string>> => {
  try {
    await fs.stat(path);
    return success(true);
  } catch (err) {
    if (err instanceof Error && err.message.includes("ENOENT")) {
      return success(false);
    }
    return error(
      `Failed to check file existence: ${err instanceof Error ? err.message : String(err)}`
    );
  }
};

export const userRecipeConfigSchemaPath = path.join(
  getUserConfigDirectory(),
  SCHEMA_FILENAME
);

export const resolveDefaultRecipeSchema = async (): Promise<WithError<{ path: string; schema: string }, string>> => {
  const fileExistsResult = await fileExists(userRecipeConfigSchemaPath);
  
  if (!fileExistsResult.success) {
    return error(fileExistsResult.error);
  }
  
  try {
    if (!fileExistsResult.result) {
      await fs.mkdir(path.dirname(userRecipeConfigSchemaPath), {
        recursive: true,
      });
      await fs.writeFile(
        userRecipeConfigSchemaPath,
        JSON.stringify(DEFAULT_RECIPE_SCHEMA, null, 2),
        "utf8"
      );
    }

    const schema = await compileFromFile(userRecipeConfigSchemaPath);
    return success({ path: userRecipeConfigSchemaPath, schema });
  } catch (err) {
    return error(
      `Failed to resolve recipe schema: ${err instanceof Error ? err.message : String(err)}`
    );
  }
};
