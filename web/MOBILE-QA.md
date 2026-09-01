# iPhone QA before promote (v1.1)

Do this **before** `deploy:early`. Full ops doc: [`HARVEST-OPS.md`](./HARVEST-OPS.md).

---

## Option A — LAN (local Mac)

1. Stop any server on port 3000 (`Ctrl+C` in the preview terminal).
2. `cd web && npm run dev:lan`
3. iPhone: same Wi‑Fi, VPN off, **not** guest network.
4. Safari → `http://<IP-from-terminal>:3000/api/dev/ping` → must show `{"ok":true,...}`
5. Then → `http://<IP>:3000/login` → sign in → test `/ask`, Home, chips.

Your Mac IP today is often `192.168.1.126` — **always use what the terminal prints**.

---

## Option B — Lab deploy (use if LAN fails)

1. `cd web && npm run deploy:lab`
2. Open the Vercel preview URL on iPhone + `/login`
3. Same QA as desktop

---

## Quick QA on phone

- [ ] Login works
- [ ] Home → Ask → stream starts (no second message)
- [ ] Harvest flies to Keep header
- [ ] Settings → Lab QA → Force due → tap chip → play round
- [ ] History scrolls inside card
- [ ] No stuck spellcheck pill after submit

---

## After mobile QA passes

Tell the agent: **commit and promote v1.1** (or run `deploy:early` yourself after commit).
