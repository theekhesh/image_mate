/**
 * ImageMate Studio - Image Adjustments Modal
 */

import React, { useState } from 'react';
import { AdjustmentType, Layer } from '../../types/imagemate';
import { X, Check, RotateCcw, Sliders } from 'lucide-react';

interface ImageAdjustmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  adjustmentType: AdjustmentType | null;
  activeLayer: Layer | null;
  onApplyAdjustment: (params: Record<string, number | string>) => void;
}

export const ImageAdjustmentsModal: React.FC<ImageAdjustmentsModalProps> = ({
  isOpen,
  onClose,
  adjustmentType,
  activeLayer,
  onApplyAdjustment,
}) => {
  const [params, setParams] = useState<Record<string, number>>({
    brightness: 0,
    contrast: 0,
    hue: 0,
    saturation: 0,
    lightness: 0,
    cyanRed: 0,
    magentaGreen: 0,
    yellowBlue: 0,
    levelsInBlack: 0,
    levelsGamma: 1,
    levelsInWhite: 255,
    levelsOutBlack: 0,
    levelsOutWhite: 255,
    threshold: 128,
    posterizeLevels: 4,
    sepiaIntensity: 100,
  });

  if (!isOpen || !adjustmentType) return null;

  const handleApply = () => {
    onApplyAdjustment(params);
    onClose();
  };

  const getTitle = () => {
    switch (adjustmentType) {
      case 'brightness-contrast':
        return 'Brightness / Contrast';
      case 'hue-saturation':
        return 'Hue / Saturation';
      case 'levels':
        return 'Levels Adjustment';
      case 'curves':
        return 'Curves Tone Mapping';
      case 'color-balance':
        return 'Color Balance';
      case 'black-white':
        return 'Black & White Conversion';
      case 'invert':
        return 'Invert Colors';
      case 'sepia':
        return 'Sepia Tone';
      case 'posterize':
        return 'Posterize';
      case 'threshold':
        return 'Threshold Binary';
      default:
        return 'Image Adjustment';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 select-none">
      <div className="bg-[#252526] border border-[#3e3e42] rounded-xl shadow-2xl w-full max-w-md text-xs text-[#cccccc] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-[#1e1e1e] border-b border-[#333333] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-[#00c8ff]" />
            <span className="font-bold text-sm text-white">{getTitle()}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#333333]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sliders Content */}
        <div className="p-4 flex flex-col gap-4 bg-[#202020]">
          {/* Brightness & Contrast */}
          {adjustmentType === 'brightness-contrast' && (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Brightness:</span>
                  <span className="font-mono text-white">{params.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={params.brightness}
                  onChange={(e) => setParams({ ...params, brightness: Number(e.target.value) })}
                  className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Contrast:</span>
                  <span className="font-mono text-white">{params.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={params.contrast}
                  onChange={(e) => setParams({ ...params, contrast: Number(e.target.value) })}
                  className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                />
              </div>
            </>
          )}

          {/* Hue / Saturation */}
          {adjustmentType === 'hue-saturation' && (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Hue:</span>
                  <span className="font-mono text-white">{params.hue}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={params.hue}
                  onChange={(e) => setParams({ ...params, hue: Number(e.target.value) })}
                  className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Saturation:</span>
                  <span className="font-mono text-white">{params.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={params.saturation}
                  onChange={(e) => setParams({ ...params, saturation: Number(e.target.value) })}
                  className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Lightness:</span>
                  <span className="font-mono text-white">{params.lightness}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={params.lightness}
                  onChange={(e) => setParams({ ...params, lightness: Number(e.target.value) })}
                  className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                />
              </div>
            </>
          )}

          {/* Color Balance */}
          {adjustmentType === 'color-balance' && (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-cyan-400">Cyan</span>
                  <span className="font-mono text-white">{params.cyanRed}</span>
                  <span className="text-red-400">Red</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={params.cyanRed}
                  onChange={(e) => setParams({ ...params, cyanRed: Number(e.target.value) })}
                  className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-pink-400">Magenta</span>
                  <span className="font-mono text-white">{params.magentaGreen}</span>
                  <span className="text-green-400">Green</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={params.magentaGreen}
                  onChange={(e) => setParams({ ...params, magentaGreen: Number(e.target.value) })}
                  className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-yellow-400">Yellow</span>
                  <span className="font-mono text-white">{params.yellowBlue}</span>
                  <span className="text-blue-400">Blue</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={params.yellowBlue}
                  onChange={(e) => setParams({ ...params, yellowBlue: Number(e.target.value) })}
                  className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                />
              </div>
            </>
          )}

          {/* Levels */}
          {adjustmentType === 'levels' && (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Input Black Point:</span>
                  <span className="font-mono text-white">{params.levelsInBlack}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="254"
                  value={params.levelsInBlack}
                  onChange={(e) => setParams({ ...params, levelsInBlack: Number(e.target.value) })}
                  className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Midtones Gamma:</span>
                  <span className="font-mono text-white">{params.levelsGamma.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.05"
                  value={params.levelsGamma}
                  onChange={(e) => setParams({ ...params, levelsGamma: Number(e.target.value) })}
                  className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Input White Point:</span>
                  <span className="font-mono text-white">{params.levelsInWhite}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="255"
                  value={params.levelsInWhite}
                  onChange={(e) => setParams({ ...params, levelsInWhite: Number(e.target.value) })}
                  className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
                />
              </div>
            </>
          )}

          {/* Posterize */}
          {adjustmentType === 'posterize' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Posterize Levels:</span>
                <span className="font-mono text-white">{params.posterizeLevels}</span>
              </div>
              <input
                type="range"
                min="2"
                max="16"
                value={params.posterizeLevels}
                onChange={(e) => setParams({ ...params, posterizeLevels: Number(e.target.value) })}
                className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
              />
            </div>
          )}

          {/* Threshold */}
          {adjustmentType === 'threshold' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Threshold Level:</span>
                <span className="font-mono text-white">{params.threshold}</span>
              </div>
              <input
                type="range"
                min="1"
                max="254"
                value={params.threshold}
                onChange={(e) => setParams({ ...params, threshold: Number(e.target.value) })}
                className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
              />
            </div>
          )}

          {/* Sepia */}
          {adjustmentType === 'sepia' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Intensity:</span>
                <span className="font-mono text-white">{params.sepiaIntensity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={params.sepiaIntensity}
                onChange={(e) => setParams({ ...params, sepiaIntensity: Number(e.target.value) })}
                className="accent-[#007acc] h-1.5 bg-[#141414] rounded"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-[#1e1e1e] border-t border-[#333333] flex justify-between items-center">
          <button
            onClick={() =>
              setParams({
                brightness: 0,
                contrast: 0,
                hue: 0,
                saturation: 0,
                lightness: 0,
                cyanRed: 0,
                magentaGreen: 0,
                yellowBlue: 0,
                levelsInBlack: 0,
                levelsGamma: 1,
                levelsInWhite: 255,
                levelsOutBlack: 0,
                levelsOutWhite: 255,
                threshold: 128,
                posterizeLevels: 4,
                sepiaIntensity: 100,
              })
            }
            className="flex items-center gap-1 text-gray-400 hover:text-white"
          >
            <RotateCcw size={12} />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
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
              <span>OK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
