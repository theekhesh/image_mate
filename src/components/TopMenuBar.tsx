/**
 * ImageMate Studio - Top Menu Bar & Document Tabs
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  Save,
  Plus,
  X,
  Undo2,
  Redo2,
  Sliders,
  Sparkles,
  Layers,
  HelpCircle,
  Maximize,
  Download,
  Image as ImageIcon,
  Crop,
  Eye,
  Settings,
  Keyboard,
  Scissors,
  Copy,
  Clipboard,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Palette,
  ChevronDown,
  Check,
} from 'lucide-react';
import { DocumentProject, AdjustmentType } from '../types/imagemate';
import { FileExporter } from '../utils/fileExporter';
import { BUILTIN_THEMES } from '../utils/themeEngine';

interface TopMenuBarProps {
  currentThemeId?: string;
  onOpenThemeModal?: () => void;
  onSelectTheme?: (themeId: string) => void;
  documents?: DocumentProject[];
  activeDocId?: string;
  projectName?: string;
  zoomLevel?: number;
  showRulers?: boolean;
  showGrid?: boolean;
  onSelectDoc?: (id: string) => void;
  onCloseDoc?: (id: string) => void;
  onNewDoc?: () => void;
  onNewDocument?: () => void;
  onOpenImage?: () => void;
  onOpenDocument?: () => void;
  onSaveProject: () => void;
  onSaveAsProject?: () => void;
  onExport?: () => void;
  onExportImage?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenFilterGallery: () => void;
  onOpenAdjustment?: (type: AdjustmentType) => void;
  onOpenAdjustments?: (type: AdjustmentType) => void;
  onOpenLayerStyles: () => void;
  onOpenCanvasSize?: (mode?: any) => void;
  onOpenShortcuts?: () => void;
  onAIEnhance?: () => void;
  onAutoEnhance?: () => void;
  onToggleRulers?: () => void;
  onToggleGrid?: () => void;
  onFitScreen?: () => void;
  onZoom100?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onAddLayer?: () => void;
  onNewLayer?: () => void;
  onDuplicateLayer?: () => void;
  onDeleteLayer?: () => void;
  onMergeDown?: () => void;
  onFlattenImage?: () => void;
  onRotateCanvas?: (angle: number) => void;
  onFlipCanvas?: (dir: 'h' | 'v') => void;
  onSelectAll?: () => void;
  onDeselect?: () => void;
  onInvertSelection?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onRasterizeLayer?: () => void;
  onInvertLayer?: () => void;
  onFillForeground?: () => void;
  onFillBackground?: () => void;
  onFreeTransform?: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  currentThemeId,
  onOpenThemeModal,
  onSelectTheme,
  documents,
  activeDocId,
  projectName,
  zoomLevel,
  showRulers,
  showGrid,
  onSelectDoc,
  onCloseDoc,
  onNewDoc,
  onNewDocument,
  onOpenImage,
  onOpenDocument,
  onSaveProject,
  onSaveAsProject,
  onExport,
  onExportImage,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenFilterGallery,
  onOpenAdjustment,
  onOpenAdjustments,
  onOpenLayerStyles,
  onOpenCanvasSize,
  onOpenShortcuts,
  onAIEnhance,
  onAutoEnhance,
  onToggleRulers,
  onToggleGrid,
  onFitScreen,
  onZoom100,
  onZoomIn,
  onZoomOut,
  onAddLayer,
  onNewLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onMergeDown,
  onFlattenImage,
  onRotateCanvas,
  onFlipCanvas,
  onSelectAll,
  onDeselect,
  onInvertSelection,
  onCopy,
  onCut,
  onPaste,
  onRasterizeLayer,
  onInvertLayer,
  onFillForeground,
  onFillBackground,
  onFreeTransform,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  const docList = documents || [
    {
      id: 'active',
      title: projectName || 'Untitled',
      width: 1920,
      height: 1080,
      dpi: 72,
      colorMode: 'RGB' as const,
      background: 'transparent' as const,
      layers: [],
      activeLayerId: null,
      selectedLayerIds: [],
      history: [],
      historyIndex: 0,
      zoom: zoomLevel || 1,
      pan: { x: 0, y: 0 },
      guides: [],
      rulersVisible: !!showRulers,
      gridVisible: !!showGrid,
      snapToGuides: true,
      snapToGrid: true,
      selection: null,
    },
  ];
  const currentDocId = activeDocId || docList[0]?.id;
  const activeDoc = docList.find((d) => d.id === currentDocId) || docList[0];

  const handleNewDoc = onNewDoc || onNewDocument || (() => {});
  const handleOpenImage = onOpenImage || onOpenDocument || (() => {});
  const handleExport = onExport || onExportImage || (() => {});
  const handleAdj = onOpenAdjustment || onOpenAdjustments || (() => {});
  const handleAI = onAIEnhance || onAutoEnhance || (() => {});
  const handleAddL = onAddLayer || onNewLayer || (() => {});

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setActiveMenu(null);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(target)) {
        setIsThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (name: string) => {
    setActiveMenu(activeMenu === name ? null : name);
  };

  const handleMenuHover = (name: string) => {
    if (activeMenu !== null) {
      setActiveMenu(name);
    }
  };

  const closeAndRun = (action?: () => void) => {
    setActiveMenu(null);
    if (action) {
      action();
    }
  };

  return (
    <div ref={menuRef} className="bg-[#202020] border-b border-[#2d2d2d] select-none text-xs text-[#cccccc]">
      {/* Upper Bar: Logo + Menus + Action Shortcuts */}
      <div className="flex items-center justify-between px-2 h-8">
        {/* Left: ImageMate Studio Brand + Menu List */}
        <div className="flex items-center gap-1">
          {/* ImageMate Brand Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 mr-2 rounded bg-[#002233] border border-[#0099cc] text-[#00d4ff] font-bold text-xs shadow-sm">
            <span className="font-extrabold text-[13px] tracking-tight">Im</span>
            <span className="text-[10px] text-gray-300 font-medium hidden sm:inline">ImageMate</span>
          </div>

          {/* File Menu */}
          <div className="relative">
            <button
              id="menu-btn-file"
              onClick={() => toggleMenu('file')}
              onMouseEnter={() => handleMenuHover('file')}
              className={`px-2.5 py-1 rounded hover:bg-[#333333] hover:text-white transition-colors ${
                activeMenu === 'file' ? 'bg-[#333333] text-white' : ''
              }`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div className="absolute left-0 top-full mt-0.5 w-56 bg-[#252526] border border-[#3e3e42] rounded-md shadow-2xl py-1 z-50 text-xs">
                <button
                  id="menu-file-new"
                  onClick={() => closeAndRun(handleNewDoc)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Plus size={14} /> New Document...</span>
                  <span className="text-[10px] text-gray-400">Ctrl+N</span>
                </button>
                <button
                  id="menu-file-open"
                  onClick={() => closeAndRun(handleOpenImage)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><FolderOpen size={14} /> Open Document / Image...</span>
                  <span className="text-[10px] text-gray-400">Ctrl+O</span>
                </button>
                <div className="h-px bg-[#3e3e42] my-1" />
                <button
                  id="menu-file-save"
                  onClick={() => closeAndRun(onSaveProject)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Save size={14} /> Save Document (.imate)</span>
                  <span className="text-[10px] text-gray-400">Ctrl+S</span>
                </button>
                <button
                  id="menu-file-save-as"
                  onClick={() => closeAndRun(onSaveAsProject || onSaveProject)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Save size={14} /> Save As (.imate)...</span>
                  <span className="text-[10px] text-gray-400">Ctrl+Shift+S</span>
                </button>
                <button
                  id="menu-file-export"
                  onClick={() => closeAndRun(handleExport)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Download size={14} /> Quick Export As...</span>
                  <span className="text-[10px] text-gray-400">Ctrl+Shift+E</span>
                </button>
                <div className="h-px bg-[#3e3e42] my-1" />
                <button
                  id="menu-file-close"
                  onClick={() => closeAndRun(() => currentDocId && onCloseDoc?.(currentDocId))}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><X size={14} /> Close Document</span>
                  <span className="text-[10px] text-gray-400">Ctrl+W</span>
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              id="menu-btn-edit"
              onClick={() => toggleMenu('edit')}
              onMouseEnter={() => handleMenuHover('edit')}
              className={`px-2.5 py-1 rounded hover:bg-[#333333] hover:text-white transition-colors ${
                activeMenu === 'edit' ? 'bg-[#333333] text-white' : ''
              }`}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <div className="absolute left-0 top-full mt-0.5 w-56 bg-[#252526] border border-[#3e3e42] rounded-md shadow-2xl py-1 z-50 text-xs">
                <button
                  id="menu-edit-undo"
                  disabled={!canUndo}
                  onClick={() => closeAndRun(onUndo)}
                  className={`w-full text-left px-3 py-1.5 flex justify-between items-center ${
                    canUndo ? 'hover:bg-[#007acc] hover:text-white text-gray-200' : 'text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-2"><Undo2 size={14} /> Undo</span>
                  <span className="text-[10px] text-gray-400">Ctrl+Z</span>
                </button>
                <button
                  id="menu-edit-redo"
                  disabled={!canRedo}
                  onClick={() => closeAndRun(onRedo)}
                  className={`w-full text-left px-3 py-1.5 flex justify-between items-center ${
                    canRedo ? 'hover:bg-[#007acc] hover:text-white text-gray-200' : 'text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-2"><Redo2 size={14} /> Redo</span>
                  <span className="text-[10px] text-gray-400">Ctrl+Y</span>
                </button>
                <div className="h-px bg-[#3e3e42] my-1" />
                <button
                  id="menu-edit-cut"
                  onClick={() => closeAndRun(onCut)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Scissors size={14} /> Cut</span>
                  <span className="text-[10px] text-gray-400">Ctrl+X</span>
                </button>
                <button
                  id="menu-edit-copy"
                  onClick={() => closeAndRun(onCopy)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Copy size={14} /> Copy</span>
                  <span className="text-[10px] text-gray-400">Ctrl+C</span>
                </button>
                <button
                  id="menu-edit-paste"
                  onClick={() => closeAndRun(onPaste)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Clipboard size={14} /> Paste</span>
                  <span className="text-[10px] text-gray-400">Ctrl+V</span>
                </button>
                <div className="h-px bg-[#3e3e42] my-1" />
                <button
                  id="menu-edit-transform"
                  onClick={() => closeAndRun(onFreeTransform)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Crop size={14} /> Free Transform</span>
                  <span className="text-[10px] text-gray-400">Ctrl+T</span>
                </button>
                <button
                  id="menu-edit-fill-fg"
                  onClick={() => closeAndRun(onFillForeground)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Fill with Foreground</span>
                  <span className="text-[10px] text-gray-400">Alt+Del</span>
                </button>
                <button
                  id="menu-edit-fill-bg"
                  onClick={() => closeAndRun(onFillBackground)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Fill with Background</span>
                  <span className="text-[10px] text-gray-400">Ctrl+Del</span>
                </button>
                <div className="h-px bg-[#3e3e42] my-1" />
                <button
                  id="menu-edit-shortcuts"
                  onClick={() => closeAndRun(onOpenShortcuts)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Keyboard size={14} /> Keyboard Shortcuts</span>
                  <span className="text-[10px] text-gray-400">Ctrl+Shift+K</span>
                </button>
                <button
                  id="menu-edit-theme-prefs"
                  onClick={() => closeAndRun(onOpenThemeModal)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Palette size={14} /> Theme Preferences...</span>
                </button>
              </div>
            )}
          </div>

          {/* Image Menu */}
          <div className="relative">
            <button
              id="menu-btn-image"
              onClick={() => toggleMenu('image')}
              onMouseEnter={() => handleMenuHover('image')}
              className={`px-2.5 py-1 rounded hover:bg-[#333333] hover:text-white transition-colors ${
                activeMenu === 'image' ? 'bg-[#333333] text-white' : ''
              }`}
            >
              Image
            </button>
            {activeMenu === 'image' && (
              <div className="absolute left-0 top-full mt-0.5 w-60 bg-[#252526] border border-[#3e3e42] rounded-md shadow-2xl py-1 z-50 text-xs">
                <button
                  id="menu-img-ai-auto"
                  onClick={() => closeAndRun(handleAI)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center text-cyan-300 font-medium"
                >
                  <span className="flex items-center gap-2"><Sparkles size={14} /> AI Auto-Enhance</span>
                  <span className="text-[10px] text-cyan-400">Auto</span>
                </button>
                <div className="h-px bg-[#3e3e42] my-1" />
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-gray-400">Adjustments</div>
                <button
                  id="menu-img-adj-bc"
                  onClick={() => closeAndRun(() => handleAdj('brightness-contrast'))}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
                >
                  Brightness / Contrast...
                </button>
                <button
                  id="menu-img-adj-hs"
                  onClick={() => closeAndRun(() => handleAdj('hue-saturation'))}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Hue / Saturation...</span>
                  <span className="text-[10px] text-gray-400">Ctrl+U</span>
                </button>
                <button
                  id="menu-img-adj-levels"
                  onClick={() => closeAndRun(() => handleAdj('levels'))}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Levels...</span>
                  <span className="text-[10px] text-gray-400">Ctrl+L</span>
                </button>
                <button
                  id="menu-img-adj-curves"
                  onClick={() => closeAndRun(() => handleAdj('curves'))}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Curves...</span>
                  <span className="text-[10px] text-gray-400">Ctrl+M</span>
                </button>
                <button
                  id="menu-img-adj-cb"
                  onClick={() => closeAndRun(() => handleAdj('color-balance'))}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Color Balance...</span>
                  <span className="text-[10px] text-gray-400">Ctrl+B</span>
                </button>
                <button
                  id="menu-img-adj-bw"
                  onClick={() => closeAndRun(() => handleAdj('black-white'))}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
                >
                  Black & White...
                </button>
                <button
                  id="menu-img-adj-invert"
                  onClick={() => closeAndRun(() => handleAdj('invert'))}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Invert</span>
                  <span className="text-[10px] text-gray-400">Ctrl+I</span>
                </button>
                <div className="h-px bg-[#3e3e42] my-1" />
                <button
                  id="menu-img-canvas-size"
                  onClick={() => closeAndRun(() => onOpenCanvasSize?.('canvas'))}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
                >
                  Canvas Size / Resample...
                </button>
                <button
                  id="menu-img-rot-90"
                  onClick={() => closeAndRun(() => onRotateCanvas?.(90))}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><RotateCw size={14} /> Rotate 90° Clockwise</span>
                </button>
                <button
                  id="menu-img-flip-h"
                  onClick={() => closeAndRun(() => onFlipCanvas?.('h'))}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><FlipHorizontal size={14} /> Flip Canvas Horizontal</span>
                </button>
                <button
                  id="menu-img-flip-v"
                  onClick={() => closeAndRun(() => onFlipCanvas?.('v'))}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><FlipVertical size={14} /> Flip Canvas Vertical</span>
                </button>
              </div>
            )}
          </div>

          {/* Layer Menu */}
          <div className="relative">
            <button
              id="menu-btn-layer"
              onClick={() => toggleMenu('layer')}
              onMouseEnter={() => handleMenuHover('layer')}
              className={`px-2.5 py-1 rounded hover:bg-[#333333] hover:text-white transition-colors ${
                activeMenu === 'layer' ? 'bg-[#333333] text-white' : ''
              }`}
            >
              Layer
            </button>
            {activeMenu === 'layer' && (
              <div className="absolute left-0 top-full mt-0.5 w-56 bg-[#252526] border border-[#3e3e42] rounded-md shadow-2xl py-1 z-50 text-xs">
                <button
                  id="menu-layer-new"
                  onClick={() => closeAndRun(handleAddL)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Plus size={14} /> New Layer</span>
                  <span className="text-[10px] text-gray-400">Ctrl+Shift+N</span>
                </button>
                <button
                  id="menu-layer-duplicate"
                  onClick={() => closeAndRun(onDuplicateLayer)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Copy size={14} /> Duplicate Layer</span>
                  <span className="text-[10px] text-gray-400">Ctrl+J</span>
                </button>
                <button
                  id="menu-layer-delete"
                  onClick={() => closeAndRun(onDeleteLayer)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center text-red-300"
                >
                  <span className="flex items-center gap-2"><X size={14} /> Delete Layer</span>
                  <span className="text-[10px] text-gray-400">Del</span>
                </button>
                <div className="h-px bg-[#3e3e42] my-1" />
                <button
                  id="menu-layer-rasterize"
                  onClick={() => closeAndRun(onRasterizeLayer)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Rasterize Layer</span>
                </button>
                <button
                  id="menu-layer-invert"
                  onClick={() => closeAndRun(onInvertLayer)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Invert Colors</span>
                  <span className="text-[10px] text-gray-400">Ctrl+I</span>
                </button>
                <div className="h-px bg-[#3e3e42] my-1" />
                <button
                  id="menu-layer-styles"
                  onClick={() => closeAndRun(onOpenLayerStyles)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Sliders size={14} /> Layer Styles (fx)...</span>
                </button>
                <div className="h-px bg-[#3e3e42] my-1" />
                <button
                  id="menu-layer-merge-down"
                  onClick={() => closeAndRun(onMergeDown)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Merge Down</span>
                  <span className="text-[10px] text-gray-400">Ctrl+E</span>
                </button>
                <button
                  id="menu-layer-flatten"
                  onClick={() => closeAndRun(onFlattenImage)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Flatten Image</span>
                  <span className="text-[10px] text-gray-400">Ctrl+Shift+E</span>
                </button>
              </div>
            )}
          </div>

          {/* Select Menu */}
          <div className="relative">
            <button
              id="menu-btn-select"
              onClick={() => toggleMenu('select')}
              onMouseEnter={() => handleMenuHover('select')}
              className={`px-2.5 py-1 rounded hover:bg-[#333333] hover:text-white transition-colors ${
                activeMenu === 'select' ? 'bg-[#333333] text-white' : ''
              }`}
            >
              Select
            </button>
            {activeMenu === 'select' && (
              <div className="absolute left-0 top-full mt-0.5 w-52 bg-[#252526] border border-[#3e3e42] rounded-md shadow-2xl py-1 z-50 text-xs">
                <button
                  id="menu-sel-all"
                  onClick={() => closeAndRun(onSelectAll)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Select All</span>
                  <span className="text-[10px] text-gray-400">Ctrl+A</span>
                </button>
                <button
                  id="menu-sel-deselect"
                  onClick={() => closeAndRun(onDeselect)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Deselect</span>
                  <span className="text-[10px] text-gray-400">Ctrl+D</span>
                </button>
                <button
                  id="menu-sel-invert"
                  onClick={() => closeAndRun(onInvertSelection)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Inverse Selection</span>
                  <span className="text-[10px] text-gray-400">Ctrl+Shift+I</span>
                </button>
              </div>
            )}
          </div>

          {/* Filter Menu */}
          <div className="relative">
            <button
              id="menu-btn-filter"
              onClick={() => toggleMenu('filter')}
              onMouseEnter={() => handleMenuHover('filter')}
              className={`px-2.5 py-1 rounded hover:bg-[#333333] hover:text-white transition-colors ${
                activeMenu === 'filter' ? 'bg-[#333333] text-white' : ''
              }`}
            >
              Filter
            </button>
            {activeMenu === 'filter' && (
              <div className="absolute left-0 top-full mt-0.5 w-56 bg-[#252526] border border-[#3e3e42] rounded-md shadow-2xl py-1 z-50 text-xs">
                <button
                  id="menu-filter-gallery"
                  onClick={() => closeAndRun(onOpenFilterGallery)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center text-cyan-300 font-medium"
                >
                  <span className="flex items-center gap-2"><Sparkles size={14} /> Filter Gallery Studio...</span>
                  <span className="text-[10px] text-cyan-400">All</span>
                </button>
                <div className="h-px bg-[#3e3e42] my-1" />
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-gray-400">Blur & Sharpen</div>
                <button
                  id="menu-filter-gauss"
                  onClick={() => closeAndRun(onOpenFilterGallery)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
                >
                  Gaussian Blur...
                </button>
                <button
                  id="menu-filter-sharpen"
                  onClick={() => closeAndRun(onOpenFilterGallery)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
                >
                  Unsharp Mask / Sharpen...
                </button>
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-gray-400 mt-1">Stylize & Distort</div>
                <button
                  id="menu-filter-pixelate"
                  onClick={() => closeAndRun(onOpenFilterGallery)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
                >
                  Pixelate / Mosaic...
                </button>
                <button
                  id="menu-filter-glitch"
                  onClick={() => closeAndRun(onOpenFilterGallery)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
                >
                  RGB Split Glitch...
                </button>
                <button
                  id="menu-filter-vignette"
                  onClick={() => closeAndRun(onOpenFilterGallery)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
                >
                  Vignette Lens Shade...
                </button>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="relative">
            <button
              id="menu-btn-view"
              onClick={() => toggleMenu('view')}
              onMouseEnter={() => handleMenuHover('view')}
              className={`px-2.5 py-1 rounded hover:bg-[#333333] hover:text-white transition-colors ${
                activeMenu === 'view' ? 'bg-[#333333] text-white' : ''
              }`}
            >
              View
            </button>
            {activeMenu === 'view' && (
              <div className="absolute left-0 top-full mt-0.5 w-52 bg-[#252526] border border-[#3e3e42] rounded-md shadow-2xl py-1 z-50 text-xs">
                <button
                  id="menu-view-fit"
                  onClick={() => closeAndRun(onFitScreen)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>Fit on Screen</span>
                  <span className="text-[10px] text-gray-400">Ctrl+0</span>
                </button>
                <button
                  id="menu-view-100"
                  onClick={() => closeAndRun(onZoom100)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>100% Actual Pixels</span>
                  <span className="text-[10px] text-gray-400">Ctrl+1</span>
                </button>
                <div className="h-px bg-[#3e3e42] my-1" />
                <button
                  id="menu-view-rulers"
                  onClick={() => closeAndRun(onToggleRulers)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>
                    {(showRulers !== undefined
                      ? showRulers
                      : (activeDoc?.showRulers ?? activeDoc?.rulersVisible))
                      ? '✓ '
                      : '  '}
                    Rulers
                  </span>
                  <span className="text-[10px] text-gray-400">Ctrl+R</span>
                </button>
                <button
                  id="menu-view-grid"
                  onClick={() => closeAndRun(onToggleGrid)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span>{activeDoc?.gridVisible ? '✓ ' : '  '}Pixel Grid</span>
                  <span className="text-[10px] text-gray-400">Ctrl+'</span>
                </button>
                <div className="h-px bg-[#3e3e42] my-1" />
                <button
                  id="menu-view-themes"
                  onClick={() => closeAndRun(onOpenThemeModal)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Palette size={13} /> Color Themes...</span>
                </button>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="relative">
            <button
              id="menu-btn-help"
              onClick={() => toggleMenu('help')}
              onMouseEnter={() => handleMenuHover('help')}
              className={`px-2.5 py-1 rounded hover:bg-[#333333] hover:text-white transition-colors ${
                activeMenu === 'help' ? 'bg-[#333333] text-white' : ''
              }`}
            >
              Help
            </button>
            {activeMenu === 'help' && (
              <div className="absolute left-0 top-full mt-0.5 w-56 bg-[#252526] border border-[#3e3e42] rounded-md shadow-2xl py-1 z-50 text-xs">
                <button
                  id="menu-help-shortcuts"
                  onClick={() => closeAndRun(onOpenShortcuts)}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex justify-between items-center"
                >
                  <span className="flex items-center gap-2"><Keyboard size={14} /> ImageMate Shortcuts</span>
                  <span className="text-[10px] text-gray-400">F1</span>
                </button>
                <div className="px-3 py-2 text-[11px] text-gray-400 border-t border-[#3e3e42] mt-1">
                  ImageMate Studio v2.4
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Theme Switcher Dropdown */}
          <div ref={themeDropdownRef} className="relative">
            <button
              id="quick-btn-theme"
              type="button"
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              title="Change Workspace Theme (Tokyo Night, Dracula, Nord, etc.)"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#252526] hover:bg-[#333333] text-gray-200 text-[11px] font-medium border border-[#3e3e42] transition-colors cursor-pointer"
            >
              <Palette size={13} className="text-cyan-400" />
              <span className="max-w-[90px] truncate">
                {BUILTIN_THEMES.find((t) => t.id === currentThemeId)?.name || 'Theme'}
              </span>
              <ChevronDown size={11} className="text-gray-400" />
            </button>

            {isThemeDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-cyan-400 font-bold border-b border-[#333333] mb-1 flex items-center justify-between">
                  <span>Color Themes</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsThemeDropdownOpen(false);
                      onOpenThemeModal?.();
                    }}
                    className="hover:underline text-[10px] text-gray-400 hover:text-white cursor-pointer"
                  >
                    All Themes →
                  </button>
                </div>
                {BUILTIN_THEMES.slice(0, 7).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onSelectTheme?.(t.id);
                      setIsThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#333333] hover:text-white cursor-pointer transition-colors ${
                      currentThemeId === t.id ? 'bg-[#007acc] text-white font-medium' : 'text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: t.colors.accent }}
                      />
                      <span>{t.name}</span>
                    </div>
                    {currentThemeId === t.id && <Check size={12} />}
                  </button>
                ))}
                <div className="border-t border-[#333333] mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsThemeDropdownOpen(false);
                      onOpenThemeModal?.();
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#333333] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                  >
                    <Palette size={13} />
                    <span>More Themes & Customizer...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Auto-Enhance quick button */}
          <button
            id="quick-btn-ai-enhance"
            onClick={handleAI}
            title="Smart AI Auto Retouch & Dynamic Tone Mapping"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gradient-to-r from-[#007acc] to-[#00a8ff] text-white text-[11px] font-medium shadow hover:brightness-110 active:scale-95 transition-all"
          >
            <Sparkles size={13} className="animate-pulse" />
            <span>AI Enhance</span>
          </button>

          {/* Quick Export Button */}
          <button
            id="quick-btn-export"
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#333333] hover:bg-[#404040] text-gray-200 text-[11px] font-medium border border-[#444444] transition-colors"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Lower Bar: Multi-Document Tabs */}
      <div className="flex items-center bg-[#181818] px-2 h-7 gap-1 overflow-x-auto">
        {docList.map((doc) => {
          const isActive = doc.id === currentDocId;
          return (
            <div
              key={doc.id}
              onClick={() => onSelectDoc?.(doc.id)}
              className={`flex items-center gap-2 px-3 py-1 text-xs rounded-t cursor-pointer transition-colors max-w-[200px] border-t-2 ${
                isActive
                  ? 'bg-[#202020] text-white border-[#007acc] font-medium'
                  : 'bg-[#141414] text-gray-400 hover:bg-[#1c1c1c] hover:text-gray-200 border-transparent'
              }`}
            >
              <ImageIcon size={12} className={isActive ? 'text-[#00c8ff]' : 'text-gray-500'} />
              <span className="truncate">{doc.title}</span>
              {doc.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              {docList.length > 1 && onCloseDoc && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseDoc(doc.id);
                  }}
                  className="p-0.5 hover:bg-[#333333] rounded text-gray-400 hover:text-white ml-1"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}

        {/* Add New Document Tab Button */}
        <button
          id="tab-add-doc-btn"
          onClick={handleNewDoc}
          title="Create New Document or Preset"
          className="p-1 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};
