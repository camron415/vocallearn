import { JUICE_SOUND, JUICE_WEIGHT, juiceQuiet } from "./halo-juice";
import { listenAtom } from "./listen-atom";

export function runHaloJuiceFixtures(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];

  if (typeof document === "undefined" && juiceQuiet() !== true) {
    failures.push("SSR / node must be quiet");
  }
  if (JUICE_WEIGHT.object !== "medium" || JUICE_WEIGHT.send !== "light") {
    failures.push("chip/send weights drifted");
  }
  if (JUICE_SOUND.object || JUICE_SOUND.send || !JUICE_SOUND.lock) {
    failures.push("only lock/gold should tick");
  }

  const short = listenAtom("Rome is the capital of Italy.");
  if (short.atom !== "Rome is the capital of Italy." || short.truncated) {
    failures.push(`short atom: ${JSON.stringify(short)}`);
  }

  const two = listenAtom("Rome is the capital of Italy. The Tiber runs through it.");
  if (two.atom !== "Rome is the capital of Italy." || !two.truncated) {
    failures.push(`two-sentence atom: ${JSON.stringify(two)}`);
  }
  if (!two.rest.startsWith("The Tiber")) {
    failures.push(`two-sentence rest: ${two.rest}`);
  }

  const long = "A".repeat(80) + ". " + "B".repeat(500);
  const capped = listenAtom(long);
  if (capped.atom.length > 400) {
    failures.push(`atom over cap: ${capped.atom.length}`);
  }
  if (!capped.truncated) failures.push("long reply should truncate");

  const dr = listenAtom("Dr. Jones found it in Egypt. Then he left.");
  if (!dr.atom.startsWith("Dr. Jones found it in Egypt.")) {
    failures.push(`abbrev split: ${dr.atom}`);
  }

  return { ok: failures.length === 0, failures };
}
