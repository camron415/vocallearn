import type { ReactNode } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

/** Paper legal pages. Public URLs for App Store / TestFlight. */
export function LegalDoc({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="login-stage">
      <style>{LEGAL_CSS}</style>
      <article className="login-card auth-card legal-doc">
        <p className="brand-mark brand-mark--sm">{APP_NAME}</p>
        <h1 className="login-title">{title}</h1>
        <p className="login-sub">
          Invite-only family beta. Draft for TestFlight — public name and
          company are not final. Not a substitute for a lawyer.
        </p>
        {children}
        <nav className="legal-nav" aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/ask">Back</Link>
        </nav>
      </article>
    </div>
  );
}

const LEGAL_CSS = `
.login-card.legal-doc { width: min(40rem, 100%); }
.legal-doc h2 {
  font-family: var(--font-display), Georgia, serif;
  font-size: 1.12rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--halo-ink);
  margin: 1.45rem 0 0.4rem;
}
.legal-doc p, .legal-doc li {
  color: var(--halo-muted);
  font-size: 0.92rem;
  line-height: 1.55;
  margin: 0 0 0.7rem;
}
.legal-doc ul { margin: 0 0 0.7rem; padding-left: 1.15rem; }
.legal-doc a { color: var(--halo-ink); }
.legal-doc .legal-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem 1.1rem;
  margin-top: 1.6rem;
  padding-top: 1rem;
  border-top: 1px solid var(--paper-inset-border, rgba(20, 32, 43, 0.1));
}
.legal-doc .legal-nav a {
  font-size: 0.92rem;
  text-decoration: none;
}
`;
