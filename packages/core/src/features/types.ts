export type ArchiveInclude = "video" | "transcription" | "metadata" | "result" | "thumbnail";

export type ArchiveConfig = {
  readonly outputPath: string;
  readonly include: ReadonlyArray<ArchiveInclude>;
  readonly filename?: string;
};
