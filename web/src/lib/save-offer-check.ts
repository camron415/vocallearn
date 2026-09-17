import { PREVIEW_HARVEST_REPLY } from "@/lib/harvest";
import { parseRecipeMarkdown } from "@/lib/recipes";
import { fallbackAskIntent, parseAskIntent } from "@/lib/ask-intent";
import {
  detectSaveOffer,
  PREVIEW_RECIPE_REPLY,
  resolveSaveOffer,
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
  const waffle = parseRecipeMarkdown(`**Basic waffles**

You'll need:
- 2 cups flour
- 2 eggs
- 1¾ cups milk

Instructions:
1. Mix the wet ingredients.
2. Fold in the flour.
3. Cook until golden.`);
  if (!waffle || waffle.ingredients.split("\n").length < 3) {
    fail(failures, "You'll need should parse as ingredients without Grok");
  }
  if (!waffle?.steps.includes("Mix the wet")) {
    fail(failures, "waffle Instructions should parse as steps");
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
  if (detectSaveOffer("What's for dinner tonight?", "1. The market closed up.\n2. A summit in Europe.\n3. Local traffic.")) {
    fail(failures, "dinner + numbered news should not offer");
  }
  if (detectSaveOffer("Who won the World Cup?", "1. Group A\n2. Group B\n3. Group C")) {
    fail(failures, "World Cup numbered list should not offer");
  }
  if (!detectSaveOffer("How do I make carbonara?", PREVIEW_RECIPE_REPLY)) {
    fail(failures, "how-to-cook with a recipe body should offer");
  }
  const ravioliIntent = fallbackAskIntent("recipe for homemade ravioli");
  if (
    !resolveSaveOffer(
      "recipe for homemade ravioli",
      PREVIEW_RECIPE_REPLY,
      ravioliIntent
    )
  ) {
    fail(failures, "intent saveOffer should show the recipe pill");
  }
  if (
    resolveSaveOffer(
      "What is the capital of Utah?",
      PREVIEW_RECIPE_REPLY,
      fallbackAskIntent("What is the capital of Utah?")
    )
  ) {
    fail(failures, "closed lookup should not offer a recipe pill");
  }
  const kitchenOverRemember = parseAskIntent(
    `{"job":"kitchen","answerMode":"practical","primaryAsk":"carbonara recipe","topicKey":"carbonara","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":"recipe"}`,
    "Tell me about making carbonara"
  );
  if (
    !resolveSaveOffer(
      "Tell me about making carbonara",
      PREVIEW_RECIPE_REPLY,
      kitchenOverRemember
    )
  ) {
    fail(failures, "classify kitchen should still show the recipe pill");
  }
  const liveGame = parseAskIntent(
    `{"job":"live","answerMode":"practical","primaryAsk":"next BYU game","topicKey":"byu-game","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    "when is the next BYU game"
  );
  if (
    resolveSaveOffer(
      "when is the next BYU game",
      "BYU's next game is Saturday, September 19 at 8pm Mountain.",
      liveGame
    )
  ) {
    fail(failures, "live sports should not show a recipe pill");
  }

  const iceCreamAsk = "Where are the best ice cream places in Salt Lake City?";
  const iceCreamListing = `**Blacksmith Ice Cream** and **Rockwell Ice Cream** consistently rank among the highest-rated spots.

1. Blacksmith Ice Cream — artisan cups of cream rolled on a cold anvil.
2. Rockwell Ice Cream — small-batch flavors.
3. A third shop with oven-warm brownies on top.

## Sources
[Yelp](https://www.yelp.com/search?find_desc=Ice+Cream)`;
  if (!detectSaveOffer(iceCreamAsk, iceCreamListing)) {
    fail(failures, "venue list with cups/steps is the recipe-pill false-positive shape");
  }
  const iceCreamLive = parseAskIntent(
    `{"job":"live","freshness":"web","feedDomain":null,"answerMode":"practical","primaryAsk":"ice cream in SLC","topicKey":"ice-cream","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    iceCreamAsk
  );
  if (resolveSaveOffer(iceCreamAsk, iceCreamListing, iceCreamLive)) {
    fail(failures, "live ice cream listing must not show a recipe pill");
  }

  return { ok: failures.length === 0, failures };
}
