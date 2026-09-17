import { closedHit } from "./closed-grade";

export function runClosedGradeFixtures() {
  const failures: string[] = [];
  const cases: Array<{
    name: string;
    want: boolean;
    said: string;
    kind: "when" | "where" | "who" | "meaning";
    answer: string;
    token?: string;
  }> = [
    {
      name: "meaning drops trailing era",
      want: true,
      said: "Mesozoic",
      kind: "meaning",
      answer: "Mesozoic Era",
      token: "Mesozoic Era",
    },
    {
      name: "meaning era-only is not enough",
      want: false,
      said: "Era",
      kind: "meaning",
      answer: "Mesozoic Era",
      token: "Mesozoic Era",
    },
    {
      name: "meaning different era fails",
      want: false,
      said: "Jurassic",
      kind: "meaning",
      answer: "Mesozoic Era",
      token: "Mesozoic Era",
    },
    {
      name: "meaning STT hedge + era",
      want: true,
      said: "um it's the mesozoic",
      kind: "meaning",
      answer: "Mesozoic Era",
      token: "Mesozoic Era",
    },
    {
      name: "meaning 1-edit core after era strip",
      want: true,
      said: "Mesozaic",
      kind: "meaning",
      answer: "Mesozoic Era",
      token: "Mesozoic Era",
    },
    {
      name: "where drops trailing ocean",
      want: true,
      said: "Pacific",
      kind: "where",
      answer: "Pacific Ocean",
      token: "Pacific Ocean",
    },
    {
      name: "where does not prefix-match",
      want: false,
      said: "Pac",
      kind: "where",
      answer: "Pacific Ocean",
      token: "Pacific Ocean",
    },
    {
      name: "who last name",
      want: true,
      said: "Washington",
      kind: "who",
      answer: "George Washington",
      token: "George Washington",
    },
    {
      name: "who first name only fails",
      want: false,
      said: "George",
      kind: "who",
      answer: "George Washington",
      token: "George Washington",
    },
    {
      name: "who the nile",
      want: true,
      said: "Nile",
      kind: "who",
      answer: "The Nile",
      token: "Nile",
    },
    {
      name: "when commas optional",
      want: true,
      said: "4130",
      kind: "when",
      answer: "4,130",
      token: "4,130",
    },
    {
      name: "closed wrong river",
      want: false,
      said: "Amazon",
      kind: "who",
      answer: "The Nile",
      token: "Nile",
    },
  ];

  for (const row of cases) {
    const got = closedHit(row.said, {
      kind: row.kind,
      answer: row.answer,
      token: row.token,
      span: row.token,
    });
    if (got !== row.want) {
      failures.push(`${row.name}: got ${got} want ${row.want}`);
    }
  }

  return { ok: failures.length === 0, failures };
}
