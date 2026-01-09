import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { extractMetadata } from "../../src/ytdlp/metadata.js";

const fixturesPath = path.join(__dirname, "../fixtures");

describe("extractMetadata Integration Tests", () => {
  it("should extract YouTube metadata with specific fields", async () => {
    const metadataFile = path.join(fixturesPath, "youtube-metadata.json");

    const result = await extractMetadata(metadataFile, {
      type: "youtube",
      metadata: ["title", "description", "duration"] as const,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toEqual({
        title: "Sample YouTube Video Title",
        description:
          "This is a sample description for testing purposes. It contains multiple lines\nand various characters: !@#$%^&*()",
        duration: 120.5,
      });
    }
  });

  it("should extract Instagram metadata with specific fields", async () => {
    const metadataFile = path.join(fixturesPath, "instagram-metadata.json");

    const result = await extractMetadata(metadataFile, {
      type: "instagram",
      metadata: ["description", "duration", "like_count"] as const,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toEqual({
        description: "Sample Instagram reel description #test #sample",
        duration: 30.2,
        likeCount: 25,
      });
    }
  });

  it("should return error for invalid metadata file", async () => {
    const invalidFile = path.join(fixturesPath, "invalid-metadata.json");

    const result = await extractMetadata(invalidFile, {
      type: "youtube",
      metadata: ["title"] as const,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Failed to extract youtube metadata");
    }
  });
});
