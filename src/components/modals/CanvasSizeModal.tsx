/**
 * ImageMate Studio - Canvas Size & Image Size Modal
 */

import React, { useState } from 'react';
import { DocumentProject } from '../../types/imagemate';
import { X, Check, Scaling, Lock, Unlock } from 'lucide-react';

interface CanvasSizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentProject;
  mode: 'canvas' | 'image';
  onResize: (newWidth: number, newHeight: number, mode: 'canvas' | 'image') => void;
}

export const CanvasSizeModal: React.FC<CanvasSizeModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  mode,
  onResize,
}) => {
  const [width, setWidth] = useState(doc.width);
  const [height, setHeight] = useState(doc.height);
  const [lockAspect, setLockAspect] = useState(true);
  const aspectRatio = doc.width / doc.height;

  if (!isOpen) return null;

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && val > 0) {
      setHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && val > 0) {
      setWidth(Math.round(val * aspectRatio));
    }
  };

  const handleApply = () => {
    if (width > 0 && height > 0) {
      onResize(width, height, mode);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 select-none">
      <div className="bg-[#252526] border border-[#3e3e42] rounded-xl shadow-2xl w-full max-w-sm text-xs text-[#cccccc] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-[#1e1e1e] border-b border-[#333333] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scaling size={16} className="text-[#00c8ff]" />
            <span className="font-bold text-sm text-white">
              {mode === 'canvas' ? 'Canvas Size' : 'Image Size Resample'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#333333]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Inputs */}
        <div className="p-4 flex flex-col gap-4 bg-[#202020]">
          <div className="flex items-center justify-between text-gray-400">
            <span>Current Size:</span>
            <span className="font-mono text-white">
              {doc.width} × {doc.height} px
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Width (px):</span>
                <input
                  type="number"
                  min="1"
                  max="8192"
                  value={width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-24 bg-[#141414] border border-[#3e3e42] rounded px-2 py-1 text-right font-mono text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Height (px):</span>
                <input
                  type="number"
                  min="1"
                  max="8192"
                  value={height}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-24 bg-[#141414] border border-[#3e3e42] rounded px-2 py-1 text-right font-mono text-white"
                />
              </div>
            </div>

            <button
              onClick={() => setLockAspect(!lockAspect)}
              title={lockAspect ? 'Constrain Proportions' : 'Unlock Proportions'}
              className={`p-2 rounded border border-[#3e3e42] ${
                lockAspect ? 'bg-[#007acc] text-white' : 'bg-[#181818] text-gray-400 hover:text-white'
              }`}
            >
              {lockAspect ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#1e1e1e] border-t border-[#333333] flex justify-end gap-2">
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
  );
};
