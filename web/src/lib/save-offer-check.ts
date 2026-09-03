import { PREVIEW_HARVEST_REPLY } from "@/lib/harvest";
import { parseRecipeMarkdown } from "@/lib/recipes";
import {
  detectSaveOffer,
  PREVIEW_RECIPE_REPLY,
} from "@/lib/save-offer";

function fail(failures: string[], msg: string) {
  failures.push(msg);
}

export function runSaveOfferFixtures() {
  const failures: string[] = [];

  if (detectSaveOffer("What's usually named as the longest river?", PREVIEW_HARVEST_REPLY)) {
    fail(failures, "Nile harvest reply should not offer Save this recipe");
  }
  if (
    detectSaveOffer(
      "What's the weather in Denver today please?",
      "It will be sunny with a high of 82 degrees."
    )
  ) {
    fail(failures, "weather should not offer a recipe save");
  }
  if (!detectSaveOffer("Give me a simple tomato pasta recipe", PREVIEW_RECIPE_REPLY)) {
    fail(failures, "pasta recipe ask should offer Save this recipe");
  }
  const card = parseRecipeMarkdown(PREVIEW_RECIPE_REPLY);
  if (!card || !/baked alaska/i.test(card.title)) {
    fail(failures, "local parse should title Baked Alaska");
  }
  if (!card?.ingredients.includes("egg whites") || !card.ingredients.includes("sugar")) {
    fail(failures, "local parse should keep ingredient lines");
  }
  if (!card?.steps.includes("Freeze the ice cream")) {
    fail(failures, "local parse should keep numbered steps");
  }
  const instructions = parseRecipeMarkdown(`**Blueberry Muffins**

**Ingredients**
- 1 cup flour
- 1 cup berries

**Instructions**
1. Mix.
2. Bake.`);
  if (!instructions || instructions.steps.split("\n").length < 2) {
    fail(failures, "Instructions heading should parse as steps");
  }
  if (parseRecipeMarkdown(PREVIEW_HARVEST_REPLY)) {
    fail(failures, "Nile harvest reply is not a recipe card");
  }
  if (detectSaveOffer("save this recipe", PREVIEW_RECIPE_REPLY)) {
    fail(failures, "typed save command is a different path — no duplicate pill");
  }
  if (detectSaveOffer("recipe?", "Sure.")) {
    fail(failures, "tiny reply should not offer");
  }

  return { ok: failures.length === 0, failures };
}
