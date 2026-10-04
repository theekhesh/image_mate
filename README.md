# ImageMate

> Professional desktop photo editing suite featuring a full multi-layer engine, raster/vector/text tools, pressure-sensitive brush dynamics, non-destructive layer effects, image adjustments, and filter gallery.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [Canvas & Navigation](#canvas--navigation)
  - [Layer Engine & Effects](#layer-engine--effects)
  - [Complete Tool Palette](#complete-tool-palette)
  - [Pressure & Jitter Brush Engine](#pressure--jitter-brush-engine)
  - [Image Adjustments & Filter Gallery](#image-adjustments--filter-gallery)
  - [Dockable Palettes](#dockable-palettes)
  - [Import & Export](#import--export)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Installation & Getting Started](#installation--getting-started)
- [Build & Deployment](#build--deployment)
  - [Web Build](#web-build)
  - [Desktop Build (Electron)](#desktop-build-electron)
  - [Desktop Build (Tauri)](#desktop-build-tauri)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [License](#license)

---

## Overview

**ImageMate** is an in-browser and cross-platform desktop raster graphics editor inspired by industry-standard digital imaging software. Built with modern React 18, TypeScript, and HTML5 Canvas, it delivers near-native desktop performance, low latency, and a comprehensive suite of creative photo manipulation and design tools.

---

## Key Features

### Canvas & Navigation
- **High-Performance Canvas Stage**: Smooth pan, zoom (10% to 500%), and viewport rendering.
- **Rulers & Pixel Guides**: Interactive horizontal and vertical rulers with drag-and-drop custom guide lines.
- **Precision Reticle Cursor**: Real-time brush diameter outline with a 1px center reticle dot.
- **Document Presets**: Blank canvas, Web standard (1920x1080), Social Media (Square 1080x1080, Portrait 1080x1350), 4K UHD, and custom dimensions.

### Layer Engine & Effects
- **Layer Types**: Raster image layers, Vector shapes, and Editable Text layers.
- **Blend Modes**: `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`.
- **Layer Operations**: Add, delete, duplicate, merge down, flatten document, lock/unlock, hide/show, and adjust opacity.
- **Layer Styles (Non-Destructive Effects)**:
  - **Drop Shadow**: Angle, distance, blur, spread, opacity, color.
  - **Stroke**: Width, color, position (Outside, Inside, Center).
  - **Color Overlay**: Solid tint with blend modes and opacity.
  - **Inner Shadow**: Inset shadow with configurable offset and blur.
  - **Outer Glow**: Ambient glow radiance and intensity.

### Complete Tool Palette
The left toolbox supports both **Single-Column** and **Double-Column** layouts (toggle via the `>>` / `<<` button at the top) with persistent sub-tool memory and flyout menus accessible via **long-press**, **right-click**, or **corner arrow click**:

| Category | Primary Tool | Sub-Tools Included | Shortcut |
| :--- | :--- | :--- | :---: |
| **Select** | Pointer & Transform (`move`) | Selection & transform handles | `V` |
| | Frame Selector (`marquee-rect`) | Box Frame Select, Oval Frame Select | `M` |
| | Contour Selector (`lasso-free`) | Freehand Contour, Polygon Segment Contour | `L` |
| | Chroma & Tone Wand (`magic-wand`) | High-performance flood-fill & global tonal selection | `W` |
| | Canvas Trimmer (`crop`) | Interactive bounding box cropping | `C` |
| **Paint** | Paint Stylus (`brush`) | Soft/Hard round, airbrush, chalk, charcoal, calligraphy, splatter | `B` |
| | Precision Scribe (`pencil`) | 1px / sharp pixel art scribe | `B` |
| | Pigment Clearer (`eraser`) | Alpha transparency eraser | `E` |
| | Color Flow (`gradient`) | Linear & Radial gradients | `G` |
| | Flood Fill Bucket (`paint-bucket`) | Contiguous & non-contiguous bucket fill | `G` |
| **Retouch** | Texture Replicator (`clone-stamp`) | Alt+Click source sampling and clone painting | `S` |
| | Surface Healer (`spot-healing`) | Texture-blended blemish removal | `J` |
| | Focus & Diffusion (`blur`) | Soft Focus, Edge Sharpener, Pigment Smudge | `R` |
| | Tone & Luminance (`dodge`) | Highlight Boost, Shadow Deepen, Color Vibrance | `O` |
| **Vector** | Bezier Path Drafter (`pen`) | Vector path drawing | `P` |
| | Typography Inscription (`text`) | In-place rich text editing (font, size, alignment) | `T` |
| | Vector Geometries (`shapes`) | Box, Filleted Box, Oval, Hexagon, Star, Line, Arrow | `U` |
| **Navigate**| Color Probe (`eyedropper`) | Canvas pixel color probe / sampler | `I` |
| | Canvas Pan (`hand`) | Freeform canvas panning | `H` |
| | View Magnifier (`zoom`) | Click to zoom in / Shift+Click to zoom out | `Z` |

- **All Tools Palette (`...`)**: Instant overview menu showing every single tool and shortcut grouped by category for quick access.

### Chroma & Tone Wand Engine
- **Flood-Fill Breadth-First Search (BFS)**: Instant contiguous boundary calculation starting from the sampled pixel.
- **Euclidean Color Distance**: Evaluates perceptual RGBA color distance based on the user-controlled **Tolerance** (0 = exact match, 32 = standard, 100+ = broad tonal range).
- **Contiguous Toggle**:
  - *Enabled (default)*: Restricts selection strictly to the connected region of similar color.
  - *Disabled (Global Tonal Mode)*: Selects all pixels of matching chromatic and tonal value throughout the entire layer/document.
- **Sample All Layers Toggle**: Switch between sampling only within the active layer or across all visible composite layers.
- **Moore-Neighbor Contour Tracing**: Extracts the true boundary polygon of the selected area for animated marching ants rendering.
- **Pixel-Accurate Mask Canvas**: Provides an exact alpha selection mask for clipboard copy/cut/paste, layer clearance, and paint fill.

### Pressure & Jitter Brush Engine
- **Size Jitter (0% – 100%)**: Dynamically fluctuates brush diameter along the path to simulate tapered strokes and natural pen pressure.
- **Opacity Jitter (0% – 100%)**: Dynamically modulates ink flow and pigment density.
- **Pressure Simulation (`Pressure` toggle)**:
  - Velocity & stroke ramp-in calculation to simulate realistic graphics tablet dynamics using a mouse or trackpad.
  - Native hardware stylus support via `PointerEvent.pressure` for drawing tablets (Wacom, Apple Pencil, Surface Pen).
- **Sub-Step Smooth Interpolation**: Renders continuous, unbroken dabs along rapid movements.
- **Dynamics Presets**: Instant switching between *Standard (0%)*, *Natural Pressure*, *Subtle Jitter (30%/20%)*, *Pressure Pen (55%/40%)*, and *Expressive Texture (80%/70%)*.

### Image Adjustments & Filter Gallery
- **Adjustments**:
  - Brightness & Contrast
  - Hue & Saturation
  - Levels & Histogram
  - Curves Tone Mapping
  - Color Balance (Cyan/Red, Magenta/Green, Yellow/Blue)
  - Vibrance & Saturation
  - Exposure & Gamma Correction
  - Black & White conversion
  - Invert, Posterize, Threshold
- **Filter Gallery**:
  - Blur: Gaussian Blur, Box Blur, Motion Blur
  - Sharpen & Detail: Unsharp Mask, High-Pass Sharpen
  - Artistic & Stylize: Edge Detect (Sobel), Emboss, Vignette, Noise Generator, Sepia Tone, Pixelate

### Dockable Palettes
- **Layers Panel**: Drag-to-reorder, layer blending, opacity sliders, visibility eye, lock toggle.
- **Adjustments Panel**: 1-click adjustment modal launchers.
- **Color Swatches & Picker**: HSV/RGB color sliders, quick hex input, recent swatches.
- **Navigator**: Real-time thumbnail preview of the entire canvas with pan view box.
- **History Panel**: Multi-step undo/redo stack with human-readable action names.
- **Properties**: Live dimensions, position, and metadata of the active layer.

### Universal Theme System
ImageMate features a full-fledged dynamic theme engine supporting universally recognized designer and developer palettes with instantaneous live switching, persistent selection, custom palette creation, and JSON import/export:
- **Tokyo Night**: Downtown Tokyo deep navy/sapphire aesthetic with vibrant cyan and violet accents.
- **Dracula**: Iconic vampire dark theme with high-contrast pink, purple, and green highlights.
- **Nord**: Arctic blue-grey minimalist palette with frost teal and ice blue tones.
- **Catppuccin Mocha**: Warm soothing pastel dark theme with lavender, sky blue, and mauve.
- **One Dark Pro**: Balanced slate dark theme optimized for eye comfort.
- **Monokai Pro**: High-contrast creative spectrum with lime green, pink, and yellow accents.
- **Cyberpunk 2077**: Electric high-octane dark theme with neon yellow and hot magenta.
- **Solarized Dark**: Precision cyan-teal scientific palette with amber and sapphire.
- **Gruvbox Dark**: Retro earthy dark groove with golden ochre and forest green.
- **Dark Studio**: ImageMate classic neutral charcoal dark workspace.
- **Theme Preferences Modal & Quick Switcher**: Quick dropdown in the top menu bar, live visual color previews, custom color slot pickers, and VS Code/ImageMate theme JSON import/export.

### Import & Export
- **Project Files (`.imate`)**: Save and load complete multi-layer documents (retains layers, coordinates, blend modes, and opacity).
- **Raster Image Export**: Export full document or cropped regions to `PNG`, `JPEG`, or `WebP` with customizable quality (1–100%) and scale factors (0.5x, 1x, 2x, 4x).
- **Sample Projects**: Built-in sample projects (*Cyberpunk City*, *Minimalist Landscape*, *Retro Poster*) to explore all features instantly.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `V` | Pointer & Transform |
| `M` | Frame Selector (Box / Oval) |
| `L` | Contour Selector (Freehand / Poly) |
| `W` | Chroma & Tone Wand |
| `C` | Canvas Trimmer |
| `I` | Color Probe |
| `B` | Paint Stylus / Precision Scribe |
| `E` | Pigment Clearer |
| `S` | Texture Replicator |
| `J` | Surface Healer |
| `G` | Color Flow / Flood Fill |
| `R` | Focus & Diffusion (Soft Focus / Edge Sharpener / Smudge) |
| `O` | Tone & Luminance (Highlight Boost / Shadow Deepen / Vibrance) |
| `P` | Bezier Path Drafter |
| `T` | Typography Inscription |
| `U` | Vector Geometries |
| `H` | Canvas Pan |
| `Z` | View Magnifier |
| `D` | Reset Colors (Black / White) |
| `X` | Swap Foreground and Background Colors |
| `Ctrl + Z` / `Cmd + Z` | Undo |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo |
| `Ctrl + A` / `Cmd + A` | Select All |
| `Ctrl + D` / `Cmd + D` | Deselect |
| `Ctrl + J` / `Cmd + J` | Duplicate Active Layer |
| `Ctrl + E` / `Cmd + E` | Merge Layer Down |
| `Ctrl + Shift + E` | Quick Export Modal |
| `Ctrl + 0` / `Cmd + 0` | Fit Canvas to Screen |
| `Delete` / `Backspace` | Clear Selection / Delete Selected Layer |

---

## Installation & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or later)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### 1. Clone the repository
```bash
git clone https://github.com/theekhesh/image_mate.git
cd image_mate
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```
Open your browser at `http://localhost:3000` to start editing.

---

## Build & Deployment

### Web Build
To build the optimized production web bundle:
```bash
npm run build
```
Output files will be generated in the `dist/` folder.

To preview the production build locally:
```bash
npm run preview
```

To run type checks and verify code integrity:
```bash
npm run lint
```

---

### Desktop Build (Electron)
ImageMate is pre-configured with Electron and `electron-builder` to package native standalone desktop apps for Windows, macOS, and Linux.

#### Run in Electron Dev Mode:
```bash
npm run electron:dev
```

#### Package Desktop Binaries:
```bash
npm run electron:build
```
This builds target packages in the `release/` directory:
- **Windows**: `.exe` (NSIS installer & portable standalone executable)
- **macOS**: `.dmg` disk image and `.zip`
- **Linux**: `.AppImage` and `.deb` package

#### Pack Directory without Installer:
```bash
npm run electron:pack
```

---

### Desktop Build (Tauri)
ImageMate also supports [Tauri](https://tauri.app/) for ultra-lightweight, native Rust-powered desktop binaries:

```bash
# Run Tauri in development mode
npm run tauri:dev

# Build release desktop binary via Tauri
npm run tauri:build
```

---

## Project Structure

```text
├── electron/                 # Electron main process & preload scripts
│   └── main.cjs
├── public/                   # Static assets & web icons
├── src/
│   ├── components/           # React UI components
│   │   ├── modals/           # Modal dialogs
│   │   │   ├── CanvasSizeModal.tsx       # Canvas & Image resizing
│   │   │   ├── ExportModal.tsx           # Image export (PNG/JPEG/WebP)
│   │   │   ├── FilterGalleryModal.tsx    # Filter gallery preview & controls
│   │   │   ├── ImageAdjustmentsModal.tsx # Brightness, Levels, Curves, etc.
│   │   │   ├── LayerStylesModal.tsx      # Shadows, Strokes, Glows
│   │   │   ├── NewDocumentModal.tsx      # Blank canvas creation
│   │   │   └── ShortcutsModal.tsx        # Keyboard reference cheat sheet
│   │   ├── panels/           # Dockable side panels
│   │   │   ├── AdjustmentsPanel.tsx      # Adjustments quick launch
│   │   │   ├── ColorPanel.tsx            # Color wheels & swatches
│   │   │   ├── HistoryPanel.tsx          # Undo/Redo action stack
│   │   │   ├── LayersPanel.tsx           # Multi-layer management
│   │   │   ├── NavigatorPanel.tsx        # Viewport zoom & pan mini-map
│   │   │   └── PropertiesPanel.tsx       # Layer geometry & stats
│   │   ├── CanvasStage.tsx   # Core interactive HTML5 Canvas engine
│   │   ├── RightDock.tsx     # Collapsible right tool palette dock
│   │   ├── Rulers.tsx        # Dynamic pixel rulers & guide lines
│   │   ├── Toolbar.tsx       # Left toolbox with flyouts & subtools
│   │   ├── ToolOptionsBar.tsx# Context-sensitive active tool options
│   │   └── TopMenuBar.tsx    # Top menu (File, Edit, Image, Layer, Filter, View)
│   ├── types/
│   │   └── imagemate.ts      # TypeScript interfaces and domain types
│   ├── utils/
│   │   ├── canvasRenderer.ts # Layer rendering, blend modes, & hit testing
│   │   ├── fileExporter.ts   # File serialization, exports, & blob helpers
│   │   ├── filterEngine.ts   # Pixel convolution, blur, and tone shaders
│   │   └── sampleProjects.ts # Built-in demo projects generator
│   ├── App.tsx               # Main application orchestration & state
│   ├── index.css             # Tailwind CSS styles & typography
│   └── main.tsx              # React DOM root entry point
├── src-tauri/                # Tauri Rust configuration
├── package.json              # Scripts & dependencies
├── tsconfig.json             # TypeScript compiler settings
└── vite.config.ts            # Vite bundler configuration
```

---

## Technology Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Graphics Engine**: Native HTML5 2D Canvas Context API with sub-pixel interpolation
- **Desktop Wrappers**: [Electron](https://www.electronjs.org/) + [Tauri](https://tauri.app/)

---

## License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)** - see the [LICENSE](LICENSE) file for details.

Copyright (C) 2026 [theekshana heshan](https://github.com/theekhesh)

