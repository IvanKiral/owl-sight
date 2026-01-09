import { GoogleGenAI } from "@google/genai";
import { error, success, type WithError } from "shared";

type GeminiResponse = {
  text: string;
};

const callGemini = async (
  apiKey: string,
  model: string,
  contents: string,
): Promise<WithError<GeminiResponse, string>> => {
  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model,
      contents,
    });

    if (!response.text) {
      return error("No response text received from Gemini API");
    }

    return success({
      text: response.text,
    });
  } catch (err) {
    return error(`Gemini API error: ${err instanceof Error ? err.message : String(err)}`);
  }
};

export { callGemini };
