# Lane 21 — Phone breaks (21:21 film)

**Status:** P1 and P2 in lab (native app only). P3 waits the next Xcode build. Chief QA. 2026-09-21.  
**Film:** `ScreenRecording_09-21-2026 21-21-56_1.MP4` (46s, Halo on the iPhone, dark).  
**Do not touch:** AskLanding / ChatThread / pending-turn / AskShell.tsx (Composer send path), LoopSkin (lane 15), morph `--travel` 1080, harvest z 120. **No promote.**

Status bar icons are signed on this film (light glyphs on dark Halo). Do not reopen that.

Desktop lab `/preview` at 1280: a short tap on Rome opens the round. `user-select` on chips is `auto` there too, but there is no iOS callout, and `data-halo-kb` stays off above 720px. The kick-out and the freeze are phone.

---

## P1 — Ask will not stay focused

**Seen:** Tap Ask. About a second later the keyboard is up, chips are gone, and the composer sits above the keys. Then Home pops back fully painted. No fade on the way out. Same thing again after a force-quit.

**Why:** `NativeBoot` blurs the field on any `pointerdown` outside the composer while `data-halo-kb` is set. Focusing Ask sets that flag immediately on the phone. The keyboard opening (or Ask moving) delivers another pointerdown on the page, so the field blurs and the keyboard drops. Desktop never sets the flag, so this does not happen there.

**Fix (shipped, `data-halo-native` only):** `NativeBoot` ignores outside taps for 1.2s after Ask focuses, so the gesture that opened the keyboard cannot blur it. `MotionProvider` fades the field immediately, waits ~320ms before the guessed keyboard inset (that jump was dropping the keyboard), and pins window scroll to 0 while Ask is focused. The field stays faded until the inset has eased back down (480ms). Desktop never sets the flag. Not AskShell.tsx.

## P2 — Hold on a chip selects the words

**Seen:** Short tap opens the round (WHERE card for Hiroshima). Press-and-hold draws the iOS loupe and Copy / Look Up / Translate on the chip label. The pills shift. Hold never dives into chat. After that, taps on chips, beads, and Ask stop landing until the app is killed. After relaunch, beads and a short tap work again until the next hold. Menu and History themselves open fine after that relaunch.

**Why:** Chip labels are selectable (`user-select: auto`, no `-webkit-touch-callout: none`). The hold timer is 520ms and `pointercancel` clears it. The loupe cancels the pointer, so `onHold` never runs. The callout then eats later taps.

**Fix (shipped, `data-halo-native` only):** `user-select: none` and `-webkit-touch-callout: none` on `.capsule`. Press-in scale. `pointercancel` / `pointerleave` do not clear the 520ms hold (the loupe was canceling it). `selectstart` and `contextmenu` are prevented. Desktop still clears on cancel/leave, and chips stay selectable. Files: `motion.css`, `WaterCapsule.tsx`, `NativeBoot.tsx`. Not HomeBubbles seating, not LoopSkin. Lab preview hold on Paris opened chat thread 1 after a cancel.

**Check after that:** `onOpenSource` returns without navigating when `askId` is missing or `"1"`–`"6"`. If hold still does nothing on a real chip, that gate is why.

## P3 — White frame when Halo comes back

**Seen:** Leaving to the app switcher and coming back flashes a full white frame before dark Home.

**Why:** The native shell background and splash are paper `#fafaf9`.

**Fix:** Not in this web deploy. Next Xcode build only (`native/capacitor.config.js` splash and `ios.backgroundColor` are paper `#fafaf9`). Rebuilding the shell was not part of this pass.
