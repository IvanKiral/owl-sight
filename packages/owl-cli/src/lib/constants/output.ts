export const OUTPUT_FORMATS = ["json", "markdown"] as const;

export type OutputFormat = (typeof OUTPUT_FORMATS)[number];
