# ImageMate - Desktop App Export & Packaging Guide

ImageMate is fully configured to be exported as a standalone native desktop application for **Windows**, **macOS**, and **Linux**.

You have three options to package and run ImageMate on desktop:

---

## Option 1: Electron (Recommended, Zero-Rust, Plug & Play)

Electron packages ImageMate with Chromium and Node.js. It requires no additional toolchains (like Rust/C++ compilers) and builds installers in 1 command.

### 1. Prerequisites
Ensure [Node.js](https://nodejs.org/) (v18+) is installed.

### 2. Development Mode (Run Desktop App Locally)
```bash
# 1. Install dependencies
npm install

# 2. Launch Vite dev server + Electron window with live reload
npm run electron:dev
```

### 3. Build Standalone Installers & Executables

Run any of the following commands:

- **Build for Current Platform:**
  ```bash
  npm run electron:build
  ```

- **Build for Windows (.exe installer + portable single-file exe):**
  ```bash
  npm run electron:build -- --win
  ```

- **Build for macOS (.dmg + .zip):**
  ```bash
  npm run electron:build -- --mac
  ```

- **Build for Linux (.AppImage + .deb):**
  ```bash
  npm run electron:build -- --linux
  ```

- **Fast Unpackaged Directory Test (no installer bundling):**
  ```bash
  npm run electron:pack
  ```

### Output Location
All built installers and executables are generated in the `./release` folder:
- **Windows**: `release/ImageMate Setup 0.1.0.exe` and `release/ImageMate 0.1.0.exe` (portable)
- **macOS**: `release/ImageMate-0.1.0.dmg`
- **Linux**: `release/ImageMate-0.1.0.AppImage` & `release/imagemate_0.1.0_amd64.deb`

---

## Option 2: Tauri v2 (Ultra-Lightweight, ~15MB Native App)

Tauri uses the OS native webview (WebView2 on Windows, WebKit on macOS, WebKitGTK on Linux) and a Rust backend for extreme performance and tiny file sizes.

### 1. Prerequisites
- [Rust](https://www.rust-lang.org/tools/install):
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```
- Platform build tools:
  - **Windows**: Visual Studio 2022 C++ Build Tools & WebView2
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`

### 2. Development Mode
```bash
npm run tauri:dev
```

### 3. Build Production Installer
```bash
npm run tauri:build
```

### Output Location
All generated packages will be in:
`src-tauri/target/release/bundle/`
(e.g., `.msi` / `.exe` on Windows, `.dmg` on macOS, `.deb` / `.AppImage` on Linux).

---

## Option 3: Instant Desktop PWA (No Build or Node.js Required)

You can also install ImageMate directly onto your desktop as a standalone application using your web browser:

1. Open ImageMate in **Google Chrome**, **Microsoft Edge**, or **Brave**.
2. Look at the browser address bar:
   - Click the **Install** icon (desktop monitor with download arrow).
   - Or click **Menu (⋮)** -> **Save and Share** -> **Install ImageMate**.
3. ImageMate opens in an independent, frameless desktop window with full offline support and taskbar/dock integration.

---

## Summary of Available Commands

| Command | Action |
|---|---|
| `npm run dev` | Runs the web app on `http://localhost:3000` |
| `npm run build` | Compiles the React production bundle to `/dist` |
| `npm run electron:dev` | Launches Vite and opens the Electron native desktop app |
| `npm run electron:build` | Compiles web assets and packages standalone native installers into `/release` |
| `npm run electron:pack` | Builds an unpackaged desktop directory for instant testing |
| `npm run tauri:dev` | Launches the Tauri native desktop app in dev mode |
| `npm run tauri:build` | Compiles an ultra-compact (~15MB) native desktop bundle via Rust |
