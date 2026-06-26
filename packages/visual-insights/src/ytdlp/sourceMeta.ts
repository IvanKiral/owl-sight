import { readFile } from "node:fs/promises";
import { error, success, type WithError } from "shared";
import { z } from "zod";

const SourceMetaSchema = z.object({
  uploader: z.string().optional(),
  channel: z.string().optional(),
});

export type RecipeSourceMeta = {
  readonly author?: string;
};

export const extractSourceMeta = async (
  metadataFilePath: string,
): Promise<WithError<RecipeSourceMeta, string>> => {
  try {
    const fileData = await readFile(metadataFilePath, "utf-8");
    const parsed = SourceMetaSchema.safeParse(JSON.parse(fileData));

    if (!parsed.success) {
      return error(
        `Failed to parse source metadata: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
      );
    }

    return success({
      author: parsed.data.channel ?? parsed.data.uploader,
    });
  } catch (e) {
    return error(
      `Failed to read source metadata '${metadataFilePath}': ${e instanceof Error ? e.message : String(e)}`,
    );
  }
};
