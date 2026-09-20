/**
 * Photoshop Web Studio - Color & Swatches Panel
 */

import React, { useState } from 'react';
import { Pipette } from 'lucide-react';

interface ColorPanelProps {
  fgColor: string;
  bgColor: string;
  onChangeFgColor: (color: string) => void;
  onChangeBgColor: (color: string) => void;
}

const PRESET_SWATCHES = [
  '#000000', '#ffffff', '#ff0055', '#ff5500', '#ffaa00', '#ffee00',
  '#55ff00', '#00ffaa', '#00e5ff', '#007acc', '#7700ff', '#ff00bb',
  '#1e1e1e', '#3c3c3c', '#5a5a5a', '#787878', '#969696', '#d4d4d4',
  '#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#3742fa', '#70a1ff',
  '#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#f8fafc',
];

export const ColorPanel: React.FC<ColorPanelProps> = ({
  fgColor,
  bgColor,
  onChangeFgColor,
  onChangeBgColor,
}) => {
  const [activeChip, setActiveChip] = useState<'fg' | 'bg'>('fg');
  const currentColor = activeChip === 'fg' ? fgColor : bgColor;

  const handleColorChange = (hex: string) => {
    if (activeChip === 'fg') onChangeFgColor(hex);
    else onChangeBgColor(hex);
  };

  return (
    <div className="p-3 bg-[#202020] text-xs text-[#cccccc] flex flex-col gap-3 select-none">
      {/* Target Selector: Foreground vs Background */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveChip('fg')}
            className={`px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1.5 ${
              activeChip === 'fg'
                ? 'bg-[#007acc] text-white font-medium'
                : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
            }`}
          >
            <div className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: fgColor }} />
            <span>Foreground</span>
          </button>
          <button
            onClick={() => setActiveChip('bg')}
            className={`px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1.5 ${
              activeChip === 'bg'
                ? 'bg-[#007acc] text-white font-medium'
                : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
            }`}
          >
            <div className="w-3 h-3 rounded-full border border-gray-400" style={{ backgroundColor: bgColor }} />
            <span>Background</span>
          </button>
        </div>
      </div>

      {/* Main HTML5 Native Color Picker Canvas */}
      <div className="flex flex-col gap-2">
        <input
          type="color"
          value={currentColor}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-full h-24 rounded border border-[#3e3e42] cursor-pointer bg-transparent shadow-inner"
        />

        <div className="flex items-center gap-2 bg-[#181818] p-1.5 rounded border border-[#3e3e42]">
          <span className="font-mono text-gray-400 text-[11px]">HEX:</span>
          <input
            type="text"
            value={currentColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full bg-transparent text-white font-mono text-xs outline-none"
          />
        </div>
      </div>

      {/* Swatches Grid */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Color Swatches
        </div>
        <div className="grid grid-cols-6 gap-1 bg-[#181818] p-2 rounded border border-[#2d2d2d]">
          {PRESET_SWATCHES.map((color, idx) => (
            <div
              key={idx}
              onClick={() => handleColorChange(color)}
              title={color}
              className="w-full h-5 rounded cursor-pointer border border-black/30 hover:scale-110 hover:border-white transition-transform"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
