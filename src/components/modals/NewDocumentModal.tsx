/**
 * ImageMate Studio - New Document Modal
 */

import React, { useState } from 'react';
import { CANVAS_PRESETS } from '../../utils/sampleProjects';
import { X, Plus, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDocument: (
    title: string,
    width: number,
    height: number,
    dpi: number,
    bg: 'transparent' | 'white' | 'black' | 'custom',
    bgColor: string
  ) => void;
  onOpenSample: (sampleType: 'cyberpunk' | 'brand') => void;
}

export const NewDocumentModal: React.FC<NewDocumentModalProps> = ({
  isOpen,
  onClose,
  onCreateDocument,
  onOpenSample,
}) => {
  const [title, setTitle] = useState('Untitled-1.psd');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [dpi, setDpi] = useState(72);
  const [bg, setBg] = useState<'transparent' | 'white' | 'black' | 'custom'>('white');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [selectedCategory, setSelectedCategory] = useState(CANVAS_PRESETS[0].category);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: { name: string; width: number; height: number; dpi: number }) => {
    setTitle(`${preset.name}.psd`);
    setWidth(preset.width);
    setHeight(preset.height);
    setDpi(preset.dpi);
  };

  const handleCreate = () => {
    onCreateDocument(title, width, height, dpi, bg, bgColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 select-none">
      <div className="bg-[#252526] border border-[#3e3e42] rounded-xl shadow-2xl w-full max-w-2xl text-xs text-[#cccccc] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#1e1e1e] border-b border-[#333333] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#00c8ff]" />
            <span className="font-bold text-sm text-white">New Document</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#333333]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Presets Categories */}
          <div className="w-full md:w-3/5 p-4 border-b md:border-b-0 md:border-r border-[#333333] flex flex-col gap-4 overflow-y-auto">
            {/* Built-in Sample Project Buttons */}
            <div className="flex flex-col gap-1.5 bg-[#181818] p-3 rounded-lg border border-[#333333]">
              <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Featured Sample Artwork</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => {
                    onOpenSample('cyberpunk');
                    onClose();
                  }}
                  className="p-2.5 rounded bg-gradient-to-br from-[#120b29] to-[#05192d] border border-cyan-500/30 hover:border-cyan-400 text-left hover:scale-[1.02] transition-all group"
                >
                  <div className="font-bold text-cyan-300 group-hover:text-cyan-200">Cyberpunk 2088</div>
                  <div className="text-[10px] text-gray-400">1280x720 • Neon Glow</div>
                </button>
                <button
                  onClick={() => {
                    onOpenSample('brand');
                    onClose();
                  }}
                  className="p-2.5 rounded bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-blue-500/30 hover:border-blue-400 text-left hover:scale-[1.02] transition-all group"
                >
                  <div className="font-bold text-blue-300 group-hover:text-blue-200">Brand Identity</div>
                  <div className="text-[10px] text-gray-400">1200x630 • Vector UI</div>
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 border-b border-[#333333] pb-1">
              {CANVAS_PRESETS.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    selectedCategory === cat.category
                      ? 'bg-[#007acc] text-white font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-[#333333]'
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2">
              {CANVAS_PRESETS.find((c) => c.category === selectedCategory)?.presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleSelectPreset(preset)}
                  className="p-3 bg-[#1e1e1e] hover:bg-[#2e2e2e] border border-[#3e3e42] hover:border-[#007acc] rounded-lg text-left transition-all"
                >
                  <div className="font-semibold text-gray-200">{preset.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {preset.width} × {preset.height} px ({preset.dpi} DPI)
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Preset Details & Custom Settings */}
          <div className="w-full md:w-2/5 p-4 flex flex-col gap-3 justify-between bg-[#202020]">
            <div className="flex flex-col gap-3">
              <div className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                Document Details
              </div>

              {/* Document Title */}
              <div className="flex flex-col gap-1">
                <span className="text-gray-400">Name:</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-[#181818] border border-[#3e3e42] rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-400">Width (px):</span>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="bg-[#181818] border border-[#3e3e42] rounded px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-400">Height (px):</span>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="bg-[#181818] border border-[#3e3e42] rounded px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Resolution (DPI) */}
              <div className="flex flex-col gap-1">
                <span className="text-gray-400">Resolution (DPI):</span>
                <input
                  type="number"
                  value={dpi}
                  onChange={(e) => setDpi(Number(e.target.value))}
                  className="bg-[#181818] border border-[#3e3e42] rounded px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              {/* Background Contents */}
              <div className="flex flex-col gap-1">
                <span className="text-gray-400">Background Contents:</span>
                <select
                  value={bg}
                  onChange={(e) => setBg(e.target.value as any)}
                  className="bg-[#181818] border border-[#3e3e42] rounded px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="white">White</option>
                  <option value="transparent">Transparent</option>
                  <option value="black">Black</option>
                  <option value="custom">Custom Color</option>
                </select>
              </div>

              {bg === 'custom' && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Custom Color:</span>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-500 cursor-pointer bg-transparent"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#333333]">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded bg-[#333333] hover:bg-[#444444] text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-5 py-1.5 rounded bg-[#007acc] hover:bg-[#0098ff] text-white font-semibold shadow-md transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
