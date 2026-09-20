/**
 * Photoshop Web Studio - Built-in Sample Projects and Presets
 */

import { DocumentProject, Layer } from '../types/photoshop';

export const CANVAS_PRESETS = [
  {
    category: 'Social Media',
    presets: [
      { name: 'Instagram Square Post', width: 1080, height: 1080, dpi: 72 },
      { name: 'Instagram Story / Reel', width: 1080, height: 1920, dpi: 72 },
      { name: 'YouTube Thumbnail', width: 1280, height: 720, dpi: 72 },
      { name: 'Twitter / X Header', width: 1500, height: 500, dpi: 72 },
      { name: 'Facebook Banner', width: 1200, height: 630, dpi: 72 },
    ],
  },
  {
    category: 'Digital & Web',
    presets: [
      { name: 'Full HD (1080p)', width: 1920, height: 1080, dpi: 72 },
      { name: '4K Ultra HD', width: 3840, height: 2160, dpi: 72 },
      { name: 'Web Banner', width: 1200, height: 800, dpi: 72 },
      { name: 'Icon / Avatar', width: 512, height: 512, dpi: 72 },
    ],
  },
  {
    category: 'Print & Photo',
    presets: [
      { name: 'A4 Document (300 DPI)', width: 2480, height: 3508, dpi: 300 },
      { name: 'US Letter (300 DPI)', width: 2550, height: 3300, dpi: 300 },
      { name: 'Photo 4x6" (300 DPI)', width: 1200, height: 1800, dpi: 300 },
      { name: 'Photo 5x7" (300 DPI)', width: 1500, height: 2100, dpi: 300 },
    ],
  },
];

/**
 * Helper to draw a procedural cyberpunk backdrop canvas
 */
function createCyberpunkBackdrop(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Dark futuristic gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0a0a18');
  bgGrad.addColorStop(0.5, '#120b29');
  bgGrad.addColorStop(1, '#05192d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Atmospheric neon city glow / grid
  const sunGrad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    20,
    width * 0.5,
    height * 0.45,
    width * 0.45
  );
  sunGrad.addColorStop(0, 'rgba(255, 0, 128, 0.45)');
  sunGrad.addColorStop(0.5, 'rgba(120, 0, 255, 0.2)');
  sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, width, height);

  // Synthwave Sun
  ctx.save();
  const sunRadius = Math.min(width, height) * 0.22;
  const sunY = height * 0.42;
  const sunX = width * 0.5;
  const sGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
  sGrad.addColorStop(0, '#ffe600');
  sGrad.addColorStop(0.5, '#ff0077');
  sGrad.addColorStop(1, '#7700ff');
  ctx.fillStyle = sGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  // Sun horizontal scanline cuts
  ctx.fillStyle = '#120b29';
  for (let i = 0; i < 8; i++) {
    const barY = sunY + sunRadius * 0.1 + i * 16;
    const barH = 2 + i * 1.5;
    ctx.fillRect(sunX - sunRadius, barY, sunRadius * 2, barH);
  }
  ctx.restore();

  // Isometric Wireframe Grid Ground
  ctx.save();
  const horizon = height * 0.65;
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
  ctx.lineWidth = 1.5;

  // Perspective lines
  for (let x = -width; x <= width * 2; x += 60) {
    ctx.beginPath();
    ctx.moveTo(width * 0.5, horizon);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  // Horizontal grid lines with perspective compression
  for (let i = 1; i <= 15; i++) {
    const y = horizon + Math.pow(i / 15, 2.2) * (height - horizon);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  // Distant City Skyline Silhouettes
  ctx.fillStyle = '#060614';
  const buildings = [
    { x: 40, w: 70, h: 220 },
    { x: 120, w: 90, h: 310 },
    { x: 230, w: 60, h: 180 },
    { x: 300, w: 110, h: 280 },
    { x: 430, w: 80, h: 360 },
    { x: 530, w: 130, h: 240 },
    { x: 680, w: 75, h: 340 },
    { x: 770, w: 100, h: 200 },
    { x: 890, w: 110, h: 290 },
    { x: 1020, w: 85, h: 380 },
    { x: 1120, w: 120, h: 250 },
  ];

  buildings.forEach((b) => {
    ctx.fillRect(b.x, horizon - b.h, b.w, b.h);
    // Glowing windows
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0, 240, 255, 0.7)' : 'rgba(255, 0, 128, 0.7)';
    for (let wy = horizon - b.h + 20; wy < horizon - 20; wy += 25) {
      for (let wx = b.x + 10; wx < b.x + b.w - 10; wx += 16) {
        if (Math.random() > 0.4) {
          ctx.fillRect(wx, wy, 6, 10);
        }
      }
    }
    ctx.fillStyle = '#060614';
  });

  return canvas;
}

/**
 * Helper to draw a glowing neon paint art layer
 */
function createNeonPaintLayer(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  ctx.strokeStyle = '#00f0ff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 20;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(100, 150);
  ctx.bezierCurveTo(300, 80, 500, 300, 750, 120);
  ctx.bezierCurveTo(900, 50, 1100, 250, 1200, 180);
  ctx.stroke();

  ctx.strokeStyle = '#ff007f';
  ctx.shadowColor = '#ff007f';
  ctx.beginPath();
  ctx.moveTo(80, 220);
  ctx.bezierCurveTo(280, 350, 600, 100, 850, 280);
  ctx.bezierCurveTo(1000, 380, 1150, 200, 1220, 290);
  ctx.stroke();
  ctx.restore();

  return canvas;
}

/**
 * Generate Default Sample Project: Cyberpunk Poster
 */
export function createCyberpunkProject(): DocumentProject {
  const width = 1280;
  const height = 720;
  const bgCanvas = createCyberpunkBackdrop(width, height);
  const neonPaintCanvas = createNeonPaintLayer(width, height);

  const layers: Layer[] = [
    {
      id: 'layer-bg',
      name: 'Synthwave Background',
      type: 'raster',
      visible: true,
      locked: true,
      opacity: 100,
      blendMode: 'normal',
      x: 0,
      y: 0,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      canvas: bgCanvas,
      effects: {},
    },
    {
      id: 'layer-neon-strokes',
      name: 'Neon Laser Streaks',
      type: 'raster',
      visible: true,
      locked: false,
      opacity: 90,
      blendMode: 'screen',
      x: 0,
      y: 0,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      canvas: neonPaintCanvas,
      effects: {
        outerGlow: {
          enabled: true,
          color: '#00f0ff',
          blur: 15,
          opacity: 80,
        },
      },
    },
    {
      id: 'layer-badge-shape',
      name: 'Header Accent Badge',
      type: 'shape',
      shapeType: 'rounded-rect',
      fillColor: 'rgba(255, 0, 128, 0.25)',
      strokeColor: '#ff0080',
      strokeWidth: 2,
      cornerRadius: 8,
      visible: true,
      locked: false,
      opacity: 95,
      blendMode: 'normal',
      x: 390,
      y: 95,
      width: 500,
      height: 48,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      effects: {
        dropShadow: {
          enabled: true,
          color: '#ff0080',
          blur: 16,
          offsetX: 0,
          offsetY: 0,
          opacity: 60,
        },
      },
    },
    {
      id: 'layer-badge-text',
      name: 'Sub-headline Text',
      type: 'text',
      text: '✦  FUTURE RETROGRADE 2088  ✦',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 16,
      fontWeight: '700',
      textColor: '#ffffff',
      textAlign: 'center',
      letterSpacing: 4,
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 390,
      y: 110,
      width: 500,
      height: 30,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      effects: {},
    },
    {
      id: 'layer-title-text',
      name: 'Main Title Typography',
      type: 'text',
      text: 'CYBERPUNK\nHORIZONS',
      fontFamily: 'Oswald, sans-serif',
      fontSize: 92,
      fontWeight: '700',
      textColor: '#00f0ff',
      textAlign: 'center',
      lineHeight: 0.95,
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 340,
      y: 165,
      width: 600,
      height: 190,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      effects: {
        dropShadow: {
          enabled: true,
          color: '#00f0ff',
          blur: 24,
          offsetX: 0,
          offsetY: 4,
          opacity: 75,
        },
        stroke: {
          enabled: true,
          color: '#ffffff',
          size: 1.5,
          position: 'outside',
        },
      },
    },
    {
      id: 'layer-color-grade',
      name: 'Color Grade & Contrast',
      type: 'adjustment',
      adjustmentType: 'hue-saturation',
      adjustmentParams: {
        hue: 5,
        saturation: 15,
        lightness: 2,
      },
      visible: true,
      locked: false,
      opacity: 80,
      blendMode: 'normal',
      x: 0,
      y: 0,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      effects: {},
    },
  ];

  return {
    id: 'doc-cyberpunk',
    title: 'Cyberpunk Horizons.psd',
    width,
    height,
    dpi: 72,
    colorMode: 'RGB',
    background: 'black',
    layers,
    activeLayerId: 'layer-title-text',
    selectedLayerIds: ['layer-title-text'],
    history: [
      {
        id: 'hist-init',
        name: 'Open Document',
        timestamp: Date.now(),
        layers: JSON.parse(JSON.stringify(layers)),
        activeLayerId: 'layer-title-text',
        width,
        height,
      },
    ],
    historyIndex: 0,
    zoom: 0.85,
    pan: { x: 0, y: 0 },
    guides: [
      { id: 'g1', orientation: 'horizontal', position: 360 },
      { id: 'g2', orientation: 'vertical', position: 640 },
    ],
    rulersVisible: true,
    gridVisible: false,
    snapToGuides: true,
    snapToGrid: false,
    selection: null,
    isDirty: false,
  };
}

/**
 * Generate Modern Brand Identity Banner project
 */
export function createBrandBannerProject(): DocumentProject {
  const width = 1200;
  const height = 630;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e293b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  }

  const layers: Layer[] = [
    {
      id: 'bg-1',
      name: 'Slate Canvas Background',
      type: 'raster',
      visible: true,
      locked: true,
      opacity: 100,
      blendMode: 'normal',
      x: 0,
      y: 0,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      canvas,
      effects: {},
    },
    {
      id: 'shape-glow-orb',
      name: 'Cyan Gradient Orb',
      type: 'shape',
      shapeType: 'ellipse',
      fillColor: '#0ea5e9',
      visible: true,
      locked: false,
      opacity: 60,
      blendMode: 'screen',
      x: 750,
      y: 80,
      width: 450,
      height: 450,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      effects: {
        outerGlow: {
          enabled: true,
          color: '#38bdf8',
          blur: 50,
          opacity: 90,
        },
      },
    },
    {
      id: 'shape-purple-orb',
      name: 'Violet Accent Orb',
      type: 'shape',
      shapeType: 'ellipse',
      fillColor: '#8b5cf6',
      visible: true,
      locked: false,
      opacity: 50,
      blendMode: 'screen',
      x: 600,
      y: 200,
      width: 350,
      height: 350,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      effects: {},
    },
    {
      id: 'text-brand-title',
      name: 'Headline',
      type: 'text',
      text: 'Next-Gen Creative Studio',
      fontFamily: 'Inter, sans-serif',
      fontSize: 54,
      fontWeight: '800',
      textColor: '#ffffff',
      textAlign: 'left',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 80,
      y: 190,
      width: 700,
      height: 80,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      effects: {
        dropShadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.5)',
          blur: 12,
          offsetX: 0,
          offsetY: 4,
          opacity: 60,
        },
      },
    },
    {
      id: 'text-brand-sub',
      name: 'Sub-caption',
      type: 'text',
      text: 'Full-featured web & desktop creative suite with multi-layer compositing, non-destructive adjustments, vector tools, and instant filters.',
      fontFamily: 'Inter, sans-serif',
      fontSize: 20,
      fontWeight: '400',
      textColor: '#94a3b8',
      textAlign: 'left',
      lineHeight: 1.4,
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 80,
      y: 290,
      width: 550,
      height: 120,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      effects: {},
    },
    {
      id: 'button-shape',
      name: 'CTA Button Pill',
      type: 'shape',
      shapeType: 'rounded-rect',
      fillColor: '#3b82f6',
      cornerRadius: 24,
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 80,
      y: 430,
      width: 180,
      height: 48,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      effects: {
        dropShadow: {
          enabled: true,
          color: '#2563eb',
          blur: 16,
          offsetX: 0,
          offsetY: 4,
          opacity: 50,
        },
      },
    },
    {
      id: 'button-text',
      name: 'CTA Label',
      type: 'text',
      text: 'Get Started →',
      fontFamily: 'Inter, sans-serif',
      fontSize: 16,
      fontWeight: '600',
      textColor: '#ffffff',
      textAlign: 'center',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 80,
      y: 444,
      width: 180,
      height: 30,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      effects: {},
    },
  ];

  return {
    id: 'doc-brand-banner',
    title: 'Brand Identity Banner.psd',
    width,
    height,
    dpi: 72,
    colorMode: 'RGB',
    background: 'black',
    layers,
    activeLayerId: 'text-brand-title',
    selectedLayerIds: ['text-brand-title'],
    history: [
      {
        id: 'hist-init',
        name: 'Open Document',
        timestamp: Date.now(),
        layers: JSON.parse(JSON.stringify(layers)),
        activeLayerId: 'text-brand-title',
        width,
        height,
      },
    ],
    historyIndex: 0,
    zoom: 0.9,
    pan: { x: 0, y: 0 },
    guides: [{ id: 'g1', orientation: 'vertical', position: 80 }],
    rulersVisible: true,
    gridVisible: false,
    snapToGuides: true,
    snapToGrid: false,
    selection: null,
    isDirty: false,
  };
}

/**
 * Generate a blank new document
 */
export function createBlankProject(
  title = 'Untitled-1.psd',
  width = 1920,
  height = 1080,
  dpi = 72,
  background: 'transparent' | 'white' | 'black' | 'custom' = 'white',
  bgColor = '#ffffff'
): DocumentProject {
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = width;
  bgCanvas.height = height;
  const ctx = bgCanvas.getContext('2d');
  if (ctx && background !== 'transparent') {
    ctx.fillStyle = background === 'white' ? '#ffffff' : background === 'black' ? '#000000' : bgColor;
    ctx.fillRect(0, 0, width, height);
  }

  const layers: Layer[] = [
    {
      id: 'layer-bg-1',
      name: 'Background',
      type: 'raster',
      visible: true,
      locked: true,
      opacity: 100,
      blendMode: 'normal',
      x: 0,
      y: 0,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      canvas: bgCanvas,
      effects: {},
    },
    {
      id: 'layer-1',
      name: 'Layer 1',
      type: 'raster',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 0,
      y: 0,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      canvas: document.createElement('canvas'),
      effects: {},
    },
  ];

  return {
    id: `doc-${Date.now()}`,
    title,
    width,
    height,
    dpi,
    colorMode: 'RGB',
    background,
    backgroundColor: bgColor,
    layers,
    activeLayerId: 'layer-1',
    selectedLayerIds: ['layer-1'],
    history: [
      {
        id: 'hist-init',
        name: 'New Document',
        timestamp: Date.now(),
        layers: JSON.parse(JSON.stringify(layers)),
        activeLayerId: 'layer-1',
        width,
        height,
      },
    ],
    historyIndex: 0,
    zoom: 0.75,
    pan: { x: 0, y: 0 },
    guides: [],
    rulersVisible: true,
    gridVisible: false,
    snapToGuides: true,
    snapToGrid: false,
    selection: null,
    isDirty: false,
  };
}

export const createBrandProject = createBrandBannerProject;
