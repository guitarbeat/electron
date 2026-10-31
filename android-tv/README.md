# Electron Movies for Fire TV

Fullscreen WebView companion for **Fire TV Stick 4K (2023), AFTKM, Fire OS 8 / API 30**.
Loads `https://electron.alw.lol/#movies`; application ID `lol.alw.electron`.
This is a regular Leanback launcher app. It changes neither the system HOME app nor Projectivy settings.
The React site still builds and deploys through its existing Vercel workflow.

## Build on macOS

Install JDK 17 and Android SDK tools once (Homebrew required):

```sh
brew install openjdk@17
brew install --cask android-commandlinetools android-platform-tools
export JAVA_HOME="$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
mkdir -p "$ANDROID_HOME"
sdkmanager --sdk_root="$ANDROID_HOME" --licenses
sdkmanager --sdk_root="$ANDROID_HOME" 'platform-tools' 'platforms;android-35' 'build-tools;35.0.0'
export PATH="$ANDROID_HOME/platform-tools:$JAVA_HOME/bin:$PATH"

# From the repository root:
cd android-tv
./gradlew assembleDebug
# Optional native static checks:
./gradlew lintDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk` (debug signed).
The checked-in Gradle wrapper downloads checksum-pinned Gradle 8.11.1; no system Gradle is needed.
AGP 8.9.2 / Kotlin 2.1.20 / compile SDK 35, minimum and target API 30.
This is a Fire OS sideload target, not a Google Play release configuration.
The shell contains no native `.so` libraries, so its universal APK runs on the device's
**32-bit `armeabi-v7a`** runtime without requiring 64-bit code.

The Fire TV launcher banner is `app/src/main/res/drawable-nodpi/tv_banner.png`, generated from
`assets/local-originals/electron-app-icon.png` at **1280 x 720**, RGB PNG with no transparency.
The square Android manifest icon uses `assets/local-originals/Pixel Electron Nightscape.png`
at 512 x 512.

## Connect, install, launch

On the Fire TV, enable **Settings → My Fire TV → Developer Options → ADB Debugging**.
If Developer Options is hidden, select the device name in **About** seven times.
Find its IP under **About → Network**. Both devices must be on the same LAN;
accept the ADB authorization prompt on the TV.

```sh
FIRE_TV_IP=192.168.1.100 # Replace with your Fire TV's IP.
adb connect "$FIRE_TV_IP:5555"
adb devices
adb -s "$FIRE_TV_IP:5555" install -r app/build/outputs/apk/debug/app-debug.apk
adb -s "$FIRE_TV_IP:5555" shell am start -n lol.alw.electron/.MainActivity
# Alternative launcher entry:
adb -s "$FIRE_TV_IP:5555" shell monkey -p lol.alw.electron -c android.intent.category.LEANBACK_LAUNCHER 1
```

`install -r` retains app data. Uninstalling or clearing app data removes local sign-in/storage.

## Remote and troubleshooting

D-pad maps to DOM `Arrow*` events; Select/Enter activates the focused action once.
Select on a text input requests the Fire TV keyboard; editing arrows use WebView's native input behavior.
Media Play/Pause delivers a standard DOM keyboard event and controls a visible HTML media element when present.
Back first dismisses the keyboard through Android, then the top web dialog/menu/search,
then WebView history, then exits. Loading failures show a native, focused Retry button;
subresource failures (for example one poster) do not replace the page.

```sh
adb -s "$FIRE_TV_IP:5555" logcat -s ElectronTV chromium AndroidRuntime
adb -s "$FIRE_TV_IP:5555" shell dumpsys package lol.alw.electron
# Remote input smoke checks:
adb -s "$FIRE_TV_IP:5555" shell input keyevent 22  # Right
adb -s "$FIRE_TV_IP:5555" shell input keyevent 23  # Select
adb -s "$FIRE_TV_IP:5555" shell input keyevent 85  # Play/Pause
adb -s "$FIRE_TV_IP:5555" shell input keyevent 4   # Back
```

With the **debug** app open and ADB connected, open `chrome://inspect/#devices` in desktop Chrome,
enable USB device discovery, and inspect the `electron.alw.lol` WebView target.
WebView inspection is disabled in release builds. No JavaScript-to-native interface is exposed;
top-level browsing is restricted to the HTTPS app origin.

First- and third-party cookies are enabled and flushed on pause/stop. LocalStorage and IndexedDB
are disk-backed; authentication remains subject to server-side session expiry. `sessionStorage`
retains normal web semantics: it belongs to a WebView browsing session and is **not a durable store
across process death**. The shell does not silently copy session-only secrets into persistent storage.

## Frontend development and verification

The `ElectronTV/1.0` user-agent marker activates TV navigation. For a desktop development preview,
use `http://localhost:3000/?tv=1#movies`. Desktop mouse and text editing retain their behavior; arrow keys inside the movie grid also move focus.
In grid mode the focused poster stays centered as the grid pans beneath it, including edge rows/columns.
Deploy the accompanying React updates through the existing GitHub/Vercel flow to enable the new
navigation in the production shell; the APK always opens the hosted site.

From the repository root:

```sh
pnpm exec tsx --test apps/web/src/hooks/tvSpatialGeometry.test.ts
pnpm run test:e2e
pnpm run check-types
pnpm run lint
pnpm run build
```

The geometry tests check directional rejection, row/column preference, and offscreen scrolling.
Browser tests cover poster navigation, dialog boundaries, Back/focus restoration, menus, picker,
filters, and input editing, alongside the existing desktop journey.
A successful APK build/browser run does not verify physical AFTKM firmware behavior. On the TV,
check first launch, Wi-Fi failure/Retry, keyboard entry, held directions, Play/Pause, nested Back,
and sign-in persistence after force-stop/relaunch before considering device acceptance complete.
