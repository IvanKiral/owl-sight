import * as fs from "node:fs";
import archiver from "archiver";
import { error, success, type WithError } from "shared";

export type ArchiveContentEntry = {
  readonly name: string;
  readonly content: string;
};

export type ArchiveFileEntry = {
  readonly name: string;
  readonly filePath: string;
};

export type ArchiveEntry = ArchiveContentEntry | ArchiveFileEntry;

export type CreateArchiveOptions = {
  readonly outputPath: string;
  readonly entries: ReadonlyArray<ArchiveEntry>;
};

const isFileEntry = (entry: ArchiveEntry): entry is ArchiveFileEntry => "filePath" in entry;

export const createArchive = (options: CreateArchiveOptions): Promise<WithError<string, string>> =>
  new Promise((resolve) => {
    const output = fs.createWriteStream(options.outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      resolve(success(options.outputPath));
    });

    archive.on("error", (err) => {
      resolve(error(`Archive creation failed: ${err.message}`));
    });

    archive.pipe(output);

    for (const entry of options.entries) {
      if (isFileEntry(entry)) {
        archive.file(entry.filePath, { name: entry.name });
      } else {
        archive.append(entry.content, { name: entry.name });
      }
    }

    archive.finalize();
  });
