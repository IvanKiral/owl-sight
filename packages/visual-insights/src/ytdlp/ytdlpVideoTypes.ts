export type MergeOutputFormat = "mkv" | "mp4" | "webm" | "mov" | "avi";

export type VideoCodec = "av01" | "vp9" | "h264" | "h265";

export type AudioCodec = "opus" | "aac" | "mp3" | "vorbis";

export type VideoQualityOptions = {
  maxHeight?: 360 | 480 | 720 | 1080 | 1440 | 2160;
  maxFps?: 24 | 30 | 60;
  preferredVideoCodec?: VideoCodec;
  preferredAudioCodec?: AudioCodec;
};
