import { keepSlotRem } from "./keep-land";

function fail(failures: string[], message: string) {
  failures.push(message);
}

function rem(value: string) {
  return Number.parseFloat(value);
}

export function runKeepLandFixtures() {
  const failures: string[] = [];
  const phoneFew = rem(keepSlotRem(4, 390));
  const phoneMany = rem(keepSlotRem(12, 390));
  const deskFew = rem(keepSlotRem(4, 1440));
  const deskMany = rem(keepSlotRem(12, 1440));

  if (phoneMany !== 1.48) {
    fail(failures, `phone many-bead slot should stay 1.48rem for swipe, got ${phoneMany}`);
  }
  if (phoneFew !== 1.58) {
    fail(failures, `phone few-bead slot should stay 1.58rem, got ${phoneFew}`);
  }
  if (deskFew < 1.0 || deskFew > 1.08) {
    fail(failures, `desktop few-bead slot should stay ~1.05rem, got ${deskFew}`);
  }
  if (deskMany < 0.88 || deskMany > 0.96) {
    fail(failures, `desktop many-bead slot should stay ~0.92rem, got ${deskMany}`);
  }

  const sixWide = 6 * phoneFew + 5 * 0.22;
  if (sixWide > 12.2) {
    fail(failures, `six phone beads (${sixWide}rem) should fit a 12.2rem pocket`);
  }

  return { ok: failures.length === 0, failures };
}
