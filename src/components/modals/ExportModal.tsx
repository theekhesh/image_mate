/**
 * ImageMate Studio - Quick Export As Modal
 */

import React, { useState } from 'react';
import { DocumentProject } from '../../types/imagemate';
import { FileExporter } from '../../utils/fileExporter';
import { Download, X, FileImage, Layers } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentProject;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  document: doc,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp' | 'imate'>('png');
  const [scale, setScale] = useState<number>(1);
  const [quality, setQuality] = useState<number>(92);
  const [includeBg, setIncludeBg] = useState<boolean>(true);

  if (!isOpen) return null;

  const outWidth = Math.round(doc.width * scale);
  const outHeight = Math.round(doc.height * scale);

  const handleExport = () => {
    if (format === 'imate') {
      FileExporter.saveImateDocument(doc);
    } else {
      FileExporter.downloadImage(doc, format, quality / 100, scale, includeBg);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 select-none">
      <div className="bg-[#252526] border border-[#3e3e42] rounded-xl shadow-2xl w-full max-w-md text-xs text-[#cccccc] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-[#1e1e1e] border-b border-[#333333] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-[#00c8ff]" />
            <span className="font-bold text-sm text-white">Export As</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#333333]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 flex flex-col gap-4 bg-[#202020]">
          {/* Format Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-gray-400 font-semibold">Format:</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(['png', 'jpeg', 'webp', 'imate'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`py-2 rounded font-semibold text-xs uppercase transition-colors ${
                    format === fmt
                      ? 'bg-[#007acc] text-white shadow-sm'
                      : 'bg-[#181818] text-gray-400 hover:bg-[#282828] hover:text-white border border-[#333333]'
                  }`}
                >
                  {fmt === 'imate' ? '.IMATE' : fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Scale Resolution */}
          {format !== 'imate' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-gray-400 font-semibold">Scale Resolution:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.5, 1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`py-1.5 rounded font-mono text-xs transition-colors ${
                      scale === s
                        ? 'bg-[#007acc] text-white font-bold'
                        : 'bg-[#181818] text-gray-400 hover:bg-[#282828] border border-[#333333]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* JPEG / WebP Quality Slider */}
          {(format === 'jpeg' || format === 'webp') && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Quality:</span>
                <span className="font-mono text-white">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="accent-[var(--theme-accent)] h-1.5 bg-[#141414] rounded"
              />
            </div>
          )}

          {/* Dimensions Output Summary */}
          <div className="bg-[#181818] p-3 rounded border border-[#333333] flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Export Dimensions:</span>
              <span className="font-mono text-cyan-300 font-semibold">
                {outWidth} × {outHeight} px
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Layers:</span>
              <span className="text-gray-200">{doc.layers.length} Layers</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-[#1e1e1e] border-t border-[#333333] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#333333] hover:bg-[#444444] text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-1.5 rounded bg-[#007acc] hover:bg-[#0098ff] text-white font-semibold shadow-md transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
