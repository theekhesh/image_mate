/**
 * ImageMate Studio - Context-Sensitive Tool Options Bar
 */

import React from 'react';
import {
  ToolType,
  BrushSettings,
  Layer,
  ShapeType,
  ToolOptions,
} from '../types/imagemate';
import { CanvasRenderer } from '../utils/canvasRenderer';
import { getToolMeta } from '../utils/toolInfo';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Check,
  X,
  Bold,
  Italic,
  Square,
  Circle,
  Star,
  Minus,
  Sparkles,
  Sun,
  Moon,
  Contrast,
  Pipette,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  PenTool,
} from 'lucide-react';

interface ToolOptionsBarProps {
  activeTool: ToolType;
  options?: ToolOptions;
  onOptionsChange?: (updates: Partial<ToolOptions>) => void;
  brushSettings?: BrushSettings;
  onChangeBrush?: (settings: Partial<BrushSettings>) => void;
  activeLayer: Layer | null;
  onUpdateLayer?: (updates: Partial<Layer>) => void;
  fgColor?: string;
  bgColor?: string;
  onChangeFgColor?: (color: string) => void;
  cropRatio?: string;
  onChangeCropRatio?: (ratio: string) => void;
  onApplyCrop?: () => void;
  onCancelCrop?: () => void;
  marqueeFeather?: number;
  onChangeMarqueeFeather?: (feather: number) => void;
  magicTolerance?: number;
  onChangeMagicTolerance?: (tol: number) => void;
  gradientType?: 'linear' | 'radial' | 'reflected' | 'diamond';
  onChangeGradientType?: (type: 'linear' | 'radial' | 'reflected' | 'diamond') => void;
  onAlignLayers?: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  zoomLevel?: number;
  onSetZoom?: (zoom: number) => void;
  onFitScreen?: () => void;
  canvasBg?: 'transparent' | 'white' | 'black' | 'custom';
  onChangeCanvasBg?: (bg: 'white' | 'black' | 'transparent') => void;
  onFlipCanvas?: (dir: 'h' | 'v') => void;
  onRotateCanvas?: (angle: number) => void;
}

export const ToolOptionsBar: React.FC<ToolOptionsBarProps> = ({
  activeTool,
  options,
  onOptionsChange,
  brushSettings,
  onChangeBrush,
  activeLayer,
  onUpdateLayer,
  fgColor = '#00e5ff',
  bgColor = '#ff0055',
  onChangeFgColor,
  cropRatio = 'free',
  onChangeCropRatio,
  onApplyCrop,
  onCancelCrop,
  marqueeFeather = 0,
  onChangeMarqueeFeather,
  magicTolerance = 32,
  onChangeMagicTolerance,
  gradientType = 'linear',
  onChangeGradientType,
  onAlignLayers,
  zoomLevel = 1,
  onSetZoom,
  onFitScreen,
  canvasBg = 'white',
  onChangeCanvasBg,
  onFlipCanvas,
  onRotateCanvas,
}) => {
  const currentBrush: BrushSettings = brushSettings || {
    size: options?.brushSize ?? 24,
    hardness: options?.brushHardness ?? 80,
    opacity: options?.brushOpacity ?? 100,
    flow: options?.brushFlow ?? 100,
    spacing: 15,
    sizeJitter: options?.brushSizeJitter ?? 0,
    opacityJitter: options?.brushOpacityJitter ?? 0,
    pressureSim: options?.brushPressureSim ?? true,
    preset: 'soft-round',
  };

  const handleBrushChange = (updates: Partial<BrushSettings>) => {
    onChangeBrush?.(updates);
    if (onOptionsChange) {
      onOptionsChange({
        ...(updates.size !== undefined && { brushSize: updates.size }),
        ...(updates.hardness !== undefined && { brushHardness: updates.hardness }),
        ...(updates.opacity !== undefined && { brushOpacity: updates.opacity }),
        ...(updates.flow !== undefined && { brushFlow: updates.flow }),
        ...(updates.sizeJitter !== undefined && { brushSizeJitter: updates.sizeJitter }),
        ...(updates.opacityJitter !== undefined && { brushOpacityJitter: updates.opacityJitter }),
        ...(updates.pressureSim !== undefined && { brushPressureSim: updates.pressureSim }),
      });
    }
  };
  return (
    <div className="bg-[#282828] border-b border-[#383838] px-3 h-9 flex items-center justify-between text-xs text-[#d4d4d4] select-none gap-3 shrink-0">
      {/* Left: Active Tool Specific Options (Scrollable) */}
      <div className="flex-1 flex items-center gap-4 overflow-x-auto scrollbar-none py-0.5">
        {/* Tool Icon / Name Label */}
        {(() => {
          const toolMeta = getToolMeta(activeTool);
          const ToolIcon = toolMeta.icon;
          return (
            <div
              className="flex items-center gap-1.5 font-medium text-cyan-300 pr-3 border-r border-[#3e3e42] shrink-0"
              title={`${toolMeta.name} (${toolMeta.shortcut}) - ${toolMeta.description}`}
            >
              <ToolIcon size={14} className="text-cyan-400" />
              <span className="font-semibold text-white tracking-wide">{toolMeta.name}</span>
            </div>
          );
        })()}

      {/* Move Tool Options */}
      {activeTool === 'move' && (
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded bg-[#1e1e1e] border-gray-600" />
            <span>Auto-Select Layer</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded bg-[#1e1e1e] border-gray-600" />
            <span>Show Transform Controls</span>
          </label>

          <div className="h-4 w-px bg-[#3e3e42]" />

          {/* Alignment buttons */}
          <div className="flex items-center gap-0.5 bg-[#1e1e1e] p-0.5 rounded border border-[#3e3e42]">
            <button
              id="align-left-btn"
              onClick={() => onAlignLayers?.('left')}
              title="Align Left Edges"
              className="p-1 hover:bg-[#333333] rounded text-gray-300 hover:text-white"
            >
              <AlignLeft size={13} />
            </button>
            <button
              id="align-center-btn"
              onClick={() => onAlignLayers?.('center')}
              title="Align Horizontal Centers"
              className="p-1 hover:bg-[#333333] rounded text-gray-300 hover:text-white"
            >
              <AlignCenter size={13} />
            </button>
            <button
              id="align-right-btn"
              onClick={() => onAlignLayers?.('right')}
              title="Align Right Edges"
              className="p-1 hover:bg-[#333333] rounded text-gray-300 hover:text-white"
            >
              <AlignRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Brush / Pencil / Eraser / Spot-healing Options */}
      {(activeTool === 'brush' ||
        activeTool === 'pencil' ||
        activeTool === 'eraser' ||
        activeTool === 'spot-healing' ||
        activeTool === 'clone-stamp' ||
        activeTool === 'blur' ||
        activeTool === 'sharpen' ||
        activeTool === 'smudge') && (
        <div className="flex items-center gap-4">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Brush:</span>
            <select
              id="brush-preset-select"
              value={currentBrush.preset}
              onChange={(e) => handleBrushChange({ preset: e.target.value as any })}
              className="bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-0.5 text-xs text-white"
            >
              <option value="soft-round">Soft Round</option>
              <option value="hard-round">Hard Round</option>
              <option value="airbrush">Airbrush</option>
              <option value="chalk">Flat Chalk</option>
              <option value="charcoal">Charcoal Grain</option>
              <option value="calligraphy">Calligraphy</option>
              <option value="splatter">Splatter</option>
              <option value="pixel">Pixel Art Pencil</option>
            </select>
          </div>

          {/* Size Slider */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Size:</span>
            <input
              id="brush-size-input"
              type="range"
              min="1"
              max="200"
              value={currentBrush.size}
              onChange={(e) => handleBrushChange({ size: Number(e.target.value) })}
              className="w-24 accent-[var(--theme-accent)] h-1.5 bg-[#1e1e1e] rounded cursor-pointer"
            >
            </input>
            <span className="w-8 text-right font-mono">{currentBrush.size}px</span>
          </div>

          {/* Hardness Slider */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Hardness:</span>
            <input
              id="brush-hardness-input"
              type="range"
              min="0"
              max="100"
              value={currentBrush.hardness}
              onChange={(e) => handleBrushChange({ hardness: Number(e.target.value) })}
              className="w-20 accent-[var(--theme-accent)] h-1.5 bg-[#1e1e1e] rounded cursor-pointer"
            />
            <span className="w-8 text-right font-mono">{currentBrush.hardness}%</span>
          </div>

          {/* Opacity Slider */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Opacity:</span>
            <input
              id="brush-opacity-input"
              type="range"
              min="1"
              max="100"
              value={currentBrush.opacity}
              onChange={(e) => handleBrushChange({ opacity: Number(e.target.value) })}
              className="w-20 accent-[var(--theme-accent)] h-1.5 bg-[#1e1e1e] rounded cursor-pointer"
            />
            <span className="w-8 text-right font-mono">{currentBrush.opacity}%</span>
          </div>

          {/* Flow Slider */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Flow:</span>
            <input
              id="brush-flow-input"
              type="range"
              min="1"
              max="100"
              value={currentBrush.flow}
              onChange={(e) => handleBrushChange({ flow: Number(e.target.value) })}
              className="w-20 accent-[var(--theme-accent)] h-1.5 bg-[#1e1e1e] rounded cursor-pointer"
            />
            <span className="w-8 text-right font-mono">{currentBrush.flow}%</span>
          </div>

          {/* Pressure & Jitter Dynamics */}
          <div className="h-4 w-px bg-[#3e3e42]" />

          {/* Pressure Simulation Toggle */}
          <button
            id="brush-pressure-toggle"
            type="button"
            onClick={() => handleBrushChange({ pressureSim: !currentBrush.pressureSim })}
            title={`Stylus Pressure & Velocity Dynamics: ${
              currentBrush.pressureSim ? 'ENABLED (Pressure simulation active)' : 'DISABLED'
            }`}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium transition-colors cursor-pointer ${
              currentBrush.pressureSim
                ? 'bg-[#007acc] text-white border-[#0098ff] shadow-sm'
                : 'bg-[#1e1e1e] text-gray-400 hover:text-white border-[#3e3e42] hover:bg-[#333333]'
            }`}
          >
            <PenTool size={11} className={currentBrush.pressureSim ? 'text-cyan-200' : 'text-gray-400'} />
            <span>Pressure</span>
          </button>

          {/* Size Jitter Slider */}
          <div
            className="flex items-center gap-1.5"
            title="Size Jitter: Randomly varies brush diameter along the stroke to simulate pressure-sensitive stroke variations"
          >
            <span className="text-gray-400">Size Jitter:</span>
            <input
              id="brush-size-jitter-input"
              type="range"
              min="0"
              max="100"
              value={currentBrush.sizeJitter ?? 0}
              onChange={(e) => handleBrushChange({ sizeJitter: Number(e.target.value) })}
              className="w-16 sm:w-20 accent-[var(--theme-accent)] h-1.5 bg-[#1e1e1e] rounded cursor-pointer"
            />
            <span className="w-8 text-right font-mono">{currentBrush.sizeJitter ?? 0}%</span>
          </div>

          {/* Opacity Jitter Slider */}
          <div
            className="flex items-center gap-1.5"
            title="Opacity Jitter: Dynamically varies stroke transparency along the path to simulate pen pressure ink flow"
          >
            <span className="text-gray-400">Opacity Jitter:</span>
            <input
              id="brush-opacity-jitter-input"
              type="range"
              min="0"
              max="100"
              value={currentBrush.opacityJitter ?? 0}
              onChange={(e) => handleBrushChange({ opacityJitter: Number(e.target.value) })}
              className="w-16 sm:w-20 accent-[var(--theme-accent)] h-1.5 bg-[#1e1e1e] rounded cursor-pointer"
            />
            <span className="w-8 text-right font-mono">{currentBrush.opacityJitter ?? 0}%</span>
          </div>

          {/* Dynamics Quick Preset Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Dynamics:</span>
            <select
              id="brush-dynamics-preset"
              value={
                (currentBrush.sizeJitter === 0 && currentBrush.opacityJitter === 0 && !currentBrush.pressureSim)
                  ? 'off'
                  : (currentBrush.sizeJitter === 0 && currentBrush.opacityJitter === 0 && currentBrush.pressureSim)
                  ? 'standard'
                  : (currentBrush.sizeJitter === 30 && currentBrush.opacityJitter === 20)
                  ? 'subtle'
                  : (currentBrush.sizeJitter === 55 && currentBrush.opacityJitter === 40)
                  ? 'pen'
                  : (currentBrush.sizeJitter === 80 && currentBrush.opacityJitter === 70)
                  ? 'textured'
                  : 'custom'
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'off') {
                  handleBrushChange({ sizeJitter: 0, opacityJitter: 0, pressureSim: false });
                } else if (val === 'standard') {
                  handleBrushChange({ sizeJitter: 0, opacityJitter: 0, pressureSim: true });
                } else if (val === 'subtle') {
                  handleBrushChange({ sizeJitter: 30, opacityJitter: 20, pressureSim: true });
                } else if (val === 'pen') {
                  handleBrushChange({ sizeJitter: 55, opacityJitter: 40, pressureSim: true });
                } else if (val === 'textured') {
                  handleBrushChange({ sizeJitter: 80, opacityJitter: 70, pressureSim: true });
                }
              }}
              className="bg-[#1e1e1e] border border-[#3e3e42] rounded px-1.5 py-0.5 text-xs text-white"
            >
              <option value="off">Off (0%)</option>
              <option value="standard">Natural Pressure</option>
              <option value="subtle">Subtle Jitter (30%/20%)</option>
              <option value="pen">Pressure Pen (55%/40%)</option>
              <option value="textured">Expressive Texture (80%/70%)</option>
              <option value="custom" disabled hidden>Custom</option>
            </select>
          </div>
        </div>
      )}

      {/* Marquee & Lasso Options */}
      {(activeTool === 'marquee-rect' ||
        activeTool === 'marquee-ellipse' ||
        activeTool === 'lasso-free' ||
        activeTool === 'lasso-poly') && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Feather:</span>
            <input
              id="marquee-feather-input"
              type="number"
              min="0"
              max="100"
              value={marqueeFeather}
              onChange={(e) => onChangeMarqueeFeather?.(Math.max(0, Number(e.target.value)))}
              className="w-14 bg-[#1e1e1e] border border-[#3e3e42] rounded px-1.5 py-0.5 text-center font-mono"
            />
            <span>px</span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded bg-[#1e1e1e] border-gray-600" />
            <span>Anti-alias</span>
          </label>
        </div>
      )}

      {/* Magic Wand & Paint Bucket Options */}
      {(activeTool === 'magic-wand' || activeTool === 'paint-bucket') && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" title="Tolerance: Permitted color distance (0 = exact match, 32 = standard, 100+ = broad tonal range)">
            <span className="text-gray-400">Tolerance:</span>
            <input
              id="magic-tol-input"
              type="number"
              min="0"
              max="255"
              value={options?.tolerance ?? magicTolerance}
              onChange={(e) => {
                const val = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                onChangeMagicTolerance?.(val);
                onOptionsChange?.({ tolerance: val });
              }}
              className="w-14 bg-[#1e1e1e] border border-[#3e3e42] rounded px-1.5 py-0.5 text-center font-mono text-xs"
            />
            <input
              type="range"
              min="0"
              max="150"
              value={options?.tolerance ?? magicTolerance}
              onChange={(e) => {
                const val = Number(e.target.value);
                onChangeMagicTolerance?.(val);
                onOptionsChange?.({ tolerance: val });
              }}
              className="w-20 accent-[var(--theme-accent)] h-1.5 bg-[#1e1e1e] rounded cursor-pointer"
            />
          </div>

          <label
            className="flex items-center gap-1.5 cursor-pointer text-xs select-none"
            title="Contiguous: When enabled, selects only adjacent/connected pixels. When disabled, selects all pixels of matching tone/chroma across the document."
          >
            <input
              type="checkbox"
              checked={options?.contiguous ?? true}
              onChange={(e) => onOptionsChange?.({ contiguous: e.target.checked })}
              className="rounded bg-[#1e1e1e] border-gray-600 accent-[var(--theme-accent)] cursor-pointer"
            />
            <span className={options?.contiguous ?? true ? 'text-white' : 'text-gray-400'}>Contiguous</span>
          </label>

          <label
            className="flex items-center gap-1.5 cursor-pointer text-xs select-none"
            title="Sample All Layers: When enabled, samples colors from the visible composite document. When disabled, samples only the active layer."
          >
            <input
              type="checkbox"
              checked={options?.sampleAllLayers ?? false}
              onChange={(e) => onOptionsChange?.({ sampleAllLayers: e.target.checked })}
              className="rounded bg-[#1e1e1e] border-gray-600 accent-[var(--theme-accent)] cursor-pointer"
            />
            <span className={options?.sampleAllLayers ? 'text-white' : 'text-gray-400'}>Sample All Layers</span>
          </label>
        </div>
      )}

      {/* Crop Tool Options */}
      {activeTool === 'crop' && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Aspect Ratio:</span>
            <select
              id="crop-ratio-select"
              value={cropRatio}
              onChange={(e) => onChangeCropRatio?.(e.target.value)}
              className="bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-0.5 text-xs text-white"
            >
              <option value="free">Freeform Unconstrained</option>
              <option value="1:1">1:1 Square (Instagram Post)</option>
              <option value="16:9">16:9 Widescreen (YouTube / HD)</option>
              <option value="9:16">9:16 Vertical (Story / Reel / Shorts)</option>
              <option value="4:3">4:3 Standard Photo</option>
              <option value="3:2">3:2 Classic 35mm</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="crop-apply-btn"
              onClick={onApplyCrop}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#007acc] hover:bg-[#0098ff] text-white font-medium shadow-sm transition-colors"
            >
              <Check size={13} />
              <span>Apply Crop</span>
            </button>
            <button
              id="crop-cancel-btn"
              onClick={onCancelCrop}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#333333] hover:bg-[#444444] text-gray-300 transition-colors"
            >
              <X size={13} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Gradient Tool Options */}
      {activeTool === 'gradient' && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Gradient:</span>
            <div
              className="w-24 h-5 rounded border border-[#444444] shadow-inner"
              style={{
                background: `linear-gradient(to right, ${fgColor}, ${bgColor})`,
              }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Type:</span>
            <select
              id="gradient-type-select"
              value={gradientType}
              onChange={(e) => onChangeGradientType?.(e.target.value as any)}
              className="bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-0.5 text-xs text-white"
            >
              <option value="linear">Linear Gradient</option>
              <option value="radial">Radial Gradient</option>
              <option value="reflected">Reflected Gradient</option>
              <option value="diamond">Diamond Gradient</option>
            </select>
          </div>
        </div>
      )}

      {/* Text Tool Options */}
      {activeTool === 'text' && (
        <div className="flex items-center gap-3">
          {/* Direct Text Content Input if a text layer is selected */}
          {activeLayer?.type === 'text' && (
            <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
              <span className="text-gray-400">Text:</span>
              <input
                id="text-content-input"
                type="text"
                value={activeLayer.text || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const dims = CanvasRenderer.measureText(
                    val || ' ',
                    activeLayer.fontSize || 36,
                    activeLayer.fontFamily || 'Inter, sans-serif',
                    activeLayer.fontWeight || '600',
                    activeLayer.fontStyle || 'normal',
                    activeLayer.lineHeight || 1.2
                  );
                  onUpdateLayer?.({
                    text: val,
                    width: dims.width,
                    height: dims.height,
                  });
                }}
                className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-0.5 text-xs text-white focus:border-cyan-500 outline-none"
                placeholder="Type layer text..."
              />
            </div>
          )}

          {/* Font Family */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Font:</span>
            <select
              id="text-font-select"
              value={activeLayer?.fontFamily || options?.fontFamily || 'Inter, sans-serif'}
              onChange={(e) => {
                const newFont = e.target.value;
                onOptionsChange?.({ fontFamily: newFont });
                if (activeLayer?.type === 'text') {
                  const dims = CanvasRenderer.measureText(
                    activeLayer.text || ' ',
                    activeLayer.fontSize || 36,
                    newFont,
                    activeLayer.fontWeight || '600',
                    activeLayer.fontStyle || 'normal',
                    activeLayer.lineHeight || 1.2
                  );
                  onUpdateLayer?.({ fontFamily: newFont, width: dims.width, height: dims.height });
                }
              }}
              className="bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-0.5 text-xs text-white w-32 truncate"
            >
              <option value="Inter, sans-serif">Inter</option>
              <option value="Montserrat, sans-serif">Montserrat</option>
              <option value="Oswald, sans-serif">Oswald</option>
              <option value="Playfair Display, serif">Playfair Display</option>
              <option value="Fira Code, monospace">Fira Code</option>
              <option value="Impact, sans-serif">Impact</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Courier New, monospace">Courier New</option>
              <option value="Times New Roman, serif">Times New Roman</option>
            </select>
          </div>

          {/* Font Size with quick preset dropdown & numeric input */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Size:</span>
            <input
              id="text-size-input"
              type="number"
              min="8"
              max="300"
              value={activeLayer?.fontSize || options?.fontSize || 36}
              onChange={(e) => {
                const newSize = Math.max(8, Number(e.target.value) || 12);
                onOptionsChange?.({ fontSize: newSize });
                if (activeLayer?.type === 'text') {
                  const dims = CanvasRenderer.measureText(
                    activeLayer.text || ' ',
                    newSize,
                    activeLayer.fontFamily || 'Inter, sans-serif',
                    activeLayer.fontWeight || '600',
                    activeLayer.fontStyle || 'normal',
                    activeLayer.lineHeight || 1.2
                  );
                  onUpdateLayer?.({ fontSize: newSize, width: dims.width, height: dims.height });
                }
              }}
              className="w-14 bg-[#1e1e1e] border border-[#3e3e42] rounded px-1.5 py-0.5 text-center font-mono text-xs"
            />
            <select
              value={activeLayer?.fontSize || options?.fontSize || 36}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onOptionsChange?.({ fontSize: newSize });
                if (activeLayer?.type === 'text') {
                  const dims = CanvasRenderer.measureText(
                    activeLayer.text || ' ',
                    newSize,
                    activeLayer.fontFamily || 'Inter, sans-serif',
                    activeLayer.fontWeight || '600',
                    activeLayer.fontStyle || 'normal',
                    activeLayer.lineHeight || 1.2
                  );
                  onUpdateLayer?.({ fontSize: newSize, width: dims.width, height: dims.height });
                }
              }}
              className="bg-[#1e1e1e] border border-[#3e3e42] rounded px-1 py-0.5 text-xs text-gray-300"
            >
              {[12, 14, 18, 24, 30, 36, 48, 60, 72, 96, 120].map((sz) => (
                <option key={sz} value={sz}>
                  {sz} pt
                </option>
              ))}
            </select>
          </div>

          {/* Style Toggles */}
          <div className="flex items-center gap-0.5 bg-[#1e1e1e] p-0.5 rounded border border-[#3e3e42]">
            <button
              id="text-bold-btn"
              onClick={() => {
                const newWeight = (activeLayer?.fontWeight === '700' || activeLayer?.fontWeight === 'bold') ? '400' : '700';
                if (activeLayer?.type === 'text') {
                  const dims = CanvasRenderer.measureText(
                    activeLayer.text || ' ',
                    activeLayer.fontSize || 36,
                    activeLayer.fontFamily || 'Inter, sans-serif',
                    newWeight,
                    activeLayer.fontStyle || 'normal',
                    activeLayer.lineHeight || 1.2
                  );
                  onUpdateLayer?.({ fontWeight: newWeight, width: dims.width, height: dims.height });
                }
              }}
              className={`p-1 rounded ${
                (activeLayer?.fontWeight === '700' || activeLayer?.fontWeight === 'bold')
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Bold"
            >
              <Bold size={13} />
            </button>
            <button
              id="text-italic-btn"
              onClick={() => {
                const newStyle = activeLayer?.fontStyle === 'italic' ? 'normal' : 'italic';
                if (activeLayer?.type === 'text') {
                  const dims = CanvasRenderer.measureText(
                    activeLayer.text || ' ',
                    activeLayer.fontSize || 36,
                    activeLayer.fontFamily || 'Inter, sans-serif',
                    activeLayer.fontWeight || '600',
                    newStyle,
                    activeLayer.lineHeight || 1.2
                  );
                  onUpdateLayer?.({ fontStyle: newStyle, width: dims.width, height: dims.height });
                }
              }}
              className={`p-1 rounded ${
                activeLayer?.fontStyle === 'italic' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Italic"
            >
              <Italic size={13} />
            </button>
          </div>

          {/* Text Align */}
          <div className="flex items-center gap-0.5 bg-[#1e1e1e] p-0.5 rounded border border-[#3e3e42]">
            <button
              id="text-align-left"
              onClick={() => {
                onOptionsChange?.({ textAlign: 'left' });
                if (activeLayer?.type === 'text') {
                  onUpdateLayer?.({ textAlign: 'left' });
                }
              }}
              className={`p-1 rounded ${
                (activeLayer?.textAlign || options?.textAlign || 'left') === 'left'
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Align Left"
            >
              <AlignLeft size={13} />
            </button>
            <button
              id="text-align-center"
              onClick={() => {
                onOptionsChange?.({ textAlign: 'center' });
                if (activeLayer?.type === 'text') {
                  onUpdateLayer?.({ textAlign: 'center' });
                }
              }}
              className={`p-1 rounded ${
                (activeLayer?.textAlign || options?.textAlign) === 'center'
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Align Center"
            >
              <AlignCenter size={13} />
            </button>
            <button
              id="text-align-right"
              onClick={() => {
                onOptionsChange?.({ textAlign: 'right' });
                if (activeLayer?.type === 'text') {
                  onUpdateLayer?.({ textAlign: 'right' });
                }
              }}
              className={`p-1 rounded ${
                (activeLayer?.textAlign || options?.textAlign) === 'right'
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Align Right"
            >
              <AlignRight size={13} />
            </button>
          </div>

          {/* Text Color */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Color:</span>
            <input
              id="text-color-input"
              type="color"
              value={activeLayer?.textColor || fgColor}
              onChange={(e) => {
                const col = e.target.value;
                if (activeLayer?.type === 'text') {
                  onUpdateLayer?.({ textColor: col });
                }
                onChangeFgColor?.(col);
              }}
              className="w-6 h-6 rounded border border-[#444444] cursor-pointer bg-transparent"
              title="Text Color"
            />
          </div>
        </div>
      )}

      {/* Shape Tool Options */}
      {(activeTool.startsWith('shape-')) && (
        <div className="flex items-center gap-3">
          {/* Fill Color */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Fill:</span>
            <input
              id="shape-fill-input"
              type="color"
              value={activeLayer?.fillColor || fgColor}
              onChange={(e) => {
                onUpdateLayer?.({ fillColor: e.target.value });
                onChangeFgColor?.(e.target.value);
              }}
              className="w-6 h-6 rounded border border-[#444444] cursor-pointer bg-transparent"
            />
          </div>

          {/* Stroke Color */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Stroke:</span>
            <input
              id="shape-stroke-input"
              type="color"
              value={activeLayer?.strokeColor || '#ffffff'}
              onChange={(e) => onUpdateLayer?.({ strokeColor: e.target.value })}
              className="w-6 h-6 rounded border border-[#444444] cursor-pointer bg-transparent"
            />
            <input
              id="shape-stroke-w-input"
              type="number"
              min="0"
              max="50"
              value={activeLayer?.strokeWidth || 0}
              onChange={(e) => onUpdateLayer?.({ strokeWidth: Number(e.target.value) })}
              className="w-12 bg-[#1e1e1e] border border-[#3e3e42] rounded px-1.5 py-0.5 text-center font-mono"
            />
            <span>px</span>
          </div>

          {/* Corner Radius for Rounded Rect */}
          {activeTool === 'shape-rounded' && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Radius:</span>
              <input
                id="shape-radius-input"
                type="number"
                min="0"
                max="100"
                value={activeLayer?.cornerRadius || 16}
                onChange={(e) => onUpdateLayer?.({ cornerRadius: Number(e.target.value) })}
                className="w-12 bg-[#1e1e1e] border border-[#3e3e42] rounded px-1.5 py-0.5 text-center font-mono"
              />
              <span>px</span>
            </div>
          )}
        </div>
      )}

      </div>

      {/* Right: Permanent Canvas & Viewport Studio Controls */}
      <div className="flex items-center gap-2 shrink-0 border-l border-[#3e3e42] pl-3">
        {/* Flip & Rotate Quick Buttons */}
        {onFlipCanvas && (
          <div className="flex items-center gap-0.5 bg-[#1e1e1e] p-0.5 rounded border border-[#3e3e42]">
            <button
              onClick={() => onFlipCanvas('h')}
              title="Flip Canvas Horizontal"
              className="p-1 hover:bg-[#333333] rounded text-gray-300 hover:text-white"
            >
              <FlipHorizontal size={13} />
            </button>
            <button
              onClick={() => onFlipCanvas('v')}
              title="Flip Canvas Vertical"
              className="p-1 hover:bg-[#333333] rounded text-gray-300 hover:text-white"
            >
              <FlipVertical size={13} />
            </button>
            {onRotateCanvas && (
              <button
                onClick={() => onRotateCanvas(90)}
                title="Rotate Canvas 90° CW"
                className="p-1 hover:bg-[#333333] rounded text-gray-300 hover:text-white"
              >
                <RotateCw size={13} />
              </button>
            )}
          </div>
        )}

        {/* Canvas Background Quick Switcher */}
        {onChangeCanvasBg && (
          <div className="flex items-center gap-0.5 bg-[#1e1e1e] p-0.5 rounded border border-[#3e3e42]" title="Canvas Background Mode">
            <button
              onClick={() => onChangeCanvasBg('white')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                canvasBg === 'white' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              White
            </button>
            <button
              onClick={() => onChangeCanvasBg('black')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                canvasBg === 'black' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => onChangeCanvasBg('transparent')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                canvasBg === 'transparent' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Grid
            </button>
          </div>
        )}

        {/* Zoom & Fit Screen Quick Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSetZoom?.(Math.min(5, zoomLevel * 1.25))}
            title="Zoom In (Ctrl +)"
            className="p-1 hover:bg-[#333333] rounded text-gray-300 hover:text-white bg-[#1e1e1e] border border-[#3e3e42]"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={() => onSetZoom?.(Math.max(0.1, zoomLevel / 1.25))}
            title="Zoom Out (Ctrl -)"
            className="p-1 hover:bg-[#333333] rounded text-gray-300 hover:text-white bg-[#1e1e1e] border border-[#3e3e42]"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={onFitScreen}
            title="Fit Canvas to Screen (Ctrl 0)"
            className="flex items-center gap-1 px-1.5 py-0.5 bg-[#1e1e1e] hover:bg-[#333333] rounded border border-[#3e3e42] text-[11px]"
          >
            <Maximize2 size={12} />
            <span className="hidden sm:inline">Fit</span>
          </button>
          <span className="font-mono text-cyan-400 font-semibold text-[11px] w-9 text-right">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
