/**
 * One Wikipedia lead, and for a picture turn one OpenAlex paper, fetched in parallel.
 * No key. A missing page is a miss, not a guess.
 */

export type StudyPage = {
  title: string;
  url: string;
  text: string;
};

export type StudyReference = {
  wiki: StudyPage | null;
  paper: StudyPage | null;
};

const UA = "Halo/1.3 (https://halo-lab-personal-f999.vercel.app; educational)";

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      }
    );
  });
}

async function getJson(url: string): Promise<unknown | null> {
  const response = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function fetchWikiLead(query: string): Promise<StudyPage | null> {
  const q = query.replace(/\s+/g, " ").trim().slice(0, 180);
  if (q.length < 3) return null;
  const searchUrl =
    "https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&namespace=0&format=json&search=" +
    encodeURIComponent(q);
  const searched = await getJson(searchUrl);
  const titles = Array.isArray(searched) ? searched[1] : null;
  const title = Array.isArray(titles) ? String(titles[0] ?? "") : "";
  if (!title) return null;
  const summaryUrl =
    "https://en.wikipedia.org/api/rest_v1/page/summary/" +
    encodeURIComponent(title.replace(/ /g, "_"));
  const summary = (await getJson(summaryUrl)) as {
    type?: string;
    title?: string;
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
  } | null;
  if (!summary || summary.type === "disambiguation" || summary.type === "no-extract") {
    return null;
  }
  const extract = String(summary.extract ?? "").trim();
  const page = summary.content_urls?.desktop?.page;
  if (!extract || !page) return null;
  return {
    title: String(summary.title || title),
    url: page,
    text: extract.slice(0, 900),
  };
}

function abstractFromIndex(index: Record<string, number[]> | undefined): string {
  if (!index) return "";
  const words: string[] = [];
  for (const [word, spots] of Object.entries(index)) {
    for (const spot of spots) words[spot] = word;
  }
  return words.filter(Boolean).join(" ").slice(0, 500);
}

export async function fetchOpenAlexPaper(query: string): Promise<StudyPage | null> {
  const q = query.replace(/\s+/g, " ").trim().slice(0, 180);
  if (q.length < 3) return null;
  const key = process.env.OPENALEX_API_KEY?.trim();
  const url =
    "https://api.openalex.org/works?per_page=1&search=" +
    encodeURIComponent(q) +
    (key ? `&api_key=${encodeURIComponent(key)}` : "");
  const data = (await getJson(url)) as {
    results?: Array<{
      display_name?: string;
      id?: string;
      abstract_inverted_index?: Record<string, number[]>;
    }>;
  } | null;
  const work = data?.results?.[0];
  if (!work?.display_name || !work.id) return null;
  return {
    title: work.display_name,
    url: work.id,
    text: abstractFromIndex(work.abstract_inverted_index),
  };
}

/** History and disputed causes do not get a paper. A mechanism why/how does. */
export function wantsStudyPaper(query: string): boolean {
  if (/\b(history of|brief history|what caused|cause of|why did|who caused|how many)\b/i.test(query)) {
    return false;
  }
  return /\b(how|why)\b/i.test(query);
}

/** Give up on the article inside the classify wait. Do not add a second pause. */
export const STUDY_BUDGET_MS = 900;

export async function fetchStudyReference(
  query: string,
  options: { picture: boolean }
): Promise<StudyReference> {
  const wiki = fetchWikiLead(query);
  const paper = options.picture ? fetchOpenAlexPaper(query) : Promise.resolve(null);
  const [lead, study] = await Promise.all([
    withTimeout(wiki, STUDY_BUDGET_MS),
    withTimeout(paper, STUDY_BUDGET_MS),
  ]);
  return { wiki: lead, paper: options.picture ? study : null };
}

export function referencePrompt(ref: StudyReference): string {
  const lines: string[] = [];
  if (ref.wiki) {
    lines.push(
      `Reference lead, already opened, “${ref.wiki.title}”: ${ref.wiki.text}`,
      "Sentence 1 must agree with that lead. Rewrite it in your own words. Do not paste it. Do not write a Sources section or a link. The link is added after you finish."
    );
  }
  if (ref.paper) {
    lines.push(
      `Paper, already opened, “${ref.paper.title}”: ${ref.paper.text || "No abstract."}`,
      "Use the paper only when it does not contradict the lead. Do not cite it yourself."
    );
  }
  if (!ref.wiki) {
    lines.push(
      "No article was opened. If this is a why, a how, or a history, answer in one or two sentences and do not write a picture."
    );
  }
  return lines.join("\n");
}

export function quietReferenceLinks(ref: StudyReference): string {
  if (!ref.wiki) return "";
  return `[${ref.wiki.title}](${ref.wiki.url})`;
}
