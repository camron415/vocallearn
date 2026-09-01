# GitHub repo setup — recruiter pass

One-time checklist after pushing doc/CI updates. Your resume already links here — do these in order.

---

## 1. Push the commit (if not already on `main`)

Default branch on GitHub may be `main`; active dev is often `halo-ui-streamline`. Recruiters land on the **default branch** README.

**Option A — merge to `main` (recommended for applications)**

```bash
git checkout main
git pull origin main
git merge halo-ui-streamline
git push origin main
```

**Option B — change default branch on GitHub**

Repo → **Settings** → **General** → **Default branch** → set to `halo-ui-streamline`.

---

## 2. Update repo description & topics

GitHub repo page → **⚙️** (top right) or **About** → **Edit**.

**Description (paste):**

```
Invite-only AI Ask + harvest/review learning loop. TypeScript, Next.js, React Native, Supabase, Vercel, Grok. Solo-built production app.
```

**Website:** `https://halo-gules-three.vercel.app/preview`

**Topics (add all):**

`typescript` `nextjs` `react` `react-native` `supabase` `postgresql` `vercel` `artificial-intelligence` `full-stack` `expo`

---

## 3. Add screenshots (~10 minutes)

See [`screenshots/README.md`](./screenshots/README.md). Three PNGs unlock the README gallery.

Until then, README still works — gallery section is commented out.

---

## 4. Verify live links

| Link | Expected |
| --- | --- |
| https://halo-gules-three.vercel.app/preview | Loads without login; Mix → Loop works |
| https://halo-gules-three.vercel.app/ask | Login page or Ask if signed in |
| https://github.com/camron415/vocallearn | README shows v1.1 / Cove loop (not “V2 lab only”) |

---

## 5. CI badge (optional, after push)

After the harvest workflow runs once on GitHub, add to top of README:

```markdown
![Harvest tests](https://github.com/camron415/vocallearn/actions/workflows/test-harvest.yml/badge.svg)
```

---

## 6. Resume wording (align with repo)

**Use:**

> Built and operate Halo — invite-only AI Ask with a harvest/review learning loop (TypeScript, Next.js, Supabase, Vercel). Live at halo-gules-three.vercel.app; no-login demo at `/preview`.

**Retire:**

> “V2 lab preview” / “learning loop coming soon” — v1.1 shipped the loop to production.

---

## 7. Pin the repo

GitHub profile → **Customize your pins** → pin **vocallearn**.

---

## Done when

- [ ] Default branch README is current
- [ ] About description + topics updated
- [ ] `/preview` loads for you on phone + desktop
- [ ] Three screenshots committed (or scheduled)
- [ ] Resume text matches “live loop” not “preview only”
