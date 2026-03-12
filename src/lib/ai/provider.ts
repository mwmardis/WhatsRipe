import { google } from "@ai-sdk/google";

/**
 * Returns the AI model to use for plan generation.
 * Uses Google Gemini 3.1 Flash Lite Preview.
 * Swap the provider here to change the model for the entire app.
 */
export function getModel() {
  return google("gemini-3.1-flash-lite-preview");
}
