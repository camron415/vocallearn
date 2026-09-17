# Ask bucket smoke (dedicated lab account)

Generated: 2026-09-15T04:18:36.281Z
Base: http://127.0.0.1:3000
Account: halo.lab.smoke@invalid.local (lane lab — not Camron's Keep)
Result: **26/28 routing · 11/11 primary atom** on the full pack.

Hole re-check `HALO_SMOKE_ONLY=live-ice-cream,product-socks` at 2026-09-15T04:22:39: **2/2 routing**. Ice cream stays live+web, no Save pill. Socks job=other, no Keep. Combined pack is **28/28 routing · 11/11 primary atom**.

| Case | Expect | Got | Job | Fresh | Provider | Search | Cited | Harvest | Chips | Primary | Save | ms | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| chat-hello | neither | neither | chat | weights | luna | no | no | no | 0 | — | no | 3636 | OK |
| chat-smash | neither | neither | chat | weights | luna | no | no | no | 0 | — | no | 5170 | OK |
| chat-testing | neither | neither | chat | weights | luna | no | no | no | 0 | — | no | 4072 | OK |
| edu-sky | remember | remember | remember | weights | luna | no | no | yes | 1 | Rayleigh scattering | no | 7389 | OK |
| chat-typo-ack | neither | neither | chat | weights | luna | no | no | no | 0 | — | no | 3928 | OK |
| edu-ruel | remember | remember | remember | weights | luna | no | no | yes | 1 | many cultures and religions | no | 6429 | OK |
| edu-who | remember | remember | remember | weights | luna | no | no | yes | 1 | no single person | no | 5994 | OK |
| edu-utah | remember | remember | remember | weights | luna | no | no | yes | 1 | Salt Lake City | no | 5702 | OK |
| edu-photosynthesis | remember | remember | remember | weights | luna | no | no | yes | 3 | Photosynthesis | no | 10210 | OK |
| edu-gettysburg | remember | remember | remember | weights | luna | no | no | yes | 1 | July 1 to July 3, 1863 | no | 8966 | OK |
| edu-austen | remember | remember | remember | weights | luna | no | no | yes | 2 | Jane Austen | no | 7240 | OK |
| edu-pythagoras | remember | remember | remember | weights | luna | no | no | yes | 1 | a² + b² = c² | no | 8881 | OK |
| edu-rome | remember | remember | remember | weights | luna | no | no | yes | 1 | 476 AD | no | 9399 | OK |
| edu-bees | remember | remember | remember | web | grok | yes | yes | yes | 1 | Deformed wing virus | no | 38720 | OK |
| kitchen-waffle | kitchen | kitchen | kitchen | weights | luna | no | no | no | 0 | — | yes | 8523 | OK |
| kitchen-carbonara | kitchen | kitchen | kitchen | weights | luna | no | no | no | 0 | — | yes | 7150 | OK |
| kitchen-ravioli | kitchen | kitchen | kitchen | weights | luna | no | no | no | 0 | — | yes | 10134 | OK |
| kitchen-lookup | kitchen | kitchen | kitchen | web | grok | yes | yes | no | 0 | — | yes | 21056 | OK |
| live-byu-bare | neither | neither | live | feeds | luna | no | yes | no | 0 | — | no | 6024 | OK |
| live-byu-short | neither | neither | live | feeds | luna | no | yes | no | 0 | — | no | 5278 | OK |
| live-byu-football | neither | neither | live | feeds | luna | no | yes | no | 0 | — | no | 4655 | OK |
| live-weather | neither | neither | live | feeds | luna | no | no | no | 0 | — | no | 3953 | OK |
| live-nintendo | neither | neither | live | web | grok | yes | yes | no | 0 | — | no | 18788 | OK |
| opinion-fans | neither | neither | opinion | web | grok | yes | yes | no | 0 | — | no | 33582 | OK |
| live-ice-cream | neither | kitchen | live | web | grok | yes | yes | no | 0 | — | yes | 23048 | HOLE — bucket kitchen want neither; unexpected recipe pill |
| live-ice-current | neither | neither | live | web | grok | yes | yes | no | 0 | — | no | 15890 | OK |
| edu-bomb-history | remember | remember | remember | weights | grok | no | no | yes | 3 | 1938 | no | 31929 | OK |
| product-socks | neither | remember | remember | weights | luna | no | no | no | 0 | — | no | 4381 | HOLE — bucket remember want neither |

## Detail

### chat-hello

**Prompt:** Hello
**Note:** Greeting — Luna chat, no Keep.
**Route:** job=chat freshness=weights provider=luna search=false cited=false skip=—

Hello! How can I help you today?

### chat-smash

**Prompt:** asdfghjklqwertyuiopzxcvbnm
**Note:** Keyboard smash — chat, no quiz.
**Route:** job=chat freshness=weights provider=luna search=false cited=false skip=—

Hello! It looks like you typed a sequence of letters. How can I assist you today?

### chat-testing

**Prompt:** I was just testing
**Note:** Chit-chat, no Keep.
**Route:** job=chat freshness=weights provider=luna search=false cited=false skip=—

No worries at all! If you want to try anything else or have questions, just let me know. I'm here to help!

### edu-sky

**Prompt:** why is the sky blue
**Note:** Educational how/why — Keep 2–3 chips.
**Route:** job=remember freshness=weights provider=luna search=false cited=false skip=—
**Chips:** meaning:closed:Rayleigh scattering

The sky is blue because molecules in the Earth's atmosphere scatter sunlight, and blue light is scattered more than other colors due to its shorter wavelength. This scattering, called Rayleigh scattering, causes the blue wavelengths to spread across the sky, making it appear blue to our eyes. This effect is most noticeable during the day when the sun is high, as sunlight passes through less atmosphere, and the shorter blue wavelengths dominate the scattered light. At sunrise or sunset, the sky 

### chat-typo-ack

**Prompt:** Oh I said sweet, it was a typo
**Note:** Typo acknowledgement after a fact ask must not harvest.
**Route:** job=chat freshness=weights provider=luna search=false cited=false skip=—

No worries! Happens to everyone. If you meant to say something else or have another question, just let me know!

### edu-ruel

**Prompt:** what is the golden ruel
**Note:** Typo inside a real fact question still remember.
**Route:** job=remember freshness=weights provider=luna search=false cited=false skip=—
**Chips:** where:closed:many cultures and religions

The **Golden Rule** is a moral principle that means treating others as you would like to be treated. It is a common ethical guideline found in many cultures and religions, encouraging kindness and empathy in interactions with others.

### edu-who

**Prompt:** Who created this?
**Note:** Follow-up “this” is the Golden Rule, not a photo.
**Route:** job=remember freshness=weights provider=luna search=false cited=false skip=—
**Chips:** meaning:closed:no single person

The **Golden Rule** was not created by a single person; it is a universal ethical concept that appears independently in many cultures and religions throughout history. It is found in ancient texts like Confucianism, Christianity, Buddhism, and others, reflecting a shared human value rather than an invention by one individual.

### edu-utah

**Prompt:** What is the capital of Utah?
**Note:** Closed lookup — main chip Salt Lake City, optional support.
**Route:** job=remember freshness=weights provider=luna search=false cited=false skip=—
**Chips:** who:closed:Salt Lake City

The capital of Utah is Salt Lake City. It is the largest city in the state and the center of Utah's government and cultural activities.

### edu-photosynthesis

**Prompt:** How does photosynthesis work?
**Note:** Open gist + supporting pegs.
**Route:** job=remember freshness=weights provider=luna search=false cited=false skip=—
**Chips:** meaning:open:Photosynthesis · where:closed:thylakoid membranes · meaning:closed:20th century

Photosynthesis is the biological process by which green plants, algae, and some bacteria convert light energy into chemical energy stored in glucose. It primarily occurs in chloroplasts within plant cells, where chlorophyll captures sunlight to drive a series of reactions. The process involves two main stages: 1. **Light-dependent reactions**: These occur in the thylakoid membranes, where sunlight splits water molecules into oxygen, protons, and electrons. This generates ATP and NADPH, energy 

### edu-gettysburg

**Prompt:** When was the Battle of Gettysburg?
**Note:** Closed date. Place can sit as a side chip.
**Route:** job=remember freshness=weights provider=luna search=false cited=false skip=—
**Chips:** when:closed:July 1 to July 3, 1863

The Battle of Gettysburg took place from July 1 to July 3, 1863. It was a crucial battle in the American Civil War fought in and around the town of Gettysburg, Pennsylvania. This battle marked a turning point with the Union Army repelling the Confederate invasion of the North.

### edu-austen

**Prompt:** Who wrote Pride and Prejudice?
**Note:** Closed who.
**Route:** job=remember freshness=weights provider=luna search=false cited=false skip=—
**Chips:** who:closed:Jane Austen · when:closed:1813

Pride and Prejudice was written by Jane Austen. It is a classic novel first published in 1813, known for its commentary on manners, marriage, and social class in early 19th-century England.

### edu-pythagoras

**Prompt:** What is the Pythagorean theorem?
**Note:** Stable math fact.
**Route:** job=remember freshness=weights provider=luna search=false cited=false skip=—
**Chips:** meaning:closed:a² + b² = c²

The Pythagorean theorem is a fundamental principle in geometry stating that in a right triangle, the square of the length of the hypotenuse (the side opposite the right angle) equals the sum of the squares of the lengths of the other two sides. It is usually written as **a² + b² = c²**, where **c** is the hypotenuse. This theorem is used to find the length of a side when the other two are known.

### edu-rome

**Prompt:** Why did the Western Roman Empire fall?
**Note:** Deeper history — Grok reasoning is OK, still Keep.
**Route:** job=remember freshness=weights provider=luna search=false cited=false skip=—
**Chips:** meaning:closed:476 AD

The Western Roman Empire fell due to a combination of internal weaknesses and external pressures that accumulated over centuries, leading to its collapse in 476 AD. Key reasons include: - **Political instability**: Frequent changes of emperors, civil wars, and weak leadership undermined effective governance. - **Economic troubles**: Heavy taxation, reliance on slave labor, inflation, and disrupted trade weakened the economy. - **Military problems**: Difficulty recruiting Roman soldiers led to i

### edu-bees

**Prompt:** What is the current scientific consensus on why bees are declining?
**Note:** Educational research — Grok search OK, still Keep not live-news.
**Route:** job=remember freshness=web provider=grok search=true cited=true skip=—
**Chips:** meaning:closed:Deformed wing virus

**Multiple interacting stressors—chiefly parasitic Varroa mites and the viruses they transmit, along with pesticides, habitat loss, poor nutrition, and climate change—drive ongoing bee population declines worldwide.**[[1]](https://www.projectapism.org/pam-blog/record-losses-of-2025-a-flashback-to-ccd-ppb-and-the-4-ps) ## Honey Bees Recent U.S. commercial colony losses reached record levels in 2025, with over 60% of colonies dying in some periods. USDA researchers linked the mass die-off primari

### kitchen-waffle

**Prompt:** Give me a basic waffle recipe
**Note:** Basic recipe — Luna, Save pill, no Keep.
**Route:** job=kitchen freshness=weights provider=luna search=false cited=false skip=—

**Basic Waffle Recipe** ### Ingredients - 2 cups all-purpose flour - 2 tablespoons sugar - 1 tablespoon baking powder - 1/2 teaspoon salt - 2 large eggs - 1 3/4 cups milk - 1/2 cup vegetable oil or melted butter - 1 teaspoon vanilla extract ### Steps 1. Preheat your waffle iron according to the manufacturer’s instructions. 2. In a large bowl, whisk together the flour, sugar, baking powder, and salt. 3. In another bowl, beat the eggs. Add the milk, oil (or melted butter), and vanilla extract; m

### kitchen-carbonara

**Prompt:** How do I make carbonara?
**Note:** How-to-cook — recipe save, no Keep.
**Route:** job=kitchen freshness=weights provider=luna search=false cited=false skip=—

**Carbonara** ### Ingredients - 12 oz (340 g) spaghetti or pasta of choice - 4 oz (115 g) pancetta or guanciale, diced - 2 large eggs - 1 cup (100 g) grated Pecorino Romano or Parmesan cheese - 2 cloves garlic, peeled (optional) - Freshly ground black pepper - Salt, for pasta water ### Steps 1. **Boil pasta:** Bring a large pot of salted water to a boil. Cook the pasta until al dente according to package instructions. Reserve 1 cup of pasta water before draining. 2. **Cook pancetta:** While pa

### kitchen-ravioli

**Prompt:** recipe for homemade ravioli
**Note:** Recipe language — Library not Keep.
**Route:** job=kitchen freshness=weights provider=luna search=false cited=false skip=—

**Homemade Ravioli** ### Ingredients - 2 cups all-purpose flour, plus extra for dusting - 3 large eggs - 1/2 tsp salt - 1 tbsp olive oil - 1 cup ricotta cheese - 1/2 cup grated Parmesan cheese - 1 cup cooked and chopped spinach (optional) - Salt and pepper, to taste - 1/2 tsp nutmeg (optional) - Your choice of sauce (marinara, brown butter sage, or cream sauce) ### Steps 1. **Make the dough:** On a clean surface, mound the flour and make a well in the center. Crack the eggs into the well, add 

### kitchen-lookup

**Prompt:** Look up the 2024 viral baked feta pasta recipe
**Note:** Specific modern recipe may use Grok search; still kitchen, no Keep.
**Route:** job=kitchen freshness=web provider=grok search=true cited=true skip=—

**Baked Feta Pasta** ## Ingredients - 2 pints (about 500 grams) cherry or grape tomatoes - 1 block (200 grams / 7-8 ounces) feta cheese - ½ cup (120 ml) extra-virgin olive oil - 2–3 garlic cloves, minced - ½ teaspoon salt - ¼ teaspoon black pepper - ½ teaspoon crushed red pepper flakes (optional) - 12 ounces (340 grams) short pasta such as rigatoni or penne - ¼ cup fresh basil leaves, chopped ## Steps 1. Preheat the oven to 400°F (200°C). 2. Place the cherry tomatoes in a medium baking dish. 3

### live-byu-bare

**Prompt:** when is the next BYU game
**Note:** Sports schedule without “football” — live, no Keep.
**Route:** job=live freshness=feeds provider=luna search=false cited=true skip=—

The next BYU Cougars game is on September 19, 2026, against the Colorado State Rams. It will be held at Canvas Stadium with kickoff at 7:30 PM EDT. Additional details: - The game is away for BYU, at Colorado State. - Following that, BYU plays TCU Horned Frogs at Amon G. Carter Stadium (date TBD). - Upcoming home games include matchups against Iowa State Cyclones on October 9, 2026, at 10:15 AM EDT. - Other scheduled opponents later this season include Notre Dame, UCF, Arizona State, Utah, and B

### live-byu-short

**Prompt:** next BYU game
**Note:** Short sports ask — still live, not a when-question Keep.
**Route:** job=live freshness=feeds provider=luna search=false cited=true skip=—

The next BYU Cougars game is against the Colorado State Rams on September 19 at 7:30 PM EDT. It will be played at Canvas Stadium. - This is the upcoming game after their recent matches against Utah Tech and Arizona Wildcats. - The following games after Colorado State are against TCU Horned Frogs (date TBD) and Iowa State Cyclones on October 9. - BYU's schedule includes home games mostly at LaVell Edwards Stadium. - The team has a mix of home and away games coming up, including a notable game at

### live-byu-football

**Prompt:** When is the next BYU football game?
**Note:** ESPN feed path — Luna, no Keep.
**Route:** job=live freshness=feeds provider=luna search=false cited=true skip=—

The next BYU football game is on September 19, 2026, against the Colorado State Rams. It will be played at Canvas Stadium, starting at 7:30 PM EDT. Additional details: - The game is at an away venue for BYU. - The previous games against Utah Tech Trailblazers and Arizona Wildcats have already finished. - Following the Colorado State game, BYU has a matchup scheduled against TCU Horned Frogs, but the date and time are TBD. - The schedule also includes other opponents like Iowa State Cyclones, No

### live-weather

**Prompt:** What's the weather in Denver today?
**Note:** Forecast — live, no Keep.
**Route:** job=live freshness=feeds provider=luna search=false cited=false skip=—

Today's weather in Denver is 73°F. - The temperature range is between 64°F and 73°F. - The wind is coming from the south at 11 mph. - UV index is moderate at 5. - It is partly cloudy. - Humidity is at 31%. This should be a pleasant day to be outside with mild temperatures and moderate sun exposure.

### live-nintendo

**Prompt:** Look up Nintendo events going on this week
**Note:** This-week events — Grok search, no Keep.
**Route:** job=live freshness=web provider=grok search=true cited=true skip=—

**This week (September 14–20, 2026), Nintendo’s main activities center on game releases rather than new Directs or major live events.**[[1]](https://www.nintendolife.com/guides/nintendo-direct-september-2026-every-game-announcement-and-trailer) - **Fire Emblem: Fortune’s Weave** launches exclusively on Nintendo Switch 2 on **September 17**. It features strategic battles in the Dagdan Empire with commanders like Cai, Dietrich, Theodora, and Leda.[[2]](https://www.mixvale.com.br/2026/09/14/ninten

### opinion-fans

**Prompt:** What is the overall sentiment of the players and fans towards the game?
**Note:** Fan sentiment — opinion, no Keep.
**Route:** job=opinion freshness=web provider=grok search=true cited=true skip=—

**Overall, fan sentiment toward American football (particularly the NFL) remains strongly positive amid the 2026 season kickoff, driven by excitement for new storylines and competitive play, though tempered by ongoing concerns about player health.**[[1]](https://www.sportsbusinessjournal.com/Articles/2025/09/08/madkour-fan-affinity-strong-as-nfl-kicks-off/) - **Fans broadly love the sport**: Surveys show high affinity, with strong ratings for the live stadium experience (70%+ excellent/good ove

### live-ice-cream

**Prompt:** Where are the best ice cream places in Salt Lake City?
**Note:** Local listing — Grok search, no Keep.
**Route:** job=live freshness=web provider=grok search=true cited=true skip=—

**Blacksmith Ice Cream** and **Rockwell Ice Cream** consistently rank among the highest-rated and most praised spots in recent Yelp data and local roundups for Salt Lake City.[[1]](https://www.yelp.com/search?find_desc=Ice+Cream+%26+Frozen+Yogurt&find_loc=Salt+Lake+City%2C+UT) Here are some of the standout options based on ratings, reviews, and mentions across sources: - **Blacksmith Ice Cream** (Sugar House at ~1295 Miller Ave or nearby Millcreek; also Bountiful location): Artisan-style ice c

### live-ice-current

**Prompt:** give me current ones
**Note:** Follow-up re-search — still no Keep.
**Route:** job=live freshness=web provider=grok search=true cited=true skip=—

**Here are the current top-rated ice cream spots in Salt Lake City** based on the latest 2026 Yelp rankings and recent local coverage (as of mid-September).[[1]](https://www.yelp.com/search?find_desc=Ice+Cream+%26+Frozen+Yogurt&find_loc=Salt+Lake+City%2C+UT) - **Blacksmith Ice Cream** (Sugar House and Bountiful locations; new Midvale spot opened recently): Frequently ranks #1 with 4.7–4.8 stars. Known for creative, on-the-spot frozen anvil flavors and flights; strong praise for uniqueness and q

### edu-bomb-history

**Prompt:** give me a brief history of the atomic bomb and nuclear energy
**Note:** Educational history summary — Keep 2–3 chips.
**Route:** job=remember freshness=weights provider=grok search=false cited=false skip=—
**Chips:** when:closed:1938 · who:closed:Manhattan Project · where:closed:Pennsylvania

The atomic bomb and nuclear energy both stem from the 1938 discovery of nuclear fission by Otto Hahn and Fritz Strassmann in Germany. ## Atomic Bomb The atomic bomb took shape during World War II when the United States launched the **Manhattan Project** in 1942 to build a weapon ahead of other nations. J. Robert Oppenheimer directed the scientific effort that produced the first successful test at Trinity site in New Mexico on July 16, 1945. The project then delivered the bombs dropped on Hirosh

### product-socks

**Prompt:** what are these socks made of (material blend)
**Note:** Product ID without a learning ask — no Keep, no recipe.
**Route:** job=remember freshness=weights provider=luna search=false cited=false skip=policy_skip

Please upload or describe the socks or their label so I can identify the material blend for you.

## Holes

Full pack holes, both green on re-check:

- **live-ice-cream**: recipe pill on a live listing — `resolveSaveOffer` now ignores non-kitchen jobs. Re-check: neither / grok / cited / no Save.
- **product-socks**: classify remember — merge lets product regex skip win. Re-check: job=other, 0 chips.
