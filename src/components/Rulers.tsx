/**
 * ImageMate Studio - Pixel Rulers Component
 * Renders interactive horizontal and vertical pixel rulers along the top and left
 * of the CanvasStage with zoom/pan tracking, cursor hairlines, and drag-to-create guides.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DocumentProject, Guide } from '../types/imagemate';

export interface RulersProps {
  doc: DocumentProject;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  mousePos?: { x: number; y: number } | null;
  onAddGuide?: (guide: Guide) => void;
  onResetPan?: () => void;
}

const RULER_THICKNESS = 18;

const NICE_STEPS = [
  1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000,
];

function getMajorStep(zoom: number): number {
  for (const s of NICE_STEPS) {
    if (s * zoom >= 55) {
      return s;
    }
  }
  return 10000;
}

export const Rulers: React.FC<RulersProps> = ({
  doc,
  containerRef,
  canvasRef,
  mousePos,
  onAddGuide,
  onResetPan,
}) => {
  const isVisible = doc.showRulers ?? doc.rulersVisible ?? false;

  const topCanvasRef = useRef<HTMLCanvasElement>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [draggingGuide, setDraggingGuide] = useState<{
    orientation: 'horizontal' | 'vertical';
    pos: number; // document pixel position
    screenPos: number; // screen pixel relative to container
  } | null>(null);

  // Measure container size with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [containerRef]);

  // Screen to Document conversion helper
  const screenToDoc = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef?.current;
      const container = containerRef.current;
      if (canvas && container) {
        const cRect = canvas.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();
        if (cRect.width > 0 && cRect.height > 0) {
          const canvasLeftInCont = cRect.left - contRect.left;
          const canvasTopInCont = cRect.top - contRect.top;
          const docX = ((screenX - canvasLeftInCont) / cRect.width) * doc.width;
          const docY = ((screenY - canvasTopInCont) / cRect.height) * doc.height;
          return { x: docX, y: docY };
        }
      }

      const cw = containerSize.width;
      const ch = containerSize.height;
      if (cw <= 0 || ch <= 0) return { x: 0, y: 0 };

      const centerX = cw / 2 + doc.pan.x;
      const centerY = ch / 2 + doc.pan.y;

      const docLeft = centerX - (doc.width * doc.zoom) / 2;
      const docTop = centerY - (doc.height * doc.zoom) / 2;

      const docX = (screenX - docLeft) / doc.zoom;
      const docY = (screenY - docTop) / doc.zoom;

      return { x: docX, y: docY };
    },
    [canvasRef, containerRef, containerSize, doc.pan, doc.zoom, doc.width, doc.height]
  );

  // Render Horizontal (Top) Ruler
  useEffect(() => {
    if (!isVisible) return;
    const canvas = topCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rulerWidth = Math.max(0, containerSize.width - RULER_THICKNESS);
    const rulerHeight = RULER_THICKNESS;
    if (rulerWidth <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rulerWidth * dpr);
    canvas.height = Math.floor(rulerHeight * dpr);
    canvas.style.width = `${rulerWidth}px`;
    canvas.style.height = `${rulerHeight}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Background
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, rulerWidth, rulerHeight);

    // Document bounds on ruler
    let originX: number;
    let screenDocRight: number;
    const docCanvas = canvasRef?.current;
    const container = containerRef.current;
    if (docCanvas && container) {
      const cRect = docCanvas.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      originX = cRect.left - contRect.left - RULER_THICKNESS;
      screenDocRight = originX + cRect.width;
    } else {
      const centerX = containerSize.width / 2 + doc.pan.x;
      const docLeft = centerX - (doc.width * doc.zoom) / 2;
      originX = docLeft - RULER_THICKNESS;
      screenDocRight = originX + doc.width * doc.zoom;
    }

    const screenDocLeft = originX;

    // Highlight document extent on ruler
    if (screenDocRight > 0 && screenDocLeft < rulerWidth) {
      const hlLeft = Math.max(0, screenDocLeft);
      const hlRight = Math.min(rulerWidth, screenDocRight);
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(hlLeft, 0, hlRight - hlLeft, rulerHeight);
    }

    // Bottom border line
    ctx.strokeStyle = '#383838';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, rulerHeight - 0.5);
    ctx.lineTo(rulerWidth, rulerHeight - 0.5);
    ctx.stroke();

    // 2. Compute Ticks
    const majorStep = getMajorStep(doc.zoom);
    let minorDivisions = 10;
    if (majorStep % 10 !== 0) {
      minorDivisions = majorStep % 5 === 0 ? 5 : 2;
    }
    const minorStep = majorStep / minorDivisions;

    const minDocX = (0 - originX) / doc.zoom;
    const maxDocX = (rulerWidth - originX) / doc.zoom;

    const startMajor = Math.floor(minDocX / majorStep) * majorStep;
    const endMajor = Math.ceil(maxDocX / majorStep) * majorStep;

    ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Draw Sub-Ticks and Major Ticks
    for (let d = startMajor; d <= endMajor; d += majorStep) {
      // Draw minor sub-ticks inside this interval
      for (let i = 0; i < minorDivisions; i++) {
        const subDocX = d + i * minorStep;
        const subScreenX = originX + subDocX * doc.zoom;
        if (subScreenX < 0 || subScreenX > rulerWidth) continue;

        const isMid = minorDivisions >= 4 && i === minorDivisions / 2;
        const tickH = isMid ? 5 : 3;

        ctx.strokeStyle = isMid ? '#666666' : '#4d4d4d';
        ctx.beginPath();
        ctx.moveTo(Math.floor(subScreenX) + 0.5, rulerHeight - tickH);
        ctx.lineTo(Math.floor(subScreenX) + 0.5, rulerHeight - 1);
        ctx.stroke();
      }

      // Draw Major Tick
      const sx = originX + d * doc.zoom;
      if (sx >= -50 && sx <= rulerWidth + 50) {
        ctx.strokeStyle = d === 0 ? '#00e5ff' : '#777777';
        ctx.beginPath();
        ctx.moveTo(Math.floor(sx) + 0.5, rulerHeight - 8);
        ctx.lineTo(Math.floor(sx) + 0.5, rulerHeight - 1);
        ctx.stroke();

        if (sx >= 0 && sx <= rulerWidth - 10) {
          ctx.fillStyle = d === 0 ? '#00e5ff' : '#909090';
          ctx.fillText(`${d}`, sx + 2, 2);
        }
      }
    }

    // 3. Mouse Hairline Indicator
    if (mousePos) {
      const mouseScreenX = originX + mousePos.x * doc.zoom;
      if (mouseScreenX >= 0 && mouseScreenX <= rulerWidth) {
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.floor(mouseScreenX) + 0.5, 0);
        ctx.lineTo(Math.floor(mouseScreenX) + 0.5, rulerHeight);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [isVisible, containerSize, doc.pan, doc.zoom, doc.width, mousePos]);

  // Render Vertical (Left) Ruler
  useEffect(() => {
    if (!isVisible) return;
    const canvas = leftCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rulerWidth = RULER_THICKNESS;
    const rulerHeight = Math.max(0, containerSize.height - RULER_THICKNESS);
    if (rulerHeight <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rulerWidth * dpr);
    canvas.height = Math.floor(rulerHeight * dpr);
    canvas.style.width = `${rulerWidth}px`;
    canvas.style.height = `${rulerHeight}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Background
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, rulerWidth, rulerHeight);

    // Document bounds on ruler
    let originY: number;
    let screenDocBottom: number;
    const docCanvas = canvasRef?.current;
    const container = containerRef.current;
    if (docCanvas && container) {
      const cRect = docCanvas.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      originY = cRect.top - contRect.top - RULER_THICKNESS;
      screenDocBottom = originY + cRect.height;
    } else {
      const centerY = containerSize.height / 2 + doc.pan.y;
      const docTop = centerY - (doc.height * doc.zoom) / 2;
      originY = docTop - RULER_THICKNESS;
      screenDocBottom = originY + doc.height * doc.zoom;
    }

    const screenDocTop = originY;

    // Highlight document extent on ruler
    if (screenDocBottom > 0 && screenDocTop < rulerHeight) {
      const hlTop = Math.max(0, screenDocTop);
      const hlBottom = Math.min(rulerHeight, screenDocBottom);
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(0, hlTop, rulerWidth, hlBottom - hlTop);
    }

    // Right border line
    ctx.strokeStyle = '#383838';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rulerWidth - 0.5, 0);
    ctx.lineTo(rulerWidth - 0.5, rulerHeight);
    ctx.stroke();

    // 2. Compute Ticks
    const majorStep = getMajorStep(doc.zoom);
    let minorDivisions = 10;
    if (majorStep % 10 !== 0) {
      minorDivisions = majorStep % 5 === 0 ? 5 : 2;
    }
    const minorStep = majorStep / minorDivisions;

    const minDocY = (0 - originY) / doc.zoom;
    const maxDocY = (rulerHeight - originY) / doc.zoom;

    const startMajor = Math.floor(minDocY / majorStep) * majorStep;
    const endMajor = Math.ceil(maxDocY / majorStep) * majorStep;

    ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Draw Sub-Ticks and Major Ticks
    for (let d = startMajor; d <= endMajor; d += majorStep) {
      // Draw minor sub-ticks inside this interval
      for (let i = 0; i < minorDivisions; i++) {
        const subDocY = d + i * minorStep;
        const subScreenY = originY + subDocY * doc.zoom;
        if (subScreenY < 0 || subScreenY > rulerHeight) continue;

        const isMid = minorDivisions >= 4 && i === minorDivisions / 2;
        const tickW = isMid ? 5 : 3;

        ctx.strokeStyle = isMid ? '#666666' : '#4d4d4d';
        ctx.beginPath();
        ctx.moveTo(rulerWidth - tickW, Math.floor(subScreenY) + 0.5);
        ctx.lineTo(rulerWidth - 1, Math.floor(subScreenY) + 0.5);
        ctx.stroke();
      }

      // Draw Major Tick
      const sy = originY + d * doc.zoom;
      if (sy >= -50 && sy <= rulerHeight + 50) {
        ctx.strokeStyle = d === 0 ? '#00e5ff' : '#777777';
        ctx.beginPath();
        ctx.moveTo(rulerWidth - 8, Math.floor(sy) + 0.5);
        ctx.lineTo(rulerWidth - 1, Math.floor(sy) + 0.5);
        ctx.stroke();

        if (sy >= 10 && sy <= rulerHeight - 10) {
          ctx.save();
          ctx.fillStyle = d === 0 ? '#00e5ff' : '#909090';
          // Draw numbers rotated vertically (vertical ruler calibration)
          ctx.translate(rulerWidth - 9, sy);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`${d}`, 0, -1);
          ctx.restore();
        }
      }
    }

    // 3. Mouse Hairline Indicator
    if (mousePos) {
      const mouseScreenY = originY + mousePos.y * doc.zoom;
      if (mouseScreenY >= 0 && mouseScreenY <= rulerHeight) {
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, Math.floor(mouseScreenY) + 0.5);
        ctx.lineTo(rulerWidth, Math.floor(mouseScreenY) + 0.5);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [isVisible, containerSize, doc.pan, doc.zoom, doc.height, mousePos]);

  // Drag from Top Ruler to create Horizontal Guide
  const handleTopRulerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const startY = e.clientY - rect.top;
    const docPt = screenToDoc(e.clientX - rect.left, startY);

    setDraggingGuide({
      orientation: 'horizontal',
      pos: Math.round(docPt.y),
      screenPos: startY,
    });
  };

  // Drag from Left Ruler to create Vertical Guide
  const handleLeftRulerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const docPt = screenToDoc(startX, e.clientY - rect.top);

    setDraggingGuide({
      orientation: 'vertical',
      pos: Math.round(docPt.x),
      screenPos: startX,
    });
  };

  // Global window listeners while dragging a guide
  useEffect(() => {
    if (!draggingGuide) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      if (draggingGuide.orientation === 'horizontal') {
        const screenY = e.clientY - rect.top;
        const docPt = screenToDoc(e.clientX - rect.left, screenY);
        setDraggingGuide({
          orientation: 'horizontal',
          pos: Math.round(docPt.y),
          screenPos: screenY,
        });
      } else {
        const screenX = e.clientX - rect.left;
        const docPt = screenToDoc(screenX, e.clientY - rect.top);
        setDraggingGuide({
          orientation: 'vertical',
          pos: Math.round(docPt.x),
          screenPos: screenX,
        });
      }
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      const container = containerRef.current;
      if (container && onAddGuide) {
        const rect = container.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // If dropped outside the rulers, commit the new guide
        if (
          (draggingGuide.orientation === 'horizontal' && screenY > RULER_THICKNESS) ||
          (draggingGuide.orientation === 'vertical' && screenX > RULER_THICKNESS)
        ) {
          const docPt = screenToDoc(screenX, screenY);
          const finalPos =
            draggingGuide.orientation === 'horizontal'
              ? Math.round(docPt.y)
              : Math.round(docPt.x);

          onAddGuide({
            id: `guide-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            orientation: draggingGuide.orientation,
            position: finalPos,
          });
        }
      }
      setDraggingGuide(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [draggingGuide, containerRef, screenToDoc, onAddGuide]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* 1. Corner Intersection Box (0,0 Origin Square) */}
      <div
        id="imagemate-ruler-corner"
        onClick={onResetPan}
        title="Ruler Origin (px) • Click to reset canvas center"
        className="absolute top-0 left-0 w-[18px] h-[18px] bg-[#222222] border-r border-b border-[#383838] z-30 flex items-center justify-center cursor-pointer select-none text-[8px] font-mono text-gray-400 hover:text-[#00e5ff] hover:bg-[#2c2c2c] transition-colors"
      >
        <span>px</span>
      </div>

      {/* 2. Top Horizontal Ruler */}
      <div
        id="imagemate-ruler-horizontal"
        onMouseDown={handleTopRulerMouseDown}
        title="Top Ruler (px) • Drag down to create horizontal guide"
        className="absolute top-0 left-[18px] right-0 h-[18px] bg-[#222222] z-20 overflow-hidden cursor-row-resize select-none"
      >
        <canvas
          ref={topCanvasRef}
          className="w-full h-full block pointer-events-none"
        />
      </div>

      {/* 3. Left Vertical Ruler */}
      <div
        id="imagemate-ruler-vertical"
        onMouseDown={handleLeftRulerMouseDown}
        title="Left Ruler (px) • Drag right to create vertical guide"
        className="absolute top-[18px] left-0 bottom-0 w-[18px] bg-[#222222] z-20 overflow-hidden cursor-col-resize select-none"
      >
        <canvas
          ref={leftCanvasRef}
          className="w-full h-full block pointer-events-none"
        />
      </div>

      {/* 4. Active Guide Dragging Line & Floating Coordinate Tooltip */}
      {draggingGuide && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {draggingGuide.orientation === 'horizontal' ? (
            <div
              className="absolute left-0 right-0 border-t border-cyan-400 border-dashed"
              style={{ top: `${draggingGuide.screenPos}px` }}
            >
              <div className="absolute left-6 -top-5 bg-[#1e1e1e]/95 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-[#3e3e42] shadow-lg">
                Y: {draggingGuide.pos} px
              </div>
            </div>
          ) : (
            <div
              className="absolute top-0 bottom-0 border-l border-cyan-400 border-dashed"
              style={{ left: `${draggingGuide.screenPos}px` }}
            >
              <div className="absolute top-6 left-1 bg-[#1e1e1e]/95 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-[#3e3e42] shadow-lg">
                X: {draggingGuide.pos} px
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
