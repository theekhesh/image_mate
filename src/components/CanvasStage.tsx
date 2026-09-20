/**
 * ImageMate Studio - Interactive Main Canvas Stage & Viewport
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  DocumentProject,
  Layer,
  ToolType,
  ToolOptions,
  Point,
  SelectionMask,
  Guide,
} from '../types/imagemate';
import { CanvasRenderer } from '../utils/canvasRenderer';
import { FilterEngine } from '../utils/filterEngine';
import { Rulers } from './Rulers';

interface CanvasStageProps {
  document: DocumentProject;
  activeTool: ToolType;
  toolOptions: ToolOptions;
  activeLayerId: string | null;
  fgColor: string;
  bgColor: string;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onAddLayerDirect: (layer: Layer) => void;
  onSetZoom: (zoom: number) => void;
  onSetPan: (pan: Point) => void;
  onSampleColor: (hex: string) => void;
  onSelectLayer: (id: string) => void;
  onPushHistory: (name: string) => void;
  onAddGuide?: (guide: Guide) => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  document: doc,
  activeTool,
  toolOptions,
  activeLayerId,
  fgColor,
  bgColor,
  onUpdateLayer,
  onAddLayerDirect,
  onSetZoom,
  onSetPan,
  onSampleColor,
  onSelectLayer,
  onPushHistory,
  onAddGuide,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cursor tracking for rulers and info overlay
  const [cursorDocPos, setCursorDocPos] = useState<Point | null>(null);

  // Interaction State
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null);
  const [transformHandle, setTransformHandle] = useState<string | null>(null);
  const [initialLayerState, setInitialLayerState] = useState<Partial<Layer> | null>(null);

  // Freehand stroke / lasso points
  const strokePointsRef = useRef<Point[]>([]);
  const tempDrawCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active layer shortcut
  const activeLayer = doc.layers.find((l) => l.id === activeLayerId) || null;

  // Convert client viewport screen coordinates to document canvas pixel coordinates
  const screenToDoc = useCallback(
    (clientX: number, clientY: number): Point => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      // Viewport center
      const centerX = rect.width / 2 + doc.pan.x;
      const centerY = rect.height / 2 + doc.pan.y;

      const docLeft = centerX - (doc.width * doc.zoom) / 2;
      const docTop = centerY - (doc.height * doc.zoom) / 2;

      const docX = (screenX - docLeft) / doc.zoom;
      const docY = (screenY - docTop) / doc.zoom;

      return { x: docX, y: docY };
    },
    [doc.pan, doc.zoom, doc.width, doc.height]
  );

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = doc.width;
    canvas.height = doc.height;

    // Render entire document composite
    CanvasRenderer.renderDocument(ctx, doc, {
      renderBackground: true,
      renderOverlays: true,
      activeLayerId,
      showGuides: doc.showGuides,
      showGrid: doc.showGrid,
    });

    // Render interactive overlay preview during in-progress tool drawing
    if (isInteracting && dragStart && dragCurrent) {
      ctx.save();

      // Shape preview
      if (activeTool.startsWith('shape-')) {
        const shapeType = activeTool.replace('shape-', '');
        const sx = Math.min(dragStart.x, dragCurrent.x);
        const sy = Math.min(dragStart.y, dragCurrent.y);
        const sw = Math.abs(dragCurrent.x - dragStart.x);
        const sh = Math.abs(dragCurrent.y - dragStart.y);

        ctx.fillStyle = fgColor;
        ctx.strokeStyle = '#00c8ff';
        ctx.lineWidth = 1.5;

        if (shapeType === 'rect') {
          ctx.fillRect(sx, sy, sw, sh);
          ctx.strokeRect(sx, sy, sw, sh);
        } else if (shapeType === 'ellipse') {
          ctx.beginPath();
          ctx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (shapeType === 'line' || shapeType === 'arrow') {
          ctx.beginPath();
          ctx.moveTo(dragStart.x, dragStart.y);
          ctx.lineTo(dragCurrent.x, dragCurrent.y);
          ctx.stroke();
        }
      }

      // Marquee selection box preview (marching ants outline)
      if (activeTool === 'marquee-rect' || activeTool === 'marquee-ellipse') {
        const mx = Math.min(dragStart.x, dragCurrent.x);
        const my = Math.min(dragStart.y, dragCurrent.y);
        const mw = Math.abs(dragCurrent.x - dragStart.x);
        const mh = Math.abs(dragCurrent.y - dragStart.y);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        if (activeTool === 'marquee-rect') {
          ctx.strokeRect(mx, my, mw, mh);
        } else {
          ctx.beginPath();
          ctx.ellipse(mx + mw / 2, my + mh / 2, mw / 2, mh / 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Gradient drag vector line preview
      if (activeTool === 'gradient') {
        ctx.strokeStyle = '#00c8ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(dragStart.x, dragStart.y);
        ctx.lineTo(dragCurrent.x, dragCurrent.y);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dragStart.x, dragStart.y, 4, 0, Math.PI * 2);
        ctx.arc(dragCurrent.x, dragCurrent.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }, [doc, activeLayerId, isInteracting, dragStart, dragCurrent, activeTool, fgColor]);

  // Ensure active layer has a writable raster canvas
  const getOrCreateRasterCanvas = (targetLayer: Layer): HTMLCanvasElement => {
    if (targetLayer.canvas) return targetLayer.canvas;
    const c = document.createElement('canvas');
    c.width = Math.max(1, doc.width);
    c.height = Math.max(1, doc.height);
    return c;
  };

  // Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey || activeTool === 'hand') {
      // Middle click or Alt or Hand tool: Pan Mode
      setIsInteracting(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (e.button !== 0) return; // Only handle primary left click

    const docPt = screenToDoc(e.clientX, e.clientY);
    setIsInteracting(true);
    setDragStart(docPt);
    setDragCurrent(docPt);

    // 1. Eyedropper Tool
    if (activeTool === 'eyedropper') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const px = Math.floor(docPt.x);
          const py = Math.floor(docPt.y);
          if (px >= 0 && px < doc.width && py >= 0 && py < doc.height) {
            const p = ctx.getImageData(px, py, 1, 1).data;
            const hex = `#${((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1)}`;
            onSampleColor(hex);
          }
        }
      }
      return;
    }

    // 2. Zoom Tool
    if (activeTool === 'zoom') {
      if (e.shiftKey) {
        onSetZoom(Math.max(0.1, doc.zoom * 0.75));
      } else {
        onSetZoom(Math.min(5, doc.zoom * 1.33));
      }
      return;
    }

    // 3. Move & Transform Tool
    if (activeTool === 'move') {
      if (activeLayer) {
        setInitialLayerState({
          x: activeLayer.x,
          y: activeLayer.y,
          width: activeLayer.width,
          height: activeLayer.height,
          rotation: activeLayer.rotation,
        });

        // Check if clicked near transform handle
        const handle = CanvasRenderer.getHandleAtPoint(docPt, activeLayer, 10 / doc.zoom);
        setTransformHandle(handle);
      } else {
        // Auto-select top-most layer at clicked point
        const hitLayer = CanvasRenderer.hitTestLayer(docPt, doc.layers);
        if (hitLayer) {
          onSelectLayer(hitLayer.id);
        }
      }
      return;
    }

    // 4. Brush / Pencil / Eraser Tools: Start continuous raster stroke
    if (activeTool === 'brush' || activeTool === 'pencil' || activeTool === 'eraser') {
      let target = activeLayer;
      if (!target || target.type !== 'raster') {
        // Automatically create a new raster layer if active layer is not raster
        const newLayer: Layer = {
          id: `layer-${Date.now()}`,
          name: `Layer ${doc.layers.length + 1}`,
          type: 'raster',
          visible: true,
          locked: false,
          opacity: 100,
          blendMode: 'normal',
          x: 0,
          y: 0,
          width: doc.width,
          height: doc.height,
          canvas: document.createElement('canvas'),
        };
        newLayer.canvas!.width = doc.width;
        newLayer.canvas!.height = doc.height;
        onAddLayerDirect(newLayer);
        target = newLayer;
      }

      strokePointsRef.current = [docPt];
      const layerCanvas = getOrCreateRasterCanvas(target);
      const lCtx = layerCanvas.getContext('2d');
      if (lCtx) {
        lCtx.save();
        lCtx.translate(-target.x, -target.y);

        if (activeTool === 'eraser') {
          lCtx.globalCompositeOperation = 'destination-out';
          lCtx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
          lCtx.globalCompositeOperation = 'source-over';
          lCtx.strokeStyle = fgColor;
        }

        lCtx.lineWidth = toolOptions.brushSize;
        lCtx.lineCap = 'round';
        lCtx.lineJoin = 'round';
        lCtx.globalAlpha = toolOptions.brushOpacity / 100;

        lCtx.beginPath();
        lCtx.arc(docPt.x, docPt.y, toolOptions.brushSize / 2, 0, Math.PI * 2);
        lCtx.fill();
        lCtx.restore();

        onUpdateLayer(target.id, { canvas: layerCanvas });
      }
      return;
    }

    // 5. Paint Bucket Tool
    if (activeTool === 'paint-bucket' && activeLayer) {
      const layerCanvas = getOrCreateRasterCanvas(activeLayer);
      const lCtx = layerCanvas.getContext('2d');
      if (lCtx) {
        lCtx.save();
        lCtx.fillStyle = fgColor;
        lCtx.fillRect(0, 0, layerCanvas.width, layerCanvas.height);
        lCtx.restore();
        onUpdateLayer(activeLayer.id, { canvas: layerCanvas });
        onPushHistory('Paint Bucket Fill');
      }
      return;
    }

    // 6. Text Tool: Click to add Text layer
    if (activeTool === 'text') {
      const newTextLayer: Layer = {
        id: `text-${Date.now()}`,
        name: 'Type Layer',
        type: 'text',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        x: Math.round(docPt.x),
        y: Math.round(docPt.y),
        width: 320,
        height: 60,
        text: 'ImageMate Typography',
        fontFamily: toolOptions.fontFamily || 'Inter, sans-serif',
        fontSize: toolOptions.fontSize || 36,
        textColor: fgColor,
      };
      onAddLayerDirect(newTextLayer);
      onPushHistory('Add Type Layer');
      return;
    }
  };

  // Mouse Move Event Handler
  const handleMouseMove = (e: React.MouseEvent) => {
    const docPt = screenToDoc(e.clientX, e.clientY);
    setCursorDocPos(docPt);

    if (!isInteracting) return;

    if (activeTool === 'hand' || e.altKey || dragStart === null) {
      // Pan Viewport
      onSetPan({
        x: doc.pan.x + e.movementX,
        y: doc.pan.y + e.movementY,
      });
      return;
    }

    setDragCurrent(docPt);

    // Move / Transform Layer
    if (activeTool === 'move' && activeLayer && initialLayerState) {
      const dx = docPt.x - dragStart.x;
      const dy = docPt.y - dragStart.y;

      if (!transformHandle) {
        // Simple translation
        onUpdateLayer(activeLayer.id, {
          x: (initialLayerState.x || 0) + dx,
          y: (initialLayerState.y || 0) + dy,
        });
      } else {
        // Transform resize handle
        const initW = initialLayerState.width || 100;
        const initH = initialLayerState.height || 100;
        const initX = initialLayerState.x || 0;
        const initY = initialLayerState.y || 0;

        if (transformHandle === 'se') {
          onUpdateLayer(activeLayer.id, {
            width: Math.max(10, initW + dx),
            height: Math.max(10, initH + dy),
          });
        } else if (transformHandle === 'nw') {
          onUpdateLayer(activeLayer.id, {
            x: initX + dx,
            y: initY + dy,
            width: Math.max(10, initW - dx),
            height: Math.max(10, initH - dy),
          });
        } else if (transformHandle === 'e') {
          onUpdateLayer(activeLayer.id, {
            width: Math.max(10, initW + dx),
          });
        } else if (transformHandle === 's') {
          onUpdateLayer(activeLayer.id, {
            height: Math.max(10, initH + dy),
          });
        }
      }
      return;
    }

    // Brush / Pencil / Eraser continuous stroke
    if ((activeTool === 'brush' || activeTool === 'pencil' || activeTool === 'eraser') && activeLayer) {
      const prevPt = strokePointsRef.current[strokePointsRef.current.length - 1] || docPt;
      strokePointsRef.current.push(docPt);

      const layerCanvas = getOrCreateRasterCanvas(activeLayer);
      const lCtx = layerCanvas.getContext('2d');
      if (lCtx) {
        lCtx.save();
        lCtx.translate(-activeLayer.x, -activeLayer.y);

        if (activeTool === 'eraser') {
          lCtx.globalCompositeOperation = 'destination-out';
          lCtx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
          lCtx.globalCompositeOperation = 'source-over';
          lCtx.strokeStyle = fgColor;
        }

        lCtx.lineWidth = toolOptions.brushSize;
        lCtx.lineCap = 'round';
        lCtx.lineJoin = 'round';
        lCtx.globalAlpha = toolOptions.brushOpacity / 100;

        lCtx.beginPath();
        lCtx.moveTo(prevPt.x, prevPt.y);
        lCtx.lineTo(docPt.x, docPt.y);
        lCtx.stroke();
        lCtx.restore();

        onUpdateLayer(activeLayer.id, { canvas: layerCanvas });
      }
    }
  };

  // Mouse Up Event Handler
  const handleMouseUp = () => {
    if (!isInteracting) return;
    setIsInteracting(false);

    if (!dragStart || !dragCurrent) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    // 1. Finalize Shape Tools -> Create Vector Shape Layer
    if (activeTool.startsWith('shape-')) {
      const shapeType = activeTool.replace('shape-', '') as any;
      const sx = Math.min(dragStart.x, dragCurrent.x);
      const sy = Math.min(dragStart.y, dragCurrent.y);
      const sw = Math.max(5, Math.abs(dragCurrent.x - dragStart.x));
      const sh = Math.max(5, Math.abs(dragCurrent.y - dragStart.y));

      const newShapeLayer: Layer = {
        id: `shape-${Date.now()}`,
        name: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} Shape`,
        type: 'shape',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        x: sx,
        y: sy,
        width: sw,
        height: sh,
        shapeType: shapeType,
        fillColor: fgColor,
        strokeColor: bgColor,
        strokeWidth: 2,
      };

      onAddLayerDirect(newShapeLayer);
      onPushHistory(`Add ${shapeType} Shape`);
    }

    // 2. Finalize Gradient Tool
    if (activeTool === 'gradient' && activeLayer) {
      const layerCanvas = getOrCreateRasterCanvas(activeLayer);
      const lCtx = layerCanvas.getContext('2d');
      if (lCtx) {
        lCtx.save();
        const grad = lCtx.createLinearGradient(dragStart.x, dragStart.y, dragCurrent.x, dragCurrent.y);
        grad.addColorStop(0, fgColor);
        grad.addColorStop(1, bgColor);
        lCtx.fillStyle = grad;
        lCtx.fillRect(0, 0, layerCanvas.width, layerCanvas.height);
        lCtx.restore();

        onUpdateLayer(activeLayer.id, { canvas: layerCanvas });
        onPushHistory('Linear Gradient');
      }
    }

    // 3. Finalize Brush Stroke History
    if (activeTool === 'brush' || activeTool === 'pencil' || activeTool === 'eraser') {
      onPushHistory(`${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} Stroke`);
    }

    // 4. Finalize Move / Transform History
    if (activeTool === 'move') {
      onPushHistory('Transform / Move');
    }

    setDragStart(null);
    setDragCurrent(null);
    setTransformHandle(null);
    setInitialLayerState(null);
    strokePointsRef.current = [];
  };

  // Wheel Zoom (Alt + Wheel or trackpad pinch)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(5, Math.max(0.05, doc.zoom * zoomFactor));
      onSetZoom(newZoom);
    } else {
      // Pan Viewport
      onSetPan({
        x: doc.pan.x - e.deltaX,
        y: doc.pan.y - e.deltaY,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      id="imagemate-canvas-stage"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setCursorDocPos(null)}
      onWheel={handleWheel}
      className="flex-1 h-full bg-[#181818] relative overflow-hidden select-none flex items-center justify-center cursor-default"
      style={{
        cursor:
          activeTool === 'hand' || isInteracting
            ? 'grab'
            : activeTool === 'move'
            ? 'default'
            : activeTool === 'eyedropper'
            ? 'crosshair'
            : activeTool === 'text'
            ? 'text'
            : 'crosshair',
      }}
    >
      {/* Horizontal & Vertical Pixel Rulers */}
      <Rulers
        doc={doc}
        containerRef={containerRef}
        mousePos={cursorDocPos}
        onAddGuide={onAddGuide}
        onResetPan={() => onSetPan({ x: 0, y: 0 })}
      />

      {/* Document Viewport Wrapper with Pan & Zoom Transform */}
      <div
        className="transition-transform duration-75 ease-out shadow-2xl relative"
        style={{
          transform: `translate(${doc.pan.x}px, ${doc.pan.y}px) scale(${doc.zoom})`,
          width: `${doc.width}px`,
          height: `${doc.height}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={doc.width}
          height={doc.height}
          className="w-full h-full block bg-transparent"
        />
      </div>

      {/* Bottom Floating Info Pill */}
      <div className="absolute bottom-3 left-6 bg-[#202020]/90 backdrop-blur-md border border-[#3e3e42] rounded-full px-3 py-1 text-[11px] text-gray-300 font-mono flex items-center gap-3 shadow-lg z-20 pointer-events-none">
        <span>
          Doc: {doc.width} × {doc.height} px
        </span>
        <span className="text-gray-500">|</span>
        <span className="text-cyan-400 font-semibold">{Math.round(doc.zoom * 100)}%</span>
        <span className="text-gray-500">|</span>
        <span>{doc.layers.length} Layers</span>
        {cursorDocPos && (
          <>
            <span className="text-gray-500">|</span>
            <span className="text-gray-300">
              X: {Math.round(cursorDocPos.x)} Y: {Math.round(cursorDocPos.y)} px
            </span>
          </>
        )}
      </div>
    </div>
  );
};
