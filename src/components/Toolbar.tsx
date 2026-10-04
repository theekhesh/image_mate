/**
 * ImageMate Studio - Left Tool Strip (ImageMate Palette)
 * Supports single & double column layouts, unclipped flyout sub-tool menus,
 * long-press / right-click / corner-arrow triggers, and an All-Tools overview.
 * Uses distinctive non-Photoshop icons and descriptive tool names.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Pointer,
  BoxSelect,
  CircleDashed,
  Spline,
  Orbit,
  Target,
  Frame,
  FlaskConical,
  Paintbrush,
  PenLine,
  CopyPlus,
  Bandage,
  SquareMinus,
  Layers,
  Droplet,
  Wind,
  Flame,
  Waves,
  SunMedium,
  SunDim,
  Contrast,
  Feather,
  CaseSensitive,
  Boxes,
  Square,
  Circle,
  Hexagon,
  Star,
  Minus,
  ArrowRight,
  Grab,
  Search,
  ArrowLeftRight,
  ChevronsRight,
  ChevronsLeft,
  MoreHorizontal,
  LucideIcon,
} from 'lucide-react';
import { ToolType } from '../types/imagemate';

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
  category: 'Select' | 'Paint' | 'Retouch' | 'Vector' | 'Navigate';
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
  const [isDoubleColumn, setIsDoubleColumn] = useState<boolean>(false);
  const [openFlyout, setOpenFlyout] = useState<string | null>(null);
  const [flyoutTop, setFlyoutTop] = useState<number>(0);
  const [colorPickerTarget, setColorPickerTarget] = useState<'fg' | 'bg' | null>(null);
  const [showAllToolsModal, setShowAllToolsModal] = useState<boolean>(false);

  // Active sub-tool memory per group
  const [selectedSubTools, setSelectedSubTools] = useState<Record<string, ToolType>>({});

  const toolbarRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const allToolsRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const toolGroups: ToolGroup[] = [
    {
      id: 'move',
      primary: 'move',
      label: 'Pointer & Transform',
      icon: Pointer,
      shortcut: 'V',
      category: 'Select',
    },
    {
      id: 'marquee',
      primary: 'marquee-rect',
      label: 'Frame Selector',
      icon: BoxSelect,
      shortcut: 'M',
      category: 'Select',
      subTools: [
        { type: 'marquee-rect', label: 'Box Frame Select', icon: BoxSelect, shortcut: 'M' },
        { type: 'marquee-ellipse', label: 'Oval Frame Select', icon: CircleDashed, shortcut: 'M' },
      ],
    },
    {
      id: 'lasso',
      primary: 'lasso-free',
      label: 'Contour Selector',
      icon: Spline,
      shortcut: 'L',
      category: 'Select',
      subTools: [
        { type: 'lasso-free', label: 'Freehand Contour', icon: Spline, shortcut: 'L' },
        { type: 'lasso-poly', label: 'Polygon Segment Contour', icon: Orbit, shortcut: 'L' },
      ],
    },
    {
      id: 'wand',
      primary: 'magic-wand',
      label: 'Chroma & Tone Wand',
      icon: Target,
      shortcut: 'W',
      category: 'Select',
    },
    {
      id: 'crop',
      primary: 'crop',
      label: 'Canvas Trimmer',
      icon: Frame,
      shortcut: 'C',
      category: 'Select',
    },
    {
      id: 'eyedropper',
      primary: 'eyedropper',
      label: 'Color Probe',
      icon: FlaskConical,
      shortcut: 'I',
      category: 'Navigate',
    },
    {
      id: 'brush',
      primary: 'brush',
      label: 'Paint Stylus',
      icon: Paintbrush,
      shortcut: 'B',
      category: 'Paint',
      subTools: [
        { type: 'brush', label: 'Paint Stylus', icon: Paintbrush, shortcut: 'B' },
        { type: 'pencil', label: 'Precision Scribe', icon: PenLine, shortcut: 'B' },
      ],
    },
    {
      id: 'stamp',
      primary: 'clone-stamp',
      label: 'Texture Replicator',
      icon: CopyPlus,
      shortcut: 'S',
      category: 'Retouch',
    },
    {
      id: 'healing',
      primary: 'spot-healing',
      label: 'Surface Healer',
      icon: Bandage,
      shortcut: 'J',
      category: 'Retouch',
    },
    {
      id: 'eraser',
      primary: 'eraser',
      label: 'Pigment Clearer',
      icon: SquareMinus,
      shortcut: 'E',
      category: 'Paint',
    },
    {
      id: 'gradient',
      primary: 'gradient',
      label: 'Color Flow & Fill',
      icon: Layers,
      shortcut: 'G',
      category: 'Paint',
      subTools: [
        { type: 'gradient', label: 'Gradient Flow', icon: Layers, shortcut: 'G' },
        { type: 'paint-bucket', label: 'Flood Fill Bucket', icon: Droplet, shortcut: 'G' },
      ],
    },
    {
      id: 'blur',
      primary: 'blur',
      label: 'Focus & Diffusion',
      icon: Wind,
      shortcut: 'R',
      category: 'Retouch',
      subTools: [
        { type: 'blur', label: 'Soft Focus', icon: Wind, shortcut: 'R' },
        { type: 'sharpen', label: 'Edge Sharpener', icon: Flame, shortcut: 'R' },
        { type: 'smudge', label: 'Pigment Smudge', icon: Waves, shortcut: 'R' },
      ],
    },
    {
      id: 'dodge',
      primary: 'dodge',
      label: 'Tone & Luminance',
      icon: SunMedium,
      shortcut: 'O',
      category: 'Retouch',
      subTools: [
        { type: 'dodge', label: 'Highlight Boost (Lighten)', icon: SunMedium, shortcut: 'O' },
        { type: 'burn', label: 'Shadow Deepen (Darken)', icon: SunDim, shortcut: 'O' },
        { type: 'sponge', label: 'Color Vibrance', icon: Contrast, shortcut: 'O' },
      ],
    },
    {
      id: 'pen',
      primary: 'pen',
      label: 'Bezier Path Drafter',
      icon: Feather,
      shortcut: 'P',
      category: 'Vector',
    },
    {
      id: 'text',
      primary: 'text',
      label: 'Typography Inscription',
      icon: CaseSensitive,
      shortcut: 'T',
      category: 'Vector',
    },
    {
      id: 'shapes',
      primary: 'shape-rect',
      label: 'Vector Geometries',
      icon: Boxes,
      shortcut: 'U',
      category: 'Vector',
      subTools: [
        { type: 'shape-rect', label: 'Box Primitive', icon: Square, shortcut: 'U' },
        { type: 'shape-rounded', label: 'Filleted Box', icon: Square, shortcut: 'U' },
        { type: 'shape-ellipse', label: 'Oval Primitive', icon: Circle, shortcut: 'U' },
        { type: 'shape-polygon', label: 'Hexagon Polygon', icon: Hexagon, shortcut: 'U' },
        { type: 'shape-star', label: 'Starburst Primitive', icon: Star, shortcut: 'U' },
        { type: 'shape-line', label: 'Linear Vector', icon: Minus, shortcut: 'U' },
        { type: 'shape-arrow', label: 'Vector Pointer', icon: ArrowRight, shortcut: 'U' },
      ],
    },
    {
      id: 'hand',
      primary: 'hand',
      label: 'Canvas Pan',
      icon: Grab,
      shortcut: 'H',
      category: 'Navigate',
    },
    {
      id: 'zoom',
      primary: 'zoom',
      label: 'View Magnifier',
      icon: Search,
      shortcut: 'Z',
      category: 'Navigate',
    },
  ];

  // Update selected subtool memory if activeTool matches a group
  useEffect(() => {
    toolGroups.forEach((group) => {
      if (group.subTools?.some((st) => st.type === activeTool)) {
        setSelectedSubTools((prev) => ({ ...prev, [group.id]: activeTool }));
      }
    });
  }, [activeTool]);

  // Click outside to close flyout and all tools menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        openFlyout &&
        flyoutRef.current &&
        !flyoutRef.current.contains(target) &&
        !toolbarRef.current?.contains(target)
      ) {
        setOpenFlyout(null);
      }
      if (
        showAllToolsModal &&
        allToolsRef.current &&
        !allToolsRef.current.contains(target) &&
        !toolbarRef.current?.contains(target)
      ) {
        setShowAllToolsModal(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenFlyout(null);
        setShowAllToolsModal(false);
        setColorPickerTarget(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openFlyout, showAllToolsModal]);

  const openSubToolsFlyout = (groupId: string, buttonEl: HTMLElement) => {
    const tbRect = toolbarRef.current?.getBoundingClientRect();
    const btnRect = buttonEl.getBoundingClientRect();
    if (tbRect) {
      setFlyoutTop(btnRect.top - tbRect.top);
    }
    setOpenFlyout(groupId);
    setShowAllToolsModal(false);
  };

  const handlePointerDown = (group: ToolGroup, buttonEl: HTMLButtonElement) => {
    if (!group.subTools || group.subTools.length <= 1) return;
    longPressTimerRef.current = setTimeout(() => {
      openSubToolsFlyout(group.id, buttonEl);
    }, 280);
  };

  const handlePointerUpOrLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const activeGroup = toolGroups.find((g) => g.id === openFlyout);

  return (
    <div
      ref={toolbarRef}
      className={`relative bg-[#202020] border-r border-[#2d2d2d] flex flex-col items-center py-1 select-none z-30 justify-between shrink-0 h-full transition-all duration-150 ${
        isDoubleColumn ? 'w-20' : 'w-11'
      }`}
    >
      {/* 1. Header: Expand / Collapse Double-Column Toggle */}
      <div className="w-full flex items-center justify-end px-1 pb-1 border-b border-[#2d2d2d] shrink-0">
        <button
          type="button"
          onClick={() => {
            setIsDoubleColumn(!isDoubleColumn);
            setOpenFlyout(null);
          }}
          title={isDoubleColumn ? 'Switch to single column' : 'Switch to double column (shows all tools without scrolling)'}
          className="text-gray-400 hover:text-white p-0.5 rounded hover:bg-[#2d2d2d] transition-colors cursor-pointer"
        >
          {isDoubleColumn ? <ChevronsLeft size={13} /> : <ChevronsRight size={13} />}
        </button>
      </div>

      {/* 2. Tool Icons Grid / List */}
      <div
        className={`flex-1 w-full px-1 overflow-y-auto overflow-x-hidden py-1 scrollbar-thin scrollbar-thumb-[#3a3a3a] ${
          isDoubleColumn ? 'grid grid-cols-2 gap-1 content-start' : 'flex flex-col items-center gap-0.5'
        }`}
      >
        {toolGroups.map((group) => {
          const activeSubToolType = selectedSubTools[group.id] || group.primary;
          const isGroupActive =
            activeTool === group.primary ||
            (group.subTools && group.subTools.some((st) => st.type === activeTool));

          // Find icon for currently active/selected tool in this group
          const currentSub = group.subTools?.find((st) => st.type === activeSubToolType);
          const DisplayIcon = currentSub ? currentSub.icon : group.icon;

          return (
            <div key={group.id} className="relative group w-full flex justify-center">
              <button
                id={`tool-btn-${group.id}`}
                type="button"
                onPointerDown={(e) => {
                  if (e.button === 0) {
                    handlePointerDown(group, e.currentTarget);
                  }
                }}
                onPointerUp={handlePointerUpOrLeave}
                onPointerLeave={handlePointerUpOrLeave}
                onClick={() => {
                  onSelectTool(activeSubToolType);
                  setOpenFlyout(null);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (group.subTools && group.subTools.length > 1) {
                    openSubToolsFlyout(group.id, e.currentTarget);
                  }
                }}
                title={`${group.label} (${group.shortcut})${
                  group.subTools && group.subTools.length > 1 ? ' • Long-press, right-click, or click corner arrow for more' : ''
                }`}
                className={`w-8 h-8 rounded flex items-center justify-center relative transition-all cursor-pointer ${
                  isGroupActive
                    ? 'bg-[#007acc] text-white shadow-sm ring-1 ring-cyan-400/50'
                    : 'text-gray-300 hover:text-white hover:bg-[#2d2d2d]'
                }`}
              >
                <DisplayIcon size={16} strokeWidth={1.75} />

                {/* Corner indicator triangle: click to open flyout menu */}
                {group.subTools && group.subTools.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      const parentBtn = e.currentTarget.parentElement as HTMLElement;
                      if (parentBtn) {
                        openSubToolsFlyout(group.id, parentBtn);
                      }
                    }}
                    title="Click to view additional tools"
                    className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 flex items-end justify-end p-0 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <span className="w-0 h-0 border-b-[4px] border-r-[4px] border-b-transparent border-r-gray-400 group-hover:border-r-cyan-300" />
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* '...' All Tools Overview Button */}
        <div className="w-full flex justify-center mt-1 pt-1 border-t border-[#2d2d2d]">
          <button
            id="all-tools-overview-btn"
            type="button"
            onClick={(e) => {
              const tbRect = toolbarRef.current?.getBoundingClientRect();
              const btnRect = e.currentTarget.getBoundingClientRect();
              if (tbRect) {
                setFlyoutTop(btnRect.top - tbRect.top);
              }
              setShowAllToolsModal(!showAllToolsModal);
              setOpenFlyout(null);
            }}
            title="All Tools & Additional Tools Overview"
            className={`w-8 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
              showAllToolsModal
                ? 'bg-[#007acc] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#2d2d2d]'
            }`}
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* 3. Foreground / Background Color Selector */}
      <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-[#333333] w-full px-2 shrink-0">
        {/* Reset & Swap Mini Controls */}
        <div className="flex items-center justify-between w-8 px-0.5 text-gray-500">
          <button
            id="reset-colors-btn"
            type="button"
            onClick={onResetColors}
            title="Default Foreground/Background Colors (D)"
            className="hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-black border border-gray-400" />
              <div className="w-2 h-2 bg-white border border-gray-400 -ml-1 -mt-1" />
            </div>
          </button>
          <button
            id="swap-colors-btn"
            type="button"
            onClick={onSwapColors}
            title="Switch Foreground and Background Colors (X)"
            className="hover:text-white transition-colors cursor-pointer"
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
            className="absolute bottom-0 right-0 w-5 h-5 rounded border border-gray-500 shadow cursor-pointer hover:border-white transition-colors"
            style={{ backgroundColor: bgColor }}
          />

          {/* Foreground Color Chip */}
          <div
            onClick={() => setColorPickerTarget(colorPickerTarget === 'fg' ? null : 'fg')}
            title={`Foreground Color: ${fgColor}`}
            className="absolute top-0 left-0 w-5 h-5 rounded border border-white shadow-md z-10 cursor-pointer hover:scale-105 transition-transform"
            style={{ backgroundColor: fgColor }}
          />
        </div>

        {/* Color Picker Popover */}
        {colorPickerTarget && (
          <div className="absolute left-full ml-2 bottom-2 bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl p-3 z-50 w-56 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs text-gray-300 font-semibold border-b border-[#3e3e42] pb-1">
              <span>{colorPickerTarget === 'fg' ? 'Foreground Color' : 'Background Color'}</span>
              <button
                type="button"
                onClick={() => setColorPickerTarget(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
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

      {/* 4. Sub-Tools Flyout Menu */}
      {openFlyout && activeGroup?.subTools && (
        <div
          ref={flyoutRef}
          className="absolute left-full ml-1.5 bg-[#252526] border border-[#3e3e42] rounded-md shadow-2xl py-1 z-50 w-56"
          style={{ top: `${Math.max(4, Math.min(flyoutTop, window.innerHeight - 300))}px` }}
        >
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-cyan-400 font-semibold border-b border-[#333333] mb-1 flex items-center justify-between">
            <span>{activeGroup.label}</span>
            <span className="text-[9px] text-gray-400 font-normal">Sub-tools</span>
          </div>
          {activeGroup.subTools.map((st) => {
            const SubIcon = st.icon;
            const isCurrent = activeTool === st.type;
            return (
              <button
                key={st.type}
                type="button"
                onClick={() => {
                  onSelectTool(st.type);
                  setSelectedSubTools((prev) => ({ ...prev, [activeGroup.id]: st.type }));
                  setOpenFlyout(null);
                }}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[#007acc] text-white font-medium'
                    : 'text-gray-300 hover:bg-[#333333] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SubIcon size={14} className={isCurrent ? 'text-white' : 'text-cyan-400'} />
                  <span>{st.label}</span>
                </div>
                {st.shortcut && (
                  <span className={`text-[10px] font-mono ${isCurrent ? 'text-cyan-200' : 'text-gray-500'}`}>
                    {st.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 5. All Tools Overview Popover */}
      {showAllToolsModal && (
        <div
          ref={allToolsRef}
          className="absolute left-full ml-2 bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl p-3 z-50 w-80 text-xs"
          style={{ top: `${Math.max(4, Math.min(flyoutTop - 120, window.innerHeight - 450))}px` }}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#3e3e42]">
            <span className="font-semibold text-white text-xs">All Tools Palette</span>
            <button
              type="button"
              onClick={() => setShowAllToolsModal(false)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
            {(['Select', 'Paint', 'Retouch', 'Vector', 'Navigate'] as const).map((cat) => {
              const groupsInCat = toolGroups.filter((g) => g.category === cat);
              return (
                <div key={cat} className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">{cat}</span>
                  <div className="grid grid-cols-2 gap-1">
                    {groupsInCat.flatMap((g) => {
                      if (g.subTools && g.subTools.length > 1) {
                        return g.subTools.map((st) => ({
                          type: st.type,
                          label: st.label,
                          icon: st.icon,
                          shortcut: st.shortcut || g.shortcut,
                          groupId: g.id,
                        }));
                      }
                      return [
                        {
                          type: g.primary,
                          label: g.label,
                          icon: g.icon,
                          shortcut: g.shortcut,
                          groupId: g.id,
                        },
                      ];
                    }).map((toolItem) => {
                      const ItemIcon = toolItem.icon;
                      const isItemActive = activeTool === toolItem.type;
                      return (
                        <button
                          key={toolItem.type}
                          type="button"
                          onClick={() => {
                            onSelectTool(toolItem.type);
                            setSelectedSubTools((prev) => ({ ...prev, [toolItem.groupId]: toolItem.type }));
                            setShowAllToolsModal(false);
                          }}
                          className={`flex items-center justify-between p-1.5 rounded transition-colors text-left cursor-pointer ${
                            isItemActive
                              ? 'bg-[#007acc] text-white font-medium'
                              : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#333333] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <ItemIcon size={13} className={`shrink-0 ${isItemActive ? 'text-white' : 'text-cyan-400'}`} />
                            <span className="truncate text-[11px]">{toolItem.label}</span>
                          </div>
                          {toolItem.shortcut && (
                            <span className="text-[9px] font-mono text-gray-400 shrink-0 ml-1">
                              {toolItem.shortcut}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
