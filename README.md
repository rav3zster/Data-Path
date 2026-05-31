# DataPath — Android App

Raveend's 84-day Data Analyst learning planner. A fully offline React app packaged as a native Android app with Capacitor. **No backend** — all progress is stored on-device.

## Tech stack

- **React 18 + Vite** — the UI layer (`src/`)
- **Capacitor 6** — wraps the web build into a native Android app (`android/`)
- **@capacitor/preferences** — on-device persistence (replaces the original `window.storage`)
- **lucide-react** — icons

## Features (all preserved from the original UI)

- **Dashboard** — greeting, KPI cards (overall %, streak, week, phase), overall progress bar, per-phase progress, today's tasks with check-off
- **Roadmap** — 4-phase journey overview + expandable phase accordions with per-week task chips
- **Tasks** — full 84-task checklist, filter by phase and week, expandable task details with time + resource links
- **Schedule** — weekly day strip, assigned tasks per day, custom study blocks grouped by Morning/Afternoon/Evening (add / complete / remove)
- **Progress** — circular completion ring, quick stats (streak, est. completion, avg tasks/day), phase breakdown, 28-day activity heatmap
- **Resources** — categorised links (SQL, Python, Visualization, Jobs) + motivational card
- **Settings** — adjustable program start date (recomputes Day 1 → Day 84)

The desktop sidebar from the original code was adapted into a mobile **top bar** (branding + mini progress + settings) and **bottom navigation** so it works as a proper phone app. Colors, data, and every interaction are identical.

## Project layout

```
src/
  DataPath.jsx     # the full app (converted from the original component)
  storage.js       # on-device storage (Capacitor Preferences + localStorage fallback)
  main.jsx         # entry + native status-bar styling
  index.css        # mobile base styles
android/           # Capacitor Android project (Gradle)
capacitor.config.json
vite.config.js
```

## Build the APK

Requirements: Node 20+, JDK 17, Android SDK.

```powershell
npm install
npm run build           # build web assets into dist/
npx cap sync android    # copy assets into the Android project
cd android
.\gradlew.bat assembleDebug
```

Output APK:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

> `android/local.properties` points Gradle at the Android SDK and JDK 17.
> (Gradle 8.2.1 / AGP 8.2.1 do not support JDK 24.)

## Install on a device

```powershell
# with a device connected and USB debugging on:
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Or copy `app-debug.apk` to the phone and open it (enable "Install unknown apps").

## Run in the browser (for quick UI tweaks)

```powershell
npm run dev
```

## Release build (signed)

Generate a keystore, configure `signingConfigs` in `android/app/build.gradle`, then:

```powershell
cd android
.\gradlew.bat assembleRelease
```
