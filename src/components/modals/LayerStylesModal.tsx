/**
 * ImageMate Studio - Layer Styles Dialog (fx)
 */

import React, { useState } from 'react';
import { Layer, LayerEffects } from '../../types/imagemate';
import { X, Check, Sliders, ShieldCheck } from 'lucide-react';

interface LayerStylesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayer: Layer | null;
  onUpdateEffects: (effects: LayerEffects) => void;
}

export const LayerStylesModal: React.FC<LayerStylesModalProps> = ({
  isOpen,
  onClose,
  activeLayer,
  onUpdateEffects,
}) => {
  const [activeTab, setActiveTab] = useState<'dropShadow' | 'stroke' | 'colorOverlay' | 'outerGlow'>('dropShadow');
  const [effects, setEffects] = useState<LayerEffects>(
    activeLayer?.effects || {
      dropShadow: { enabled: true, color: '#000000', blur: 15, offsetX: 0, offsetY: 8, opacity: 60 },
      stroke: { enabled: false, color: '#ffffff', size: 2, position: 'outside' },
      colorOverlay: { enabled: false, color: '#3b82f6', opacity: 100 },
      outerGlow: { enabled: false, color: '#00c8ff', blur: 20, opacity: 80 },
    }
  );

  if (!isOpen || !activeLayer) return null;

  const handleApply = () => {
    onUpdateEffects(effects);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="bg-[#252526] border border-[#3e3e42] rounded-xl shadow-2xl w-full max-w-2xl text-xs text-[#cccccc] overflow-hidden flex flex-col h-[75vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#1e1e1e] border-b border-[#333333] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-[#00c8ff]" />
            <span className="font-bold text-sm text-white">Layer Style ({activeLayer.name})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#333333]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Styles Tabs */}
          <div className="w-56 bg-[#202020] border-r border-[#333333] p-3 flex flex-col gap-1.5 overflow-y-auto">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Styles List
            </div>

            {/* Drop Shadow Tab */}
            <div
              onClick={() => setActiveTab('dropShadow')}
              className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                activeTab === 'dropShadow' ? 'bg-[#007acc] text-white font-medium' : 'hover:bg-[#2c2c2c] text-gray-300'
              }`}
            >
              <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={effects.dropShadow?.enabled || false}
                  onChange={(e) =>
                    setEffects({
                      ...effects,
                      dropShadow: {
                        ...(effects.dropShadow || { color: '#000000', blur: 15, offsetX: 0, offsetY: 8, opacity: 60 }),
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded bg-[#141414] border-gray-500"
                />
                <span>Drop Shadow</span>
              </label>
            </div>

            {/* Stroke Tab */}
            <div
              onClick={() => setActiveTab('stroke')}
              className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                activeTab === 'stroke' ? 'bg-[#007acc] text-white font-medium' : 'hover:bg-[#2c2c2c] text-gray-300'
              }`}
            >
              <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={effects.stroke?.enabled || false}
                  onChange={(e) =>
                    setEffects({
                      ...effects,
                      stroke: {
                        ...(effects.stroke || { color: '#ffffff', size: 2, position: 'outside' }),
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded bg-[#141414] border-gray-500"
                />
                <span>Stroke Border</span>
              </label>
            </div>

            {/* Color Overlay Tab */}
            <div
              onClick={() => setActiveTab('colorOverlay')}
              className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                activeTab === 'colorOverlay' ? 'bg-[#007acc] text-white font-medium' : 'hover:bg-[#2c2c2c] text-gray-300'
              }`}
            >
              <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={effects.colorOverlay?.enabled || false}
                  onChange={(e) =>
                    setEffects({
                      ...effects,
                      colorOverlay: {
                        ...(effects.colorOverlay || { color: '#3b82f6', opacity: 100 }),
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded bg-[#141414] border-gray-500"
                />
                <span>Color Overlay</span>
              </label>
            </div>

            {/* Outer Glow Tab */}
            <div
              onClick={() => setActiveTab('outerGlow')}
              className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                activeTab === 'outerGlow' ? 'bg-[#007acc] text-white font-medium' : 'hover:bg-[#2c2c2c] text-gray-300'
              }`}
            >
              <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={effects.outerGlow?.enabled || false}
                  onChange={(e) =>
                    setEffects({
                      ...effects,
                      outerGlow: {
                        ...(effects.outerGlow || { color: '#00c8ff', blur: 20, opacity: 80 }),
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded bg-[#141414] border-gray-500"
                />
                <span>Outer Glow</span>
              </label>
            </div>
          </div>

          {/* Right: Effect Configuration Controls */}
          <div className="flex-1 bg-[#252526] p-4 flex flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-4">
              {activeTab === 'dropShadow' && (
                <>
                  <div className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider border-b border-[#333333] pb-2">
                    Drop Shadow Structure
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Shadow Color:</span>
                    <input
                      type="color"
                      value={effects.dropShadow?.color || '#000000'}
                      onChange={(e) =>
                        setEffects({
                          ...effects,
                          dropShadow: {
                            ...(effects.dropShadow || { enabled: true, color: '#000000', blur: 15, offsetX: 0, offsetY: 8, opacity: 60 }),
                            color: e.target.value,
                          },
                        })
                      }
                      className="w-8 h-8 rounded border border-gray-500 cursor-pointer bg-transparent"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Opacity:</span>
                      <span className="font-mono text-white">{effects.dropShadow?.opacity || 60}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={effects.dropShadow?.opacity || 60}
                      onChange={(e) =>
                        setEffects({
                          ...effects,
                          dropShadow: {
                            ...(effects.dropShadow || { enabled: true, color: '#000000', blur: 15, offsetX: 0, offsetY: 8, opacity: 60 }),
                            opacity: Number(e.target.value),
                          },
                        })
                      }
                      className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Blur / Size:</span>
                      <span className="font-mono text-white">{effects.dropShadow?.blur || 15}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={effects.dropShadow?.blur || 15}
                      onChange={(e) =>
                        setEffects({
                          ...effects,
                          dropShadow: {
                            ...(effects.dropShadow || { enabled: true, color: '#000000', blur: 15, offsetX: 0, offsetY: 8, opacity: 60 }),
                            blur: Number(e.target.value),
                          },
                        })
                      }
                      className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-400">Offset X:</span>
                      <input
                        type="number"
                        value={effects.dropShadow?.offsetX || 0}
                        onChange={(e) =>
                          setEffects({
                            ...effects,
                            dropShadow: {
                              ...(effects.dropShadow || { enabled: true, color: '#000000', blur: 15, offsetX: 0, offsetY: 8, opacity: 60 }),
                              offsetX: Number(e.target.value),
                            },
                          })
                        }
                        className="bg-[#141414] border border-[#3e3e42] rounded px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-400">Offset Y:</span>
                      <input
                        type="number"
                        value={effects.dropShadow?.offsetY || 8}
                        onChange={(e) =>
                          setEffects({
                            ...effects,
                            dropShadow: {
                              ...(effects.dropShadow || { enabled: true, color: '#000000', blur: 15, offsetX: 0, offsetY: 8, opacity: 60 }),
                              offsetY: Number(e.target.value),
                            },
                          })
                        }
                        className="bg-[#141414] border border-[#3e3e42] rounded px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'stroke' && (
                <>
                  <div className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider border-b border-[#333333] pb-2">
                    Stroke Border
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Stroke Color:</span>
                    <input
                      type="color"
                      value={effects.stroke?.color || '#ffffff'}
                      onChange={(e) =>
                        setEffects({
                          ...effects,
                          stroke: {
                            ...(effects.stroke || { enabled: true, color: '#ffffff', size: 2, position: 'outside' }),
                            color: e.target.value,
                          },
                        })
                      }
                      className="w-8 h-8 rounded border border-gray-500 cursor-pointer bg-transparent"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Size:</span>
                      <span className="font-mono text-white">{effects.stroke?.size || 2}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="40"
                      value={effects.stroke?.size || 2}
                      onChange={(e) =>
                        setEffects({
                          ...effects,
                          stroke: {
                            ...(effects.stroke || { enabled: true, color: '#ffffff', size: 2, position: 'outside' }),
                            size: Number(e.target.value),
                          },
                        })
                      }
                      className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                    />
                  </div>
                </>
              )}

              {activeTab === 'colorOverlay' && (
                <>
                  <div className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider border-b border-[#333333] pb-2">
                    Color Overlay
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Fill Color:</span>
                    <input
                      type="color"
                      value={effects.colorOverlay?.color || '#3b82f6'}
                      onChange={(e) =>
                        setEffects({
                          ...effects,
                          colorOverlay: {
                            ...(effects.colorOverlay || { enabled: true, color: '#3b82f6', opacity: 100 }),
                            color: e.target.value,
                          },
                        })
                      }
                      className="w-8 h-8 rounded border border-gray-500 cursor-pointer bg-transparent"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Opacity:</span>
                      <span className="font-mono text-white">{effects.colorOverlay?.opacity || 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={effects.colorOverlay?.opacity || 100}
                      onChange={(e) =>
                        setEffects({
                          ...effects,
                          colorOverlay: {
                            ...(effects.colorOverlay || { enabled: true, color: '#3b82f6', opacity: 100 }),
                            opacity: Number(e.target.value),
                          },
                        })
                      }
                      className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                    />
                  </div>
                </>
              )}

              {activeTab === 'outerGlow' && (
                <>
                  <div className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider border-b border-[#333333] pb-2">
                    Outer Glow
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Glow Color:</span>
                    <input
                      type="color"
                      value={effects.outerGlow?.color || '#00c8ff'}
                      onChange={(e) =>
                        setEffects({
                          ...effects,
                          outerGlow: {
                            ...(effects.outerGlow || { enabled: true, color: '#00c8ff', blur: 20, opacity: 80 }),
                            color: e.target.value,
                          },
                        })
                      }
                      className="w-8 h-8 rounded border border-gray-500 cursor-pointer bg-transparent"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Blur Size:</span>
                      <span className="font-mono text-white">{effects.outerGlow?.blur || 20}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="80"
                      value={effects.outerGlow?.blur || 20}
                      onChange={(e) =>
                        setEffects({
                          ...effects,
                          outerGlow: {
                            ...(effects.outerGlow || { enabled: true, color: '#00c8ff', blur: 20, opacity: 80 }),
                            blur: Number(e.target.value),
                          },
                        })
                      }
                      className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#333333]">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded bg-[#333333] hover:bg-[#444444] text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-5 py-1.5 rounded bg-[#007acc] hover:bg-[#0098ff] text-white font-semibold shadow-md transition-colors flex items-center gap-1"
              >
                <Check size={14} />
                <span>OK</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
