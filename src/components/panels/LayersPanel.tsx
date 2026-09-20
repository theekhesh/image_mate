/**
 * Photoshop Web Studio - Layers & Blend Modes Panel
 */

import React, { useState } from 'react';
import {
  Layer,
  BlendMode,
  AdjustmentType,
} from '../../types/photoshop';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Sliders,
  FolderPlus,
  Type,
  Square,
  Image as ImageIcon,
  Folder,
} from 'lucide-react';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onAddLayer: () => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onAddAdjustmentLayer: (type: AdjustmentType) => void;
  onAddLayerMask: (id: string) => void;
  onOpenLayerStyles: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onUpdateLayer,
  onAddLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onMoveLayer,
  onAddAdjustmentLayer,
  onAddLayerMask,
  onOpenLayerStyles,
}) => {
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [showAdjMenu, setShowAdjMenu] = useState(false);

  const activeLayer = layers.find((l) => l.id === activeLayerId);

  const blendModes: { value: BlendMode; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'multiply', label: 'Multiply' },
    { value: 'screen', label: 'Screen' },
    { value: 'overlay', label: 'Overlay' },
    { value: 'darken', label: 'Darken' },
    { value: 'lighten', label: 'Lighten' },
    { value: 'color-dodge', label: 'Color Dodge' },
    { value: 'color-burn', label: 'Color Burn' },
    { value: 'hard-light', label: 'Hard Light' },
    { value: 'soft-light', label: 'Soft Light' },
    { value: 'difference', label: 'Difference' },
    { value: 'exclusion', label: 'Exclusion' },
    { value: 'hue', label: 'Hue' },
    { value: 'saturation', label: 'Saturation' },
    { value: 'color', label: 'Color' },
    { value: 'luminosity', label: 'Luminosity' },
  ];

  const handleStartRename = (layer: Layer) => {
    setEditingNameId(layer.id);
    setNameInput(layer.name);
  };

  const handleSaveRename = () => {
    if (editingNameId && nameInput.trim()) {
      onUpdateLayer(editingNameId, { name: nameInput.trim() });
    }
    setEditingNameId(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#202020] text-xs text-[#cccccc] select-none">
      {/* Top Controls: Blend Mode + Opacity */}
      <div className="p-2.5 border-b border-[#2d2d2d] flex flex-col gap-2 bg-[#252526]">
        <div className="flex items-center justify-between gap-2">
          {/* Blend Mode Dropdown */}
          <select
            id="layer-blend-mode-select"
            disabled={!activeLayer}
            value={activeLayer?.blendMode || 'normal'}
            onChange={(e) =>
              activeLayerId &&
              onUpdateLayer(activeLayerId, { blendMode: e.target.value as BlendMode })
            }
            className="bg-[#181818] border border-[#3e3e42] rounded px-2 py-1 text-xs text-white flex-1 disabled:opacity-50"
          >
            {blendModes.map((bm) => (
              <option key={bm.value} value={bm.value}>
                {bm.label}
              </option>
            ))}
          </select>

          {/* Lock Button */}
          <button
            id="layer-lock-toggle-btn"
            disabled={!activeLayer}
            onClick={() =>
              activeLayerId &&
              onUpdateLayer(activeLayerId, { locked: !activeLayer?.locked })
            }
            title={activeLayer?.locked ? 'Unlock Layer' : 'Lock Layer'}
            className={`p-1 rounded border border-[#3e3e42] ${
              activeLayer?.locked ? 'bg-[#007acc] text-white' : 'bg-[#181818] text-gray-400 hover:text-white'
            }`}
          >
            {activeLayer?.locked ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
        </div>

        {/* Opacity Slider */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-400">Opacity:</span>
          <input
            id="layer-opacity-slider"
            type="range"
            min="0"
            max="100"
            disabled={!activeLayer}
            value={activeLayer?.opacity || 100}
            onChange={(e) =>
              activeLayerId &&
              onUpdateLayer(activeLayerId, { opacity: Number(e.target.value) })
            }
            className="flex-1 accent-[#007acc] h-1.5 bg-[#181818] rounded disabled:opacity-50"
          />
          <span className="w-9 text-right font-mono text-gray-200">
            {activeLayer?.opacity || 100}%
          </span>
        </div>
      </div>

      {/* Layer List (stacked top to bottom: index length - 1 down to 0) */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {layers
          .slice()
          .reverse()
          .map((layer) => {
            const isActive = layer.id === activeLayerId;
            const hasEffects =
              layer.effects?.dropShadow?.enabled ||
              layer.effects?.stroke?.enabled ||
              layer.effects?.colorOverlay?.enabled ||
              layer.effects?.outerGlow?.enabled;

            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`flex items-center gap-2 p-1.5 rounded border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#007acc]/20 border-[#007acc] text-white font-medium shadow-sm'
                    : 'bg-[#252526] border-transparent text-gray-300 hover:bg-[#2a2a2c]'
                }`}
              >
                {/* Visibility Toggle */}
                <button
                  id={`layer-vis-${layer.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { visible: !layer.visible });
                  }}
                  className="text-gray-400 hover:text-white p-0.5"
                  title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                >
                  {layer.visible ? <Eye size={14} className="text-[#00c8ff]" /> : <EyeOff size={14} className="text-gray-600" />}
                </button>

                {/* Layer Thumbnail / Icon */}
                <div className="w-8 h-8 rounded bg-[#181818] border border-[#3e3e42] flex items-center justify-center overflow-hidden shrink-0 relative">
                  {layer.type === 'raster' && <ImageIcon size={14} className="text-blue-400" />}
                  {layer.type === 'text' && <Type size={14} className="text-amber-400" />}
                  {layer.type === 'shape' && <Square size={14} className="text-emerald-400" />}
                  {layer.type === 'adjustment' && <Sparkles size={14} className="text-purple-400" />}
                  {layer.type === 'group' && <Folder size={14} className="text-yellow-400" />}
                </div>

                {/* Layer Name & Type */}
                <div className="flex-1 min-w-0">
                  {editingNameId === layer.id ? (
                    <input
                      type="text"
                      value={nameInput}
                      autoFocus
                      onChange={(e) => setNameInput(e.target.value)}
                      onBlur={handleSaveRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename();
                        if (e.key === 'Escape') setEditingNameId(null);
                      }}
                      className="w-full bg-[#181818] border border-[#007acc] rounded px-1 text-xs text-white"
                    />
                  ) : (
                    <div
                      onDoubleClick={() => handleStartRename(layer)}
                      className="truncate text-xs select-none"
                      title="Double-click to rename"
                    >
                      {layer.name}
                    </div>
                  )}

                  {/* Layer FX Badge */}
                  {hasEffects && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLayerStyles();
                      }}
                      className="inline-block mt-0.5 px-1 py-0.2 text-[9px] font-bold bg-[#333333] hover:bg-[#007acc] text-cyan-400 rounded cursor-pointer"
                    >
                      fx
                    </span>
                  )}
                </div>

                {/* Layer Mask Indicator */}
                {layer.maskCanvas && (
                  <div
                    title="Layer Mask Active"
                    className="w-5 h-5 rounded border border-gray-500 bg-black flex items-center justify-center text-[9px] text-white"
                  >
                    M
                  </div>
                )}

                {/* Layer Reorder / Lock indicator */}
                <div className="flex items-center gap-0.5">
                  {layer.locked && <Lock size={12} className="text-gray-500 mr-1" />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayer(layer.id, 'up');
                    }}
                    title="Move Layer Up"
                    className="p-0.5 text-gray-500 hover:text-white"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayer(layer.id, 'down');
                    }}
                    title="Move Layer Down"
                    className="p-0.5 text-gray-500 hover:text-white"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Bottom Layer Action Toolbar */}
      <div className="p-2 border-t border-[#2d2d2d] bg-[#252526] flex items-center justify-between relative">
        {/* Layer Styles (fx) */}
        <button
          id="btn-layer-fx"
          onClick={onOpenLayerStyles}
          title="Add a layer style (fx)"
          className="p-1.5 hover:bg-[#333333] rounded text-gray-300 hover:text-cyan-400 transition-colors font-bold text-xs"
        >
          fx
        </button>

        {/* Add Layer Mask */}
        <button
          id="btn-add-mask"
          disabled={!activeLayerId}
          onClick={() => activeLayerId && onAddLayerMask(activeLayerId)}
          title="Add layer mask"
          className="p-1.5 hover:bg-[#333333] rounded text-gray-300 hover:text-white disabled:opacity-40 transition-colors"
        >
          <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          </div>
        </button>

        {/* Add Adjustment Layer Menu */}
        <div className="relative">
          <button
            id="btn-adj-layer"
            onClick={() => setShowAdjMenu(!showAdjMenu)}
            title="Create new adjustment layer"
            className="p-1.5 hover:bg-[#333333] rounded text-gray-300 hover:text-white transition-colors"
          >
            <Sparkles size={14} />
          </button>
          {showAdjMenu && (
            <div className="absolute bottom-full right-0 mb-1 w-48 bg-[#252526] border border-[#3e3e42] rounded-md shadow-2xl py-1 z-50 text-xs">
              <button
                onClick={() => {
                  onAddAdjustmentLayer('brightness-contrast');
                  setShowAdjMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
              >
                Brightness/Contrast
              </button>
              <button
                onClick={() => {
                  onAddAdjustmentLayer('hue-saturation');
                  setShowAdjMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
              >
                Hue/Saturation
              </button>
              <button
                onClick={() => {
                  onAddAdjustmentLayer('color-balance');
                  setShowAdjMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
              >
                Color Balance
              </button>
              <button
                onClick={() => {
                  onAddAdjustmentLayer('black-white');
                  setShowAdjMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
              >
                Black & White
              </button>
              <button
                onClick={() => {
                  onAddAdjustmentLayer('invert');
                  setShowAdjMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
              >
                Invert
              </button>
              <button
                onClick={() => {
                  onAddAdjustmentLayer('sepia');
                  setShowAdjMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white"
              >
                Sepia Tone
              </button>
            </div>
          )}
        </div>

        {/* Duplicate Layer */}
        <button
          id="btn-dup-layer"
          disabled={!activeLayerId}
          onClick={() => activeLayerId && onDuplicateLayer(activeLayerId)}
          title="Duplicate Current Layer (Ctrl+J)"
          className="p-1.5 hover:bg-[#333333] rounded text-gray-300 hover:text-white disabled:opacity-40 transition-colors"
        >
          <Copy size={14} />
        </button>

        {/* Create New Layer */}
        <button
          id="btn-new-layer"
          onClick={onAddLayer}
          title="Create a new layer"
          className="p-1.5 hover:bg-[#333333] rounded text-gray-300 hover:text-white transition-colors"
        >
          <Plus size={14} />
        </button>

        {/* Delete Layer */}
        <button
          id="btn-delete-layer"
          disabled={!activeLayerId || layers.length <= 1}
          onClick={() => activeLayerId && onDeleteLayer(activeLayerId)}
          title="Delete Layer"
          className="p-1.5 hover:bg-[#333333] rounded text-gray-300 hover:text-red-400 disabled:opacity-40 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
