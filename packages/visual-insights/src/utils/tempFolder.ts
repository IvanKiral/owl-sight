import * as path from "node:path";
import * as os from "node:os";
import { mkdtemp, rm } from "fs/promises";

type TempDirOptions = {
  prefix?: string;
};

export async function withTempDir<T>(
  fn: (dirPath: string) => Promise<T>,
  options: TempDirOptions = {},
): Promise<T> {
  const prefix = path.join(os.tmpdir(), options.prefix ?? "owl-sight-temp");
  const tempDir = await mkdtemp(prefix);

  const cleanup = async () => {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      console.error(`Could not remove folder ${prefix}`);
    }
  };

  const onExit = () => {
    cleanup().finally(() => process.exit());
  };

  process.once("SIGINT", onExit);
  process.once("SIGTERM", onExit);
  process.once("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    cleanup().finally(() => process.exit(1));
  });

  try {
    return await fn(tempDir);
  } finally {
    await cleanup();
    process.removeListener("SIGINT", onExit);
    process.removeListener("SIGTERM", onExit);
  }
}
