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

export const WHISPER_LANGUAGES = [
  "af",
  "am",
  "ar",
  "as",
  "az",
  "ba",
  "be",
  "bg",
  "bn",
  "bo",
  "br",
  "bs",
  "ca",
  "cs",
  "cy",
  "da",
  "de",
  "el",
  "en",
  "es",
  "et",
  "eu",
  "fa",
  "fi",
  "fo",
  "fr",
  "gl",
  "gu",
  "ha",
  "haw",
  "he",
  "hi",
  "hr",
  "ht",
  "hu",
  "hy",
  "id",
  "is",
  "it",
  "ja",
  "jw",
  "ka",
  "kk",
  "km",
  "kn",
  "ko",
  "la",
  "lb",
  "ln",
  "lo",
  "lt",
  "lv",
  "mg",
  "mi",
  "mk",
  "ml",
  "mn",
  "mr",
  "ms",
  "mt",
  "my",
  "ne",
  "nl",
  "nn",
  "no",
  "oc",
  "pa",
  "pl",
  "ps",
  "pt",
  "ro",
  "ru",
  "sa",
  "sd",
  "si",
  "sk",
  "sl",
  "sn",
  "so",
  "sq",
  "sr",
  "su",
  "sv",
  "sw",
  "ta",
  "te",
  "tg",
  "th",
  "tk",
  "tl",
  "tr",
  "tt",
  "uk",
  "ur",
  "uz",
  "vi",
  "yi",
  "yo",
  "yue",
  "zh",
] as const;

export type WhisperLanguage = (typeof WHISPER_LANGUAGES)[number];

export const WHISPER_LANGUAGE_MAP = {
  af: "Afrikaans",
  am: "Amharic",
  ar: "Arabic",
  as: "Assamese",
  az: "Azerbaijani",
  ba: "Bashkir",
  be: "Belarusian",
  bg: "Bulgarian",
  bn: "Bengali",
  bo: "Tibetan",
  br: "Breton",
  bs: "Bosnian",
  ca: "Catalan",
  cs: "Czech",
  cy: "Welsh",
  da: "Danish",
  de: "German",
  el: "Greek",
  en: "English",
  es: "Spanish",
  et: "Estonian",
  eu: "Basque",
  fa: "Persian",
  fi: "Finnish",
  fo: "Faroese",
  fr: "French",
  gl: "Galician",
  gu: "Gujarati",
  ha: "Hausa",
  haw: "Hawaiian",
  he: "Hebrew",
  hi: "Hindi",
  hr: "Croatian",
  ht: "Haitian Creole",
  hu: "Hungarian",
  hy: "Armenian",
  id: "Indonesian",
  is: "Icelandic",
  it: "Italian",
  ja: "Japanese",
  jw: "Javanese",
  ka: "Georgian",
  kk: "Kazakh",
  km: "Khmer",
  kn: "Kannada",
  ko: "Korean",
  la: "Latin",
  lb: "Luxembourgish",
  ln: "Lingala",
  lo: "Lao",
  lt: "Lithuanian",
  lv: "Latvian",
  mg: "Malagasy",
  mi: "Maori",
  mk: "Macedonian",
  ml: "Malayalam",
  mn: "Mongolian",
  mr: "Marathi",
  ms: "Malay",
  mt: "Maltese",
  my: "Myanmar",
  ne: "Nepali",
  nl: "Dutch",
  nn: "Norwegian Nynorsk",
  no: "Norwegian",
  oc: "Occitan",
  pa: "Punjabi",
  pl: "Polish",
  ps: "Pashto",
  pt: "Portuguese",
  ro: "Romanian",
  ru: "Russian",
  sa: "Sanskrit",
  sd: "Sindhi",
  si: "Sinhala",
  sk: "Slovak",
  sl: "Slovenian",
  sn: "Shona",
  so: "Somali",
  sq: "Albanian",
  sr: "Serbian",
  su: "Sundanese",
  sv: "Swedish",
  sw: "Swahili",
  ta: "Tamil",
  te: "Telugu",
  tg: "Tajik",
  th: "Thai",
  tk: "Turkmen",
  tl: "Tagalog",
  tr: "Turkish",
  tt: "Tatar",
  uk: "Ukrainian",
  ur: "Urdu",
  uz: "Uzbek",
  vi: "Vietnamese",
  yi: "Yiddish",
  yo: "Yoruba",
  yue: "Cantonese",
  zh: "Chinese",
} as const satisfies Record<WhisperLanguage, string>;

export type WhisperLanguageName =
  (typeof WHISPER_LANGUAGE_MAP)[WhisperLanguage];

export const getLanguageName = (code: WhisperLanguage): WhisperLanguageName =>
  WHISPER_LANGUAGE_MAP[code];

export const isValidLanguageCode = (code: string): code is WhisperLanguage =>
  code in WHISPER_LANGUAGE_MAP;

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
