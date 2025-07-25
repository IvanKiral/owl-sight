import * as os from "node:os";
import * as path from "node:path";
import { runYtDlp, runYtDlpMetadata } from "./ytdlp.js";

export const downloadDescriptionFromVideo = async (url: string): Promise<string> => {
  try {
    const jsonOutput = await runYtDlpMetadata(url);
    const videoInfo = JSON.parse(jsonOutput);
    return videoInfo.description || "No description available";
  } catch (e) {
    console.error("yt-dlp failed to extract description:", e);
    return "No description available";
  }
};

export const downloadAudioFromVideo = async (url: string) => {
  const tempDir = os.tmpdir();
  const outTemplate = path.join(tempDir, "audio.mp3");

  const ytdlArgs = [
    // select best audio
    "-f",
    "bestaudio/best",
    // extract audio
    "--extract-audio",
    // choose MP3 and quality
    "--audio-format",
    "mp3",
    "--verbose",
    "False",
    "--audio-quality",
    "192",
    // output template
    "-o",
    outTemplate,
  ];

  try {
    await runYtDlp(url, ytdlArgs);
    console.log("Conversion complete!");
  } catch (e) {
    console.error("yt-dlp failed:", e);
  }

  return tempDir;
};
