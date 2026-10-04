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
import { computeWandSelection } from '../utils/wandEngine';
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
  const [cursorScreenPos, setCursorScreenPos] = useState<{ x: number; y: number } | null>(null);

  // Interaction State
  const [isInteracting, setIsInteracting] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
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
  const lastStrokeTimeRef = useRef<number>(0);

  // In-place Text Editing State
  const [editingTextLayerId, setEditingTextLayerId] = useState<string | null>(null);
  const [editingTextVal, setEditingTextVal] = useState<string>('');
  const textInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Active editing text layer
  const editingTextLayer = doc.layers.find((l) => l.id === editingTextLayerId) || null;

  // Active layer shortcut
  const activeLayer = doc.layers.find((l) => l.id === activeLayerId) || null;

  // Commit text editing
  const commitTextEditing = useCallback(() => {
    if (!editingTextLayerId) return;
    const targetLayer = doc.layers.find((l) => l.id === editingTextLayerId);
    if (targetLayer) {
      const text = editingTextVal.trim() || 'Text Layer';
      const dims = CanvasRenderer.measureText(
        text,
        targetLayer.fontSize || 36,
        targetLayer.fontFamily || 'Inter, sans-serif',
        targetLayer.fontWeight || '600',
        targetLayer.fontStyle || 'normal',
        targetLayer.lineHeight || 1.2
      );
      onUpdateLayer(editingTextLayerId, {
        text,
        width: dims.width,
        height: dims.height,
        hiddenForEdit: false,
      });
      onPushHistory?.('Edit Text');
    }
    setEditingTextLayerId(null);
  }, [editingTextLayerId, editingTextVal, doc.layers, onUpdateLayer, onPushHistory]);

  // Cancel text editing
  const cancelTextEditing = useCallback(() => {
    if (editingTextLayerId) {
      onUpdateLayer(editingTextLayerId, { hiddenForEdit: false });
    }
    setEditingTextLayerId(null);
  }, [editingTextLayerId, onUpdateLayer]);

  // Start text editing
  const startTextEditing = useCallback(
    (layerId: string) => {
      const target = doc.layers.find((l) => l.id === layerId && l.type === 'text');
      if (!target) return;
      onSelectLayer(layerId);
      setEditingTextLayerId(layerId);
      setEditingTextVal(target.text || '');
      onUpdateLayer(layerId, { hiddenForEdit: true });
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          textInputRef.current.select();
        }
      }, 50);
    },
    [doc.layers, onSelectLayer, onUpdateLayer]
  );

  // Auto-commit when switching tool or deselecting layer
  useEffect(() => {
    if (activeTool !== 'text' && editingTextLayerId) {
      commitTextEditing();
    }
  }, [activeTool, editingTextLayerId, commitTextEditing]);

  useEffect(() => {
    if (editingTextLayerId && activeLayerId !== editingTextLayerId) {
      commitTextEditing();
    }
  }, [activeLayerId, editingTextLayerId, commitTextEditing]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditingTextVal(val);
    if (editingTextLayerId) {
      const targetLayer = doc.layers.find((l) => l.id === editingTextLayerId);
      if (targetLayer) {
        const dims = CanvasRenderer.measureText(
          val || ' ',
          targetLayer.fontSize || 36,
          targetLayer.fontFamily || 'Inter, sans-serif',
          targetLayer.fontWeight || '600',
          targetLayer.fontStyle || 'normal',
          targetLayer.lineHeight || 1.2
        );
        onUpdateLayer(editingTextLayerId, {
          text: val,
          width: dims.width,
          height: dims.height,
        });
      }
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      commitTextEditing();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      commitTextEditing();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const docPt = screenToDoc(e.clientX, e.clientY);
    const clickedTextLayer = [...doc.layers].reverse().find(
      (l) =>
        l.type === 'text' &&
        l.visible &&
        !l.locked &&
        docPt.x >= l.x &&
        docPt.x <= l.x + l.width &&
        docPt.y >= l.y &&
        docPt.y <= l.y + l.height
    );
    if (clickedTextLayer) {
      startTextEditing(clickedTextLayer.id);
    }
  };

  // Convert client viewport screen coordinates to document canvas pixel coordinates
  const screenToDoc = useCallback(
    (clientX: number, clientY: number): Point => {
      // Primary: measure direct document canvas bounding rect for 100% pixel-perfect hit-testing
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const docX = ((clientX - rect.left) / rect.width) * doc.width;
          const docY = ((clientY - rect.top) / rect.height) * doc.height;
          return { x: docX, y: docY };
        }
      }

      // Viewport container geometry fallback
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      const centerX = rect.width / 2 + doc.pan.x;
      const centerY = rect.height / 2 + doc.pan.y;

      const docLeft = centerX - (doc.width * doc.zoom) / 2;
      const docTop = centerY - (doc.height * doc.zoom) / 2;

      const docX = (screenX - docLeft) / doc.zoom;
      const docY = (screenY - docTop) / doc.zoom;

      return { x: docX, y: docY };
    },
    [doc.width, doc.height, doc.pan.x, doc.pan.y, doc.zoom]
  );

  // Ensure active layer has a writable raster canvas with full document dimensions
  const getOrCreateRasterCanvas = useCallback(
    (targetLayer: Layer): HTMLCanvasElement => {
      const minW = Math.max(targetLayer.width || 0, doc.width);
      const minH = Math.max(targetLayer.height || 0, doc.height);

      if (targetLayer.canvas) {
        if (targetLayer.canvas.width < minW || targetLayer.canvas.height < minH) {
          const expanded = document.createElement('canvas');
          expanded.width = minW;
          expanded.height = minH;
          const eCtx = expanded.getContext('2d');
          if (eCtx && targetLayer.canvas.width > 0 && targetLayer.canvas.height > 0) {
            eCtx.drawImage(targetLayer.canvas, 0, 0);
          }
          targetLayer.canvas = expanded;
        }
        return targetLayer.canvas;
      }
      const c = document.createElement('canvas');
      c.width = minW;
      c.height = minH;
      targetLayer.canvas = c;
      return c;
    },
    [doc.width, doc.height]
  );

  // Auto-fit document on initial mount and when document dimensions change
  const initialFitDoneRef = useRef(false);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const fitToView = () => {
      const cWidth = container.clientWidth;
      const cHeight = container.clientHeight;
      if (cWidth > 100 && cHeight > 100) {
        const padding = 64; // comfortable padding around canvas
        const availW = Math.max(100, cWidth - padding);
        const availH = Math.max(100, cHeight - padding);
        const scale = Math.min(availW / doc.width, availH / doc.height, 1);
        const roundedScale = Math.max(0.05, Math.min(3, Math.round(scale * 100) / 100));
        onSetZoom(roundedScale);
        onSetPan({ x: 0, y: 0 });
      }
    };

    if (!initialFitDoneRef.current) {
      initialFitDoneRef.current = true;
      const timer = setTimeout(fitToView, 60);
      return () => clearTimeout(timer);
    }
  }, [doc.id, doc.width, doc.height, onSetZoom, onSetPan]);

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
      activeTool,
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
    if (e.button === 1 || (e.altKey && activeTool !== 'clone-stamp') || activeTool === 'hand') {
      // Middle click or Alt or Hand tool: Pan Mode
      setIsPanning(true);
      setIsInteracting(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (e.button !== 0) return; // Only primary left click

    const container = containerRef.current;
    if (container) {
      const cRect = container.getBoundingClientRect();
      setCursorScreenPos({
        x: e.clientX - cRect.left,
        y: e.clientY - cRect.top,
      });
    }

    const docPt = screenToDoc(e.clientX, e.clientY);

    // If currently editing text and clicked with another tool or outside
    if (editingTextLayerId && activeTool !== 'text') {
      commitTextEditing();
    }

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

    // 5. Chroma & Tonal Wand Tool: Professional flood-fill & global tone selection
    if (activeTool === 'magic-wand') {
      const selection = computeWandSelection(doc, activeLayer, docPt, {
        tolerance: toolOptions.tolerance ?? 32,
        contiguous: toolOptions.contiguous ?? true,
        sampleAllLayers: toolOptions.sampleAllLayers ?? false,
        feather: toolOptions.feather || 0,
      });

      if (selection) {
        onSetSelection?.(selection);
        onPushHistory(
          toolOptions.contiguous ?? true
            ? 'Contiguous Wand Selection'
            : 'Chroma / Tonal Global Selection'
        );
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

    // 7. Raster Stroke Tools: Brush / Pencil / Pen / Eraser / Blur / Sharpen / Smudge / Dodge / Burn / Sponge / Clone / Healing
    const isRasterStroke = [
      'brush',
      'pencil',
      'pen',
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
        target = doc.layers.find((l) => l.type === 'raster' && !l.locked) ||
                 doc.layers.find((l) => l.type === 'raster') || null;
        if (target) {
          onSelectLayer(target.id);
        }
      }

      // If target layer is locked, auto-unlock it immediately so user can edit right away
      if (target && target.locked) {
        onUpdateLayer(target.id, { locked: false });
        target = { ...target, locked: false };
      }

      if (!target) {
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
      lastStrokeTimeRef.current = performance.now();
      const layerCanvas = getOrCreateRasterCanvas(target);
      const lCtx = layerCanvas.getContext('2d');
      if (lCtx) {
        lCtx.save();
        lCtx.translate(-target.x, -target.y);

        const brushSize = toolOptions.brushSize || 20;
        const sizeJitter = (toolOptions.brushSizeJitter || 0) / 100;
        const opacityJitter = (toolOptions.brushOpacityJitter || 0) / 100;
        const pressureSim = toolOptions.brushPressureSim ?? true;
        const baseBrushSize = activeTool === 'pen' ? (toolOptions.strokeWidth || 2) : brushSize;
        const baseOpacity = (toolOptions.brushOpacity || 100) / 100;

        const randSizeJitter = sizeJitter > 0 ? (1 - Math.random() * sizeJitter) : 1.0;
        const initialSize = Math.max(1, baseBrushSize * (pressureSim ? 0.6 : 1.0) * randSizeJitter);

        const randOpacityJitter = opacityJitter > 0 ? (1 - Math.random() * opacityJitter) : 1.0;
        const initialOpacity = Math.max(0.02, Math.min(1, baseOpacity * (pressureSim ? 0.65 : 1.0) * randOpacityJitter));

        if (activeTool === 'eraser') {
          lCtx.globalCompositeOperation = 'destination-out';
          lCtx.fillStyle = 'rgba(0,0,0,1)';
          lCtx.beginPath();
          lCtx.arc(docPt.x, docPt.y, initialSize / 2, 0, Math.PI * 2);
          lCtx.fill();
        } else if (activeTool === 'brush' || activeTool === 'pencil' || activeTool === 'pen') {
          lCtx.globalCompositeOperation = 'source-over';
          lCtx.fillStyle = fgColor;
          lCtx.globalAlpha = initialOpacity;
          lCtx.beginPath();
          lCtx.arc(
            docPt.x,
            docPt.y,
            initialSize / 2,
            0,
            Math.PI * 2
          );
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
          } else if (doc.selection.points && doc.selection.points.length > 2) {
            lCtx.beginPath();
            lCtx.moveTo(doc.selection.points[0].x - activeLayer.x, doc.selection.points[0].y - activeLayer.y);
            for (let i = 1; i < doc.selection.points.length; i++) {
              lCtx.lineTo(doc.selection.points[i].x - activeLayer.x, doc.selection.points[i].y - activeLayer.y);
            }
            lCtx.closePath();
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

    // 9. Text Tool: Click to add or edit Text layer
    if (activeTool === 'text') {
      // If user is currently editing a text layer, commit previous edit
      if (editingTextLayerId) {
        commitTextEditing();
      }

      // Check if user clicked an existing text layer to edit it
      const clickedTextLayer = [...doc.layers].reverse().find(
        (l) =>
          l.type === 'text' &&
          l.visible &&
          !l.locked &&
          docPt.x >= l.x &&
          docPt.x <= l.x + l.width &&
          docPt.y >= l.y &&
          docPt.y <= l.y + l.height
      );

      if (clickedTextLayer) {
        startTextEditing(clickedTextLayer.id);
        return;
      }

      // Clicked on empty space: create new text layer at clicked position
      const initialText = 'Your text here';
      const fontSize = toolOptions.fontSize || 36;
      const fontFamily = toolOptions.fontFamily || 'Inter, sans-serif';
      const fontWeight = '600';
      const dims = CanvasRenderer.measureText(initialText, fontSize, fontFamily, fontWeight, 'normal', 1.2);

      const newTextLayer: Layer = {
        id: `text-${Date.now()}`,
        name: `Text ${doc.layers.filter((l) => l.type === 'text').length + 1}`,
        type: 'text',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        x: Math.round(docPt.x),
        y: Math.round(docPt.y),
        width: dims.width,
        height: dims.height,
        text: initialText,
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle: 'normal',
        textColor: fgColor,
        textAlign: toolOptions.textAlign || 'left',
        lineHeight: 1.2,
        hiddenForEdit: true,
      };

      onAddLayerDirect(newTextLayer);
      onSelectLayer(newTextLayer.id);
      setEditingTextLayerId(newTextLayer.id);
      setEditingTextVal(initialText);
      onPushHistory?.('Add Type Layer');

      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          textInputRef.current.select();
        }
      }, 50);
      return;
    }
  };

  // Handle Mouse Move Event
  const handleMouseMove = (e: React.MouseEvent) => {
    const docPt = screenToDoc(e.clientX, e.clientY);
    setCursorDocPos(docPt);

    const container = containerRef.current;
    if (container) {
      const cRect = container.getBoundingClientRect();
      setCursorScreenPos({
        x: e.clientX - cRect.left,
        y: e.clientY - cRect.top,
      });
    }

    if (!isInteracting) return;

    if (isPanning || activeTool === 'hand' || (e.altKey && activeTool !== 'clone-stamp') || dragStart === null) {
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
      'pen',
      'eraser',
      'clone-stamp',
      'blur',
      'sharpen',
      'smudge',
      'dodge',
      'burn',
      'sponge',
    ].includes(activeTool);

    if (isContinuousStroke) {
      let target = activeLayer;
      if (!target || target.type !== 'raster') {
        target = doc.layers.find((l) => l.type === 'raster') || null;
      }
      if (!target) return;

      const prevPt = strokePointsRef.current[strokePointsRef.current.length - 1] || docPt;
      strokePointsRef.current.push(docPt);

      const layerCanvas = getOrCreateRasterCanvas(target);
      const lCtx = layerCanvas.getContext('2d');
      if (lCtx) {
        lCtx.save();
        lCtx.translate(-target.x, -target.y);

        const brushSize = toolOptions.brushSize || 20;
        const sizeJitter = (toolOptions.brushSizeJitter || 0) / 100;
        const opacityJitter = (toolOptions.brushOpacityJitter || 0) / 100;
        const pressureSim = toolOptions.brushPressureSim ?? true;
        const baseBrushSize = activeTool === 'pen' ? (toolOptions.strokeWidth || 2) : brushSize;
        const baseOpacity = (toolOptions.brushOpacity || 100) / 100;

        const dx = docPt.x - prevPt.x;
        const dy = docPt.y - prevPt.y;
        const dist = Math.hypot(dx, dy);

        const now = performance.now();
        const dt = Math.max(1, now - (lastStrokeTimeRef.current || now));
        lastStrokeTimeRef.current = now;
        const speed = dist / dt; // pixels per ms

        const rawPressure = (e.nativeEvent as any)?.pressure;
        const hasStylusPressure = rawPressure !== undefined && rawPressure > 0 && rawPressure !== 0.5;
        const strokeCount = strokePointsRef.current.length;
        const rampIn = Math.min(1, 0.4 + strokeCount * 0.15);
        const speedFactor = Math.max(0.4, Math.min(1.3, 1.25 - speed * 0.12));
        const simPressure = hasStylusPressure ? rawPressure : (pressureSim ? (rampIn * speedFactor) : 1.0);

        if (activeTool === 'eraser' || activeTool === 'brush' || activeTool === 'pencil' || activeTool === 'pen') {
          lCtx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';
          lCtx.strokeStyle = activeTool === 'eraser' ? 'rgba(0,0,0,1)' : fgColor;
          lCtx.lineCap = 'round';
          lCtx.lineJoin = 'round';

          if (sizeJitter > 0 || opacityJitter > 0 || pressureSim) {
            const stepDist = Math.max(2, Math.min(12, baseBrushSize * 0.3));
            const steps = Math.max(1, Math.min(60, Math.ceil(dist / stepDist)));

            for (let s = 1; s <= steps; s++) {
              const t0 = (s - 1) / steps;
              const t1 = s / steps;
              const p0x = prevPt.x + dx * t0;
              const p0y = prevPt.y + dy * t0;
              const p1x = prevPt.x + dx * t1;
              const p1y = prevPt.y + dy * t1;

              const randSizeJitter = sizeJitter > 0 ? (1 - Math.random() * sizeJitter) : 1.0;
              const stepSize = Math.max(1, baseBrushSize * simPressure * randSizeJitter);

              const randOpacityJitter = opacityJitter > 0 ? (1 - Math.random() * opacityJitter) : 1.0;
              const pressureAlpha = pressureSim ? (0.35 + 0.65 * simPressure) : 1.0;
              const stepOpacity = Math.max(0.02, Math.min(1, baseOpacity * pressureAlpha * randOpacityJitter));

              lCtx.lineWidth = stepSize;
              lCtx.globalAlpha = stepOpacity;
              lCtx.beginPath();
              lCtx.moveTo(p0x, p0y);
              lCtx.lineTo(p1x, p1y);
              lCtx.stroke();
            }
          } else {
            lCtx.lineWidth = baseBrushSize;
            lCtx.globalAlpha = baseOpacity;
            lCtx.beginPath();
            lCtx.moveTo(prevPt.x, prevPt.y);
            lCtx.lineTo(docPt.x, docPt.y);
            lCtx.stroke();
          }
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
    setIsPanning(false);
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
          const lx = b.x - activeLayer.x;
          const ly = b.y - activeLayer.y;
          lCtx.beginPath();
          if (doc.selection.type === 'ellipse') {
            lCtx.ellipse(lx + b.width / 2, ly + b.height / 2, b.width / 2, b.height / 2, 0, 0, Math.PI * 2);
          } else if (doc.selection.points && doc.selection.points.length > 2) {
            lCtx.moveTo(doc.selection.points[0].x - activeLayer.x, doc.selection.points[0].y - activeLayer.y);
            for (let i = 1; i < doc.selection.points.length; i++) {
              lCtx.lineTo(doc.selection.points[i].x - activeLayer.x, doc.selection.points[i].y - activeLayer.y);
            }
            lCtx.closePath();
          } else {
            lCtx.rect(lx, ly, b.width, b.height);
          }
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

    // 8. Finalize Brush / Pencil / Pen / Eraser History
    if (['brush', 'pencil', 'pen', 'eraser', 'clone-stamp', 'blur', 'sharpen', 'smudge', 'dodge', 'burn', 'sponge'].includes(activeTool)) {
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

  const isBrushTool = [
    'brush',
    'pencil',
    'pen',
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

  const getCursorStyle = () => {
    if (isPanning || (activeTool === 'hand' && isInteracting)) return 'grabbing';
    if (activeTool === 'hand') return 'grab';
    if (isBrushTool) return 'none';
    if (activeTool === 'move') return transformHandle ? `${transformHandle}-resize` : 'default';
    if (activeTool === 'text') return 'text';
    if (activeTool === 'eyedropper') return 'crosshair';
    return 'crosshair';
  };

  const activeBrushDiameter = Math.max(
    4,
    (activeTool === 'pen' ? (toolOptions.strokeWidth || 2) : (toolOptions.brushSize || 20)) * doc.zoom
  );

  return (
    <div
      ref={containerRef}
      id="imagemate-canvas-stage"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onMouseLeave={() => {
        setIsPanning(false);
        setCursorDocPos(null);
        setCursorScreenPos(null);
      }}
      onWheel={handleWheel}
      className="flex-1 h-full bg-[#181818] relative overflow-hidden select-none flex items-center justify-center"
      style={{ cursor: getCursorStyle() }}
    >
      {/* Horizontal & Vertical Pixel Rulers */}
      <Rulers
        doc={doc}
        containerRef={containerRef}
        canvasRef={canvasRef}
        mousePos={cursorDocPos}
        onAddGuide={onAddGuide}
        onResetPan={() => onSetPan({ x: 0, y: 0 })}
      />

      {/* Precision Brush Cursor Outline with Center Reticle */}
      {isBrushTool && cursorScreenPos && !isPanning && (
        <div
          className="pointer-events-none absolute z-50 rounded-full border border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.85)] flex items-center justify-center -translate-x-1/2 -translate-y-1/2 will-change-transform"
          style={{
            left: `${cursorScreenPos.x}px`,
            top: `${cursorScreenPos.y}px`,
            width: `${activeBrushDiameter}px`,
            height: `${activeBrushDiameter}px`,
          }}
        >
          {/* 1px Center Reticle Dot */}
          <div className="w-[3px] h-[3px] rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.9)]" />
        </div>
      )}

      {/* Document Viewport Wrapper with Pan & Zoom Transform */}
      <div
        className="shadow-2xl relative shrink-0 select-none"
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

        {/* In-Place Interactive Text Editor */}
        {editingTextLayer && (
          <div
            className="absolute z-40"
            style={{
              left: `${editingTextLayer.x}px`,
              top: `${editingTextLayer.y}px`,
              transform: editingTextLayer.rotation ? `rotate(${editingTextLayer.rotation}deg)` : undefined,
              transformOrigin: 'top left',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Quick Floating Text Bar with Confirm & Cancel */}
            <div className="absolute -top-9 left-0 flex items-center gap-1.5 bg-[#1e1e1e] border border-cyan-500/80 rounded-md px-2 py-1 shadow-2xl text-xs z-50 whitespace-nowrap">
              <span className="text-[11px] text-gray-300 font-mono">
                {editingTextLayer.fontSize || 36}pt {editingTextLayer.fontFamily?.split(',')[0]}
              </span>
              <div className="h-3 w-px bg-gray-600 mx-0.5" />
              <button
                type="button"
                onClick={commitTextEditing}
                title="Commit Text (Ctrl+Enter)"
                className="flex items-center gap-1 px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-[11px] transition-colors shadow-sm"
              >
                <Check size={12} />
                <span>Done</span>
              </button>
              <button
                type="button"
                onClick={cancelTextEditing}
                title="Cancel (Esc)"
                className="p-1 hover:bg-[#333333] text-gray-400 hover:text-white rounded transition-colors"
              >
                <X size={12} />
              </button>
            </div>

            <textarea
              ref={textInputRef}
              value={editingTextVal}
              onChange={handleTextChange}
              onKeyDown={handleTextKeyDown}
              rows={Math.max(1, editingTextVal.split('\n').length)}
              className="bg-black/85 text-white border-2 border-cyan-400 outline-none rounded p-1 shadow-2xl overflow-hidden block resize-none"
              style={{
                fontFamily: editingTextLayer.fontFamily || 'Inter, sans-serif',
                fontSize: `${editingTextLayer.fontSize || 36}px`,
                fontWeight: editingTextLayer.fontWeight || '600',
                fontStyle: editingTextLayer.fontStyle || 'normal',
                color: editingTextLayer.textColor || fgColor,
                textAlign: editingTextLayer.textAlign || 'left',
                lineHeight: editingTextLayer.lineHeight || 1.2,
                minWidth: '160px',
                width: `${Math.max(160, editingTextLayer.width)}px`,
                height: `${Math.max(42, editingTextLayer.height)}px`,
              }}
              placeholder="Type your text..."
              autoFocus
            />
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
