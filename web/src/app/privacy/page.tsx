import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "Privacy · Cove",
  description: "How the invite-only Cove / Halo beta stores and shares data.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy">
      <p>Updated September 20, 2026. Operator: Camron Trost, United States.</p>
      <p>
        The app on the iPhone home screen is currently labeled Halo. The site
        calls itself Cove. Keep, Home, and Ask are the product words. A public
        brand name is not chosen yet. This page covers that same invite-only
        service — the website and the iPhone wrapper around it.
      </p>

      <h2>Who this is for</h2>
      <p>
        Accounts are created only with a one-time invite. There is no public
        signup, no ads, and no sale of personal information. This draft is
        written for a US family beta. It is not aimed at the EU or UK until we
        say so.
      </p>
      <p>
        You must be at least 13. We do not knowingly collect data from children
        under 13. If we learn an account belongs to a child under 13, we delete
        it. This is a general AI chat, not a kids’ app.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>Account: email, password (hashed), the name you give us.</li>
        <li>Asks: your questions, the answers, and chat history.</li>
        <li>
          Keep: facts the app saved so you can review them, including ranks and
          when they are due.
        </li>
        <li>Recipes you save, including photos you attach.</li>
        <li>
          A coarse place (city, region, country, timezone) guessed from the
          network so weather and “today” work. We do not store your raw IP.
        </li>
        <li>
          Usage counts (asks, saves) so we can cap weekly cost. Dollar amounts
          in Settings are visible to the operator, not to every family account.
        </li>
        <li>
          Harvest logs: the question, the answer, and what the miner extracted.
          Used to improve Keep for this household. The operator can read these.
        </li>
        <li>
          On your device: Keep backup, theme, and whether you finished first-run.
        </li>
      </ul>

      <h2>Who else sees a turn</h2>
      <p>
        To answer you, we send the current question, a trimmed slice of the
        thread, and any files you attach to AI providers:
      </p>
      <ul>
        <li>
          <strong>xAI (Grok)</strong> — deeper asks, web search, images, and
          PDFs.
        </li>
        <li>
          <strong>OpenAI</strong> — shorter asks and routing (we call this Luna).
        </li>
      </ul>
      <p>
        Images go as part of the ask. PDFs are uploaded to xAI’s file API. We
        cannot unsay a prompt once it has been sent. We do not use ads or
        consumer analytics SDKs.
      </p>
      <p>
        Other processors that host the service: <strong>Vercel</strong> (the
        site), <strong>Supabase</strong> (accounts, database, recipe photos).
        When Sign in with Apple or Google ships, those companies will see the
        sign-in. Browser or on-device dictation (when you use the mic) is handled
        by the OS; we receive the text, not a kept audio file, unless that
        changes and we update this page.
      </p>

      <h2>What we do not do</h2>
      <ul>
        <li>No ads, trackers, or selling your data.</li>
        <li>
          We do not claim this is more private than ChatGPT on the model side.
          The text of an Ask still goes to a lab.
        </li>
        <li>
          Family activity for the operator is counts, not a feed of everyone’s
          chats. The database itself can still be read by the operator.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use a session cookie so you stay signed in, plus a theme preference.
        That is not advertising.
      </p>

      <h2>Keep, delete, export</h2>
      <p>
        Your chats, Keep, and recipes stay while the account exists. You can
        sign out anytime. Lab tools can clear chats on a development machine;
        that is not the family delete path.
      </p>
      <p>
        To delete your account and the data tied to it, email the person who
        invited you (for this beta, Camron). We will remove the account and the
        stored chats, Keep, recipes, photos, and logs we control. Copies already
        sent to xAI or OpenAI follow those companies’ own retention. An in-app
        delete button will be in Settings before this app goes to testers beyond
        this household.
      </p>

      <h2>Voice and photos</h2>
      <p>
        Today, Listen uses the device’s built-in speech. Dictate uses the
        browser’s speech recognizer when it exists. Recipe photos stay in your
        private library unless you also attach them to an Ask (then they go to
        xAI). We will not clone a celebrity, family member, or another product’s
        voice.
      </p>

      <h2>Changes</h2>
      <p>
        We will bump the date on this page when the facts change (new name,
        company, processors, or an in-app delete control). Material changes will
        also be noted in Settings.
      </p>
      <p>
        Questions: write to the person who invited you. Apple App Store and
        TestFlight listings can use this URL:{" "}
        <a href="/privacy">/privacy</a>.
      </p>
    </LegalDoc>
  );
}
