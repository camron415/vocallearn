# Decisions

Short on purpose. If a line would not stop a real mistake, it does not belong here. Read this before `web/PHONE-HANDOFF.md`.

## Locked

- The iPhone app is the lab site in a web view. Lab URL: `https://halo-lab-personal-f999.vercel.app`. Branch: `cloud/overnight-ui`.
- Family `/ask` stays 1.2.0. No promote, no `vercel --prod`, no `deploy:early`, unless Camron says promote, early access, production, or emergency.
- `--travel` stays 1080ms. Harvest z-index stays 120. Desktop 16-seat, the signed phone dock, and sheet 520/380 stay.
- The composer lives in AskShell, above Home and Chat. History already uses that. Do not rebuild it.
- Phone Ask does not full-reload, does not run the 1080ms leave, and does not push while the keyboard is up.
- A gray screen with one bubble and a finished composer is a failed stub, not a design. The reply starts only when the real chat is mounted.
- One writer at a time on `AskLanding`, `AskShell`, and `ChatThread`. Other agents may read. They may not edit those files.
- The phone checklist is the test. A desktop click is not a pass. One change, one lab deploy, then stop for that check.
- Do not rewrite the app. Do not start an `!important` cleanup while Ask still fails the checklist.

## Open

- How a phone Ask mounts `/ask/[id]` and starts the reply. That is the current job. See `web/PHONE-HANDOFF.md`.
- Whether the native splash stays paper `#fafaf9`. Changing it needs an Xcode rebuild Camron asks for.
- Trimming LoopSkin overrides. Later, and only where a named phone screen is wrong.
- Joins, haptics, and Apple sign-in. Not this job.
