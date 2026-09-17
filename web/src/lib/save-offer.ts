import type { AskIntent } from "@/lib/ask-intent";
import { isSaveRecipeCommand } from "@/lib/recipes";

export type SaveOfferKind = "recipe";

/** Canned cooking reply so Lab `/preview` can show the pill with no API. */
export const PREVIEW_RECIPE_ASK =
  "Can you give me a baked Alaska recipe for two?";

export const PREVIEW_RECIPE_REPLY = `Here's a classic **Baked Alaska** for two.

**Ingredients**
- 4 egg whites
- ¼ cup sugar
- 1 quart ice cream, slightly softened
- 1 sponge cake layer (8 inch)
- Pinch of cream of tartar

**Steps**
1. Freeze the ice cream on the cake until firm.
2. Beat egg whites with cream of tartar to stiff peaks; fold in sugar.
3. Cover the frozen cake with meringue, sealing to the plate.
4. Bake at 500°F until golden, about 3 minutes. Serve immediately.`;

const RECIPE_ASK =
  /\b(recipe|cookbook|ingredients|meal idea|how (?:do i|to) (?:make|cook|bake))\b/i;
const KITCHEN_BODY =
  /\b(ingredients?|preheat|tablespoons?|teaspoons?|simmer|whisk|chop|dice|oven|cups? of)\b/i;
const HAS_STEPS = /^\s*\d+[\.)]\s+\S+/m;
const HAS_METHOD = /\b(instructions|directions|method|steps)\b/i;

function replyLooksLikeRecipe(body: string) {
  const kitchen = KITCHEN_BODY.test(body) || /\bingredients?\b/i.test(body);
  const steps = HAS_STEPS.test(body) || HAS_METHOD.test(body);
  return kitchen && steps;
}

/**
 * Cheap regex fallback after the stream — no extra model call.
 * Extract runs only when the user taps Save.
 */
export function detectSaveOffer(
  userText: string,
  reply: string
): SaveOfferKind | null {
  if (isSaveRecipeCommand(userText)) return null;
  const ask = userText.trim();
  const body = reply.trim();
  if (ask.length < 8 || body.length < 80) return null;
  if (!RECIPE_ASK.test(ask) && !replyLooksLikeRecipe(body)) return null;
  if (!replyLooksLikeRecipe(body)) return null;
  return "recipe";
}

/** Prefer classify `saveOffer`; regex is the backup. Still opt-in — never auto-saves. */
export function resolveSaveOffer(
  userText: string,
  reply: string,
  intent?: Pick<AskIntent, "harvest" | "answerMode" | "saveOffer" | "job"> | null
): SaveOfferKind | null {
  if (isSaveRecipeCommand(userText)) return null;
  if (intent?.harvest && intent.answerMode === "direct") return null;
  if (intent?.job && intent.job !== "kitchen") return null;
  const body = reply.trim();
  if (intent?.saveOffer === "recipe" && body.length >= 80 && replyLooksLikeRecipe(body)) {
    return "recipe";
  }
  return detectSaveOffer(userText, reply);
}
