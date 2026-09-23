import {
  capitalFallbackCard,
  cardMatchesIntent,
  fallbackAskIntent,
  intentAnswerGuide,
  harvestAskText,
  isHarvestFollowUp,
  openFallbackCard,
  parseAskIntent,
  peekAskIntent,
  resolveAskIntentForAnswer,
  CLASSIFY_MS,
  classifyProvider,
} from "@/lib/ask-intent";
import { skipHarvestTurn, shouldSkipHarvest } from "@/lib/harvest-policy";
import { cardsFromMinerJson, parseMinerJson } from "@/lib/learn-mine";
import { V2_HARVEST_POLICY } from "@/lib/harvest-policy";
import { PREVIEW_HARVEST_REPLY } from "@/lib/harvest";
import { grokInput } from "@/lib/grok";
import { openaiMessages } from "@/lib/openai";

function fail(failures: string[], message: string) {
  failures.push(message);
}

export function runAskIntentFixtures(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];

  const socks = fallbackAskIntent(
    "what are these socks made of (material blend)",
    { hasFiles: true }
  );
  if (socks.harvest) fail(failures, "sock photo should not harvest");
  if (socks.answerMode !== "practical") fail(failures, "sock mode practical");

  const capital = fallbackAskIntent("What is the capital of Utah?");
  if (
    !capital.harvest ||
    capital.answerMode !== "direct" ||
    capital.maxOpen !== 0 ||
    capital.maxChips < 2
  ) {
    fail(failures, "utah capital should be direct closed with 2–3 chip budget");
  }

  const cows = fallbackAskIntent("why are cows brown");
  if (!cows.harvest || cows.answerMode !== "teach_light" || cows.maxOpen !== 1) {
    fail(failures, "cows why should be teach_light with one open slot");
  }

  const weather = fallbackAskIntent("What's the weather this week?");
  if (weather.harvest) fail(failures, "weekly forecast should not harvest");

  const hello = fallbackAskIntent("Hello");
  if (hello.harvest) fail(failures, "hello should not harvest");
  if (!/greet them back/i.test(intentAnswerGuide(hello))) {
    fail(failures, "hello guide should be a short greeting");
  }

  const goldSpot = fallbackAskIntent("what is the spot price of gold");
  if (goldSpot.harvest || goldSpot.job !== "live" || goldSpot.freshness !== "web") {
    fail(failures, "gold spot price should search live, not Keep");
  }
  const goldRemember = parseAskIntent(
    `{"job":"remember","freshness":"weights","feedDomain":null,"askKind":"number","answerMode":"direct","primaryAsk":"gold spot price","topicKey":"gold","maxChips":2,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    "what is the spot price of gold"
  );
  if (
    !goldRemember ||
    goldRemember.job !== "live" ||
    goldRemember.freshness !== "web" ||
    goldRemember.harvest
  ) {
    fail(failures, "classify remember must not Keep a gold spot price");
  }

  const quake = fallbackAskIntent("why do earthquakes happen");
  if (!quake.harvest || quake.answerMode !== "teach_light") {
    fail(failures, "earthquake how/why should harvest");
  }

  const immune = fallbackAskIntent("How does the human immune system work?");
  if (!immune.harvest || immune.maxOpen !== 1) {
    fail(failures, "immune how should allow one open gist");
  }

  const event = fallbackAskIntent("What time is the Tesla cyber cab event");
  if (event.harvest) fail(failures, "event time should not harvest");

  const salsa = fallbackAskIntent("what to eat with salsa");
  if (salsa.harvest) fail(failures, "advice list should not harvest");

  const ravioli = fallbackAskIntent("recipe for homemade ravioli");
  if (ravioli.harvest) fail(failures, "ravioli recipe should not harvest");
  if (ravioli.saveOffer !== "recipe") fail(failures, "ravioli should offer Save this recipe");

  const carbonara = fallbackAskIntent("How do I make carbonara?");
  if (carbonara.harvest) fail(failures, "how-to-cook should not harvest");
  if (carbonara.saveOffer !== "recipe") fail(failures, "carbonara should offer recipe save");

  const nileName = fallbackAskIntent(
    "What is usually named as the longest river in the world?"
  );
  if (!nileName.harvest || nileName.answerMode !== "direct" || nileName.maxChips < 2) {
    fail(failures, "nile name-only should be direct with 2–3 chip budget");
  }

  const photo = fallbackAskIntent("what is this", { hasFiles: true });
  if (photo.harvest) fail(failures, "photo what-is-this should not harvest");

  const plant = fallbackAskIntent("what plant is this", { hasFiles: true });
  if (!plant.harvest || plant.job !== "remember") {
    fail(failures, "plant photo should still be a remember job");
  }

  const painting = fallbackAskIntent("who painted this", { hasFiles: true });
  if (!painting.harvest) fail(failures, "who painted this with a file should harvest");

  const goldenTypo = fallbackAskIntent("what is the golden ruel");
  if (!goldenTypo.harvest) fail(failures, "golden rule typo should harvest");

  const smash =
    "asdfghjklqwertyuiopzxcvbnm";
  const smashIntent = fallbackAskIntent(smash);
  if (smashIntent.harvest || smashIntent.job !== "chat") {
    fail(failures, "keyboard smash should be chat, not Keep");
  }
  const smashFollow = fallbackAskIntent(smash, {
    priorText: "why is the sky blue",
  });
  if (smashFollow.harvest) {
    fail(failures, "smash follow-up should not inherit the prior fact ask");
  }
  if (isHarvestFollowUp(smash)) {
    fail(failures, "keyboard smash is not a harvest follow-up");
  }
  if (
    !shouldSkipHarvest(
      smash,
      "It looks like you have a typo in your message. That string is gibberish."
    )
  ) {
    fail(failures, "keyboard smash should policy-skip");
  }
  if (
    shouldSkipHarvest(
      "what is the golden ruel",
      "The Golden Rule is a moral principle: treat others as you would like to be treated."
    )
  ) {
    fail(failures, "golden ruel typo must still be harvestable");
  }
  if (
    shouldSkipHarvest(
      "why is the sky blue",
      "The sky looks blue because of Rayleigh scattering in Earth's atmosphere, which sends shorter blue wavelengths toward your eyes."
    )
  ) {
    fail(failures, "why is the sky blue should still harvest");
  }

  const typoAck = "Oh I said sweet, it was a typo";
  const typoIntent = fallbackAskIntent(typoAck, {
    priorText: "why is the sky blue",
  });
  if (typoIntent.harvest || typoIntent.job !== "chat") {
    fail(failures, "typo acknowledgement should be chat, not Keep");
  }
  if (isHarvestFollowUp(typoAck)) {
    fail(failures, "typo acknowledgement is not a harvest follow-up");
  }
  if (
    !shouldSkipHarvest(
      typoAck,
      "Okay, cool — you were saying sweet. Nice to know."
    )
  ) {
    fail(failures, "typo acknowledgement should policy-skip");
  }
  const forcedTypo = parseAskIntent(
    `{"job":"remember","answerMode":"direct","primaryAsk":"what was the typo","topicKey":"typo","maxChips":1,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    typoAck,
    { priorText: "why is the sky blue" }
  );
  if (!forcedTypo) {
    fail(failures, "typo acknowledgement classify JSON should parse");
  }
  if (forcedTypo?.harvest) {
    fail(failures, "classify cannot force Keep on a typo acknowledgement");
  }
  if (fallbackAskIntent("I was just testing").harvest) {
    fail(failures, "just testing should not harvest");
  }
  if (fallbackAskIntent("got it").harvest) {
    fail(failures, "got it should not harvest");
  }
  if (fallbackAskIntent("cool").harvest) {
    fail(failures, "cool should not harvest");
  }

  const whoCreated = fallbackAskIntent("Who created this?");
  if (!whoCreated.harvest) fail(failures, "who created this follow-up should harvest");

  if (!isHarvestFollowUp("Who created this?")) {
    fail(failures, "who created this should be a harvest follow-up");
  }
  if (isHarvestFollowUp("What is the capital of Utah?")) {
    fail(failures, "capital ask is not a follow-up");
  }
  if (isHarvestFollowUp("What's the weather this week?")) {
    fail(failures, "weather this week is not a harvest follow-up");
  }
  const resolvedWho = harvestAskText(
    "Who created this?",
    "what is the golden ruel"
  );
  if (!/golden ruel/i.test(resolvedWho) || !/who created this/i.test(resolvedWho)) {
    fail(failures, "harvestAskText should keep prior + who created this");
  }
  if (
    harvestAskText("What is the capital of Utah?", "what are these socks made of") !==
    "What is the capital of Utah?"
  ) {
    fail(failures, "standalone capital must not inherit socks prior");
  }

  const whoWithPrior = fallbackAskIntent("Who created this?", {
    priorText: "what is the golden ruel",
  });
  if (!whoWithPrior.harvest || !/golden ruel/i.test(whoWithPrior.primaryAsk)) {
    fail(failures, "who created this should resolve primaryAsk from prior");
  }
  if (
    !cardMatchesIntent(
      {
        prompt: "Who is associated with an early form of the Golden Rule?",
        token: "Confucius",
        answer: "Confucius",
      },
      whoWithPrior,
      resolvedWho
    )
  ) {
    fail(failures, "Confucius should match golden-rule follow-up intent");
  }
  if (
    cardMatchesIntent(
      {
        prompt: "Who is associated with an early form of the Golden Rule?",
        token: "Confucius",
        answer: "Confucius",
      },
      fallbackAskIntent("Who created this?"),
      "Who created this?"
    )
  ) {
    fail(failures, "Confucius should not match a bare who-created-this without prior");
  }

  const stillSkipThis = fallbackAskIntent("what is this", {
    priorText: "what is the golden ruel",
    hasFiles: true,
  });
  if (stillSkipThis.harvest) {
    fail(failures, "bare what is this should still skip even with a learning prior");
  }

  const photoExcusePrior = parseAskIntent(
    `{"job":"remember","answerMode":"direct","primaryAsk":"who created the golden rule","topicKey":"golden-rule","maxChips":1,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    "Who created this?",
    { priorText: "what is the golden ruel" }
  );
  if (
    !photoExcusePrior?.harvest ||
    !/golden ruel/i.test(photoExcusePrior.primaryAsk)
  ) {
    fail(failures, "follow-up parse should keep golden rule in primaryAsk");
  }

  const parsed = parseAskIntent(
    `{"harvest":false,"harvestWhy":"product lookup","answerMode":"practical","primaryAsk":"sock blend","topicKey":"socks","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    "what are these socks made of"
  );
  if (!parsed || parsed.harvest) fail(failures, "parse sock skip");

  const socksRemember = parseAskIntent(
    `{"job":"remember","answerMode":"direct","primaryAsk":"sock material blend","topicKey":"socks","maxChips":1,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    "what are these socks made of (material blend)"
  );
  if (!socksRemember || socksRemember.harvest || socksRemember.job === "remember") {
    fail(failures, "classify remember must not Keep a product ID");
  }

  const typoSkip = parseAskIntent(
    `{"harvest":false,"harvestWhy":"typo query","answerMode":"practical","primaryAsk":"what they need in one line","topicKey":null,"maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    "what is the golden ruel"
  );
  if (!typoSkip?.harvest || typoSkip.job !== "remember") {
    fail(failures, "classify typo excuse must not veto golden rule");
  }

  const photoExcuse = parseAskIntent(
    `{"job":"chat","answerMode":"practical","primaryAsk":"who created the item in the file","topicKey":null,"maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    "Who created this?"
  );
  if (photoExcuse?.harvest || photoExcuse?.job !== "chat") {
    fail(failures, "classify chat should skip Keep on a photo-style who-created-this");
  }

  const rememberPlant = parseAskIntent(
    `{"job":"remember","answerMode":"direct","primaryAsk":"what plant is this","topicKey":"plant","maxChips":1,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    "what plant is this"
  );
  if (!rememberPlant?.harvest || rememberPlant.answerMode !== "direct") {
    fail(failures, "remember + plant should keep direct harvest");
  }

  if (
    typoSkip &&
    skipHarvestTurn(
      "what is the golden ruel",
      "The Golden Rule is treat others as you would like to be treated.",
      typoSkip
    ).skip
  ) {
    fail(failures, "golden rule typo should not skipHarvestTurn");
  }

  const maine = capitalFallbackCard(
    "What is the capital of Maine?",
    "The capital of Maine is Augusta."
  );
  if (maine?.token !== "Augusta") {
    fail(failures, `maine fallback got ${maine?.token ?? "none"}`);
  }

  const utah = capitalFallbackCard(
    "what is the capital of utah",
    "Salt Lake City is the capital of Utah."
  );
  if (utah?.token !== "Salt Lake City") {
    fail(failures, `utah fallback got ${utah?.token ?? "none"}`);
  }

  const us = capitalFallbackCard(
    "what is the capital of the us",
    "Washington, D.C. is the capital of the United States."
  );
  if (!us?.token.toLowerCase().includes("washington")) {
    fail(failures, `us fallback got ${us?.token ?? "none"}`);
  }

  const guided = intentAnswerGuide(capital);
  if (!/first sentence/i.test(guided)) fail(failures, "direct guide missing");

  if (
    shouldSkipHarvest(
      "why do earthquakes happen",
      "Earthquakes happen when plates stick, then slip, sending waves through rock for miles."
    )
  ) {
    fail(failures, "educational earthquake ask should not policy-skip");
  }

  const openJson = `{
    "cards": [{
      "prompt": "How does the immune system protect the body?",
      "answer": "The immune system uses innate barriers plus adaptive cells that learn specific threats.",
      "token": "adaptive cells",
      "span": "Innate barriers plus adaptive cells that learn specific threats.",
      "kind": "meaning",
      "recall": "open"
    }]
  }`;
  const reply =
    "Innate barriers plus adaptive cells that learn specific threats. Antibodies tag germs. T cells kill infected cells.";
  const openKept = cardsFromMinerJson(parseMinerJson(openJson), reply, [], "imm", {
    intent: immune,
  });
  if (openKept.length !== 1 || openKept[0]?.recall !== "open") {
    fail(failures, `open gist with intent maxOpen 1, got ${openKept.length}`);
  }

  const openBlocked = cardsFromMinerJson(parseMinerJson(openJson), reply, [], "imm", {
    policy: { ...V2_HARVEST_POLICY, closedOnly: true, maxOpen: 0 },
  });
  if (openBlocked.length !== 0) {
    fail(failures, "default closed-only should still drop open gists");
  }

  if (
    skipHarvestTurn(
      "What's the weather in Denver today please?",
      "Sunny, high of 82, light breeze this afternoon.",
      { harvest: true }
    ).reason !== "policy_skip"
  ) {
    fail(failures, "classify harvest=true must not override weather policy");
  }

  if (
    skipHarvestTurn(
      "What is the overall sentiment of the players and fans towards the game?",
      "Fans sound optimistic about Saturday, though some worry about the offensive line.",
      { harvest: true }
    ).skip !== true
  ) {
    fail(failures, "classify harvest=true must not override opinion skip");
  }

  if (
    !shouldSkipHarvest(
      "recipe for homemade ravioli",
      "Here's a ravioli dough. 1. Mix. 2. Roll."
    )
  ) {
    fail(failures, "recipe ask should policy-skip");
  }

  const nileAsk = "What is usually named as the longest river in the world?";
  const nileIntent = fallbackAskIntent(nileAsk);
  const nileCards = cardsFromMinerJson(
    parseMinerJson(`{
      "cards": [
        {
          "prompt": "What is usually named as the longest river in the world?",
          "answer": "The Nile",
          "token": "Nile",
          "span": "Nile",
          "kind": "who",
          "recall": "closed",
          "distractors": ["Amazon", "Yangtze", "Mississippi"]
        },
        {
          "prompt": "Which country is most associated with the lower Nile?",
          "answer": "Egypt",
          "token": "Egypt",
          "span": "Egypt",
          "kind": "where",
          "recall": "closed",
          "distractors": ["Sudan", "Ethiopia", "Libya"]
        }
      ]
    }`),
    PREVIEW_HARVEST_REPLY,
    [],
    "nile-name",
    { intent: nileIntent, userText: nileAsk }
  );
  if (nileCards[0]?.token !== "Nile") {
    fail(
      failures,
      `nile-name main chip ${nileCards[0]?.token ?? "none"} want Nile`
    );
  }
  if (nileCards.length < 1 || nileCards.length > 2) {
    fail(
      failures,
      `nile-name cluster ${nileCards.map((c) => c.token).join(",")} (main + optional where)`
    );
  }
  if (cardMatchesIntent({ prompt: "Which country is most associated with the lower Nile?", token: "Egypt", answer: "Egypt" }, nileIntent, nileAsk)) {
    fail(failures, "Egypt card should not match nile-name intent");
  }

  const wyomingAsk = "What is the capital of Wyoming?";
  const wyoming = cardsFromMinerJson(
    parseMinerJson(`{
      "cards": [
        {
          "prompt": "What is the capital of Wyoming?",
          "answer": "Cheyenne",
          "token": "Cheyenne",
          "span": "Cheyenne",
          "kind": "where",
          "recall": "closed",
          "distractors": ["Casper", "Laramie", "Jackson"]
        },
        {
          "prompt": "When did Wyoming become a state?",
          "answer": "1869",
          "token": "1869",
          "span": "1869",
          "kind": "when",
          "recall": "closed",
          "distractors": ["1890", "1876", "1848"]
        }
      ]
    }`),
    "The capital of Wyoming is Cheyenne. Wyoming became a state in 1869.",
    [],
    "wy",
    { intent: fallbackAskIntent(wyomingAsk), userText: wyomingAsk }
  );
  const wyTokens = wyoming.map((c) => c.token);
  if (!wyTokens.includes("Cheyenne") || wyoming.length < 1 || wyoming.length > 3) {
    fail(failures, `wyoming capital should keep Cheyenne plus optional support, got ${wyTokens.join(",")}`);
  }
  if (!wyTokens.includes("1869")) {
    fail(failures, "wyoming should also keep the supporting statehood year");
  }

  const gist = openFallbackCard(
    "How does photosynthesis work?",
    "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide. It happens in the chloroplast."
  );
  if (!gist || gist.recall !== "open" || gist.span.length < 8) {
    fail(failures, "open fallback should emit a gist with a span in the reply");
  }
  if (gist && gist.token.toLowerCase() !== "photosynthesis") {
    fail(failures, `open token should be the topic, got ${gist.token}`);
  }
  if (gist && !/photosynthesis is/i.test(gist.answer)) {
    fail(failures, `open gist should be a complete sentence, got ${gist.answer}`);
  }

  const telegram = openFallbackCard(
    "What is the basic definition of photosynthesis?",
    "Convert light energy from the sun into chemical energy stored in glucose. Chloroplasts do this work."
  );
  if (
    telegram &&
    !/photosynthesis is the process of converting/i.test(telegram.answer)
  ) {
    fail(failures, `telegram gist should complete the sentence, got ${telegram.answer}`);
  }

  const fans = fallbackAskIntent(
    "What is the overall sentiment of the players and fans towards the game?"
  );
  if (fans.harvest) fail(failures, "fan sentiment should not harvest");

  const nintendo = fallbackAskIntent(
    "Look up Nintendo events going on this week"
  );
  if (nintendo.harvest) fail(failures, "this-week events should not harvest");

  const byu = fallbackAskIntent("When is the next BYU football game?");
  if (byu.harvest) fail(failures, "next football game should not harvest");

  const byuBareAsk = "when is the next BYU game";
  const byuBareFallback = fallbackAskIntent(byuBareAsk);
  if (byuBareFallback.harvest || byuBareFallback.job !== "live") {
    fail(failures, "timeout fallback treats next BYU game as live, not Keep");
  }
  const byuBare = parseAskIntent(
    `{"job":"live","answerMode":"practical","primaryAsk":"next BYU game","topicKey":"byu-game","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    byuBareAsk
  );
  if (!byuBare || byuBare.harvest || byuBare.job !== "live") {
    fail(failures, "classify live must skip Keep on next BYU game without football");
  }
  if (
    skipHarvestTurn(
      byuBareAsk,
      "BYU's next game is Saturday, September 19.",
      byuBare
    ).reason !== "intent_skip"
  ) {
    fail(failures, "BYU live job should intent_skip, not wait for a football regex");
  }
  if (byuBare && !/not for review/i.test(intentAnswerGuide(byuBare))) {
    fail(failures, "live job should get the generic practical answer guide");
  }

  const byuShortAsk = "next BYU game";
  if (fallbackAskIntent(byuShortAsk).harvest) {
    fail(failures, "short next BYU game should not regex-Keep");
  }
  const byuShort = parseAskIntent(
    `{"job":"live","answerMode":"practical","primaryAsk":"next BYU game","topicKey":"byu-game","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    byuShortAsk
  );
  if (!byuShort || byuShort.harvest) {
    fail(failures, "classify live must skip Keep on short next BYU game");
  }

  const cookAsk = "Tell me about making carbonara";
  if (!fallbackAskIntent(cookAsk).harvest) {
    fail(failures, "tell-me-about cooking still regex-harvests without classify");
  }
  const kitchenOverRemember = parseAskIntent(
    `{"job":"kitchen","answerMode":"practical","primaryAsk":"carbonara recipe","topicKey":"carbonara","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":"recipe"}`,
    cookAsk
  );
  if (
    !kitchenOverRemember ||
    kitchenOverRemember.harvest ||
    kitchenOverRemember.saveOffer !== "recipe" ||
    kitchenOverRemember.job !== "kitchen"
  ) {
    fail(failures, "classify kitchen must skip Keep and keep the recipe save pill");
  }
  if (
    kitchenOverRemember &&
    (!/\*\*Ingredients\*\*/.test(intentAnswerGuide(kitchenOverRemember)) ||
      !/\*\*Steps\*\*/.test(intentAnswerGuide(kitchenOverRemember)))
  ) {
    fail(failures, "kitchen job should ask for Ingredients and Steps headings");
  }

  const recipeGuide = intentAnswerGuide(
    fallbackAskIntent("Give me a basic waffle recipe")
  );
  if (!/\*\*Ingredients\*\*/.test(recipeGuide) || !/\*\*Steps\*\*/.test(recipeGuide)) {
    fail(failures, "recipe guide should ask for Ingredients and Steps headings");
  }

  const teachGuide = intentAnswerGuide(quake);
  if (!/first sentence|gist/i.test(teachGuide) || !/supporting pegs/i.test(teachGuide)) {
    fail(failures, "teach_light guide should lead with the answer then supporting pegs");
  }

  const sky = parseAskIntent(
    `{"job":"remember","answerMode":"teach_light","primaryAsk":"why the sky is blue","topicKey":"sky-blue","maxChips":3,"primaryRecall":"open","maxOpen":1,"saveOffer":null}`,
    "why is the sky blue"
  );
  if (
    !sky?.harvest ||
    sky.job !== "remember" ||
    sky.maxChips !== 3 ||
    sky.saveOffer
  ) {
    fail(failures, "educational remember should Keep, cap 3 chips, no recipe pill");
  }

  const weatherRemember = parseAskIntent(
    `{"job":"live","freshness":"feeds","feedDomain":"weather","answerMode":"practical","primaryAsk":"denver weather","topicKey":"weather","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    "What's the weather this week?"
  );
  if (weatherRemember?.harvest || weatherRemember?.job !== "live") {
    fail(failures, "classify live must skip Keep on a forecast");
  }

  const iceCreamAsk =
    "Where are the best ice cream places in Salt Lake City?";
  const iceCream = fallbackAskIntent(iceCreamAsk);
  if (iceCream.harvest || iceCream.job !== "live" || iceCream.freshness !== "web") {
    fail(failures, "best ice cream in a city should be live+web, not Keep");
  }
  const iceCreamLive = parseAskIntent(
    `{"job":"live","freshness":"web","feedDomain":null,"answerMode":"practical","primaryAsk":"ice cream in SLC","topicKey":"ice-cream","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    iceCreamAsk
  );
  if (!iceCreamLive || iceCreamLive.harvest || iceCreamLive.freshness !== "web") {
    fail(failures, "classify live+web must skip Keep on a local listing");
  }

  const currentOnes = fallbackAskIntent("give me current ones", {
    priorText: iceCreamAsk,
  });
  if (currentOnes.harvest || currentOnes.job !== "live" || currentOnes.freshness !== "web") {
    fail(failures, "give me current ones should inherit live+web from the listing");
  }

  const bombAsk =
    "give me a brief history of the atomic bomb and nuclear energy";
  const bomb = fallbackAskIntent(bombAsk);
  if (!bomb.harvest || bomb.job !== "remember" || bomb.answerMode !== "teach_light") {
    fail(failures, "brief history of the atomic bomb should harvest as teach_light");
  }
  if (bomb.maxChips < 2) {
    fail(failures, "brief history should budget at least 2 chips");
  }

  const nagasaki = fallbackAskIntent(
    "Where was Nagasaki bombed with an atomic weapon?"
  );
  if (!nagasaki.harvest || nagasaki.job !== "remember") {
    fail(failures, "where-was history should still Keep");
  }

  const japanPlaces = fallbackAskIntent(
    "What places in Japan were attacked using these weapons in World War II?"
  );
  if (!japanPlaces.harvest) {
    fail(failures, "places-in-Japan history should still Keep");
  }

  return { ok: failures.length === 0, failures };
}

export async function runAskIntentAsyncFixtures(): Promise<{
  ok: boolean;
  failures: string[];
}> {
  const failures: string[] = [];
  const fallback = fallbackAskIntent("What is the capital of Utah?");
  const classified = fallbackAskIntent("Why are cows brown?");
  const late = new Promise<typeof classified>(() => undefined);
  const peeked = await peekAskIntent(late, fallback);
  if (peeked.primaryAsk !== fallback.primaryAsk) {
    fail(failures, "peekAskIntent should use fallback when classify is still pending");
  }
  const ready = await peekAskIntent(Promise.resolve(classified), fallback);
  if (ready.answerMode !== "teach_light") {
    fail(failures, "peekAskIntent should use classify when it already finished");
  }
  const slowClassify = new Promise<typeof classified>((resolve) => {
    setTimeout(() => resolve(classified), 50);
  });
  const awaited = await resolveAskIntentForAnswer(slowClassify, fallback);
  if (awaited.answerMode !== "teach_light") {
    fail(failures, "resolveAskIntentForAnswer should await classify, not regex race");
  }
  const fast = await resolveAskIntentForAnswer(Promise.resolve(classified), fallback);
  if (fast.answerMode !== "teach_light") {
    fail(failures, "resolveAskIntentForAnswer should keep a fast classify");
  }
  if (CLASSIFY_MS > 1500) {
    fail(failures, "CLASSIFY_MS is a hang cap, not a 2.5s wait");
  }
  const provider = classifyProvider();
  if (provider !== "luna" && provider !== "grok") {
    fail(failures, "classifyProvider should be luna or grok");
  }
  const grokBare = grokInput([{ role: "user", content: "USER: hi" }], {
    system: "Return ONLY JSON.",
    bareSystem: true,
    answerLength: "short",
  });
  const grokSystem = String(grokBare[0]?.content ?? "");
  if (grokSystem !== "Return ONLY JSON." || /Length:/.test(grokSystem)) {
    fail(failures, "Grok classify must not append Ask length/clock");
  }
  const lunaBare = openaiMessages([{ role: "user", content: "USER: hi" }], {
    system: "Return ONLY JSON.",
    bareSystem: true,
    answerLength: "short",
  });
  const lunaSystem = lunaBare[0]?.content ?? "";
  if (lunaSystem !== "Return ONLY JSON." || /Length:/.test(lunaSystem)) {
    fail(failures, "Luna classify must not append Ask length/clock");
  }
  return { ok: failures.length === 0, failures };
}
