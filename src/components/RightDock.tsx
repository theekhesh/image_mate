/**
 * ImageMate Studio - Collapsible Right Panel Dock
 */

import React, { useState } from 'react';
import {
  Layers as LayersIcon,
  Sparkles,
  Palette,
  SlidersHorizontal,
  History,
  Compass,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { LayersPanel } from './panels/LayersPanel';
import { ColorPanel } from './panels/ColorPanel';
import { PropertiesPanel } from './panels/PropertiesPanel';
import { HistoryPanel } from './panels/HistoryPanel';
import { NavigatorPanel } from './panels/NavigatorPanel';
import { AdjustmentsPanel } from './panels/AdjustmentsPanel';
import {
  DocumentProject,
  Layer,
  AdjustmentType,
  HistoryStep,
  Point,
} from '../types/imagemate';

interface RightDockProps {
  document: DocumentProject;
  activeLayerId: string | null;
  history: HistoryStep[];
  historyIndex: number;
  fgColor: string;
  bgColor: string;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onAddLayer: () => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onAddAdjustmentLayer: (type: AdjustmentType) => void;
  onAddLayerMask: (id: string) => void;
  onOpenLayerStyles: () => void;
  onChangeFgColor: (color: string) => void;
  onChangeBgColor: (color: string) => void;
  onJumpToHistoryStep: (index: number) => void;
  onSetPan: (pan: Point) => void;
  onSetZoom: (zoom: number) => void;
}

type TabType = 'layers' | 'color' | 'adjustments' | 'properties' | 'history' | 'navigator';

export const RightDock: React.FC<RightDockProps> = ({
  document: doc,
  activeLayerId,
  history,
  historyIndex,
  fgColor,
  bgColor,
  onSelectLayer,
  onUpdateLayer,
  onAddLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onMoveLayer,
  onAddAdjustmentLayer,
  onAddLayerMask,
  onOpenLayerStyles,
  onChangeFgColor,
  onChangeBgColor,
  onJumpToHistoryStep,
  onSetPan,
  onSetZoom,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [topTab, setTopTab] = useState<TabType>('color');
  const [bottomTab, setBottomTab] = useState<TabType>('layers');

  const activeLayer = doc.layers.find((l) => l.id === activeLayerId) || null;

  if (isCollapsed) {
    return (
      <div className="w-10 bg-[#1e1e1e] border-l border-[#2d2d2d] flex flex-col items-center py-2 select-none z-30 shrink-0 h-full justify-between">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setIsCollapsed(false)}
            title="Expand Panels"
            className="p-1.5 rounded hover:bg-[#2d2d2d] text-cyan-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="w-6 h-px bg-[#333333] my-1" />
          <button
            onClick={() => {
              setBottomTab('layers');
              setIsCollapsed(false);
            }}
            title="Layers Panel"
            className="p-1.5 rounded hover:bg-[#2d2d2d] text-gray-400 hover:text-white transition-colors"
          >
            <LayersIcon size={16} />
          </button>
          <button
            onClick={() => {
              setTopTab('color');
              setIsCollapsed(false);
            }}
            title="Color Panel"
            className="p-1.5 rounded hover:bg-[#2d2d2d] text-gray-400 hover:text-white transition-colors"
          >
            <Palette size={16} />
          </button>
          <button
            onClick={() => {
              setTopTab('adjustments');
              setIsCollapsed(false);
            }}
            title="Adjustments"
            className="p-1.5 rounded hover:bg-[#2d2d2d] text-gray-400 hover:text-white transition-colors"
          >
            <Sparkles size={16} />
          </button>
          <button
            onClick={() => {
              setBottomTab('properties');
              setIsCollapsed(false);
            }}
            title="Properties"
            className="p-1.5 rounded hover:bg-[#2d2d2d] text-gray-400 hover:text-white transition-colors"
          >
            <SlidersHorizontal size={16} />
          </button>
          <button
            onClick={() => {
              setBottomTab('history');
              setIsCollapsed(false);
            }}
            title="History"
            className="p-1.5 rounded hover:bg-[#2d2d2d] text-gray-400 hover:text-white transition-colors"
          >
            <History size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 md:w-80 bg-[#202020] border-l border-[#2d2d2d] flex flex-col h-full select-none z-30 shrink-0">
      {/* Top Split Panel (Color / Adjustments / Navigator / Properties) */}
      <div className="h-2/5 flex flex-col border-b border-[#2d2d2d] overflow-hidden">
        {/* Top Panel Tabs Header */}
        <div className="flex bg-[#1e1e1e] border-b border-[#2d2d2d] px-1 pt-1 gap-1 items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => setTopTab('color')}
              className={`px-3 py-1.5 rounded-t text-xs flex items-center gap-1.5 transition-colors ${
                topTab === 'color'
                  ? 'bg-[#202020] text-white font-medium border-t-2 border-[#007acc]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Palette size={13} />
              <span>Color</span>
            </button>
            <button
              onClick={() => setTopTab('adjustments')}
              className={`px-3 py-1.5 rounded-t text-xs flex items-center gap-1.5 transition-colors ${
                topTab === 'adjustments'
                  ? 'bg-[#202020] text-white font-medium border-t-2 border-[#007acc]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles size={13} />
              <span>Adjustments</span>
            </button>
            <button
              onClick={() => setTopTab('navigator')}
              className={`px-3 py-1.5 rounded-t text-xs flex items-center gap-1.5 transition-colors ${
                topTab === 'navigator'
                  ? 'bg-[#202020] text-white font-medium border-t-2 border-[#007acc]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Compass size={13} />
              <span>Navigator</span>
            </button>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            title="Collapse Panels"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#2d2d2d] mr-1"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Top Panel Content */}
        <div className="flex-1 overflow-y-auto">
          {topTab === 'color' && (
            <ColorPanel
              fgColor={fgColor}
              bgColor={bgColor}
              onChangeFgColor={onChangeFgColor}
              onChangeBgColor={onChangeBgColor}
            />
          )}
          {topTab === 'adjustments' && (
            <AdjustmentsPanel onApplyAdjustment={onAddAdjustmentLayer} />
          )}
          {topTab === 'navigator' && (
            <NavigatorPanel
              document={doc}
              onSetPan={onSetPan}
              onSetZoom={onSetZoom}
            />
          )}
        </div>
      </div>

      {/* Bottom Split Panel (Layers / Properties / History) */}
      <div className="h-3/5 flex flex-col overflow-hidden">
        {/* Bottom Panel Tabs Header */}
        <div className="flex bg-[#1e1e1e] border-b border-[#2d2d2d] px-1 pt-1 gap-1">
          <button
            onClick={() => setBottomTab('layers')}
            className={`px-3 py-1.5 rounded-t text-xs flex items-center gap-1.5 transition-colors ${
              bottomTab === 'layers'
                ? 'bg-[#202020] text-white font-medium border-t-2 border-[#007acc]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayersIcon size={13} />
            <span>Layers</span>
          </button>
          <button
            onClick={() => setBottomTab('properties')}
            className={`px-3 py-1.5 rounded-t text-xs flex items-center gap-1.5 transition-colors ${
              bottomTab === 'properties'
                ? 'bg-[#202020] text-white font-medium border-t-2 border-[#007acc]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Properties</span>
          </button>
          <button
            onClick={() => setBottomTab('history')}
            className={`px-3 py-1.5 rounded-t text-xs flex items-center gap-1.5 transition-colors ${
              bottomTab === 'history'
                ? 'bg-[#202020] text-white font-medium border-t-2 border-[#007acc]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <History size={13} />
            <span>History</span>
          </button>
        </div>

        {/* Bottom Panel Content */}
        <div className="flex-1 overflow-y-auto">
          {bottomTab === 'layers' && (
            <LayersPanel
              layers={doc.layers}
              activeLayerId={activeLayerId}
              onSelectLayer={onSelectLayer}
              onUpdateLayer={onUpdateLayer}
              onAddLayer={onAddLayer}
              onDuplicateLayer={onDuplicateLayer}
              onDeleteLayer={onDeleteLayer}
              onMoveLayer={onMoveLayer}
              onAddAdjustmentLayer={onAddAdjustmentLayer}
              onAddLayerMask={onAddLayerMask}
              onOpenLayerStyles={onOpenLayerStyles}
            />
          )}
          {bottomTab === 'properties' && (
            <PropertiesPanel
              activeLayer={activeLayer}
              onUpdateLayer={(updates) => activeLayerId && onUpdateLayer(activeLayerId, updates)}
              onOpenLayerStyles={onOpenLayerStyles}
            />
          )}
          {bottomTab === 'history' && (
            <HistoryPanel
              history={history}
              currentIndex={historyIndex}
              onJumpToStep={onJumpToHistoryStep}
            />
          )}
        </div>
      </div>
    </div>
  );
};
