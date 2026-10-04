/**
 * ImageMate Studio - Filter Gallery Studio Modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { Layer } from '../../types/imagemate';
import { FilterEngine } from '../../utils/filterEngine';
import { Sparkles, X, Check, Eye } from 'lucide-react';

interface FilterGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayer: Layer | null;
  onApplyFilter: (newCanvas: HTMLCanvasElement, filterName: string) => void;
}

type FilterCategory = 'blur' | 'sharpen' | 'stylize' | 'distort' | 'noise' | 'artistic';

export const FilterGalleryModal: React.FC<FilterGalleryModalProps> = ({
  isOpen,
  onClose,
  activeLayer,
  onApplyFilter,
}) => {
  const [category, setCategory] = useState<FilterCategory>('blur');
  const [activeFilter, setActiveFilter] = useState<string>('gaussian');
  const [params, setParams] = useState<Record<string, number>>({
    radius: 6,
    amount: 50,
    blockSize: 10,
    offset: 12,
    intensity: 80,
  });

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const srcImageDataRef = useRef<ImageData | null>(null);

  // Cache source layer image data when opening modal
  useEffect(() => {
    if (!isOpen || !activeLayer) return;

    let sourceCanvas = activeLayer.canvas;
    if (!sourceCanvas) {
      sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = Math.max(1, activeLayer.width);
      sourceCanvas.height = Math.max(1, activeLayer.height);
      const ctx = sourceCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
      }
    }

    const ctx = sourceCanvas.getContext('2d');
    if (ctx) {
      try {
        srcImageDataRef.current = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      } catch {
        srcImageDataRef.current = null;
      }
    }
  }, [isOpen, activeLayer]);

  // Compute live filter preview
  useEffect(() => {
    if (!isOpen || !srcImageDataRef.current || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const src = srcImageDataRef.current;
    let filtered = src;

    if (activeFilter === 'gaussian') {
      filtered = FilterEngine.applyGaussianBlur(src, params.radius);
    } else if (activeFilter === 'sharpen') {
      filtered = FilterEngine.applySharpen(src, params.amount);
    } else if (activeFilter === 'pixelate') {
      filtered = FilterEngine.applyPixelate(src, params.blockSize);
    } else if (activeFilter === 'emboss') {
      filtered = FilterEngine.applyEmboss(src, params.intensity / 50);
    } else if (activeFilter === 'findEdges') {
      filtered = FilterEngine.applyFindEdges(src);
    } else if (activeFilter === 'glitch') {
      filtered = FilterEngine.applyGlitchRgbSplit(src, params.offset);
    } else if (activeFilter === 'vignette') {
      filtered = FilterEngine.applyVignette(src, params.amount);
    } else if (activeFilter === 'noise') {
      filtered = FilterEngine.applyNoise(src, params.amount, false);
    } else if (activeFilter === 'tealOrange') {
      filtered = FilterEngine.applyTealAndOrange(src);
    } else if (activeFilter === 'sepia') {
      filtered = FilterEngine.applySepia(src, params.intensity);
    } else if (activeFilter === 'autoEnhance') {
      filtered = FilterEngine.applyAutoEnhance(src);
    }

    // Render scaled preview on canvas
    canvas.width = src.width;
    canvas.height = src.height;
    ctx.putImageData(filtered, 0, 0);
  }, [isOpen, activeFilter, params]);

  if (!isOpen) return null;

  const handleApply = () => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = previewCanvas.width;
    resultCanvas.height = previewCanvas.height;
    const rCtx = resultCanvas.getContext('2d');
    if (rCtx) {
      rCtx.drawImage(previewCanvas, 0, 0);
    }

    onApplyFilter(resultCanvas, activeFilter);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="bg-[#252526] border border-[#3e3e42] rounded-xl shadow-2xl w-full max-w-4xl text-xs text-[#cccccc] overflow-hidden flex flex-col h-[80vh]">
        {/* Top Header */}
        <div className="px-4 py-3 bg-[#1e1e1e] border-b border-[#333333] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400" />
            <span className="font-bold text-sm text-white">Filter Gallery Studio</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#333333]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Filter Categories & Items */}
          <div className="w-64 bg-[#202020] border-r border-[#333333] flex flex-col p-3 gap-2 overflow-y-auto">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Filter Categories
            </div>

            {/* Category Selectors */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setCategory('blur');
                  setActiveFilter('gaussian');
                }}
                className={`text-left px-2.5 py-1.5 rounded transition-colors ${
                  category === 'blur' ? 'bg-[#007acc] text-white font-medium' : 'text-gray-300 hover:bg-[#2e2e2e]'
                }`}
              >
                Blur Filters
              </button>
              <button
                onClick={() => {
                  setCategory('sharpen');
                  setActiveFilter('sharpen');
                }}
                className={`text-left px-2.5 py-1.5 rounded transition-colors ${
                  category === 'sharpen' ? 'bg-[#007acc] text-white font-medium' : 'text-gray-300 hover:bg-[#2e2e2e]'
                }`}
              >
                Sharpen Filters
              </button>
              <button
                onClick={() => {
                  setCategory('stylize');
                  setActiveFilter('pixelate');
                }}
                className={`text-left px-2.5 py-1.5 rounded transition-colors ${
                  category === 'stylize' ? 'bg-[#007acc] text-white font-medium' : 'text-gray-300 hover:bg-[#2e2e2e]'
                }`}
              >
                Stylize & Pixelate
              </button>
              <button
                onClick={() => {
                  setCategory('distort');
                  setActiveFilter('glitch');
                }}
                className={`text-left px-2.5 py-1.5 rounded transition-colors ${
                  category === 'distort' ? 'bg-[#007acc] text-white font-medium' : 'text-gray-300 hover:bg-[#2e2e2e]'
                }`}
              >
                Distort & Lens
              </button>
              <button
                onClick={() => {
                  setCategory('noise');
                  setActiveFilter('noise');
                }}
                className={`text-left px-2.5 py-1.5 rounded transition-colors ${
                  category === 'noise' ? 'bg-[#007acc] text-white font-medium' : 'text-gray-300 hover:bg-[#2e2e2e]'
                }`}
              >
                Noise & Grain
              </button>
              <button
                onClick={() => {
                  setCategory('artistic');
                  setActiveFilter('tealOrange');
                }}
                className={`text-left px-2.5 py-1.5 rounded transition-colors ${
                  category === 'artistic' ? 'bg-[#007acc] text-white font-medium' : 'text-gray-300 hover:bg-[#2e2e2e]'
                }`}
              >
                AI Creative & Grade
              </button>
            </div>

            {/* Sub-Filters List */}
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-3 pt-2 border-t border-[#333333]">
              Presets
            </div>
            <div className="flex flex-col gap-1">
              {category === 'blur' && (
                <button
                  onClick={() => setActiveFilter('gaussian')}
                  className={`text-left px-2.5 py-1.5 rounded ${
                    activeFilter === 'gaussian' ? 'bg-[#333333] text-cyan-300 font-semibold border border-[#007acc]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Gaussian Blur
                </button>
              )}

              {category === 'sharpen' && (
                <button
                  onClick={() => setActiveFilter('sharpen')}
                  className={`text-left px-2.5 py-1.5 rounded ${
                    activeFilter === 'sharpen' ? 'bg-[#333333] text-cyan-300 font-semibold border border-[#007acc]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Unsharp Mask / Sharpen
                </button>
              )}

              {category === 'stylize' && (
                <>
                  <button
                    onClick={() => setActiveFilter('pixelate')}
                    className={`text-left px-2.5 py-1.5 rounded ${
                      activeFilter === 'pixelate' ? 'bg-[#333333] text-cyan-300 font-semibold border border-[#007acc]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Pixelate / Mosaic
                  </button>
                  <button
                    onClick={() => setActiveFilter('emboss')}
                    className={`text-left px-2.5 py-1.5 rounded ${
                      activeFilter === 'emboss' ? 'bg-[#333333] text-cyan-300 font-semibold border border-[#007acc]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Emboss Relief
                  </button>
                  <button
                    onClick={() => setActiveFilter('findEdges')}
                    className={`text-left px-2.5 py-1.5 rounded ${
                      activeFilter === 'findEdges' ? 'bg-[#333333] text-cyan-300 font-semibold border border-[#007acc]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Find Edges
                  </button>
                </>
              )}

              {category === 'distort' && (
                <>
                  <button
                    onClick={() => setActiveFilter('glitch')}
                    className={`text-left px-2.5 py-1.5 rounded ${
                      activeFilter === 'glitch' ? 'bg-[#333333] text-cyan-300 font-semibold border border-[#007acc]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    RGB Split Glitch
                  </button>
                  <button
                    onClick={() => setActiveFilter('vignette')}
                    className={`text-left px-2.5 py-1.5 rounded ${
                      activeFilter === 'vignette' ? 'bg-[#333333] text-cyan-300 font-semibold border border-[#007acc]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Vignette Lens Shade
                  </button>
                </>
              )}

              {category === 'noise' && (
                <button
                  onClick={() => setActiveFilter('noise')}
                  className={`text-left px-2.5 py-1.5 rounded ${
                    activeFilter === 'noise' ? 'bg-[#333333] text-cyan-300 font-semibold border border-[#007acc]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Add Noise
                </button>
              )}

              {category === 'artistic' && (
                <>
                  <button
                    onClick={() => setActiveFilter('tealOrange')}
                    className={`text-left px-2.5 py-1.5 rounded ${
                      activeFilter === 'tealOrange' ? 'bg-[#333333] text-cyan-300 font-semibold border border-[#007acc]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Cinema Teal & Orange
                  </button>
                  <button
                    onClick={() => setActiveFilter('sepia')}
                    className={`text-left px-2.5 py-1.5 rounded ${
                      activeFilter === 'sepia' ? 'bg-[#333333] text-cyan-300 font-semibold border border-[#007acc]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Vintage Sepia Tone
                  </button>
                  <button
                    onClick={() => setActiveFilter('autoEnhance')}
                    className={`text-left px-2.5 py-1.5 rounded ${
                      activeFilter === 'autoEnhance' ? 'bg-[#333333] text-cyan-300 font-semibold border border-[#007acc]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    AI Smart Auto-Enhance
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Center: Live Preview Stage */}
          <div className="flex-1 bg-[#141414] p-4 flex items-center justify-center overflow-hidden relative shadow-inner">
            <canvas
              ref={previewCanvasRef}
              className="max-w-full max-h-full rounded shadow-lg border border-[#3e3e42] object-contain"
            />
          </div>

          {/* Right: Dynamic Parameters Panel */}
          <div className="w-64 bg-[#202020] border-l border-[#333333] p-4 flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <div className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider border-b border-[#333333] pb-2">
                Filter Parameters
              </div>

              {activeFilter === 'gaussian' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Radius:</span>
                    <span className="font-mono text-white">{params.radius}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={params.radius}
                    onChange={(e) => setParams({ ...params, radius: Number(e.target.value) })}
                    className="accent-[var(--theme-accent)] h-1.5 bg-[#141414] rounded"
                  />
                </div>
              )}

              {activeFilter === 'sharpen' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sharpen Amount:</span>
                    <span className="font-mono text-white">{params.amount}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={params.amount}
                    onChange={(e) => setParams({ ...params, amount: Number(e.target.value) })}
                    className="accent-[var(--theme-accent)] h-1.5 bg-[#141414] rounded"
                  />
                </div>
              )}

              {activeFilter === 'pixelate' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cell Size:</span>
                    <span className="font-mono text-white">{params.blockSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="64"
                    value={params.blockSize}
                    onChange={(e) => setParams({ ...params, blockSize: Number(e.target.value) })}
                    className="accent-[var(--theme-accent)] h-1.5 bg-[#141414] rounded"
                  />
                </div>
              )}

              {activeFilter === 'glitch' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">RGB Shift:</span>
                    <span className="font-mono text-white">{params.offset}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="40"
                    value={params.offset}
                    onChange={(e) => setParams({ ...params, offset: Number(e.target.value) })}
                    className="accent-[var(--theme-accent)] h-1.5 bg-[#141414] rounded"
                  />
                </div>
              )}

              {activeFilter === 'vignette' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shade Amount:</span>
                    <span className="font-mono text-white">{params.amount}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={params.amount}
                    onChange={(e) => setParams({ ...params, amount: Number(e.target.value) })}
                    className="accent-[var(--theme-accent)] h-1.5 bg-[#141414] rounded"
                  />
                </div>
              )}

              {activeFilter === 'noise' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Noise Amount:</span>
                    <span className="font-mono text-white">{params.amount}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={params.amount}
                    onChange={(e) => setParams({ ...params, amount: Number(e.target.value) })}
                    className="accent-[var(--theme-accent)] h-1.5 bg-[#141414] rounded"
                  />
                </div>
              )}

              {activeFilter === 'sepia' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Intensity:</span>
                    <span className="font-mono text-white">{params.intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={params.intensity}
                    onChange={(e) => setParams({ ...params, intensity: Number(e.target.value) })}
                    className="accent-[var(--theme-accent)] h-1.5 bg-[#141414] rounded"
                  />
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#333333]">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-[#333333] hover:bg-[#444444] text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-1.5 rounded bg-[#007acc] hover:bg-[#0098ff] text-white font-semibold shadow-md transition-colors flex items-center gap-1"
              >
                <Check size={14} />
                <span>Apply</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
