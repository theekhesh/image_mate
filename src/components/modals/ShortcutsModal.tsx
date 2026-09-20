/**
 * Photoshop Web Studio - Keyboard Shortcuts Reference Cheat Sheet
 */

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcutSections = [
    {
      title: 'Tools',
      shortcuts: [
        { key: 'V', desc: 'Move & Transform Tool' },
        { key: 'M', desc: 'Marquee Selection Tool' },
        { key: 'L', desc: 'Lasso Selection Tool' },
        { key: 'W', desc: 'Magic Wand Tool' },
        { key: 'C', desc: 'Crop Tool' },
        { key: 'I', desc: 'Eyedropper Color Picker' },
        { key: 'B', desc: 'Brush & Pencil Tool' },
        { key: 'E', desc: 'Eraser Tool' },
        { key: 'S', desc: 'Clone Stamp Tool' },
        { key: 'J', desc: 'Spot Healing Brush' },
        { key: 'G', desc: 'Gradient / Paint Bucket' },
        { key: 'T', desc: 'Type / Text Tool' },
        { key: 'U', desc: 'Rectangle / Vector Shapes' },
        { key: 'H / Space', desc: 'Hand (Pan Canvas)' },
        { key: 'Z', desc: 'Zoom Tool' },
        { key: 'X', desc: 'Swap Foreground/Background' },
        { key: 'D', desc: 'Reset Default Colors (B&W)' },
      ],
    },
    {
      title: 'Layers & Edit',
      shortcuts: [
        { key: 'Ctrl + Z', desc: 'Undo' },
        { key: 'Ctrl + Y', desc: 'Redo' },
        { key: 'Ctrl + J', desc: 'Duplicate Layer' },
        { key: 'Ctrl + E', desc: 'Merge Down' },
        { key: 'Ctrl + Shift + N', desc: 'New Layer' },
        { key: 'Ctrl + Shift + E', desc: 'Flatten Image' },
        { key: 'Del / Backspace', desc: 'Delete Active Layer' },
        { key: 'Ctrl + T', desc: 'Free Transform' },
        { key: 'Ctrl + A', desc: 'Select All' },
        { key: 'Ctrl + D', desc: 'Deselect' },
        { key: 'Ctrl + Shift + I', desc: 'Inverse Selection' },
      ],
    },
    {
      title: 'Navigation & View',
      shortcuts: [
        { key: 'Ctrl + 0', desc: 'Fit Canvas on Screen' },
        { key: 'Ctrl + 1', desc: '100% Actual Pixels' },
        { key: 'Ctrl + R', desc: 'Toggle Pixel Rulers' },
        { key: "Ctrl + '", desc: 'Toggle Grid' },
        { key: 'Alt + Scroll', desc: 'Smooth Canvas Zoom' },
        { key: 'Space + Drag', desc: 'Interactive Pan' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="bg-[#252526] border border-[#3e3e42] rounded-xl shadow-2xl w-full max-w-2xl text-xs text-[#cccccc] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#1e1e1e] border-b border-[#333333] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-[#00c8ff]" />
            <span className="font-bold text-sm text-white">Photoshop Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#333333]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto bg-[#202020]">
          {shortcutSections.map((sec) => (
            <div key={sec.title} className="flex flex-col gap-2">
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider border-b border-[#333333] pb-1">
                {sec.title}
              </div>
              <div className="flex flex-col gap-1.5">
                {sec.shortcuts.map((sc, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-300">{sc.desc}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#141414] border border-[#3e3e42] font-mono text-[10px] text-cyan-300">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#1e1e1e] border-t border-[#333333] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#007acc] hover:bg-[#0098ff] text-white font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
