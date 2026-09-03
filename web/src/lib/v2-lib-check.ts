import { runHarvestClientFixtures } from "./harvest-client-fixtures";
import { runLearnMineFixtures } from "./learn-mine-fixtures";
import { runLocalDayFixtures } from "./local-day-check";
import { runOpenScoreFixtures } from "./open-score";
import { runSaveOfferFixtures } from "./save-offer-check";

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

const suites: Array<[string, () => SuiteResult]> = [
  ["learn-mine (intake gates + validation)", runLearnMineFixtures],
  ["harvest-client (dedup + re-flight)", runHarvestClientFixtures],
  ["open-score (gist grading)", runOpenScoreFixtures],
  ["local-day (calendar due + greeting hour)", runLocalDayFixtures],
  ["save-offer (recipe pill detect)", runSaveOfferFixtures],
];

let failed = 0;
for (const [name, run] of suites) {
  const result = run();
  report(name, result);
  if (!result.ok) failed += 1;
}

console.log(`\n${suites.length - failed}/${suites.length} suites passed`);
if (failed > 0) process.exit(1);
