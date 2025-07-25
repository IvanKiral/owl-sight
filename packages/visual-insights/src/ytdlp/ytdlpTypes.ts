import { z } from "zod";

export const YtDlpYoutubeChapterSchema = z.object({
  start_time: z.number(),
  end_time: z.number(),
  title: z.string().optional(),
});

export const YtDlpYoutubeSubtitleFormatSchema = z.object({
  ext: z.string(),
  url: z.string(),
  name: z.string().optional(),
});

export const YtDlpInstagramCommentSchema = z.object({
  author: z.string(),
  text: z.string(),
});

export const YtDlpYoutubeMetadataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  channel: z.string().optional(),
  uploader: z.string().optional(),
  upload_date: z.string().optional(),
  timestamp: z.number().optional(),
  duration: z.number().optional(),
  duration_string: z.string().optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  chapters: z.array(YtDlpYoutubeChapterSchema).optional(),
  language: z.string().optional(),
  location: z.string().optional(),
  view_count: z.number().optional(),
  like_count: z.number().optional(),
  comment_count: z.number().optional(),
  webpage_url: z.string(),
  extractor: z.literal("youtube"),
  extractor_key: z.literal("Youtube"),
  is_live: z.boolean().optional(),
  was_live: z.boolean().optional(),
  age_limit: z.number().optional(),
  series: z.string().optional(),
  episode: z.string().optional(),
  thumbnail: z.string().optional(),
  subtitles: z
    .record(z.string(), z.array(YtDlpYoutubeSubtitleFormatSchema))
    .optional(),
  automatic_captions: z
    .record(z.string(), z.array(YtDlpYoutubeSubtitleFormatSchema))
    .optional(),
});

export const YtDlpInstagramReelMetadataSchema = z.object({
  description: z.string().optional(),
  channel: z.string(),
  uploader: z.string(),
  duration: z.number(),
  timestamp: z.number(),
  upload_date: z.string(),
  like_count: z.number().optional(),
  comment_count: z.number().optional(),
  comments: z.array(YtDlpInstagramCommentSchema).optional(),
  extractor: z.literal("Instagram"),
  extractor_key: z.literal("Instagram"),
});

// CamelCase types inferred from transformed schemas
export type YtDlpYoutubeChapter = z.infer<typeof YtDlpYoutubeChapterSchema>;
export type YtDlpYoutubeSubtitleFormat = z.infer<
  typeof YtDlpYoutubeSubtitleFormatSchema
>;
export type YtDlpYoutubeMetadata = z.infer<typeof YtDlpYoutubeMetadataSchema>;
export type YtDlpInstagramComment = z.infer<typeof YtDlpInstagramCommentSchema>;
export type YtDlpInstagramReelMetadata = z.infer<
  typeof YtDlpInstagramReelMetadataSchema
>;

export type YtDlpYoutubeMetadaKeys = keyof YtDlpYoutubeMetadata;
export type YtDlpInstagramMetadataKeys = keyof YtDlpInstagramReelMetadata;
