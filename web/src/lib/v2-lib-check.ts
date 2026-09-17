import { FAMILY_REVIEW_CASES, intentForFamilyCase } from "./harvest-family-review";
import { skipHarvestTurn } from "./harvest-policy";
import { runAskGuardFixtures } from "./ask-guard-check";
import { runAskIntentAsyncFixtures, runAskIntentFixtures } from "./ask-intent-check";
import { runAskProviderFixtures } from "./ask-provider-check";
import { runHarvestClientFixtures } from "./harvest-client-fixtures";
import { runLearnMineFixtures } from "./learn-mine-fixtures";
import { runLocalDayFixtures } from "./local-day-check";
import { runOpenScoreFixtures } from "./open-score";
import { runSaveOfferFixtures } from "./save-offer-check";
import { runFirstHarvestLineFixtures } from "./first-harvest-line-check";
import { runFirstDueLineFixtures } from "./first-due-line-check";
import { runKeepMemoryFixtures } from "./keep-memory-check";
import { runOpenClozeFixtures } from "./open-cloze-check";
import { runHarvestLockFixtures } from "./harvest-lock-check";
import { runKeepLandFixtures } from "./keep-land-check";
import { runHomePackFixtures } from "./home-pack-check";
import { runClosedGradeFixtures } from "./closed-grade-check";
import { runAskHarnessDryFixtures } from "./ask-harness-run";
import { runAskClaimHarnessFixtures } from "./ask-claim-harness-check";
import { runChipInvariantFixtures } from "./chip-invariants-check";
import { runAskAnswerShapeFixtures } from "./ask-answer-shape";

function runFamilyReviewFixtures(): SuiteResult {
  const failures: string[] = [];
  for (const row of FAMILY_REVIEW_CASES) {
    const intent = intentForFamilyCase(row);
    const skipped = skipHarvestTurn(row.question, row.cannedReply, intent).skip;
    if (skipped !== row.wantSkip) {
      failures.push(`${row.id}: skip ${skipped} want ${row.wantSkip}`);
    }
    if (row.wantOpen && intent.maxOpen < 1) {
      failures.push(`${row.id}: wanted open gist budget`);
    }
    if (!row.wantOpen && !row.wantSkip && intent.maxOpen > 0 && intent.answerMode === "direct") {
      failures.push(`${row.id}: closed lookup should not budget open`);
    }
  }
  return { ok: failures.length === 0, failures };
}

type SuiteResult = { ok: boolean; failures: string[] };

function report(name: string, result: SuiteResult) {
  const mark = result.ok ? "PASS" : "FAIL";
  console.log(`\n[${mark}] ${name}`);
  if (!result.ok) {
    for (const line of result.failures) {
      console.log(`  - ${line}`);
    }
  }
}

const suites: Array<[string, () => SuiteResult | Promise<SuiteResult>]> = [
  ["ask-intent (classify fallback + capital)", runAskIntentFixtures],
  ["ask-intent (classify budget / peek)", runAskIntentAsyncFixtures],
  ["ask-provider (Luna vs Grok routing)", runAskProviderFixtures],
  ["ask-harness (TurnPlan routing dry)", runAskHarnessDryFixtures],
  ["ask-claim (short / open-closed / cue uniq)", runAskClaimHarnessFixtures],
  ["chip-invariants (main chip + echo + year)", runChipInvariantFixtures],
  ["ask-answer-shape (remember opening)", runAskAnswerShapeFixtures],
  ["ask-guard (caps + attachment reject)", runAskGuardFixtures],
  ["family-review (intent skip vs harvest)", runFamilyReviewFixtures],
  ["learn-mine (intake gates + validation)", runLearnMineFixtures],
  ["harvest-client (dedup + re-flight)", runHarvestClientFixtures],
  ["open-score (gist grading)", runOpenScoreFixtures],
  ["closed-grade (SAY normalizer)", runClosedGradeFixtures],
  ["local-day (calendar due + greeting hour)", runLocalDayFixtures],
  ["save-offer (recipe pill detect)", runSaveOfferFixtures],
  ["first-harvest-line (H1 once)", runFirstHarvestLineFixtures],
  ["first-due-line (Home once)", runFirstDueLineFixtures],
  ["keep-memory (cap + finishRound + inspect)", runKeepMemoryFixtures],
  ["open-cloze (gist blanks)", runOpenClozeFixtures],
  ["harvest-lock (play mode + kickers)", runHarvestLockFixtures],
  ["keep-land (phone vs desktop bead slot)", runKeepLandFixtures],
  ["home-pack (phone seats vs desktop 16)", runHomePackFixtures],
];

async function main() {
  let failed = 0;
  for (const [name, run] of suites) {
    const result = await Promise.resolve(run());
    report(name, result);
    if (!result.ok) failed += 1;
  }

  console.log(`\n${suites.length - failed}/${suites.length} suites passed`);
  if (failed > 0) process.exit(1);
}

void main();
