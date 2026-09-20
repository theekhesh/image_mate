/**
 * Photoshop Web Studio - Core Types & Interfaces
 */

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export type LayerType = 'raster' | 'text' | 'shape' | 'adjustment' | 'group';

export type ShapeType =
  | 'rect'
  | 'rounded-rect'
  | 'ellipse'
  | 'polygon'
  | 'star'
  | 'line'
  | 'arrow';

export type AdjustmentType =
  | 'brightness-contrast'
  | 'hue-saturation'
  | 'curves'
  | 'levels'
  | 'color-balance'
  | 'vibrance'
  | 'black-white'
  | 'invert'
  | 'posterize'
  | 'threshold'
  | 'sepia'
  | 'gradient-map'
  | 'exposure'
  | 'photo-filter';

export interface Point {
  x: number;
  y: number;
}

export type SelectionMask = HTMLCanvasElement;

export interface ToolOptions {
  brushSize: number;
  brushHardness: number;
  brushOpacity: number;
  brushFlow: number;
  feather: number;
  tolerance: number;
  contiguous: boolean;
  fontFamily: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  shapeType: ShapeType;
  zoomLevel: number;
  sampleAllLayers: boolean;
}

export interface LayerEffects {
  dropShadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
  };
  stroke?: {
    enabled: boolean;
    color: string;
    size: number;
    position: 'outside' | 'inside' | 'center';
  };
  colorOverlay?: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
  innerShadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
  };
  outerGlow?: {
    enabled: boolean;
    color: string;
    blur: number;
    opacity: number;
  };
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 - 100
  blendMode: BlendMode;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees
  scaleX?: number;
  scaleY?: number;

  // Raster content (stored as canvas or ImageData or dataURL)
  canvas?: HTMLCanvasElement;
  imageData?: ImageData;
  dataUrl?: string;

  // Layer Mask (grayscale canvas for masking)
  maskCanvas?: HTMLCanvasElement;
  maskEnabled?: boolean;
  isEditingMask?: boolean;

  // Text specific properties
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  warp?: {
    type: 'none' | 'arc' | 'wave' | 'bulge';
    bend: number;
  };

  // Shape specific properties
  shapeType?: ShapeType;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  sides?: number; // For polygon
  starPoints?: number; // For star

  // Adjustment specific properties
  adjustmentType?: AdjustmentType;
  adjustmentParams?: Record<string, number | string>;

  // Group properties
  children?: string[]; // IDs of children

  // Layer styles / effects
  effects?: LayerEffects;
}

export type ToolType =
  | 'move'
  | 'marquee-rect'
  | 'marquee-ellipse'
  | 'lasso-free'
  | 'lasso-poly'
  | 'magic-wand'
  | 'crop'
  | 'eyedropper'
  | 'brush'
  | 'pencil'
  | 'eraser'
  | 'clone-stamp'
  | 'spot-healing'
  | 'gradient'
  | 'paint-bucket'
  | 'blur'
  | 'sharpen'
  | 'smudge'
  | 'dodge'
  | 'burn'
  | 'sponge'
  | 'pen'
  | 'text'
  | 'shape-rect'
  | 'shape-rounded'
  | 'shape-ellipse'
  | 'shape-polygon'
  | 'shape-star'
  | 'shape-line'
  | 'shape-arrow'
  | 'hand'
  | 'zoom';

export interface BrushSettings {
  size: number;
  hardness: number; // 0 - 100
  opacity: number; // 0 - 100
  flow: number; // 0 - 100
  spacing: number; // percentage
  preset:
    | 'soft-round'
    | 'hard-round'
    | 'airbrush'
    | 'chalk'
    | 'charcoal'
    | 'calligraphy'
    | 'splatter'
    | 'pixel';
}

export interface SelectionState {
  active: boolean;
  type: 'rect' | 'ellipse' | 'polygon' | 'free' | 'mask';
  points: { x: number; y: number }[];
  bounds: { x: number; y: number; width: number; height: number };
  feather: number;
  maskCanvas?: HTMLCanvasElement;
}

export interface Guide {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number; // in canvas pixels
}

export interface HistoryStep {
  id: string;
  name: string;
  iconName?: string;
  timestamp: number;
  document?: DocumentProject;
  layers?: Layer[];
  activeLayerId?: string | null;
  width?: number;
  height?: number;
}

export interface DocumentProject {
  id: string;
  title: string;
  width: number;
  height: number;
  dpi: number;
  colorMode: 'RGB' | 'Grayscale';
  background: 'transparent' | 'white' | 'black' | 'custom';
  backgroundColor?: string;
  layers: Layer[];
  activeLayerId: string | null;
  selectedLayerIds: string[];
  history: HistoryStep[];
  historyIndex: number;
  zoom: number; // 1 = 100%
  pan: { x: number; y: number };
  guides: Guide[];
  rulersVisible: boolean;
  gridVisible: boolean;
  showRulers?: boolean;
  showGrid?: boolean;
  showGuides?: boolean;
  snapToGuides: boolean;
  snapToGrid: boolean;
  selection: SelectionState | null;
  isDirty?: boolean;
}

export type ActivePanel =
  | 'layers'
  | 'color'
  | 'history'
  | 'properties'
  | 'navigator'
  | 'adjustments'
  | 'brushes'
  | 'channels';

export interface GradientPreset {
  id: string;
  name: string;
  stops: { offset: number; color: string }[];
}
