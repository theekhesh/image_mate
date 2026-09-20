/**
 * Photoshop Web Studio - History & Snapshots Panel
 */

import React from 'react';
import { HistoryStep } from '../../types/photoshop';
import { History, Camera, CornerUpLeft } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryStep[];
  currentIndex: number;
  onJumpToStep: (index: number) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  currentIndex,
  onJumpToStep,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#202020] text-xs text-[#cccccc] select-none">
      {/* Header */}
      <div className="p-2 border-b border-[#2d2d2d] bg-[#252526] flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium text-gray-300">
          <History size={13} className="text-[#00c8ff]" />
          <span>History States ({history.length})</span>
        </div>
      </div>

      {/* States Stack */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {history.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isUndone = idx > currentIndex;

          return (
            <div
              key={step.id}
              onClick={() => onJumpToStep(idx)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                isActive
                  ? 'bg-[#007acc] text-white font-semibold shadow-sm'
                  : isUndone
                  ? 'text-gray-600 hover:bg-[#252526] hover:text-gray-400'
                  : 'text-gray-300 hover:bg-[#282828] hover:text-white'
              }`}
            >
              <CornerUpLeft size={12} className={isActive ? 'text-white' : 'text-gray-500'} />
              <span className="truncate flex-1">{step.name}</span>
              <span className="text-[10px] opacity-60 font-mono">
                {idx === 0 ? 'Init' : `#${idx}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
