import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "Terms · Cove",
  description: "Terms of use for the invite-only Cove / Halo beta.",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <LegalDoc title="Terms">
      <p>Updated September 20, 2026. Operator: Camron Trost, United States.</p>
      <p>
        These terms cover the invite-only service currently shown as Cove on the
        site and Halo on the iPhone. Keep, Home, and Ask are how the product
        talks. The public name and legal entity are not final. If you do not
        agree, do not use the app.
      </p>

      <h2>A private beta, not a public product</h2>
      <p>
        Access is by invite only. An invite creates one account. We may expire
        invites, refuse an account, or shut off the beta. There is no paid plan
        in this version and no public App Store listing yet.
      </p>

      <h2>Who may use it</h2>
      <p>
        You must be at least 13. This is not a children’s app. If you are 13–17,
        a parent or guardian should know you have an account. We may refuse
        anyone we are not willing to host, including anyone under 18.
      </p>

      <h2>The service</h2>
      <p>
        You type or dictate a question. We send that text (and files you attach)
        to AI providers so you get an answer. When a fact looks worth keeping,
        it can land in Keep and come back on Home for a short review. Caps
        apply: a daily ask limit, a weekly cost budget, and a daily round limit
        on Home. Those exist so the household bill stays small.
      </p>
      <p>
        Answers can be wrong, incomplete, or out of date. This is not medical,
        legal, tax, or financial advice. Do not use it as a clinician, lawyer,
        or broker. You are responsible for how you use what it says.
      </p>

      <h2>Your content</h2>
      <p>
        You keep whatever rights you already have in the questions, photos, and
        recipes you put in. You give us a license to store them, send them to
        the providers named in the{" "}
        <a href="/privacy">Privacy</a> page, and show them back to you so the
        app works. Do not upload anything you do not have the right to use.
        Model replies are generated; we do not promise they are original or
        yours to republish as a finished work.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>No accounts for children under 13.</li>
        <li>No using someone else’s invite or account.</li>
        <li>No scraping, resale, or wrapping this as your own public app.</li>
        <li>
          No illegal content, and no trying to break the caps or the invite
          gate.
        </li>
      </ul>

      <h2>Our rights</h2>
      <p>
        The app, design, Keep loop, and name-in-progress are ours (or our
        licensors’). We may change, pause, or end the beta. Fonts and device
        voices follow their own licenses. We will not clone another company’s
        assistant voice or a real person’s voice for this product.
      </p>

      <h2>No warranty, limited liability</h2>
      <p>
        The beta is provided as is. To the fullest extent the law allows, we
        disclaim warranties and are not liable for indirect or consequential
        damages, or for a bad answer. If a court requires a cap, it is the
        amount you paid us for the service in the last twelve months — which,
        in this unpaid beta, is zero.
      </p>

      <h2>Ending the account</h2>
      <p>
        You may stop anytime and ask us to delete the account (see Privacy). We
        may suspend an account that breaks these terms or that we can no longer
        host.
      </p>

      <h2>Law</h2>
      <p>
        Utah law, ignoring conflict-of-law rules. Courts in Utah, USA, unless
        the law in your place of residence requires otherwise. If a piece of
        these terms cannot be enforced, the rest still applies.
      </p>
      <p>
        We will change this page when the product, name, or company does.
        Continued use after we post a new date is acceptance of the update.
      </p>
    </LegalDoc>
  );
}
