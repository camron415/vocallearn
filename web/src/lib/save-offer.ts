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
  /\b(recipe|cookbook|cook(?:ing)?|bake|dinner|ingredients?|meal idea)\b/i;
const RECIPE_BODY =
  /\b(ingredients?|preheat|tablespoons?|teaspoons?|cups?|simmer|whisk|chop|dice|oven)\b/i;
const HAS_STEPS = /^\s*\d+[\.)]\s+\S+/m;

/**
 * Cheap offer after the stream — no extra model call.
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

  const looksRecipe =
    RECIPE_ASK.test(ask) || RECIPE_BODY.test(body) || /\bingredients?\b/i.test(body);
  if (!looksRecipe) return null;
  if (!HAS_STEPS.test(body) && !/\bingredients?\b/i.test(body)) return null;
  return "recipe";
}
