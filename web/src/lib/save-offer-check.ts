import { PREVIEW_HARVEST_REPLY } from "@/lib/harvest";
import {
  detectSaveOffer,
  PREVIEW_RECIPE_ASK,
  PREVIEW_RECIPE_REPLY,
  recipeSaveMarkdown,
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
  const marked = recipeSaveMarkdown(PREVIEW_RECIPE_REPLY);
  if (!marked.includes("save://line/ingredient") || !marked.includes("save://line/step")) {
    fail(failures, "recipeSaveMarkdown should mark ingredients and steps");
  }
  if (
    detectSaveOffer(
      "save this recipe",
      PREVIEW_RECIPE_REPLY
    )
  ) {
    fail(failures, "typed save command is a different path — no duplicate pill");
  }
  if (detectSaveOffer("recipe?", "Sure.")) {
    fail(failures, "tiny reply should not offer");
  }

  return { ok: failures.length === 0, failures };
}
