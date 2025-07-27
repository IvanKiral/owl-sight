import camelcaseKeys from "camelcase-keys";
import { readFile } from "fs/promises";
import z from "zod";
import {
  YtDlpYoutubeMetadaKeys,
  YtDlpYoutubeMetadataSchema,
  YtDlpYoutubeMetadata,
  YtDlpInstagramMetadataKeys,
  YtDlpInstagramReelMetadataSchema,
  YtDlpInstagramReelMetadata,
} from "./ytdlpTypes.js";

const camelize = <T extends Record<string, unknown>>(val: T) =>
  camelcaseKeys(val);

const parseMetadataFromYoutube = <K extends readonly YtDlpYoutubeMetadaKeys[]>(
  jsonString: string,
  metadataKeys: K,
) => {
  return parseMetadata(YtDlpYoutubeMetadataSchema, metadataKeys, jsonString);
};

const parseMetadataFromInstagram = <
  K extends readonly YtDlpInstagramMetadataKeys[],
>(
  jsonString: string,
  metadataKeys: K,
) => {
  return parseMetadata(
    YtDlpInstagramReelMetadataSchema,
    metadataKeys,
    jsonString,
  );
};

const parseMetadata = <
  S extends z.ZodObject,
  K extends readonly (keyof z.infer<S>)[],
>(
  schema: S,
  keys: K,
  data: unknown,
) => {
  const pickObj = Object.fromEntries(keys.map((k) => [k, true])) as {
    [P in K[number]]: true;
  };

  return schema.required().pick(pickObj).parse(data) as unknown as Pick<
    Required<z.infer<S>>,
    K[number]
  >;
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
  options: { type: "youtube"; metadata: K }
): Promise<Pick<YtDlpYoutubeMetadata, K[number]>>;

export async function extractMetadata<K extends readonly YtDlpInstagramMetadataKeys[]>(
  filePath: string,
  options: { type: "instagram"; metadata: K }
): Promise<Pick<YtDlpInstagramReelMetadata, K[number]>>;

export async function extractMetadata(
  filePath: string,
  options: VideoMetadata,
) {
  try {
    const fileData = await readFile(filePath, "utf-8");
    const jsonData = JSON.parse(fileData);

    if (options.type === "youtube") {
      return camelize(parseMetadataFromYoutube(jsonData, options.metadata));
    } else {
      return camelize(parseMetadataFromInstagram(jsonData, options.metadata));
    }
  } catch (e) {
    console.error("yt-dlp failed to extract metadata:", e);
    throw new Error(`Failed to extract metadata: ${e}`);
  }
};
