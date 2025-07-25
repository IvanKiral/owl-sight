import { spawn } from "node:child_process";

export const transcribe = async (
  audioPath: string,
  language: string,
  model = "turbo",
): Promise<string> => {
  const result = spawn(
    "whisper",
    [
      audioPath,
      "--model",
      model,
      "--language",
      language,
      "--output_format",
      "txt",
      "--output_dir",
      "-",
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  return new Promise((resolve, reject) => {
    result.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    result.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    result.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Whisper process exited with code ${code}`));
      }

      resolve(result.stdout.toString());
    });
  });
};
