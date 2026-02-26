import { google } from "@ai-sdk/google";

/**
 * Returns the AI model to use for plan generation.
 * Uses Google Gemini 2.0 Flash (free tier available).
 * Swap the provider here to change the model for the entire app.
 */
export function getModel() {
  return google("gemini-2.5-flash");
}
