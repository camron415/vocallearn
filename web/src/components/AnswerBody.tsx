"use client";

import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  collectSources,
  linkifyBareCitations,
  promoteSourcesHeading,
  stabilizeMarkdown,
  type DisplaySource,
} from "@/lib/markdown-plain";

function childText(children: unknown): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(childText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return childText((children as { props?: { children?: unknown } }).props?.children);
  }
  return "";
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
}: {
  content: string;
  streaming?: boolean;
}) {
  const sources = collectSources(content);
  const markdown = stabilizeMarkdown(
    linkifyBareCitations(promoteSourcesHeading(content), sources)
  );

  return (
    <div className={`answer${streaming ? " answer--streaming" : ""}`}>
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents(sources)}>
        {markdown}
      </Markdown>
      {streaming ? <span className="stream-caret" aria-hidden /> : null}
    </div>
  );
}
