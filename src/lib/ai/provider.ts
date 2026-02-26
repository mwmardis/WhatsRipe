import { openai } from "@ai-sdk/openai";

/**
 * Returns the AI model to use for plan generation.
 * Defaults to OpenAI gpt-4o-mini (cheapest good model).
 * Swap the provider here to change the model for the entire app.
 */
export function getModel() {
  return openai("gpt-4o-mini");
}
