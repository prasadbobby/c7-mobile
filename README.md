# PulseFit — React Native (Expo)

Dark, acid-lime fitness app built from the reference shots and the
`unified-mobile-experience` repo (tokens, copy, images). Expo SDK 58 · expo-router ·
Reanimated 4 · GSAP 3 · react-native-svg.

## Run

```bash
npm install
npx expo start        # i = iOS sim, a = Android, w = web
```

## Structure

```
app/                     expo-router routes (27 screens)
  onboarding, login, email-login, signup, forgot, goals
  (tabs)/ home · workout · stats (centre FAB) · meals · profile
  exercise/[id]          video player, progress chart, session plan
  session/[id]           live workout timer (rest states, next-up, quit sheet)
  complete               GSAP celebration + summary
  program/[id]           multi-week plan
  challenges, challenge/[id], streak, leaderboard
  search, meal/[id]      recipe search, recipe detail with servings + steps
  notifications, achievements, history, body, saved, settings
src/
  theme.ts               design tokens (colors, type, space, radius, shadow)
  ui.tsx                 component kit — every screen is built only from these
  motion.tsx             GSAP ↔ Reanimated bridge + scroll effects
  charts.tsx             ProgressLine (draw-on line) and Bars (staggered rise)
  icons.tsx              custom duotone macro / ingredient icons + social logos
  social.tsx             community post card, follow / like / save
  data.ts, store.ts      mock content + persisted zustand store
```

## Design system (keep every screen consistent)

| Token | Value | Use |
| --- | --- | --- |
| `surface` | `#050605` | App background |
| `card` / `secondary` | `#151816` / `#1C211D` | Tiles, rows / rows inside sheets |
| `primary` | `#C6F21B` | CTAs, active tab, selected chip outline, data highlights |
| `primaryGlow` | `#3DCB55` | Green end of the lime gradient |
| `heroTop` | `#1F5A1E` | Radial glow at the top of every screen (`<HeroGlow/>`) |
| `text` / `textMuted` | `#F4F6F2` / `#959A94` | Copy |
| macros | `#F05A28` `#16B3EB` `#E99B2A` `#955BE3` | Calories, protein, carbs, fat |

Type is **Lexend**: numbers in Light (stat/display), labels Regular, titles Medium.
Shapes are pills (buttons, chips, inputs) and 20–36px radii (cards, sheets, heroes).
Signature motifs: lime→green gradient pill, dashed-ring activity avatars, floating
blurred tab bar with a glowing centre FAB, ingredient bar over food photos.

Rules: use `Txt v="…"` not raw `Text`; use `Press` for anything tappable (spring + haptic);
active = lime outline (`Chip`, `Segmented`), never a lime fill except CTAs; one
`PrimaryButton` per screen, pinned to the bottom on detail screens.

## Motion

* **GSAP** (`gsap` 3) drives timelines: `useTimeline`, `useStagger`, `svTo`, `svStagger`,
  `useCountUp`. It tweens plain JS proxies and writes into Reanimated shared values, so
  rendering stays on the UI thread. Used for onboarding slide sequences, podium rise,
  chart draw + marker pop, challenge day-grid cascade, confetti burst, rings, number count-ups.
* **Scroll** effects use Reanimated (`useScrollY`, `Parallax`, `ScrollReveal`,
  `useHeaderFade`). GSAP's ScrollTrigger is DOM-only and does not run in React Native;
  `ScrollReveal` is the native equivalent (place it as a direct child of the scroll content,
  or pass `offset` = its container's y).
* Gestures: swipe onboarding, swipe-to-dismiss notifications, spring bottom sheets.

## Build an Android APK

Pick one:

**A. EAS Build (cloud, no Android SDK needed)**

```bash
npm i -g eas-cli
eas login                 # free Expo account
eas build -p android --profile preview   # APK; download link printed at the end
```

`eas.json` is already set up: `preview` → installable `.apk`, `production` → Play Store `.aab`.

**B. GitHub Actions (free, no local setup)**

Push this folder to a GitHub repo. `.github/workflows/android-apk.yml` runs on every push to
`main` (or *Actions → Build Android APK → Run workflow*) and uploads `pulsefit-apk`
(`app-release.apk`) as a build artifact.

**C. Locally** (needs Android Studio / SDK + JDK 17, ~15 GB free)

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

The release APK is signed with the debug key so it installs directly on a phone
(enable “Install unknown apps”). Create your own keystore before publishing to the Play Store.
