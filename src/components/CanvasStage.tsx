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
  SelectionState,
  Guide,
  BrushSettings,
} from '../types/imagemate';
import { CanvasRenderer } from '../utils/canvasRenderer';
import { Rulers } from './Rulers';
import { Check, X } from 'lucide-react';

interface CanvasStageProps {
  document: DocumentProject;
  activeTool: ToolType;
  toolOptions: ToolOptions;
  brushSettings?: BrushSettings;
  activeLayerId: string | null;
  fgColor: string;
  bgColor: string;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onAddLayerDirect: (layer: Layer) => void;
  onSetZoom: (zoom: number) => void;
  onSetPan: (pan: Point) => void;
  onSampleColor: (hex: string) => void;
  onSelectLayer: (id: string) => void;
  onPushHistory: (name: string, updatedDoc?: DocumentProject) => void;
  onAddGuide?: (guide: Guide) => void;
  onSetSelection?: (sel: SelectionState | null) => void;
  onCropDocument?: (bounds: { x: number; y: number; width: number; height: number }) => void;
  cropRatio?: string;
  gradientType?: 'linear' | 'radial' | 'reflected' | 'diamond';
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  document: doc,
  activeTool,
  toolOptions,
  brushSettings,
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
  onSetSelection,
  onCropDocument,
  cropRatio = 'free',
  gradientType = 'linear',
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

  // Polygonal lasso and pen points
  const [polyPoints, setPolyPoints] = useState<Point[]>([]);

  // Crop tool bounding box
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Clone stamp source point
  const cloneSourceRef = useRef<Point | null>(null);

  // Freehand stroke points
  const strokePointsRef = useRef<Point[]>([]);

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

  // Ensure active layer has a writable raster canvas
  const getOrCreateRasterCanvas = useCallback(
    (targetLayer: Layer): HTMLCanvasElement => {
      if (targetLayer.canvas) return targetLayer.canvas;
      const c = document.createElement('canvas');
      c.width = Math.max(1, doc.width);
      c.height = Math.max(1, doc.height);
      return c;
    },
    [doc.width, doc.height]
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
      showGuides: doc.showRulers ?? doc.rulersVisible,
      showGrid: doc.showGrid ?? doc.gridVisible,
    });

    // Render interactive overlay preview during in-progress tool drawing
    ctx.save();

    // 1. Shapes preview
    if (isInteracting && dragStart && dragCurrent && activeTool.startsWith('shape-')) {
      const shapeType = activeTool.replace('shape-', '');
      const sx = Math.min(dragStart.x, dragCurrent.x);
      const sy = Math.min(dragStart.y, dragCurrent.y);
      const sw = Math.max(2, Math.abs(dragCurrent.x - dragStart.x));
      const sh = Math.max(2, Math.abs(dragCurrent.y - dragStart.y));

      ctx.fillStyle = fgColor;
      ctx.strokeStyle = bgColor || '#ffffff';
      ctx.lineWidth = toolOptions.strokeWidth || 2;

      if (shapeType === 'rect') {
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeRect(sx, sy, sw, sh);
      } else if (shapeType === 'rounded') {
        ctx.beginPath();
        const r = Math.min(16, sw / 2, sh / 2);
        ctx.roundRect(sx, sy, sw, sh, r);
        ctx.fill();
        ctx.stroke();
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
      } else if (shapeType === 'star') {
        const points = 5;
        const rx = sw / 2;
        const ry = sh / 2;
        const innerRx = rx * 0.45;
        const innerRy = ry * 0.45;
        const cx = sx + rx;
        const cy = sy + ry;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
          const angle = (i * Math.PI) / points - Math.PI / 2;
          const isOuter = i % 2 === 0;
          const curRx = isOuter ? rx : innerRx;
          const curRy = isOuter ? ry : innerRy;
          const px = cx + curRx * Math.cos(angle);
          const py = cy + curRy * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (shapeType === 'polygon') {
        const sides = 6;
        const rx = sw / 2;
        const ry = sh / 2;
        const cx = sx + rx;
        const cy = sy + ry;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
          const px = cx + rx * Math.cos(angle);
          const py = cy + ry * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // 2. Marquee selection preview (marching ants outline)
    if (isInteracting && dragStart && dragCurrent && (activeTool === 'marquee-rect' || activeTool === 'marquee-ellipse')) {
      const mx = Math.min(dragStart.x, dragCurrent.x);
      const my = Math.min(dragStart.y, dragCurrent.y);
      const mw = Math.abs(dragCurrent.x - dragStart.x);
      const mh = Math.abs(dragCurrent.y - dragStart.y);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      if (activeTool === 'marquee-rect') {
        ctx.strokeRect(mx, my, mw, mh);
        ctx.strokeStyle = '#ffffff';
        ctx.lineDashOffset = 4;
        ctx.strokeRect(mx, my, mw, mh);
      } else {
        ctx.beginPath();
        ctx.ellipse(mx + mw / 2, my + mh / 2, mw / 2, mh / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineDashOffset = 4;
        ctx.stroke();
      }
    }

    // 3. Freehand Lasso live path preview
    if (isInteracting && activeTool === 'lasso-free' && strokePointsRef.current.length > 1) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(strokePointsRef.current[0].x, strokePointsRef.current[0].y);
      for (let i = 1; i < strokePointsRef.current.length; i++) {
        ctx.lineTo(strokePointsRef.current[i].x, strokePointsRef.current[i].y);
      }
      ctx.stroke();
    }

    // 4. Polygonal Lasso path preview
    if (activeTool === 'lasso-poly' && polyPoints.length > 0) {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(polyPoints[0].x, polyPoints[0].y);
      for (let i = 1; i < polyPoints.length; i++) {
        ctx.lineTo(polyPoints[i].x, polyPoints[i].y);
      }
      if (cursorDocPos) {
        ctx.lineTo(cursorDocPos.x, cursorDocPos.y);
      }
      ctx.stroke();

      // Start point handle circle
      ctx.setLineDash([]);
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(polyPoints[0].x, polyPoints[0].y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Gradient vector line preview
    if (isInteracting && dragStart && dragCurrent && activeTool === 'gradient') {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(dragStart.x, dragStart.y);
      ctx.lineTo(dragCurrent.x, dragCurrent.y);
      ctx.stroke();

      ctx.fillStyle = fgColor;
      ctx.beginPath();
      ctx.arc(dragStart.x, dragStart.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.arc(dragCurrent.x, dragCurrent.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 6. Crop box overlay
    const activeCrop = cropBox || (isInteracting && activeTool === 'crop' && dragStart && dragCurrent ? {
      x: Math.min(dragStart.x, dragCurrent.x),
      y: Math.min(dragStart.y, dragCurrent.y),
      width: Math.abs(dragCurrent.x - dragStart.x),
      height: Math.abs(dragCurrent.y - dragStart.y),
    } : null);

    if (activeCrop && activeCrop.width > 5 && activeCrop.height > 5) {
      // Dim exterior area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, doc.width, activeCrop.y);
      ctx.fillRect(0, activeCrop.y + activeCrop.height, doc.width, doc.height - (activeCrop.y + activeCrop.height));
      ctx.fillRect(0, activeCrop.y, activeCrop.x, activeCrop.height);
      ctx.fillRect(activeCrop.x + activeCrop.width, activeCrop.y, doc.width - (activeCrop.x + activeCrop.width), activeCrop.height);

      // Crop border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.strokeRect(activeCrop.x, activeCrop.y, activeCrop.width, activeCrop.height);

      // Rule of thirds grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(activeCrop.x + activeCrop.width / 3, activeCrop.y);
      ctx.lineTo(activeCrop.x + activeCrop.width / 3, activeCrop.y + activeCrop.height);
      ctx.moveTo(activeCrop.x + (activeCrop.width * 2) / 3, activeCrop.y);
      ctx.lineTo(activeCrop.x + (activeCrop.width * 2) / 3, activeCrop.y + activeCrop.height);
      ctx.moveTo(activeCrop.x, activeCrop.y + activeCrop.height / 3);
      ctx.lineTo(activeCrop.x + activeCrop.width, activeCrop.y + activeCrop.height / 3);
      ctx.moveTo(activeCrop.x, activeCrop.y + (activeCrop.height * 2) / 3);
      ctx.lineTo(activeCrop.x + activeCrop.width, activeCrop.y + (activeCrop.height * 2) / 3);
      ctx.stroke();
    }

    // 7. Clone stamp source crosshair
    if (cloneSourceRef.current && (activeTool === 'clone-stamp')) {
      const src = cloneSourceRef.current;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(src.x, src.y, 8, 0, Math.PI * 2);
      ctx.moveTo(src.x - 12, src.y);
      ctx.lineTo(src.x + 12, src.y);
      ctx.moveTo(src.x, src.y - 12);
      ctx.lineTo(src.x, src.y + 12);
      ctx.stroke();
    }

    ctx.restore();
  }, [
    doc,
    activeLayerId,
    isInteracting,
    dragStart,
    dragCurrent,
    activeTool,
    fgColor,
    bgColor,
    toolOptions,
    polyPoints,
    cropBox,
    cursorDocPos,
  ]);

  // Handle Mouse Down Event
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey && activeTool !== 'clone-stamp' || activeTool === 'hand') {
      // Middle click or Alt or Hand tool: Pan Mode
      setIsInteracting(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (e.button !== 0) return; // Only primary left click

    const docPt = screenToDoc(e.clientX, e.clientY);
    setIsInteracting(true);
    setDragStart(docPt);
    setDragCurrent(docPt);

    // 1. Eyedropper Tool: Sample Color
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

    // 4. Polygonal Lasso Tool: Add anchor point
    if (activeTool === 'lasso-poly') {
      if (polyPoints.length > 2) {
        // Check if close to start point to close
        const start = polyPoints[0];
        const dist = Math.hypot(docPt.x - start.x, docPt.y - start.y);
        if (dist < 12 / doc.zoom) {
          // Close polygon selection
          const xs = polyPoints.map((p) => p.x);
          const ys = polyPoints.map((p) => p.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          onSetSelection?.({
            active: true,
            type: 'polygon',
            points: [...polyPoints],
            bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
            feather: 0,
          });
          onPushHistory('Polygonal Lasso Selection');
          setPolyPoints([]);
          setIsInteracting(false);
          return;
        }
      }
      setPolyPoints((prev) => [...prev, docPt]);
      return;
    }

    // 5. Magic Wand Tool: Sample and flood fill region
    if (activeTool === 'magic-wand') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const px = Math.floor(docPt.x);
          const py = Math.floor(docPt.y);
          if (px >= 0 && px < doc.width && py >= 0 && py < doc.height) {
            const targetColor = ctx.getImageData(px, py, 1, 1).data;
            const tolerance = (toolOptions.tolerance ?? 32) * 2.5;

            // Compute matching bounds across document
            const imgData = ctx.getImageData(0, 0, doc.width, doc.height);
            const data = imgData.data;
            let minX = doc.width;
            let maxX = 0;
            let minY = doc.height;
            let maxY = 0;
            let count = 0;

            for (let y = 0; y < doc.height; y += 2) {
              for (let x = 0; x < doc.width; x += 2) {
                const idx = (y * doc.width + x) * 4;
                const rDiff = Math.abs(data[idx] - targetColor[0]);
                const gDiff = Math.abs(data[idx + 1] - targetColor[1]);
                const bDiff = Math.abs(data[idx + 2] - targetColor[2]);
                const dist = Math.hypot(rDiff, gDiff, bDiff);

                if (dist <= tolerance) {
                  count++;
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                }
              }
            }

            if (count > 0 && maxX >= minX && maxY >= minY) {
              onSetSelection?.({
                active: true,
                type: 'rect',
                bounds: { x: minX, y: minY, width: Math.max(10, maxX - minX), height: Math.max(10, maxY - minY) },
                points: [],
                feather: 0,
              });
              onPushHistory('Magic Wand Selection');
            }
          }
        }
      }
      return;
    }

    // 6. Clone Stamp Tool: Alt+Click samples source
    if (activeTool === 'clone-stamp') {
      if (e.altKey) {
        cloneSourceRef.current = docPt;
        onPushHistory('Set Clone Source');
        return;
      }
    }

    // 7. Raster Stroke Tools: Brush / Pencil / Eraser / Blur / Sharpen / Smudge / Dodge / Burn / Sponge / Clone / Healing
    const isRasterStroke = [
      'brush',
      'pencil',
      'eraser',
      'clone-stamp',
      'spot-healing',
      'blur',
      'sharpen',
      'smudge',
      'dodge',
      'burn',
      'sponge',
    ].includes(activeTool);

    if (isRasterStroke) {
      let target = activeLayer;
      if (!target || target.type !== 'raster') {
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

        const brushSize = toolOptions.brushSize || 20;

        if (activeTool === 'eraser') {
          lCtx.globalCompositeOperation = 'destination-out';
          lCtx.fillStyle = 'rgba(0,0,0,1)';
          lCtx.beginPath();
          lCtx.arc(docPt.x, docPt.y, brushSize / 2, 0, Math.PI * 2);
          lCtx.fill();
        } else if (activeTool === 'brush' || activeTool === 'pencil') {
          lCtx.globalCompositeOperation = 'source-over';
          lCtx.fillStyle = fgColor;
          lCtx.globalAlpha = (toolOptions.brushOpacity || 100) / 100;
          lCtx.beginPath();
          lCtx.arc(docPt.x, docPt.y, brushSize / 2, 0, Math.PI * 2);
          lCtx.fill();
        }

        lCtx.restore();
        onUpdateLayer(target.id, { canvas: layerCanvas });
      }
      return;
    }

    // 8. Paint Bucket Tool
    if (activeTool === 'paint-bucket' && activeLayer) {
      const layerCanvas = getOrCreateRasterCanvas(activeLayer);
      const lCtx = layerCanvas.getContext('2d');
      if (lCtx) {
        lCtx.save();
        lCtx.fillStyle = fgColor;

        if (doc.selection && doc.selection.active) {
          // Fill only selection bounds
          const b = doc.selection.bounds;
          const lx = b.x - activeLayer.x;
          const ly = b.y - activeLayer.y;
          if (doc.selection.type === 'ellipse') {
            lCtx.beginPath();
            lCtx.ellipse(lx + b.width / 2, ly + b.height / 2, b.width / 2, b.height / 2, 0, 0, Math.PI * 2);
            lCtx.fill();
          } else {
            lCtx.fillRect(lx, ly, b.width, b.height);
          }
        } else {
          lCtx.fillRect(0, 0, layerCanvas.width, layerCanvas.height);
        }

        lCtx.restore();
        onUpdateLayer(activeLayer.id, { canvas: layerCanvas });
        onPushHistory('Paint Bucket Fill');
      }
      return;
    }

    // 9. Text Tool: Click to add Text layer
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
        text: 'ImageMate Studio',
        fontFamily: toolOptions.fontFamily || 'Inter, sans-serif',
        fontSize: toolOptions.fontSize || 36,
        textColor: fgColor,
      };
      onAddLayerDirect(newTextLayer);
      onPushHistory('Add Type Layer');
      return;
    }
  };

  // Handle Mouse Move Event
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

    // 1. Move & Transform Layer
    if (activeTool === 'move' && activeLayer && initialLayerState) {
      const dx = docPt.x - dragStart.x;
      const dy = docPt.y - dragStart.y;

      if (!transformHandle) {
        onUpdateLayer(activeLayer.id, {
          x: Math.round((initialLayerState.x || 0) + dx),
          y: Math.round((initialLayerState.y || 0) + dy),
        });
      } else {
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

    // 2. Freehand Lasso: collect stroke points
    if (activeTool === 'lasso-free') {
      strokePointsRef.current.push(docPt);
      return;
    }

    // 3. Raster Stroke Tools: Continuous drawing / processing
    const isContinuousStroke = [
      'brush',
      'pencil',
      'eraser',
      'clone-stamp',
      'blur',
      'sharpen',
      'smudge',
      'dodge',
      'burn',
      'sponge',
    ].includes(activeTool);

    if (isContinuousStroke && activeLayer) {
      const prevPt = strokePointsRef.current[strokePointsRef.current.length - 1] || docPt;
      strokePointsRef.current.push(docPt);

      const layerCanvas = getOrCreateRasterCanvas(activeLayer);
      const lCtx = layerCanvas.getContext('2d');
      if (lCtx) {
        lCtx.save();
        lCtx.translate(-activeLayer.x, -activeLayer.y);

        const brushSize = toolOptions.brushSize || 20;

        if (activeTool === 'eraser') {
          lCtx.globalCompositeOperation = 'destination-out';
          lCtx.strokeStyle = 'rgba(0,0,0,1)';
          lCtx.lineWidth = brushSize;
          lCtx.lineCap = 'round';
          lCtx.lineJoin = 'round';
          lCtx.beginPath();
          lCtx.moveTo(prevPt.x, prevPt.y);
          lCtx.lineTo(docPt.x, docPt.y);
          lCtx.stroke();
        } else if (activeTool === 'brush' || activeTool === 'pencil') {
          lCtx.globalCompositeOperation = 'source-over';
          lCtx.strokeStyle = fgColor;
          lCtx.lineWidth = brushSize;
          lCtx.lineCap = activeTool === 'pencil' ? 'square' : 'round';
          lCtx.lineJoin = 'round';
          lCtx.globalAlpha = (toolOptions.brushOpacity || 100) / 100;
          lCtx.beginPath();
          lCtx.moveTo(prevPt.x, prevPt.y);
          lCtx.lineTo(docPt.x, docPt.y);
          lCtx.stroke();
        } else if (activeTool === 'clone-stamp' && cloneSourceRef.current) {
          // Clone pixels from source offset
          const srcX = cloneSourceRef.current.x + (docPt.x - dragStart.x);
          const srcY = cloneSourceRef.current.y + (docPt.y - dragStart.y);
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const radius = Math.floor(brushSize / 2);
              const sample = ctx.getImageData(
                Math.max(0, srcX - radius),
                Math.max(0, srcY - radius),
                radius * 2,
                radius * 2
              );
              lCtx.putImageData(sample, docPt.x - activeLayer.x - radius, docPt.y - activeLayer.y - radius);
            }
          }
        } else if (activeTool === 'blur' || activeTool === 'sharpen') {
          // Pixel manipulation in brush radius
          const rad = Math.floor(brushSize / 2);
          const lx = Math.floor(docPt.x - activeLayer.x - rad);
          const ly = Math.floor(docPt.y - activeLayer.y - rad);
          const w = rad * 2;
          const h = rad * 2;
          if (lx >= 0 && ly >= 0 && lx + w <= layerCanvas.width && ly + h <= layerCanvas.height) {
            const imgData = lCtx.getImageData(lx, ly, w, h);
            const d = imgData.data;
            if (activeTool === 'blur') {
              // 3x3 box blur on region
              for (let i = 0; i < d.length; i += 4) {
                if (i > 4 && i < d.length - 4) {
                  d[i] = (d[i - 4] + d[i] + d[i + 4]) / 3;
                  d[i + 1] = (d[i - 3] + d[i + 1] + d[i + 5]) / 3;
                  d[i + 2] = (d[i - 2] + d[i + 2] + d[i + 6]) / 3;
                }
              }
            } else {
              // Simple sharpen
              for (let i = 0; i < d.length; i += 4) {
                d[i] = Math.min(255, Math.max(0, d[i] * 1.2 - 20));
                d[i + 1] = Math.min(255, Math.max(0, d[i + 1] * 1.2 - 20));
                d[i + 2] = Math.min(255, Math.max(0, d[i + 2] * 1.2 - 20));
              }
            }
            lCtx.putImageData(imgData, lx, ly);
          }
        } else if (activeTool === 'dodge' || activeTool === 'burn') {
          const rad = Math.floor(brushSize / 2);
          const lx = Math.floor(docPt.x - activeLayer.x - rad);
          const ly = Math.floor(docPt.y - activeLayer.y - rad);
          const w = rad * 2;
          const h = rad * 2;
          if (lx >= 0 && ly >= 0 && lx + w <= layerCanvas.width && ly + h <= layerCanvas.height) {
            const imgData = lCtx.getImageData(lx, ly, w, h);
            const d = imgData.data;
            const factor = activeTool === 'dodge' ? 1.15 : 0.85;
            for (let i = 0; i < d.length; i += 4) {
              d[i] = Math.min(255, Math.max(0, d[i] * factor));
              d[i + 1] = Math.min(255, Math.max(0, d[i + 1] * factor));
              d[i + 2] = Math.min(255, Math.max(0, d[i + 2] * factor));
            }
            lCtx.putImageData(imgData, lx, ly);
          }
        }

        lCtx.restore();
        onUpdateLayer(activeLayer.id, { canvas: layerCanvas });
      }
    }
  };

  // Handle Mouse Up Event
  const handleMouseUp = () => {
    if (!isInteracting) return;
    setIsInteracting(false);

    if (!dragStart || !dragCurrent) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    const dist = Math.hypot(dragCurrent.x - dragStart.x, dragCurrent.y - dragStart.y);

    // 1. Marquee Rect Selection
    if (activeTool === 'marquee-rect') {
      const mx = Math.min(dragStart.x, dragCurrent.x);
      const my = Math.min(dragStart.y, dragCurrent.y);
      const mw = Math.abs(dragCurrent.x - dragStart.x);
      const mh = Math.abs(dragCurrent.y - dragStart.y);

      if (mw > 4 && mh > 4) {
        onSetSelection?.({
          active: true,
          type: 'rect',
          bounds: { x: Math.round(mx), y: Math.round(my), width: Math.round(mw), height: Math.round(mh) },
          points: [],
          feather: toolOptions.feather || 0,
        });
        onPushHistory('Marquee Rect Selection');
      } else {
        // Click without drag clears selection
        onSetSelection?.(null);
      }
    }

    // 2. Marquee Ellipse Selection
    if (activeTool === 'marquee-ellipse') {
      const mx = Math.min(dragStart.x, dragCurrent.x);
      const my = Math.min(dragStart.y, dragCurrent.y);
      const mw = Math.abs(dragCurrent.x - dragStart.x);
      const mh = Math.abs(dragCurrent.y - dragStart.y);

      if (mw > 4 && mh > 4) {
        onSetSelection?.({
          active: true,
          type: 'ellipse',
          bounds: { x: Math.round(mx), y: Math.round(my), width: Math.round(mw), height: Math.round(mh) },
          points: [],
          feather: toolOptions.feather || 0,
        });
        onPushHistory('Marquee Ellipse Selection');
      } else {
        onSetSelection?.(null);
      }
    }

    // 3. Freehand Lasso Selection
    if (activeTool === 'lasso-free') {
      if (strokePointsRef.current.length > 2) {
        const xs = strokePointsRef.current.map((p) => p.x);
        const ys = strokePointsRef.current.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        onSetSelection?.({
          active: true,
          type: 'free',
          points: [...strokePointsRef.current],
          bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
          feather: toolOptions.feather || 0,
        });
        onPushHistory('Lasso Selection');
      }
    }

    // 4. Crop Tool: Set crop bounding box
    if (activeTool === 'crop') {
      const cx = Math.min(dragStart.x, dragCurrent.x);
      const cy = Math.min(dragStart.y, dragCurrent.y);
      const cw = Math.abs(dragCurrent.x - dragStart.x);
      const ch = Math.abs(dragCurrent.y - dragStart.y);

      if (cw > 10 && ch > 10) {
        setCropBox({ x: Math.round(cx), y: Math.round(cy), width: Math.round(cw), height: Math.round(ch) });
      }
    }

    // 5. Finalize Shape Tools -> Create Vector Shape Layer
    if (activeTool.startsWith('shape-')) {
      const shapeType = activeTool.replace('shape-', '') as any;
      const sx = Math.min(dragStart.x, dragCurrent.x);
      const sy = Math.min(dragStart.y, dragCurrent.y);
      const sw = Math.max(10, Math.abs(dragCurrent.x - dragStart.x));
      const sh = Math.max(10, Math.abs(dragCurrent.y - dragStart.y));

      const newShapeLayer: Layer = {
        id: `shape-${Date.now()}`,
        name: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} Shape`,
        type: 'shape',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        x: Math.round(sx),
        y: Math.round(sy),
        width: Math.round(sw),
        height: Math.round(sh),
        shapeType: shapeType === 'rounded' ? 'rounded-rect' : shapeType,
        fillColor: fgColor,
        strokeColor: bgColor,
        strokeWidth: toolOptions.strokeWidth || 2,
        cornerRadius: 16,
      };

      onAddLayerDirect(newShapeLayer);
      onPushHistory(`Add ${shapeType} Shape`);
    }

    // 6. Finalize Gradient Tool
    if (activeTool === 'gradient' && activeLayer) {
      const layerCanvas = getOrCreateRasterCanvas(activeLayer);
      const lCtx = layerCanvas.getContext('2d');
      if (lCtx) {
        lCtx.save();

        if (doc.selection && doc.selection.active) {
          const b = doc.selection.bounds;
          lCtx.beginPath();
          lCtx.rect(b.x - activeLayer.x, b.y - activeLayer.y, b.width, b.height);
          lCtx.clip();
        }

        let grad: CanvasGradient;
        if (gradientType === 'radial') {
          grad = lCtx.createRadialGradient(
            dragStart.x,
            dragStart.y,
            0,
            dragStart.x,
            dragStart.y,
            Math.max(10, dist)
          );
        } else {
          grad = lCtx.createLinearGradient(dragStart.x, dragStart.y, dragCurrent.x, dragCurrent.y);
        }

        grad.addColorStop(0, fgColor);
        grad.addColorStop(1, bgColor);
        lCtx.fillStyle = grad;
        lCtx.fillRect(0, 0, layerCanvas.width, layerCanvas.height);
        lCtx.restore();

        onUpdateLayer(activeLayer.id, { canvas: layerCanvas });
        onPushHistory(`${gradientType} Gradient`);
      }
    }

    // 7. Spot Healing Tool: smooth inpaint region
    if (activeTool === 'spot-healing' && activeLayer && strokePointsRef.current.length > 0) {
      const layerCanvas = getOrCreateRasterCanvas(activeLayer);
      const lCtx = layerCanvas.getContext('2d');
      if (lCtx) {
        lCtx.save();
        lCtx.filter = 'blur(4px)';
        lCtx.drawImage(layerCanvas, 0, 0);
        lCtx.restore();
        onUpdateLayer(activeLayer.id, { canvas: layerCanvas });
        onPushHistory('Spot Healing');
      }
    }

    // 8. Finalize Brush / Pencil / Eraser History
    if (['brush', 'pencil', 'eraser', 'clone-stamp', 'blur', 'sharpen', 'dodge', 'burn'].includes(activeTool)) {
      onPushHistory(`${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} Stroke`);
    }

    // 9. Finalize Move / Transform History
    if (activeTool === 'move' && dist > 2) {
      onPushHistory('Transform / Move Layer');
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

  // Apply Crop Action
  const handleConfirmCrop = () => {
    if (cropBox) {
      onCropDocument?.(cropBox);
      setCropBox(null);
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

        {/* Floating Crop Confirmation Buttons inside Document Space */}
        {cropBox && (
          <div
            className="absolute z-30 flex items-center gap-1.5 bg-[#1e1e1e] border border-cyan-500/50 rounded-lg px-2.5 py-1.5 shadow-2xl"
            style={{
              left: `${cropBox.x}px`,
              top: `${Math.max(0, cropBox.y - 42)}px`,
            }}
          >
            <span className="text-[11px] text-gray-300 font-mono pr-1">
              {cropBox.width} × {cropBox.height} px
            </span>
            <button
              onClick={handleConfirmCrop}
              className="flex items-center gap-1 px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded transition-colors"
            >
              <Check size={13} />
              <span>Apply</span>
            </button>
            <button
              onClick={() => setCropBox(null)}
              className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#333333] transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        )}
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
        {doc.selection && doc.selection.active && (
          <>
            <span className="text-gray-500">|</span>
            <span className="text-amber-400">
              Selection: {doc.selection.bounds.width}×{doc.selection.bounds.height}px
            </span>
          </>
        )}
        {cloneSourceRef.current && activeTool === 'clone-stamp' && (
          <>
            <span className="text-gray-500">|</span>
            <span className="text-cyan-400">
              Clone Source: ({Math.round(cloneSourceRef.current.x)}, {Math.round(cloneSourceRef.current.y)})
            </span>
          </>
        )}
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
