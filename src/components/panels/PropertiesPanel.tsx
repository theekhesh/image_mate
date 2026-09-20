/**
 * Photoshop Web Studio - Properties Inspector Panel
 */

import React from 'react';
import { Layer } from '../../types/photoshop';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Type,
  Square,
  Sparkles,
} from 'lucide-react';

interface PropertiesPanelProps {
  activeLayer: Layer | null;
  onUpdateLayer: (updates: Partial<Layer>) => void;
  onOpenLayerStyles: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  activeLayer,
  onUpdateLayer,
  onOpenLayerStyles,
}) => {
  if (!activeLayer) {
    return (
      <div className="p-4 text-center text-gray-500 text-xs select-none">
        No layer selected. Click on a layer to inspect properties.
      </div>
    );
  }

  return (
    <div className="p-3 bg-[#202020] text-xs text-[#cccccc] flex flex-col gap-3 select-none overflow-y-auto">
      {/* Transform Geometry (X, Y, W, H, Rotation) */}
      <div className="flex flex-col gap-1.5 pb-3 border-b border-[#2d2d2d]">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Transform & Position
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 bg-[#181818] px-2 py-1 rounded border border-[#3e3e42]">
            <span className="text-gray-400 font-mono">X:</span>
            <input
              type="number"
              value={Math.round(activeLayer.x)}
              onChange={(e) => onUpdateLayer({ x: Number(e.target.value) })}
              className="w-full bg-transparent text-white font-mono text-xs outline-none"
            />
            <span className="text-[10px] text-gray-500">px</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#181818] px-2 py-1 rounded border border-[#3e3e42]">
            <span className="text-gray-400 font-mono">Y:</span>
            <input
              type="number"
              value={Math.round(activeLayer.y)}
              onChange={(e) => onUpdateLayer({ y: Number(e.target.value) })}
              className="w-full bg-transparent text-white font-mono text-xs outline-none"
            />
            <span className="text-[10px] text-gray-500">px</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#181818] px-2 py-1 rounded border border-[#3e3e42]">
            <span className="text-gray-400 font-mono">W:</span>
            <input
              type="number"
              min="1"
              value={Math.round(activeLayer.width)}
              onChange={(e) => onUpdateLayer({ width: Math.max(1, Number(e.target.value)) })}
              className="w-full bg-transparent text-white font-mono text-xs outline-none"
            />
            <span className="text-[10px] text-gray-500">px</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#181818] px-2 py-1 rounded border border-[#3e3e42]">
            <span className="text-gray-400 font-mono">H:</span>
            <input
              type="number"
              min="1"
              value={Math.round(activeLayer.height)}
              onChange={(e) => onUpdateLayer({ height: Math.max(1, Number(e.target.value)) })}
              className="w-full bg-transparent text-white font-mono text-xs outline-none"
            />
            <span className="text-[10px] text-gray-500">px</span>
          </div>
        </div>

        {/* Rotation slider */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-gray-400">Angle:</span>
          <input
            type="range"
            min="-180"
            max="180"
            value={activeLayer.rotation || 0}
            onChange={(e) => onUpdateLayer({ rotation: Number(e.target.value) })}
            className="flex-1 accent-[#007acc] h-1.5 bg-[#181818] rounded"
          />
          <span className="w-9 text-right font-mono">{activeLayer.rotation || 0}°</span>
        </div>
      </div>

      {/* Text Layer Specific Properties */}
      {activeLayer.type === 'text' && (
        <div className="flex flex-col gap-2 pb-3 border-b border-[#2d2d2d]">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Type size={12} />
            <span>Typography</span>
          </div>

          <textarea
            value={activeLayer.text || ''}
            onChange={(e) => onUpdateLayer({ text: e.target.value })}
            placeholder="Type your text..."
            rows={3}
            className="w-full bg-[#181818] border border-[#3e3e42] rounded p-2 text-xs text-white resize-none outline-none focus:border-[#007acc]"
          />

          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-400">Font:</span>
            <select
              value={activeLayer.fontFamily || 'Inter, sans-serif'}
              onChange={(e) => onUpdateLayer({ fontFamily: e.target.value })}
              className="bg-[#181818] border border-[#3e3e42] rounded px-2 py-1 text-xs text-white flex-1"
            >
              <option value="Inter, sans-serif">Inter</option>
              <option value="Montserrat, sans-serif">Montserrat</option>
              <option value="Oswald, sans-serif">Oswald</option>
              <option value="Playfair Display, serif">Playfair Display</option>
              <option value="Fira Code, monospace">Fira Code</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-400">Color:</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activeLayer.textColor || '#ffffff'}
                onChange={(e) => onUpdateLayer({ textColor: e.target.value })}
                className="w-6 h-6 rounded border border-[#3e3e42] cursor-pointer bg-transparent"
              />
              <span className="font-mono text-gray-300">{activeLayer.textColor || '#ffffff'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Shape Layer Specific Properties */}
      {activeLayer.type === 'shape' && (
        <div className="flex flex-col gap-2 pb-3 border-b border-[#2d2d2d]">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Square size={12} />
            <span>Shape Vector</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Fill Color:</span>
            <input
              type="color"
              value={activeLayer.fillColor || '#3b82f6'}
              onChange={(e) => onUpdateLayer({ fillColor: e.target.value })}
              className="w-6 h-6 rounded border border-[#3e3e42] cursor-pointer bg-transparent"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Stroke Color:</span>
            <input
              type="color"
              value={activeLayer.strokeColor || '#ffffff'}
              onChange={(e) => onUpdateLayer({ strokeColor: e.target.value })}
              className="w-6 h-6 rounded border border-[#3e3e42] cursor-pointer bg-transparent"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-400">Stroke Width:</span>
            <input
              type="number"
              min="0"
              max="50"
              value={activeLayer.strokeWidth || 0}
              onChange={(e) => onUpdateLayer({ strokeWidth: Number(e.target.value) })}
              className="w-16 bg-[#181818] border border-[#3e3e42] rounded px-1.5 py-0.5 text-center font-mono"
            />
          </div>
        </div>
      )}

      {/* Quick Action Button for Layer Styles */}
      <button
        onClick={onOpenLayerStyles}
        className="w-full py-1.5 px-3 rounded bg-[#2a2a2a] hover:bg-[#007acc] text-gray-200 hover:text-white font-medium border border-[#3e3e42] transition-colors flex items-center justify-center gap-1.5"
      >
        <span className="font-bold">fx</span>
        <span>Layer Styles & Effects...</span>
      </button>
    </div>
  );
};
