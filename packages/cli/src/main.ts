import { getVideoData } from "visual-insights";

const { transcription, metadata } = await getVideoData(
  "https://www.instagram.com/reel/DMklH98K1EA",
);

console.log("transcription", transcription);

console.log("metadata", metadata.description);
