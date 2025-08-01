export type WhisperModel =
  | "tiny"
  | "base"
  | "small"
  | "medium"
  | "large"
  | "turbo"
  | "large-v3";

export type WhisperOutputFormat =
  | "txt"
  | "vtt"
  | "srt"
  | "tsv"
  | "json"
  | "all";

export type WhisperTask = "transcribe" | "translate";

export type WhisperDevice = "cpu" | "cuda";

export type WhisperLanguage =
  | "af"
  | "am"
  | "ar"
  | "as"
  | "az"
  | "ba"
  | "be"
  | "bg"
  | "bn"
  | "bo"
  | "br"
  | "bs"
  | "ca"
  | "cs"
  | "cy"
  | "da"
  | "de"
  | "el"
  | "en"
  | "es"
  | "et"
  | "eu"
  | "fa"
  | "fi"
  | "fo"
  | "fr"
  | "gl"
  | "gu"
  | "ha"
  | "haw"
  | "he"
  | "hi"
  | "hr"
  | "ht"
  | "hu"
  | "hy"
  | "id"
  | "is"
  | "it"
  | "ja"
  | "jw"
  | "ka"
  | "kk"
  | "km"
  | "kn"
  | "ko"
  | "la"
  | "lb"
  | "ln"
  | "lo"
  | "lt"
  | "lv"
  | "mg"
  | "mi"
  | "mk"
  | "ml"
  | "mn"
  | "mr"
  | "ms"
  | "mt"
  | "my"
  | "ne"
  | "nl"
  | "nn"
  | "no"
  | "oc"
  | "pa"
  | "pl"
  | "ps"
  | "pt"
  | "ro"
  | "ru"
  | "sa"
  | "sd"
  | "si"
  | "sk"
  | "sl"
  | "sn"
  | "so"
  | "sq"
  | "sr"
  | "su"
  | "sv"
  | "sw"
  | "ta"
  | "te"
  | "tg"
  | "th"
  | "tk"
  | "tl"
  | "tr"
  | "tt"
  | "uk"
  | "ur"
  | "uz"
  | "vi"
  | "yi"
  | "yo"
  | "yue"
  | "zh";

export type WhisperOptions = {
  audioPath: string;
  model?: WhisperModel;
  language?: WhisperLanguage;
  outputFormat?: WhisperOutputFormat;
  outputDir?: string;
  task?: WhisperTask;
  device?: WhisperDevice;
  /** Extract word-level timestamps for precise timing information */
  wordTimestamps?: boolean;
  /** Temperature for sampling. 0 = deterministic, higher values = more random */
  temperature?: number;
  /** Number of beams in beam search. Higher = better quality but slower. Only applies when temperature is 0 */
  beamSize?: number;
  /** Number of candidates when sampling with non-zero temperature */
  bestOf?: number;
  /** Number of threads used by torch for CPU inference */
  threads?: number;
  /** Whether to perform inference in fp16 (16-bit floating point). Reduces memory usage */
  fp16?: boolean;
  verbose?: "True" | "False";
  /** If gzip compression ratio exceeds this value, treat decoding as failed */
  compressionRatioThreshold?: number;
  /** If average log probability is below this value, treat decoding as failed */
  logprobThreshold?: number;
  /** Probability threshold for detecting silence segments */
  noSpeechThreshold?: number;
  /** Optional text to provide as context for the first audio window */
  initialPrompt?: string;
  /** If true, use previous output as prompt for next window. May cause repetition loops */
  conditionOnPreviousText?: boolean;
};
