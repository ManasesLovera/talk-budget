# Talk Budget — Mobile App

A mobile-first **Expo (SDK 51) / React Native** client for Talk Budget. It mirrors
the Next.js web frontend's UI and talks to the same FastAPI backend, sharing the
brand design language (mint canvas, `#12876a` brand green, rounded cards).

## Design reference

Screenshots captured on an Android 14 emulator (Pixel 7). These are the source of
truth for how each screen should look across devices.

### Authentication

<table>
  <tr>
    <td align="center"><b>Login</b></td>
    <td align="center"><b>Register</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/login.png" width="240" alt="Login screen" /></td>
    <td><img src="docs/screenshots/register.png" width="240" alt="Register screen" /></td>
  </tr>
</table>

### Main tabs

<table>
  <tr>
    <td align="center"><b>Chat</b></td>
    <td align="center"><b>Transactions</b></td>
    <td align="center"><b>Dashboard</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/chat.png" width="220" alt="Chat / AI assistant" /></td>
    <td><img src="docs/screenshots/transactions.png" width="220" alt="Transactions" /></td>
    <td><img src="docs/screenshots/dashboard.png" width="220" alt="Dashboard" /></td>
  </tr>
  <tr>
    <td align="center"><b>Wallets</b></td>
    <td align="center"><b>Templates</b></td>
    <td align="center"><b>Settings</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/wallets.png" width="220" alt="Wallets & Loans" /></td>
    <td><img src="docs/screenshots/templates.png" width="220" alt="Templates" /></td>
    <td><img src="docs/screenshots/settings.png" width="220" alt="Settings" /></td>
  </tr>
</table>

**Navigation:** the bottom bar shows icon-only tabs; the active tab gets a slightly
larger icon plus its label centered directly beneath it.

## Tech

| Layer         | Tech                                                        |
| ------------- | ----------------------------------------------------------- |
| Framework     | Expo SDK 51 · React Native 0.74 · TypeScript                |
| Navigation    | React Navigation 6 (bottom tabs + stack)                    |
| Icons         | lucide-react-native · react-native-svg                      |
| Storage       | AsyncStorage (JWT), IndexedDB-style offline chat cache      |
| i18n          | English / Spanish, currency USD / DOP                       |

## Requirements

| To run…                         | You need…                                                                 |
| ------------------------------- | ------------------------------------------------------------------------- |
| Backend + DB + cache + web      | Docker & Docker Compose                                                   |
| Mobile tooling (Metro, Expo)    | **Node 20 LTS** (or **Bun ≥ 1.3**)                                        |
| Android SDK tools (`sdkmanager`)| **Java 17+** (JDK)                                                        |
| Android **emulator**            | A CPU with **Intel VT-x / AMD-V enabled in BIOS**, **KVM**, Android SDK   |

> Reference environment this was built and verified on: Ubuntu, Intel Core
> i7‑4712MQ (VT‑x), Android 14 (API 34) x86_64 emulator, Node 20, Bun 1.3,
> Expo SDK 51.

The mobile app targets these backend base URLs (see `src/lib/api.ts`):

- **Android emulator** → `http://10.0.2.2:8000/api/v1` (the emulator's alias for the host loopback)
- **iOS / web** → `http://localhost:8000/api/v1`

---

## Running the full stack

### 1. Backend, PostgreSQL, Redis, and the web frontend (Docker)

From the **repo root**:

```bash
cp example.env .env          # first time only; add OPENCODE_API_KEY if you have one
docker compose up --build -d
```

| Service   | URL / port                                   |
| --------- | -------------------------------------------- |
| Frontend  | http://localhost:3000                        |
| Backend   | http://localhost:8000 (Swagger at `/docs`)   |
| Postgres  | localhost:5433                               |
| Redis     | localhost:6380                               |

Default login (seeded on startup): **`admin` / `admin123`**.

> The mobile app needs this backend reachable. The containers **stop after a host
> reboot** — just run `docker compose up -d` again.

### 2. Install the mobile app's dependencies

```bash
cd mobile
bun install                  # or: npm install
```

### 3. Run the mobile app in the browser (fastest — react-native-web)

```bash
# first time only: add the web renderer deps
bunx expo install react-dom react-native-web @expo/metro-runtime
bunx expo start --web        # opens http://localhost:8081 in the browser
```

### 4. Run the mobile app on a physical phone (Expo Go)

```bash
bunx expo start              # scan the QR code with the Expo Go app
```

> On a physical phone, repoint `API_BASE` in `src/lib/api.ts` at your computer's
> LAN IP (the hard-coded `10.0.2.2` only works inside the emulator).

### 5. Run the mobile app on an Android emulator (Linux)

The x86_64 system image needs hardware virtualization. This is a **one-time
setup**; afterwards you only repeat step 5e.

#### 5a. Enable virtualization in the BIOS

Many machines ship with it **disabled**.

1. Reboot and enter the **BIOS/UEFI** setup (commonly `F2`, `Del`, or `Esc` at boot).
2. Under *Advanced → CPU Configuration* (or *Security*), enable
   **Intel Virtualization Technology (VT‑x)** — or **SVM / AMD‑V** on AMD.
3. Save & reboot.
4. Verify it's on:
   ```bash
   grep -c vmx /proc/cpuinfo    # Intel: must be > 0
   grep -c svm /proc/cpuinfo    # AMD:   must be > 0
   ```

#### 5b. Enable KVM (one-time, needs sudo)

```bash
sudo modprobe kvm-intel        # or: sudo modprobe kvm-amd
sudo usermod -aG kvm "$USER"   # then log out and back in
ls -l /dev/kvm                 # should now exist and be group-readable
```

#### 5c. Install the Android SDK (user-space, no sudo needed)

```bash
export ANDROID_HOME="$HOME/Android/Sdk"

# command-line tools → $ANDROID_HOME/cmdline-tools/latest
mkdir -p "$ANDROID_HOME/cmdline-tools"
curl -L -o /tmp/cmdtools.zip \
  https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip -q /tmp/cmdtools.zip -d /tmp/cmdtools
mv /tmp/cmdtools/cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"

export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

yes | sdkmanager --licenses
sdkmanager "platform-tools" "emulator" "platforms;android-34" \
           "system-images;android-34;google_apis;x86_64"
```

> Persist the `ANDROID_HOME` / `PATH` exports in your `~/.bashrc` (and the Node
> bin dir if Node is installed user-space) so new shells pick them up.

#### 5d. Create the virtual device (AVD)

```bash
avdmanager create avd -n talkbudget \
  -k "system-images;android-34;google_apis;x86_64" -d pixel_7
```

#### 5e. Boot the emulator and launch the app

```bash
# 1) make sure the backend is up (repo root): docker compose up -d
# 2) boot the emulator (KVM makes this ~30s instead of minutes):
emulator -avd talkbudget -gpu swiftshader_indirect -no-boot-anim &
adb wait-for-device
adb shell 'while [ "$(getprop sys.boot_completed)" != 1 ]; do sleep 1; done'  # wait for boot

# 3) build + open the app (auto-installs Expo Go on the emulator):
cd mobile
bunx expo start --android
```

### 6. Voice input (Android speech-to-text) — requires a dev client build

The chat screen's microphone button (Android only) uses `expo-speech-recognition`,
which wraps Android's native `SpeechRecognizer` API via a native module. **Expo Go
cannot load native modules**, so as soon as this dependency is installed, testing
the mic button (or anything else on Android) needs a **custom dev client** instead
of plain Expo Go:

```bash
cd mobile
bunx expo prebuild --platform android   # one-time; regenerates android/ from app.json
bunx expo run:android                   # builds + installs the dev client, then launches it
```

> `android/` is committed to the repo, so most contributors won't need to run
> `expo prebuild` again unless `app.json`'s native config (plugins, package name,
> permissions) changes — in which case re-run it to sync `android/`.

For a build you can install without a dev machine attached, use EAS instead:

```bash
bunx eas build --profile development --platform android
```

This only affects **Android**. iOS and web are unaffected — the mic button is
hidden on those platforms (see `ChatScreen.tsx`), so steps 3 and 4 above (Expo Go /
`--web`) keep working exactly as before for everything except voice input.

## Verification

```bash
bunx tsc --noEmit     # TypeScript typecheck
npx expo-doctor       # project health check (should be all green)
```

## Troubleshooting

- **Login shows "Network request failed" / `ECONNREFUSED`** — the backend isn't
  reachable at `10.0.2.2:8000`. Start it with `docker compose up -d` (containers
  stop after a reboot).
- **Emulator won't boot or is unusably slow** — virtualization isn't active:
  re-check `grep -c vmx /proc/cpuinfo` and that `/dev/kvm` exists (steps 5a–5b).
- **`node` / `npx` not found** — Node isn't on your `PATH`; install Node 20 LTS
  (e.g. via `nvm`) and add it to `PATH`.
- **Metro serves a stale bundle after an edit** — restart with `bunx expo start -c`
  (clears the cache). Kill a stray Metro **by port** (`ss -ltnp | grep :8081` →
  `kill -9 <pid>`), never by matching `"expo start"` (that also matches your shell).

## Project structure

```
mobile/
├── App.tsx                 # navigation shell, tab bar, brand header, providers
├── src/
│   ├── screens/            # Login, Register, Chat, Transactions, Dashboard,
│   │                       #   Wallets, Templates, Settings
│   ├── components/         # DonutChart, AccountCard, Modal, TransactionForm, …
│   └── lib/                # api client, auth/currency/i18n contexts, date-range
└── docs/screenshots/       # design-reference captures (this README)
```
