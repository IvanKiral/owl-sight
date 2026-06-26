export const MODEL_MAP = {
  "gemma-4": "gemma-4-31b-it",
  "gemma-4-fast": "gemma-4-26b-a4b-it",
  "gemini-flash": "gemini-flash-latest",
  "gemini-flash-lite": "gemini-flash-lite-latest",
} as const;

export type ModelKey = keyof typeof MODEL_MAP;

export const MODEL_KEYS = Object.keys(MODEL_MAP) as ReadonlyArray<ModelKey>;

export const DEFAULT_MODEL_KEY: ModelKey = "gemma-4";

export const mapToApiModel = (key: ModelKey): string => MODEL_MAP[key];

export const isModelKey = (value: string): value is ModelKey => value in MODEL_MAP;
