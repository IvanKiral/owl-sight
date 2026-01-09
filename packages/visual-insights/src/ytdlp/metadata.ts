import { readFile } from "node:fs/promises";
import camelcaseKeys from "camelcase-keys";
import { error, success, type WithError } from "shared";
import type z from "zod";
import {
  type YtDlpInstagramMetadataKeys,
  type YtDlpInstagramReelMetadata,
  YtDlpInstagramReelMetadataSchema,
  type YtDlpYoutubeMetadaKeys,
  type YtDlpYoutubeMetadata,
  YtDlpYoutubeMetadataSchema,
} from "./ytdlpTypes.js";

const camelize = <T extends Record<string, unknown>>(val: T) => camelcaseKeys(val);

const parseMetadataFromYoutube = <K extends readonly YtDlpYoutubeMetadaKeys[]>(
  jsonString: string,
  metadataKeys: K,
): WithError<Pick<YtDlpYoutubeMetadata, K[number]>, string> => {
  return parseMetadata(YtDlpYoutubeMetadataSchema, metadataKeys, jsonString);
};

const parseMetadataFromInstagram = <K extends readonly YtDlpInstagramMetadataKeys[]>(
  jsonString: string,
  metadataKeys: K,
): WithError<Pick<YtDlpInstagramReelMetadata, K[number]>, string> => {
  return parseMetadata(YtDlpInstagramReelMetadataSchema, metadataKeys, jsonString);
};

const parseMetadata = <S extends z.ZodObject, K extends readonly (keyof z.infer<S>)[]>(
  schema: S,
  keys: K,
  data: unknown,
): WithError<Pick<Required<z.infer<S>>, K[number]>, string> => {
  const pickObj = Object.fromEntries(keys.map((k) => [k, true])) as {
    [P in K[number]]: true;
  };

  const result = schema.required().pick(pickObj).safeParse(data);

  if (!result.success) {
    return error(`Validation failed: ${result.error.issues.map((i) => i.message).join("; ")}`);
  }

  return success(result.data as unknown as Pick<Required<z.infer<S>>, K[number]>);
};

export type VideoMetadata =
  | {
      type: "youtube";
      metadata: ReadonlyArray<YtDlpYoutubeMetadaKeys>;
    }
  | {
      type: "instagram";
      metadata: ReadonlyArray<YtDlpInstagramMetadataKeys>;
    };

export async function extractMetadata<K extends readonly YtDlpYoutubeMetadaKeys[]>(
  filePath: string,
  options: { type: "youtube"; metadata: K },
): Promise<WithError<Pick<YtDlpYoutubeMetadata, K[number]>, string>>;

export async function extractMetadata<K extends readonly YtDlpInstagramMetadataKeys[]>(
  filePath: string,
  options: { type: "instagram"; metadata: K },
): Promise<WithError<Pick<YtDlpInstagramReelMetadata, K[number]>, string>>;

export async function extractMetadata(
  filePath: string,
  options: VideoMetadata,
  // biome-ignore lint/suspicious/noExplicitAny: Implementation signature for overloaded function
): Promise<WithError<any, string>> {
  try {
    const fileData = await readFile(filePath, "utf-8");
    const jsonData: unknown = JSON.parse(fileData);

    const parseResult =
      options.type === "youtube"
        ? parseMetadataFromYoutube(jsonData as string, options.metadata)
        : parseMetadataFromInstagram(jsonData as string, options.metadata);

    if (!parseResult.success) {
      return error(
        `Failed to extract ${options.type} metadata from '${filePath}': ${parseResult.error}`,
      );
    }

    return success(camelize(parseResult.result));
  } catch (e) {
    if (e instanceof SyntaxError) {
      return error(`Invalid JSON in metadata file '${filePath}': ${e.message}`);
    }
    return error(
      `Failed to read metadata file '${filePath}': ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
