import { describe, it, expect } from "vitest";
import { extractMetadata } from "../../src/ytdlp/metadata.js";
import * as path from "node:path";

const fixturesPath = path.join(__dirname, "../fixtures");

describe("extractMetadata Integration Tests", () => {
  it("should extract YouTube metadata with specific fields", async () => {
    const metadataFile = path.join(fixturesPath, "youtube-metadata.json");

    const result = await extractMetadata(metadataFile, {
      type: "youtube",
      metadata: ["title", "description", "duration"] as const,
    });

    expect(result).toEqual({
      title: "Sample YouTube Video Title",
      description:
        "This is a sample description for testing purposes. It contains multiple lines\nand various characters: !@#$%^&*()",
      duration: 120.5,
    });
  });

  it("should extract Instagram metadata with specific fields", async () => {
    const metadataFile = path.join(fixturesPath, "instagram-metadata.json");

    const result = await extractMetadata(metadataFile, {
      type: "instagram",
      metadata: ["description", "duration", "like_count"] as const,
    });

    expect(result).toEqual({
      description: "Sample Instagram reel description #test #sample",
      duration: 30.2,
      likeCount: 25,
    });
  });

  it("should throw error for invalid metadata file", async () => {
    const invalidFile = path.join(fixturesPath, "invalid-metadata.json");

    await expect(
      extractMetadata(invalidFile, {
        type: "youtube",
        metadata: ["title"] as const,
      }),
    ).rejects.toThrow("Failed to extract metadata");
  });
});
