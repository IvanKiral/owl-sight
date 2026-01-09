// Audio format options for yt-dlp
export type AudioFormat =
  | "wav"
  | "flac"
  | "m4a"
  | "mp3"
  | "aac"
  | "alac"
  | "opus"
  | "vorbis"
  | "best";

// Audio quality can be a number (0-10) or a bitrate string
export type AudioQuality = number | `${number}K` | `${number}k`;

// Format selection options
export type FormatSelection =
  | "bestaudio/best"
  | "bestaudio"
  | "best"
  | `bestaudio[abr>=${number}]`
  | `bestaudio[abr<=${number}]`
  | `bestaudio[asr>=${number}]`
  | `bestaudio[asr=${number}]`
  | `bestaudio[acodec=${string}]`
  | `bestaudio[acodec^=${string}]`
  | `bestaudio[ext=${string}]`
  | `ba`
  | `ba*`;

// Output template options - allows any string for custom templates
export type OutputTemplate = string;
