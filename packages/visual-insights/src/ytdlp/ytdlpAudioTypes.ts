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

// Output template options
export type OutputTemplate =
  | "%(title)s.%(ext)s"
  | "%(channel)s - %(title)s.%(ext)s"
  | "%(uploader)s - %(title)s.%(ext)s"
  | "%(upload_date)s - %(uploader)s - %(title)s [%(duration)s].%(ext)s"
  | string; // Allow custom templates
