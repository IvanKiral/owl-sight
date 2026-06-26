import { execa } from "execa";

const MEDIA_BUCKET = "cookmark";

export const uploadMedia = async (
  key: string,
  filePath: string,
  contentType: string,
): Promise<void> => {
  await execa("wrangler", [
    "r2",
    "object",
    "put",
    `${MEDIA_BUCKET}/${key}`,
    "--file",
    filePath,
    "--content-type",
    contentType,
    "--remote",
  ]);
};
