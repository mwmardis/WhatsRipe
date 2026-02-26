import { z } from "zod";

export const groceryItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  storeSection: z.enum(["produce", "dairy", "meat", "pantry", "frozen"]),
});

export const groceryListSchema = z.object({
  items: z.array(groceryItemSchema),
});

export type GroceryItemOutput = z.infer<typeof groceryItemSchema>;
export type GroceryListOutput = z.infer<typeof groceryListSchema>;

/**
 * Builds the system + user prompts for grocery list generation.
 * Takes all meals from a weekly plan and asks the LLM to compile,
 * deduplicate, and categorize all ingredients.
 */
export function buildGroceryPrompt(meals: { name: string; description: string; seasonalIngredients: string }[]) {
  const system = `You are a grocery list assistant. Given a list of meals for the week, compile all the ingredients needed into a single grocery list.

Rules:
- Combine duplicate ingredients (e.g., "2 onions" + "1 onion" = "3 onions")
- Categorize each item into one of these store sections: produce, dairy, meat, pantry, frozen
- Use reasonable default quantities if not specified
- Use common units: "count", "lb", "oz", "cup", "tbsp", "tsp", "bunch", "can", "bag", "package"
- Return a clean, consolidated list ready for shopping`;

  const mealDescriptions = meals
    .map((meal) => {
      const ingredients = JSON.parse(meal.seasonalIngredients) as string[];
      return `- ${meal.name}: ${meal.description}${ingredients.length > 0 ? ` (Key ingredients: ${ingredients.join(", ")})` : ""}`;
    })
    .join("\n");

  const user = `Here are all the meals planned for this week:

${mealDescriptions}

Please compile a complete grocery list with all ingredients needed for these meals. Combine duplicates and categorize each item by store section.`;

  return { system, user };
}
