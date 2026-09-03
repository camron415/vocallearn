"use client";

import type { Components } from "react-markdown";
import Markdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  collectSources,
  linkifyBareCitations,
  promoteSourcesHeading,
  stabilizeMarkdown,
  type DisplaySource,
} from "@/lib/markdown-plain";
import { harvestMarkdown, type HarvestChip } from "@/lib/harvest";
import { recipeSaveMarkdown } from "@/lib/save-offer";

function childText(children: unknown): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(childText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return childText((children as { props?: { children?: unknown } }).props?.children);
  }
  return "";
}

function harvestMark(href: string, children: unknown) {
  const rest = href.slice("harvest://".length);
  const slash = rest.indexOf("/");
  const id = slash >= 0 ? rest.slice(0, slash) : rest;
  const kind = slash >= 0 ? rest.slice(slash + 1) : "meaning";
  return (
    <mark data-harvest={id} className={`harvest-span harvest-span--${kind}`}>
      {children as string}
    </mark>
  );
}

function saveMark(children: unknown) {
  return <mark className="save-span">{children as string}</mark>;
}

function CitationMark({
  n,
  href,
  sources,
}: {
  n: number;
  href?: string;
  sources: DisplaySource[];
}) {
  const source = sources[n - 1];
  const url =
    href && href.startsWith("http") ? href : source?.url || href || `#src-${n}`;
  const external = url.startsWith("http");

  return (
    <a
      className="cite-mark"
      href={url}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      title={source?.label || url}
      aria-label={`Source ${n}${source ? `: ${source.label}` : ""}`}
    >
      {n}
    </a>
  );
}

function markdownComponents(sources: DisplaySource[]): Components {
  return {
    img: () => null,
    a: ({ href, children }) => {
      if (href?.startsWith("save://")) return saveMark(children);
      if (href?.startsWith("harvest://")) return harvestMark(href, children);
      const text = childText(children).trim();
      const cite = text.match(/^\[(\d+)\]$/);
      if (cite) {
        return (
          <CitationMark n={Number(cite[1])} href={href} sources={sources} />
        );
      }
      if (!href) return <span>{children}</span>;
      const external = href.startsWith("http");
      return (
        <a
          href={href}
          className="answer-link"
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      );
    },
  };
}

export function AnswerBody({
  content,
  streaming = false,
  harvest = [],
  saveHighlight = false,
}: {
  content: string;
  streaming?: boolean;
  harvest?: HarvestChip[];
  saveHighlight?: boolean;
}) {
  const sources = collectSources(content);
  let body = stabilizeMarkdown(
    linkifyBareCitations(promoteSourcesHeading(content), sources)
  );
  if (saveHighlight && !streaming) body = recipeSaveMarkdown(body);
  const markdown = harvestMarkdown(body, harvest);

  return (
    <div className={`answer${streaming ? " answer--streaming" : ""}`}>
      <Markdown
        key={harvest.map((chip) => chip.id).join("-") || "plain"}
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) =>
          url.startsWith("harvest://") || url.startsWith("save://")
            ? url
            : defaultUrlTransform(url)
        }
        components={markdownComponents(sources)}
      >
        {markdown}
      </Markdown>
      {streaming ? <span className="stream-caret" aria-hidden /> : null}
    </div>
  );
}
