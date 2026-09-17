import {
  clusterKeepOrder,
  packHomeChips,
  PHONE_HOME_SEAT_CAP,
  seedKeepField,
  seedPhoneHome,
  setPhoneHomeSeatedIds,
  type HomeWall,
  type PackChip,
} from "./home-pack";

function fail(failures: string[], message: string) {
  failures.push(message);
}

function hit(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  gap: number
) {
  return (
    a.x < b.x + b.w + gap &&
    a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap &&
    a.y + a.h + gap > b.y
  );
}

const PHONE_VIEW = { w: 393, h: 852 };
const PHONE_WALLS: HomeWall[] = [
  { x: 24, y: 528, w: 345, h: 72 },
  { x: 0, y: 0, w: 393, h: 56 },
  { x: 12, y: 720, w: 369, h: 110 },
];

function chip(
  id: string,
  extra?: Partial<PackChip>
): PackChip {
  return {
    id,
    w: 220,
    h: 44,
    hue: "when",
    group: id,
    role: "keep",
    ...extra,
  };
}

export function runHomePackFixtures() {
  const failures: string[] = [];
  setPhoneHomeSeatedIds(null);

  const desk = seedKeepField(
    [
      chip("d1", { w: 140, h: 48 }),
      chip("d2", { w: 140, h: 48 }),
      chip("d3", { w: 140, h: 48 }),
      chip("d4", { w: 140, h: 48 }),
    ],
    { w: 1440, h: 900 },
    []
  );
  if (desk.length !== 4) {
    fail(failures, `desktop 4-count should keep 4 seats, got ${desk.length}`);
  }
  const deskBoxes = desk.map((seat, i) => ({
    ...seat,
    w: 140,
    h: 48,
    group: `d${i + 1}`,
  }));
  const sixteen = Array.from({ length: 16 }, (_, i) =>
    chip(`d16-${i}`, { w: 120, h: 44 })
  );
  const desk16 = seedKeepField(sixteen, { w: 1440, h: 900 }, []);
  if (desk16.length !== 16) {
    fail(failures, `desktop 16-count should keep 16 seats, got ${desk16.length}`);
  }
  const emptyView = seedKeepField(sixteen, { w: 0, h: 0 }, []);
  if (emptyView.length !== 16) {
    fail(failures, `zero-size view must not throw, got ${emptyView.length}`);
  }

  const deskPacked = packHomeChips(deskBoxes, [], { w: 1440, h: 900 });
  for (let i = 0; i < deskPacked.length; i += 1) {
    for (let j = i + 1; j < deskPacked.length; j += 1) {
      if (hit(deskPacked[i], deskPacked[j], 8)) {
        fail(failures, `desktop seats ${i} and ${j} overlap`);
      }
    }
  }
  if (desk[0] && desk[0].x > 400) {
    fail(failures, "desktop n=1 should still sit near the left");
  }

  const one = seedPhoneHome([chip("solo")], PHONE_VIEW, PHONE_WALLS);
  if (one.length !== 1) fail(failures, "phone n=1 should seat one chip");
  const solo = one[0];
  if (solo) {
    const cx = solo.x + 110;
    if (cx > PHONE_VIEW.w * 0.42 && cx < PHONE_VIEW.w * 0.58) {
      fail(failures, "phone n=1 must not sit in the true center");
    }
    if (solo.y + 44 > 528) {
      fail(failures, "phone n=1 must sit above the greeting");
    }
  }

  const longs = Array.from({ length: 12 }, (_, i) =>
    chip(`long-${i}`, { w: 250, group: `g${Math.floor(i / 3)}` })
  );
  const packedLong = seedPhoneHome(longs, PHONE_VIEW, PHONE_WALLS);
  if (packedLong.length > PHONE_HOME_SEAT_CAP) {
    fail(
      failures,
      `phone must not seat more than ${PHONE_HOME_SEAT_CAP}, got ${packedLong.length}`
    );
  }
  if (packedLong.length < 4) {
    fail(failures, `phone 12-wide should still seat a field, got ${packedLong.length}`);
  }
  const sized = packedLong.map((seat) => ({ ...seat, w: 250, h: 44 }));
  for (let i = 0; i < sized.length; i += 1) {
    for (let j = i + 1; j < sized.length; j += 1) {
      if (hit(sized[i], sized[j], 8)) {
        fail(failures, `phone wide seats ${sized[i].id} and ${sized[j].id} overlap`);
      }
    }
    if (sized[i].y + sized[i].h > 528) {
      fail(failures, `${sized[i].id} sits on the greeting`);
    }
  }

  const shorts = [
    chip("c1a", { w: 90, group: "rome", hue: "where" }),
    chip("c1b", { w: 90, group: "rome", hue: "when" }),
    chip("c1c", { w: 90, group: "rome", hue: "who" }),
    chip("c2a", { w: 90, group: "moon", hue: "where" }),
    chip("c2b", { w: 90, group: "moon", hue: "when" }),
  ];
  const clustered = seedPhoneHome(shorts, PHONE_VIEW, PHONE_WALLS);
  if (clustered.length < 5) {
    fail(failures, `short cluster field should seat all 5, got ${clustered.length}`);
  }
  const rome = clustered.filter((seat) => seat.id.startsWith("c1"));
  const moon = clustered.filter((seat) => seat.id.startsWith("c2"));
  if (rome.length >= 2) {
    const spread = Math.max(...rome.map((s) => s.y)) - Math.min(...rome.map((s) => s.y));
    if (spread > 220) {
      fail(failures, `rome cluster should sit nearby, y-spread ${spread}`);
    }
  }
  if (rome[0] && moon[0]) {
    const apart = Math.hypot(rome[0].x - moon[0].x, rome[0].y - moon[0].y);
    if (apart < 24) {
      fail(failures, "different clusters should not share a seat");
    }
  }

  const ordered = clusterKeepOrder([
    { id: "a", kind: "when", cluster: "one" },
    { id: "b", kind: "where", cluster: "two" },
    { id: "c", kind: "who", cluster: "one" },
  ]);
  const oneAt = ordered.findIndex((chip) => chip.id === "a");
  const cAt = ordered.findIndex((chip) => chip.id === "c");
  if (Math.abs(oneAt - cAt) !== 1) {
    fail(failures, "clusterKeepOrder should keep the same Ask together");
  }

  const again = seedPhoneHome(longs, PHONE_VIEW, PHONE_WALLS);
  const key = packedLong.map((s) => `${s.id}:${s.x}:${s.y}`).join("|");
  const key2 = again.map((s) => `${s.id}:${s.x}:${s.y}`).join("|");
  if (key !== key2) fail(failures, "phone packer must be deterministic");

  return { ok: failures.length === 0, failures };
}
