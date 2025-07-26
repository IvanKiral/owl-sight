import { describe, it, expect } from "vitest";
import { withTempDir } from "../../src/utils/tempFolder.js";
import * as path from "node:path";
import { writeFile, access } from "fs/promises";
import { readFile } from "node:fs/promises";
import { a } from "vitest/dist/chunks/suite.B2jumIFP.js";

describe("withTempDir Integration Tests", () => {
  it("should create temporary directory and clean up after successful execution", async () => {
    let tempDirPath: string | undefined;

    const result = await withTempDir(async (dirPath) => {
      tempDirPath = dirPath;

      // Verify directory exists during execution
      await access(dirPath);

      // Create a test file in temp directory
      const text = "test content";
      await writeFile(path.join(dirPath, "test.txt"), text);
      const readText = await readFile(path.join(dirPath, "test.txt"), "utf-8");

      expect(readText).toEqual(text);
      return "success";
    });

    expect(result).toBe("success");
    expect(tempDirPath).toBeDefined();

    // Verify directory is cleaned up after execution
    await expect(access(tempDirPath!)).rejects.toThrow();
  });

  it("should create temporary directory with custom prefix", async () => {
    let tempDirPath: string | undefined;

    await withTempDir(
      async (dirPath) => {
        tempDirPath = dirPath;
        expect(dirPath).toContain("custom-test-prefix");
        return "done";
      },
      { prefix: "custom-test-prefix" },
    );

    expect(tempDirPath).toBeDefined();
  });

  it("should clean up even when function throws error", async () => {
    let tempDirPath: string | undefined;

    await expect(
      withTempDir(async (dirPath) => {
        tempDirPath = dirPath;

        // Verify directory exists
        await access(dirPath);

        // Throw an error to test cleanup
        throw new Error("Test error");
      }),
    ).rejects.toThrow("Test error");

    expect(tempDirPath).toBeDefined();

    await expect(access(tempDirPath!)).rejects.toThrow();
  });
});
