# Family harvest review

Generated: 2026-09-17T20:51:04.539Z
Mode: dry (gate + intent only)
Result: **18/18 looked right**

Answers here are **canned** so we do not spend Luna. Miner (Grok none) is the harvest job.

## OK · skip-weather

**Question:** What's the weather in Denver today?

**Canned reply:** Sunny, high of 82, light breeze this afternoon.

**Intent:** harvest=false · practical · open=0

**Skipped:** yes

**Harvested:**
- _(none)_

**Note:** Ephemeral forecast — no Keep chips.

## OK · skip-socks

**Question:** what are these socks made of (material blend)

**Canned reply:** Those look like a cotton-poly blend with a bit of elastane in the cuff. Good for walking, not a study fact.

**Intent:** harvest=false · practical · open=0

**Skipped:** yes

**Harvested:**
- _(none)_

**Note:** Product ID / photo practical — skip harvest.

## OK · capital-utah

**Question:** What is the capital of Utah?

**Canned reply:** The capital of Utah is Salt Lake City.

**Intent:** harvest=true · direct · open=0

**Skipped:** no

**Harvested:**
- _(none)_

**Note:** Closed lookup — must harvest the city.

## OK · capital-maine

**Question:** What is the capital of Maine?

**Canned reply:** The capital of Maine is Augusta.

**Intent:** harvest=true · direct · open=0

**Skipped:** no

**Harvested:**
- _(none)_

**Note:** Closed lookup — capital fallback if miner blanks.

## OK · gettysburg

**Question:** When was the Battle of Gettysburg?

**Canned reply:** The Battle of Gettysburg was fought in **1863** in **Pennsylvania**. It was a turning point of the American Civil War.

**Intent:** harvest=true · direct · open=0

**Skipped:** no

**Harvested:**
- _(none)_

**Note:** Closed date. Place is optional support, not Civil War trivia.

## OK · photosynthesis

**Question:** How does photosynthesis work?

**Canned reply:** Photosynthesis is how plants make food from sunlight, water, and carbon dioxide. It happens in the chloroplast and gives off oxygen.

**Intent:** harvest=true · teach_light · open=1

**Skipped:** no

**Harvested:**
- _(none)_

**Note:** Open gist + closed pegs. Gist due tomorrow; Home cloze then gist SAY.

## OK · cows

**Question:** Why are cows brown?

**Canned reply:** Many cows are brown because of genetics — pigments like **melanin** in the coat. Breed and camouflage also play a part. It is not because they drink chocolate milk.

**Intent:** harvest=true · teach_light · open=1

**Skipped:** no

**Harvested:**
- _(none)_

**Note:** How/why — gist plus one closed atom.

## OK · nile-name

**Question:** What is usually named as the longest river in the world?

**Canned reply:** The **Nile** is usually named the longest river. It runs through **Egypt**. Do not harvest the Amazon just because it is mentioned as a rival.

**Intent:** harvest=true · direct · open=0

**Skipped:** no

**Harvested:**
- _(none)_

**Note:** Primary name only; Egypt/Amazon in the prose are not the ask.

## OK · skip-ravioli

**Question:** recipe for homemade ravioli

**Canned reply:** **Ingredients**
- 2 cups flour

**Steps**
1. Mix the dough.
2. Fill and boil.

**Intent:** harvest=false · practical · open=0

**Skipped:** yes

**Harvested:**
- _(none)_

**Note:** Cooking belongs in Library, not Keep.

## OK · skip-tesla

**Question:** What time is the Tesla cyber cab event

**Canned reply:** The event is scheduled for 7pm Pacific tonight.

**Intent:** harvest=false · practical · open=0

**Skipped:** yes

**Harvested:**
- _(none)_

**Note:** Event time is ephemeral.

## OK · skip-photo

**Question:** what is this

**Canned reply:** That looks like a cotton sock with a reinforced heel. Not a study fact.

**Intent:** harvest=false · practical · open=0

**Skipped:** yes

**Harvested:**
- _(none)_

**Note:** Photo ID / what-is-this.

## OK · golden-ruel

**Question:** what is the golden ruel

**Canned reply:** The **Golden Rule** is a moral principle: treat others as you would like to be treated.

**Intent:** harvest=true · direct · open=0

**Skipped:** no

**Harvested:**
- _(none)_

**Note:** Typo definition — still remember. Junk classify JSON falls through to Keep.

## OK · who-created

**Question:** Who created this?

**Canned reply:** The Golden Rule was not created by a single person; versions appear in Confucius and the Bible.

**Intent:** harvest=true · direct · open=0

**Skipped:** no

**Harvested:**
- _(none)_

**Note:** Follow-up who-created is a fact ask, not photo ID.

## OK · plant-name

**Question:** what plant is this

**Canned reply:** That looks like a **monstera**. The split leaves are how you tell it from a philodendron.

**Intent:** harvest=true · direct · open=0

**Skipped:** no

**Harvested:**
- _(none)_

**Note:** Learning photo — file does not skip Keep.

## OK · capital-us

**Question:** what is the capital of the us

**Canned reply:** Washington, D.C. is the capital of the United States.

**Intent:** harvest=true · direct · open=0

**Skipped:** no

**Harvested:**
- _(none)_

**Note:** Closed lookup — capital fallback if miner blanks.

## OK · skip-smash

**Question:** asdfghjklqwertyuiopzxcvbnm

**Canned reply:** It looks like you have a typo in your message. That string does not mean anything.

**Intent:** harvest=false · practical · open=0

**Skipped:** yes

**Harvested:**
- _(none)_

**Note:** Keyboard smash — chat, not a Keep quiz about gibberish.

## OK · skip-typo-ack

**Question:** Oh I said sweet, it was a typo

**Canned reply:** Okay, cool — you were saying sweet. Nice to know.

**Intent:** harvest=false · practical · open=0

**Skipped:** yes

**Harvested:**
- _(none)_

**Note:** Typo acknowledgement is chat, even after a sky-blue fact ask.

## OK · skip-byu-game

**Question:** when is the next BYU game

**Canned reply:** BYU's next game is Saturday, September 19.

**Intent:** harvest=false · practical · open=0

**Skipped:** yes

**Harvested:**
- _(none)_

**Note:** Sports schedule is live. Classify job owns Keep — do not wait for the word football.
