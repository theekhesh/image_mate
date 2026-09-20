/**
 * Photoshop Web Studio - Navigator Minimap & Live Histogram Panel
 */

import React, { useRef, useEffect } from 'react';
import { DocumentProject } from '../../types/photoshop';
import { CanvasRenderer } from '../../utils/canvasRenderer';
import { FilterEngine } from '../../utils/filterEngine';
import { ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface NavigatorPanelProps {
  document: DocumentProject;
  onSetPan: (pan: { x: number; y: number }) => void;
  onSetZoom: (zoom: number) => void;
}

export const NavigatorPanel: React.FC<NavigatorPanelProps> = ({
  document: doc,
  onSetPan,
  onSetZoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const histCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render thumbnail minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 240;
    canvas.height = 135;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min(canvas.width / doc.width, canvas.height / doc.height);
    const renderW = doc.width * scale;
    const renderH = doc.height * scale;
    const offsetX = (canvas.width - renderW) / 2;
    const offsetY = (canvas.height - renderH) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    CanvasRenderer.renderDocument(ctx, doc, {
      renderBackground: true,
      renderOverlays: false,
      activeLayerId: null,
      showGuides: false,
      showGrid: false,
    });
    ctx.restore();

    // Render Histogram
    const histCanvas = histCanvasRef.current;
    if (histCanvas) {
      const hCtx = histCanvas.getContext('2d');
      if (hCtx) {
        histCanvas.width = 240;
        histCanvas.height = 60;
        hCtx.clearRect(0, 0, histCanvas.width, histCanvas.height);

        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const hist = FilterEngine.computeHistogram(imgData);
          const maxCount = Math.max(1, ...hist.lum, ...hist.r, ...hist.g, ...hist.b);

          // Draw channels
          const drawCurve = (counts: number[], color: string) => {
            hCtx.strokeStyle = color;
            hCtx.lineWidth = 1;
            hCtx.beginPath();
            for (let i = 0; i < 256; i++) {
              const x = (i / 255) * histCanvas.width;
              const y = histCanvas.height - (counts[i] / maxCount) * (histCanvas.height - 4);
              if (i === 0) hCtx.moveTo(x, y);
              else hCtx.lineTo(x, y);
            }
            hCtx.stroke();
          };

          drawCurve(hist.lum, 'rgba(255, 255, 255, 0.7)');
          drawCurve(hist.r, 'rgba(255, 50, 50, 0.6)');
          drawCurve(hist.g, 'rgba(50, 255, 50, 0.6)');
          drawCurve(hist.b, 'rgba(50, 150, 255, 0.6)');
        } catch {
          // ignore
        }
      }
    }
  }, [doc]);

  return (
    <div className="p-3 bg-[#202020] text-xs text-[#cccccc] flex flex-col gap-3 select-none">
      {/* Navigator Minimap Canvas */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Compass size={12} className="text-[#00c8ff]" />
          <span>Navigator</span>
        </div>

        <div className="w-full h-[140px] bg-[#141414] rounded border border-[#3e3e42] flex items-center justify-center overflow-hidden relative shadow-inner">
          <canvas ref={canvasRef} className="max-w-full max-h-full" />
        </div>

        {/* Zoom Slider */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <ZoomOut size={13} className="text-gray-400" />
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.05"
            value={doc.zoom}
            onChange={(e) => onSetZoom(Number(e.target.value))}
            className="flex-1 accent-[#007acc] h-1.5 bg-[#181818] rounded"
          />
          <ZoomIn size={13} className="text-gray-400" />
          <span className="w-10 text-right font-mono">{Math.round(doc.zoom * 100)}%</span>
        </div>
      </div>

      {/* Real-time RGB Histogram */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-[#2d2d2d]">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          RGB & Luminance Histogram
        </div>
        <div className="w-full h-[65px] bg-[#141414] rounded border border-[#3e3e42] p-1 shadow-inner flex items-center justify-center">
          <canvas ref={histCanvasRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};
