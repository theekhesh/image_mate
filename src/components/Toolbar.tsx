/**
 * Photoshop Web Studio - Left Tool Strip (Photoshop Palette)
 */

import React, { useState } from 'react';
import {
  Move,
  Square,
  Circle,
  Lasso,
  Wand2,
  Crop,
  Pipette,
  Brush,
  Pencil,
  Eraser,
  Stamp,
  Sparkles,
  PaintBucket,
  Blend,
  Droplets,
  SunMedium,
  PenTool,
  Type,
  Shapes,
  Star,
  Minus,
  ArrowRight,
  Hand,
  ZoomIn,
  ArrowLeftRight,
  RefreshCw,
  LucideIcon,
} from 'lucide-react';
import { ToolType } from '../types/photoshop';

interface ToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  fgColor: string;
  bgColor: string;
  onChangeFgColor: (color: string) => void;
  onChangeBgColor: (color: string) => void;
  onSwapColors: () => void;
  onResetColors: () => void;
}

interface ToolGroup {
  id: string;
  primary: ToolType;
  label: string;
  icon: LucideIcon;
  shortcut: string;
  subTools?: { type: ToolType; label: string; icon: LucideIcon; shortcut?: string }[];
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  fgColor,
  bgColor,
  onChangeFgColor,
  onChangeBgColor,
  onSwapColors,
  onResetColors,
}) => {
  const [openFlyout, setOpenFlyout] = useState<string | null>(null);
  const [colorPickerTarget, setColorPickerTarget] = useState<'fg' | 'bg' | null>(null);

  const toolGroups: ToolGroup[] = [
    { id: 'move', primary: 'move', label: 'Move Tool', icon: Move, shortcut: 'V' },
    {
      id: 'marquee',
      primary: 'marquee-rect',
      label: 'Marquee Tool',
      icon: Square,
      shortcut: 'M',
      subTools: [
        { type: 'marquee-rect', label: 'Rectangular Marquee', icon: Square, shortcut: 'M' },
        { type: 'marquee-ellipse', label: 'Elliptical Marquee', icon: Circle, shortcut: 'M' },
      ],
    },
    {
      id: 'lasso',
      primary: 'lasso-free',
      label: 'Lasso Tool',
      icon: Lasso,
      shortcut: 'L',
      subTools: [
        { type: 'lasso-free', label: 'Freehand Lasso', icon: Lasso, shortcut: 'L' },
        { type: 'lasso-poly', label: 'Polygonal Lasso', icon: Lasso, shortcut: 'L' },
      ],
    },
    { id: 'wand', primary: 'magic-wand', label: 'Magic Wand Tool', icon: Wand2, shortcut: 'W' },
    { id: 'crop', primary: 'crop', label: 'Crop Tool', icon: Crop, shortcut: 'C' },
    { id: 'eyedropper', primary: 'eyedropper', label: 'Eyedropper Tool', icon: Pipette, shortcut: 'I' },
    {
      id: 'brush',
      primary: 'brush',
      label: 'Brush Tool',
      icon: Brush,
      shortcut: 'B',
      subTools: [
        { type: 'brush', label: 'Brush Tool', icon: Brush, shortcut: 'B' },
        { type: 'pencil', label: 'Pencil Tool', icon: Pencil, shortcut: 'B' },
      ],
    },
    { id: 'stamp', primary: 'clone-stamp', label: 'Clone Stamp Tool', icon: Stamp, shortcut: 'S' },
    { id: 'healing', primary: 'spot-healing', label: 'Spot Healing Brush', icon: Sparkles, shortcut: 'J' },
    { id: 'eraser', primary: 'eraser', label: 'Eraser Tool', icon: Eraser, shortcut: 'E' },
    {
      id: 'gradient',
      primary: 'gradient',
      label: 'Gradient Tool',
      icon: Blend,
      shortcut: 'G',
      subTools: [
        { type: 'gradient', label: 'Gradient Tool', icon: Blend, shortcut: 'G' },
        { type: 'paint-bucket', label: 'Paint Bucket Tool', icon: PaintBucket, shortcut: 'G' },
      ],
    },
    {
      id: 'blur',
      primary: 'blur',
      label: 'Blur / Sharpen Tool',
      icon: Droplets,
      shortcut: 'R',
      subTools: [
        { type: 'blur', label: 'Blur Tool', icon: Droplets },
        { type: 'sharpen', label: 'Sharpen Tool', icon: Droplets },
        { type: 'smudge', label: 'Smudge Tool', icon: Droplets },
      ],
    },
    {
      id: 'dodge',
      primary: 'dodge',
      label: 'Dodge / Burn Tool',
      icon: SunMedium,
      shortcut: 'O',
      subTools: [
        { type: 'dodge', label: 'Dodge Tool (Lighten)', icon: SunMedium },
        { type: 'burn', label: 'Burn Tool (Darken)', icon: SunMedium },
        { type: 'sponge', label: 'Sponge Tool (Saturate)', icon: SunMedium },
      ],
    },
    { id: 'pen', primary: 'pen', label: 'Pen & Vector Path', icon: PenTool, shortcut: 'P' },
    { id: 'text', primary: 'text', label: 'Horizontal Type Tool', icon: Type, shortcut: 'T' },
    {
      id: 'shapes',
      primary: 'shape-rect',
      label: 'Shape Tools',
      icon: Shapes,
      shortcut: 'U',
      subTools: [
        { type: 'shape-rect', label: 'Rectangle Tool', icon: Square },
        { type: 'shape-rounded', label: 'Rounded Rectangle Tool', icon: Square },
        { type: 'shape-ellipse', label: 'Ellipse Tool', icon: Circle },
        { type: 'shape-star', label: 'Star Tool', icon: Star },
        { type: 'shape-line', label: 'Line Tool', icon: Minus },
        { type: 'shape-arrow', label: 'Arrow Tool', icon: ArrowRight },
      ],
    },
    { id: 'hand', primary: 'hand', label: 'Hand Tool (Pan)', icon: Hand, shortcut: 'H' },
    { id: 'zoom', primary: 'zoom', label: 'Zoom Tool', icon: ZoomIn, shortcut: 'Z' },
  ];

  return (
    <div className="w-12 bg-[#202020] border-r border-[#2d2d2d] flex flex-col items-center py-2 select-none z-30 justify-between">
      {/* Tool Icons List */}
      <div className="flex flex-col items-center gap-1 w-full px-1">
        {toolGroups.map((group) => {
          const isGroupActive =
            activeTool === group.primary ||
            (group.subTools && group.subTools.some((st) => st.type === activeTool));

          const activeSub = group.subTools?.find((st) => st.type === activeTool);
          const DisplayIcon = activeSub ? activeSub.icon : group.icon;

          return (
            <div key={group.id} className="relative group w-full flex justify-center">
              <button
                id={`tool-btn-${group.id}`}
                onClick={() => {
                  onSelectTool(group.primary);
                  setOpenFlyout(null);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (group.subTools) {
                    setOpenFlyout(openFlyout === group.id ? null : group.id);
                  }
                }}
                title={`${group.label} (${group.shortcut})`}
                className={`w-9 h-8 rounded flex items-center justify-center relative transition-all ${
                  isGroupActive
                    ? 'bg-[#007acc] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-[#2d2d2d]'
                }`}
              >
                <DisplayIcon size={17} strokeWidth={1.75} />
                {/* Tiny corner triangle indicator if tool has sub-tools */}
                {group.subTools && (
                  <span className="absolute bottom-0.5 right-0.5 w-0 h-0 border-b-4 border-r-4 border-b-transparent border-r-gray-400" />
                )}
              </button>

              {/* Sub-tools Flyout Menu (on right click or toggle) */}
              {openFlyout === group.id && group.subTools && (
                <div className="absolute left-full ml-1 top-0 bg-[#252526] border border-[#3e3e42] rounded-md shadow-2xl py-1 z-50 w-44">
                  {group.subTools.map((st) => (
                    <button
                      key={st.type}
                      onClick={() => {
                        onSelectTool(st.type);
                        setOpenFlyout(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs hover:bg-[#007acc] hover:text-white ${
                        activeTool === st.type ? 'bg-[#007acc] text-white font-medium' : 'text-gray-300'
                      }`}
                    >
                      <st.icon size={14} />
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Foreground / Background Color Selector */}
      <div className="flex flex-col items-center gap-1.5 mt-4 pt-2 border-t border-[#333333] w-full px-2">
        {/* Reset & Swap Mini Controls */}
        <div className="flex items-center justify-between w-8 px-0.5 text-gray-500">
          <button
            id="reset-colors-btn"
            onClick={onResetColors}
            title="Default Foreground/Background Colors (D)"
            className="hover:text-white transition-colors"
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-black border border-gray-400" />
              <div className="w-2 h-2 bg-white border border-gray-400 -ml-1 -mt-1" />
            </div>
          </button>
          <button
            id="swap-colors-btn"
            onClick={onSwapColors}
            title="Switch Foreground and Background Colors (X)"
            className="hover:text-white transition-colors"
          >
            <ArrowLeftRight size={10} />
          </button>
        </div>

        {/* Color Chips */}
        <div className="relative w-8 h-8">
          {/* Background Color Chip */}
          <div
            onClick={() => setColorPickerTarget(colorPickerTarget === 'bg' ? null : 'bg')}
            title={`Background Color: ${bgColor}`}
            className="absolute bottom-0 right-0 w-5 h-5 rounded border border-gray-500 shadow cursor-pointer"
            style={{ backgroundColor: bgColor }}
          />

          {/* Foreground Color Chip */}
          <div
            onClick={() => setColorPickerTarget(colorPickerTarget === 'fg' ? null : 'fg')}
            title={`Foreground Color: ${fgColor}`}
            className="absolute top-0 left-0 w-5 h-5 rounded border border-white shadow-md z-10 cursor-pointer"
            style={{ backgroundColor: fgColor }}
          />
        </div>

        {/* Color Picker Popover */}
        {colorPickerTarget && (
          <div className="absolute left-14 bottom-4 bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl p-3 z-50 w-52 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs text-gray-300 font-semibold border-b border-[#3e3e42] pb-1">
              <span>{colorPickerTarget === 'fg' ? 'Foreground Color' : 'Background Color'}</span>
              <button
                onClick={() => setColorPickerTarget(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <input
              type="color"
              value={colorPickerTarget === 'fg' ? fgColor : bgColor}
              onChange={(e) => {
                if (colorPickerTarget === 'fg') onChangeFgColor(e.target.value);
                else onChangeBgColor(e.target.value);
              }}
              className="w-full h-20 rounded border border-[#444444] cursor-pointer bg-transparent"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">HEX:</span>
              <input
                type="text"
                value={colorPickerTarget === 'fg' ? fgColor : bgColor}
                onChange={(e) => {
                  if (colorPickerTarget === 'fg') onChangeFgColor(e.target.value);
                  else onChangeBgColor(e.target.value);
                }}
                className="w-full bg-[#181818] border border-[#3e3e42] rounded px-2 py-1 text-xs text-white font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
