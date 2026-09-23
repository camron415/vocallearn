import {
  agentKeyframeFiles,
  filmCanvasWidth,
  filmSnapOpts,
  filmStillEveryMs,
  parseAgentTake,
} from "./film-rate";

export function runFilmRateFixtures(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  const still = (search: string, want: number) => {
    const got = filmStillEveryMs(search);
    if (got !== want) failures.push(`still ${search || "(empty)"} → ${got} want ${want}`);
  };
  still("", 2000);
  still("film=1", 2000);
  still("burst=1", 80);
  still("burst=12", 83);
  still("burst=3", 2000);
  still("?burst=24", 42);
  still("burst=1&take=roundtrip", 100);

  if (filmCanvasWidth(393) !== 393) failures.push("phone canvas");
  if (filmCanvasWidth(820) !== 960) failures.push("desktop canvas");

  const morph = parseAgentTake("take=morph&q=nile&hold=2400");
  if (morph.take !== "morph") failures.push("take morph");
  if (morph.q !== "nile") failures.push("q");
  if (morph.holdMs !== 2400) failures.push("hold");
  if (parseAgentTake("take=roundtrip").take !== "roundtrip") failures.push("take roundtrip");
  if (parseAgentTake("take=return").take !== "return") failures.push("take return");
  if (parseAgentTake("").take != null) failures.push("empty take");

  const snap = filmSnapOpts("burst=1", 393);
  if (snap.skipFonts) failures.push("burst should keep fonts");
  if (snap.pixelRatio !== 2) failures.push("phone burst dpr");
  if (!filmSnapOpts("", 800).skipFonts) failures.push("slow film can skip fonts");

  const keys = agentKeyframeFiles([
    "frame-01-start.jpg",
    "frame-02-tick.jpg",
    "frame-07-travel.jpg",
    "frame-15-land.jpg",
    "path.jpg",
  ]);
  if (keys.join() !== "frame-01-start.jpg,frame-07-travel.jpg,frame-15-land.jpg") {
    failures.push(`keyframes ${keys.join()}`);
  }

  return { ok: failures.length === 0, failures };
}
