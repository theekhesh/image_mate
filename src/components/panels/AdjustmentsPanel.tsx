/**
 * Photoshop Web Studio - 1-Click Adjustments Panel
 */

import React from 'react';
import { AdjustmentType } from '../../types/photoshop';
import {
  Sun,
  Sliders,
  Activity,
  Palette,
  Eye,
  CircleDot,
  Sparkles,
  Contrast,
  Split,
  Layers,
} from 'lucide-react';

interface AdjustmentsPanelProps {
  onApplyAdjustment: (type: AdjustmentType) => void;
}

export const AdjustmentsPanel: React.FC<AdjustmentsPanelProps> = ({
  onApplyAdjustment,
}) => {
  const adjustments: {
    type: AdjustmentType;
    label: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      type: 'brightness-contrast',
      label: 'Brightness/Contrast',
      icon: <Sun size={15} />,
      color: 'text-amber-400',
    },
    {
      type: 'levels',
      label: 'Levels',
      icon: <Sliders size={15} />,
      color: 'text-blue-400',
    },
    {
      type: 'curves',
      label: 'Curves',
      icon: <Activity size={15} />,
      color: 'text-cyan-400',
    },
    {
      type: 'exposure',
      label: 'Exposure',
      icon: <Contrast size={15} />,
      color: 'text-yellow-400',
    },
    {
      type: 'vibrance',
      label: 'Vibrance',
      icon: <Sparkles size={15} />,
      color: 'text-pink-400',
    },
    {
      type: 'hue-saturation',
      label: 'Hue/Saturation',
      icon: <Palette size={15} />,
      color: 'text-emerald-400',
    },
    {
      type: 'color-balance',
      label: 'Color Balance',
      icon: <Split size={15} />,
      color: 'text-indigo-400',
    },
    {
      type: 'black-white',
      label: 'Black & White',
      icon: <CircleDot size={15} />,
      color: 'text-gray-300',
    },
    {
      type: 'photo-filter',
      label: 'Photo Filter',
      icon: <Layers size={15} />,
      color: 'text-orange-400',
    },
    {
      type: 'invert',
      label: 'Invert',
      icon: <Eye size={15} />,
      color: 'text-purple-400',
    },
    {
      type: 'posterize',
      label: 'Posterize',
      icon: <Layers size={15} />,
      color: 'text-rose-400',
    },
    {
      type: 'threshold',
      label: 'Threshold',
      icon: <Contrast size={15} />,
      color: 'text-teal-400',
    },
  ];

  return (
    <div className="p-3 bg-[#202020] text-xs text-[#cccccc] flex flex-col gap-2 select-none">
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        Adjustment Layers
      </div>

      <div className="grid grid-cols-4 gap-1.5 bg-[#181818] p-2 rounded border border-[#2d2d2d]">
        {adjustments.map((adj) => (
          <button
            key={adj.type}
            id={`adj-btn-${adj.type}`}
            onClick={() => onApplyAdjustment(adj.type)}
            title={adj.label}
            className="flex flex-col items-center justify-center p-2 rounded hover:bg-[#2a2a2a] hover:scale-105 transition-all text-gray-300 hover:text-white group border border-transparent hover:border-[#3e3e42]"
          >
            <div className={`${adj.color} mb-1 group-hover:scale-110 transition-transform`}>
              {adj.icon}
            </div>
            <span className="text-[9px] text-center text-gray-400 group-hover:text-gray-200 line-clamp-1">
              {adj.label.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
