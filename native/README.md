# Halo iOS (Wave 0)

Capacitor shell. USB-dev loads **lab over HTTPS** (Vercel preview), so cellular and other wifi work. Not VocalLearn Expo (`app/`). Not live early access unless you pass `HALO_NATIVE_ORIGIN=prod`.

The **N** badge was Next.js `next dev` on LAN. Lab preview is a real build — no N.

Brand name on the home screen is **Halo**. USB-dev bundle id: `com.camrontrost.halo`.

## On your Mac (once)

1. Xcode from the App Store, open it once, accept the license.
2. Plug in the iPhone, trust the computer. Settings → Privacy & Security → Developer Mode (iOS 16+).
3. From this folder:

```bash
cd native
npm install
npx cap sync ios
npx cap open ios
```

4. In Xcode: pick **your iPhone** as the run destination (not a simulator, if you want the real device).
5. Signing: **App** target → **Signing & Capabilities** → check **Automatically manage signing** → Team = your Apple ID (camrontrost@gmail.com). CLI cannot create a profile until that Team is chosen once.
6. Play (⌘R). First run must Trust the free Apple ID on the phone: Settings → General → VPN & Device Management → Apple Development → Trust. Then tap **Halo**.

Scheme name is **App** (`npx cap run ios --scheme App` after Team is set).

You should see paper splash, then lab Halo (login or Home). Safari chrome is gone. `lab-origin.txt` is the internet URL. Same account / Keep / Settings as early access; preview is not production, so lab AskShell and admin reset tools stay on.

## Switch origin

Lab over the internet (default once `lab-origin.txt` exists):

```bash
cd native
npx cap sync ios
```

LAN `next dev` (HMR only — shows the Next.js N, same wifi):

```bash
cd native
HALO_NATIVE_ORIGIN=lan npx cap sync ios
```

Live early access (production 1.2.0 — everyone else’s site):

```bash
cd native
HALO_NATIVE_ORIGIN=prod npx cap sync ios
```

A one-off Vercel preview:

```bash
cd native
HALO_NATIVE_ORIGIN="https://YOUR-preview.vercel.app" npx cap sync ios
```

After `cd web && npm run deploy:lab`, write the printed HTTPS URL into `native/lab-origin.txt` and sync again. Next lab deploys can `vercel alias` that deployment onto the same host so the app does not need a rebuild.

## If the project fails to fetch packages

Xcode uses Swift Package Manager (not CocoaPods). First open may download Capacitor packages. File → Packages → Resolve if needed.

Open `native/ios/App/App.xcodeproj` via `npx cap open ios`.

## What this is not

- Not TestFlight (needs $99 Apple Developer).
- Not Sign in with Apple / Google until the paid account is enrolled (email works).
- Not a rebuild of Home / Keep / chat. Those stay the website.
