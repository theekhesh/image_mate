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
}) => {
  const currentBrush: BrushSettings = brushSettings || {
    size: options?.brushSize ?? 24,
    hardness: options?.brushHardness ?? 80,
    opacity: options?.brushOpacity ?? 100,
    flow: options?.brushFlow ?? 100,
    spacing: 15,
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
      });
    }
  };
  return (
    <div className="bg-[#282828] border-b border-[#383838] px-3 h-9 flex items-center gap-4 text-xs text-[#d4d4d4] overflow-x-auto select-none">
      {/* Tool Icon / Name Label */}
      <div className="flex items-center gap-1.5 font-medium text-gray-300 pr-3 border-r border-[#3e3e42]">
        <span className="capitalize">{activeTool.replace('-', ' ')}</span>
      </div>

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
              onClick={() => onAlignLayers('left')}
              title="Align Left Edges"
              className="p-1 hover:bg-[#333333] rounded text-gray-300 hover:text-white"
            >
              <AlignLeft size={13} />
            </button>
            <button
              id="align-center-btn"
              onClick={() => onAlignLayers('center')}
              title="Align Horizontal Centers"
              className="p-1 hover:bg-[#333333] rounded text-gray-300 hover:text-white"
            >
              <AlignCenter size={13} />
            </button>
            <button
              id="align-right-btn"
              onClick={() => onAlignLayers('right')}
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
              className="w-24 accent-[#007acc] h-1.5 bg-[#1e1e1e] rounded"
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
              className="w-20 accent-[#007acc] h-1.5 bg-[#1e1e1e] rounded"
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
              className="w-20 accent-[#007acc] h-1.5 bg-[#1e1e1e] rounded"
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
              className="w-20 accent-[#007acc] h-1.5 bg-[#1e1e1e] rounded"
            />
            <span className="w-8 text-right font-mono">{currentBrush.flow}%</span>
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
              onChange={(e) => onChangeMarqueeFeather(Math.max(0, Number(e.target.value)))}
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
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Tolerance:</span>
            <input
              id="magic-tol-input"
              type="number"
              min="0"
              max="255"
              value={magicTolerance}
              onChange={(e) => onChangeMagicTolerance(Number(e.target.value))}
              className="w-14 bg-[#1e1e1e] border border-[#3e3e42] rounded px-1.5 py-0.5 text-center font-mono"
            />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded bg-[#1e1e1e] border-gray-600" />
            <span>Contiguous</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded bg-[#1e1e1e] border-gray-600" />
            <span>Anti-alias</span>
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
              onChange={(e) => onChangeCropRatio(e.target.value)}
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
              onChange={(e) => onChangeGradientType(e.target.value as any)}
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
          {/* Font Family */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Font:</span>
            <select
              id="text-font-select"
              value={activeLayer?.fontFamily || 'Inter, sans-serif'}
              onChange={(e) => onUpdateLayer({ fontFamily: e.target.value })}
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
            </select>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Size:</span>
            <input
              id="text-size-input"
              type="number"
              min="8"
              max="300"
              value={activeLayer?.fontSize || 48}
              onChange={(e) => onUpdateLayer({ fontSize: Number(e.target.value) })}
              className="w-14 bg-[#1e1e1e] border border-[#3e3e42] rounded px-1.5 py-0.5 text-center font-mono"
            />
            <span>pt</span>
          </div>

          {/* Style Toggles */}
          <div className="flex items-center gap-0.5 bg-[#1e1e1e] p-0.5 rounded border border-[#3e3e42]">
            <button
              id="text-bold-btn"
              onClick={() =>
                onUpdateLayer({
                  fontWeight: activeLayer?.fontWeight === '700' ? '400' : '700',
                })
              }
              className={`p-1 rounded ${
                activeLayer?.fontWeight === '700' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Bold size={13} />
            </button>
            <button
              id="text-italic-btn"
              onClick={() =>
                onUpdateLayer({
                  fontStyle: activeLayer?.fontStyle === 'italic' ? 'normal' : 'italic',
                })
              }
              className={`p-1 rounded ${
                activeLayer?.fontStyle === 'italic' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Italic size={13} />
            </button>
          </div>

          {/* Text Align */}
          <div className="flex items-center gap-0.5 bg-[#1e1e1e] p-0.5 rounded border border-[#3e3e42]">
            <button
              id="text-align-left"
              onClick={() => onUpdateLayer({ textAlign: 'left' })}
              className={`p-1 rounded ${
                (activeLayer?.textAlign || 'left') === 'left' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <AlignLeft size={13} />
            </button>
            <button
              id="text-align-center"
              onClick={() => onUpdateLayer({ textAlign: 'center' })}
              className={`p-1 rounded ${
                activeLayer?.textAlign === 'center' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <AlignCenter size={13} />
            </button>
            <button
              id="text-align-right"
              onClick={() => onUpdateLayer({ textAlign: 'right' })}
              className={`p-1 rounded ${
                activeLayer?.textAlign === 'right' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'
              }`}
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
                onUpdateLayer({ textColor: e.target.value });
                onChangeFgColor(e.target.value);
              }}
              className="w-6 h-6 rounded border border-[#444444] cursor-pointer bg-transparent"
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
                onUpdateLayer({ fillColor: e.target.value });
                onChangeFgColor(e.target.value);
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
              onChange={(e) => onUpdateLayer({ strokeColor: e.target.value })}
              className="w-6 h-6 rounded border border-[#444444] cursor-pointer bg-transparent"
            />
            <input
              id="shape-stroke-w-input"
              type="number"
              min="0"
              max="50"
              value={activeLayer?.strokeWidth || 0}
              onChange={(e) => onUpdateLayer({ strokeWidth: Number(e.target.value) })}
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
                onChange={(e) => onUpdateLayer({ cornerRadius: Number(e.target.value) })}
                className="w-12 bg-[#1e1e1e] border border-[#3e3e42] rounded px-1.5 py-0.5 text-center font-mono"
              />
              <span>px</span>
            </div>
          )}
        </div>
      )}

      {/* Zoom Tool Options */}
      {activeTool === 'zoom' && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSetZoom(zoomLevel * 1.25)}
              className="flex items-center gap-1 px-2 py-1 bg-[#1e1e1e] hover:bg-[#333333] rounded border border-[#3e3e42]"
            >
              <ZoomIn size={13} />
              <span>Zoom In</span>
            </button>
            <button
              onClick={() => onSetZoom(zoomLevel / 1.25)}
              className="flex items-center gap-1 px-2 py-1 bg-[#1e1e1e] hover:bg-[#333333] rounded border border-[#3e3e42]"
            >
              <ZoomOut size={13} />
              <span>Zoom Out</span>
            </button>
            <button
              onClick={() => onSetZoom(1)}
              className="px-2 py-1 bg-[#1e1e1e] hover:bg-[#333333] rounded border border-[#3e3e42]"
            >
              100%
            </button>
            <button
              onClick={onFitScreen}
              className="flex items-center gap-1 px-2 py-1 bg-[#1e1e1e] hover:bg-[#333333] rounded border border-[#3e3e42]"
            >
              <Maximize2 size={13} />
              <span>Fit Screen</span>
            </button>
          </div>
          <span className="font-mono text-gray-400">{Math.round(zoomLevel * 100)}%</span>
        </div>
      )}
    </div>
  );
};
