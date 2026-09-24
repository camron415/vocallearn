<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Cloud agents clone the remote branch. They do not see uncommitted laptop files.

- Tonight’s queue is `web/OVERNIGHT-UI.md`. You are not done after the five known bugs. One change, click-through, then the 30-minute timer in that file.
- Older lane locks: `web/CLOUD-DISPATCH.md`. Do not retune a frozen token to clear a hitch.
- Tests from `web/`: `npm run test:harvest`. Dry packs only unless secrets are in the Cloud Agents secrets tab.
- App: `npm run dev` in `web/`, then open `http://localhost:3000/preview`.
- Lab only. Do not run `deploy:early` or `vercel --prod`.
- Morph `--travel` stays 1080ms. Harvest z-index stays 120.
