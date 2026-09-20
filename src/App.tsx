/**
 * ImageMate Studio - Main Application Orchestrator
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DocumentProject,
  Layer,
  ToolType,
  ToolOptions,
  AdjustmentType,
  HistoryStep,
  Point,
  LayerEffects,
} from './types/imagemate';
import {
  createCyberpunkProject,
  createBrandProject,
  createBlankProject,
} from './utils/sampleProjects';
import { CanvasRenderer } from './utils/canvasRenderer';
import { FilterEngine } from './utils/filterEngine';
import { FileExporter } from './utils/fileExporter';

import { TopMenuBar } from './components/TopMenuBar';
import { ToolOptionsBar } from './components/ToolOptionsBar';
import { Toolbar } from './components/Toolbar';
import { CanvasStage } from './components/CanvasStage';
import { RightDock } from './components/RightDock';

import { NewDocumentModal } from './components/modals/NewDocumentModal';
import { ExportModal } from './components/modals/ExportModal';
import { FilterGalleryModal } from './components/modals/FilterGalleryModal';
import { ImageAdjustmentsModal } from './components/modals/ImageAdjustmentsModal';
import { LayerStylesModal } from './components/modals/LayerStylesModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { CanvasSizeModal } from './components/modals/CanvasSizeModal';

export const App: React.FC = () => {
  // 1. Initial State: Start with high-impact Cyberpunk 2088 demo project
  const [doc, setDoc] = useState<DocumentProject>(() => createCyberpunkProject());
  const [activeTool, setActiveTool] = useState<ToolType>('move');
  const [activeLayerId, setActiveLayerId] = useState<string | null>(() => {
    const initDoc = createCyberpunkProject();
    return initDoc.layers[initDoc.layers.length - 1]?.id || null;
  });

  const [fgColor, setFgColor] = useState<string>('#00e5ff');
  const [bgColor, setBgColor] = useState<string>('#ff0055');

  const [toolOptions, setToolOptions] = useState<ToolOptions>({
    brushSize: 24,
    brushHardness: 80,
    brushOpacity: 100,
    brushFlow: 100,
    feather: 0,
    tolerance: 32,
    contiguous: true,
    fontFamily: 'Inter, sans-serif',
    fontSize: 48,
    textAlign: 'left',
    fillColor: '#00e5ff',
    strokeColor: '#ff0055',
    strokeWidth: 2,
    shapeType: 'rect',
    zoomLevel: 100,
    sampleAllLayers: false,
  });

  // History Stack
  const [history, setHistory] = useState<HistoryStep[]>(() => [
    { id: 'init', name: 'Open Project', document: createCyberpunkProject(), timestamp: Date.now() },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Modals visibility
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFilterGalleryOpen, setIsFilterGalleryOpen] = useState(false);
  const [isAdjustmentsOpen, setIsAdjustmentsOpen] = useState(false);
  const [activeAdjModalType, setActiveAdjModalType] = useState<AdjustmentType | null>(null);
  const [isLayerStylesOpen, setIsLayerStylesOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCanvasSizeOpen, setIsCanvasSizeOpen] = useState(false);
  const [canvasSizeMode, setCanvasSizeMode] = useState<'canvas' | 'image'>('canvas');
  const [cropRatio, setCropRatio] = useState<string>('free');
  const [gradientType, setGradientType] = useState<'linear' | 'radial' | 'reflected' | 'diamond'>('linear');

  // Active layer shortcut
  const activeLayer = doc.layers.find((l) => l.id === activeLayerId) || null;

  // Push Step to History Stack
  const pushHistory = useCallback(
    (name: string, updatedDoc?: DocumentProject) => {
      const stateToSave = updatedDoc || doc;
      // Deep clone document structure (shallow copying canvases)
      const clonedDoc: DocumentProject = {
        ...stateToSave,
        layers: stateToSave.layers.map((l) => {
          let clonedCanvas: HTMLCanvasElement | undefined = undefined;
          if (l.canvas) {
            clonedCanvas = document.createElement('canvas');
            clonedCanvas.width = l.canvas.width;
            clonedCanvas.height = l.canvas.height;
            const ctx = clonedCanvas.getContext('2d');
            if (ctx) ctx.drawImage(l.canvas, 0, 0);
          }
          return { ...l, canvas: clonedCanvas };
        }),
      };

      const newStep: HistoryStep = {
        id: `step-${Date.now()}-${Math.random()}`,
        name,
        document: clonedDoc,
        timestamp: Date.now(),
      };

      setHistory((prev) => [...prev.slice(0, historyIndex + 1), newStep]);
      setHistoryIndex((prev) => prev + 1);
    },
    [doc, historyIndex]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const targetStep = history[prevIndex];
      setHistoryIndex(prevIndex);
      setDoc(targetStep.document);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetStep = history[nextIndex];
      setHistoryIndex(nextIndex);
      setDoc(targetStep.document);
    }
  }, [history, historyIndex]);

  const handleJumpToHistoryStep = (index: number) => {
    if (index >= 0 && index < history.length) {
      setHistoryIndex(index);
      setDoc(history[index].document);
    }
  };

  // Layer Mutations
  const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
    setDoc((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  };

  const handleAddLayerDirect = (newLayer: Layer) => {
    setDoc((prev) => {
      const newLayers = [...prev.layers, newLayer];
      return { ...prev, layers: newLayers };
    });
    setActiveLayerId(newLayer.id);
  };

  const handleAddNewBlankLayer = () => {
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
    handleAddLayerDirect(newLayer);
    pushHistory('New Layer');
  };

  const handleDuplicateLayer = (id: string) => {
    const target = doc.layers.find((l) => l.id === id);
    if (!target) return;

    let dupCanvas: HTMLCanvasElement | undefined = undefined;
    if (target.canvas) {
      dupCanvas = document.createElement('canvas');
      dupCanvas.width = target.canvas.width;
      dupCanvas.height = target.canvas.height;
      const ctx = dupCanvas.getContext('2d');
      if (ctx) ctx.drawImage(target.canvas, 0, 0);
    }

    const dupLayer: Layer = {
      ...target,
      id: `layer-${Date.now()}`,
      name: `${target.name} Copy`,
      canvas: dupCanvas,
      x: target.x + 15,
      y: target.y + 15,
    };

    setDoc((prev) => {
      const idx = prev.layers.findIndex((l) => l.id === id);
      const newLayers = [...prev.layers];
      newLayers.splice(idx + 1, 0, dupLayer);
      return { ...prev, layers: newLayers };
    });
    setActiveLayerId(dupLayer.id);
    pushHistory(`Duplicate ${target.name}`);
  };

  const handleDeleteLayer = (id: string) => {
    if (doc.layers.length <= 1) return;
    setDoc((prev) => {
      const remaining = prev.layers.filter((l) => l.id !== id);
      return { ...prev, layers: remaining };
    });
    const remaining = doc.layers.filter((l) => l.id !== id);
    setActiveLayerId(remaining[remaining.length - 1]?.id || null);
    pushHistory('Delete Layer');
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    const idx = doc.layers.findIndex((l) => l.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx >= doc.layers.length - 1) return;
    if (direction === 'down' && idx <= 0) return;

    const newLayers = [...doc.layers];
    const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
    const temp = newLayers[idx];
    newLayers[idx] = newLayers[targetIdx];
    newLayers[targetIdx] = temp;

    setDoc((prev) => ({ ...prev, layers: newLayers }));
    pushHistory(`Reorder Layer ${direction}`);
  };

  const handleAddAdjustmentLayer = (type: AdjustmentType) => {
    const newAdjLayer: Layer = {
      id: `adj-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Adjustment`,
      type: 'adjustment',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 0,
      y: 0,
      width: doc.width,
      height: doc.height,
      adjustmentType: type,
      adjustmentParams: {
        brightness: 15,
        contrast: 20,
        hue: 0,
        saturation: 25,
      },
    };
    handleAddLayerDirect(newAdjLayer);
    pushHistory(`Add ${type} Adjustment`);
  };

  const handleAddLayerMask = (id: string) => {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = doc.width;
    maskCanvas.height = doc.height;
    const ctx = maskCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    }
    handleUpdateLayer(id, { maskCanvas });
    pushHistory('Add Layer Mask');
  };

  // Auto Enhance Action
  const handleAutoEnhance = () => {
    if (!activeLayer) return;

    let srcCanvas = activeLayer.canvas;
    if (!srcCanvas) return;

    const ctx = srcCanvas.getContext('2d');
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
      const enhanced = FilterEngine.applyAutoEnhance(imgData);
      ctx.putImageData(enhanced, 0, 0);
      handleUpdateLayer(activeLayer.id, { canvas: srcCanvas });
      pushHistory('AI Auto Enhance');
    } catch {
      // ignore
    }
  };

  // Merge Down Layer
  const handleMergeDown = () => {
    if (!activeLayerId) return;
    const idx = doc.layers.findIndex((l) => l.id === activeLayerId);
    if (idx <= 0) return; // Cannot merge bottom layer

    const topLayer = doc.layers[idx];
    const bottomLayer = doc.layers[idx - 1];

    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = doc.width;
    mergedCanvas.height = doc.height;
    const mCtx = mergedCanvas.getContext('2d');

    if (mCtx) {
      // Draw bottom
      CanvasRenderer.renderLayer(mCtx, bottomLayer, doc.width, doc.height);
      // Draw top
      CanvasRenderer.renderLayer(mCtx, topLayer, doc.width, doc.height);
    }

    const mergedLayer: Layer = {
      ...bottomLayer,
      id: `layer-${Date.now()}`,
      name: `${bottomLayer.name} + ${topLayer.name}`,
      canvas: mergedCanvas,
      x: 0,
      y: 0,
      width: doc.width,
      height: doc.height,
    };

    setDoc((prev) => {
      const newLayers = prev.layers.filter((_, i) => i !== idx && i !== idx - 1);
      newLayers.splice(idx - 1, 0, mergedLayer);
      return { ...prev, layers: newLayers };
    });
    setActiveLayerId(mergedLayer.id);
    pushHistory('Merge Layers Down');
  };

  // Flatten Image
  const handleFlattenImage = () => {
    const flatCanvas = document.createElement('canvas');
    flatCanvas.width = doc.width;
    flatCanvas.height = doc.height;
    const fCtx = flatCanvas.getContext('2d');
    if (fCtx) {
      CanvasRenderer.renderDocument(fCtx, doc, {
        renderBackground: true,
        renderOverlays: false,
        activeLayerId: null,
      });
    }

    const backgroundLayer: Layer = {
      id: 'bg-flattened',
      name: 'Background',
      type: 'raster',
      visible: true,
      locked: true,
      opacity: 100,
      blendMode: 'normal',
      x: 0,
      y: 0,
      width: doc.width,
      height: doc.height,
      canvas: flatCanvas,
    };

    setDoc((prev) => ({
      ...prev,
      layers: [backgroundLayer],
    }));
    setActiveLayerId(backgroundLayer.id);
    pushHistory('Flatten Image');
  };

  // Open Sample Project
  const handleOpenSample = (type: 'cyberpunk' | 'brand') => {
    const sample = type === 'cyberpunk' ? createCyberpunkProject() : createBrandProject();
    setDoc(sample);
    setActiveLayerId(sample.layers[sample.layers.length - 1]?.id || null);
    setHistory([{ id: 'init', name: `Open ${sample.title}`, document: sample, timestamp: Date.now() }]);
    setHistoryIndex(0);
  };

  // Create New Custom Document
  const handleCreateDocument = (
    title: string,
    width: number,
    height: number,
    dpi: number,
    bg: 'transparent' | 'white' | 'black' | 'custom',
    customBgColor: string
  ) => {
    const newDoc = createBlankProject(title, width, height, dpi, bg, customBgColor);
    setDoc(newDoc);
    setActiveLayerId(newDoc.layers[0]?.id || null);
    setHistory([{ id: 'init', name: 'New Document', document: newDoc, timestamp: Date.now() }]);
    setHistoryIndex(0);
  };

  // Open Local Image as Layer / Document
  const handleOpenImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const imgCanvas = document.createElement('canvas');
        imgCanvas.width = img.width;
        imgCanvas.height = img.height;
        const ctx = imgCanvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);

        const newLayer: Layer = {
          id: `img-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: 'raster',
          visible: true,
          locked: false,
          opacity: 100,
          blendMode: 'normal',
          x: Math.max(0, (doc.width - img.width) / 2),
          y: Math.max(0, (doc.height - img.height) / 2),
          width: img.width,
          height: img.height,
          canvas: imgCanvas,
        };

        handleAddLayerDirect(newLayer);
        pushHistory(`Place ${file.name}`);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Resize Canvas / Resample Image
  const handleResize = (newWidth: number, newHeight: number, mode: 'canvas' | 'image') => {
    if (mode === 'image') {
      // Scale all layers proportionally
      const scaleX = newWidth / doc.width;
      const scaleY = newHeight / doc.height;

      setDoc((prev) => ({
        ...prev,
        width: newWidth,
        height: newHeight,
        layers: prev.layers.map((l) => ({
          ...l,
          x: l.x * scaleX,
          y: l.y * scaleY,
          width: l.width * scaleX,
          height: l.height * scaleY,
        })),
      }));
    } else {
      // Expand / shrink canvas bounds
      setDoc((prev) => ({
        ...prev,
        width: newWidth,
        height: newHeight,
      }));
    }
    pushHistory(`${mode === 'canvas' ? 'Canvas' : 'Image'} Size Resample`);
  };

  // Crop Entire Document
  const handleCropDocument = (bounds: { x: number; y: number; width: number; height: number }) => {
    const w = Math.round(bounds.width);
    const h = Math.round(bounds.height);
    if (w < 10 || h < 10) return;

    const newLayers = doc.layers.map((layer) => {
      let newCanvas = layer.canvas;
      if (layer.canvas) {
        newCanvas = document.createElement('canvas');
        newCanvas.width = layer.canvas.width;
        newCanvas.height = layer.canvas.height;
        const ctx = newCanvas.getContext('2d');
        if (ctx) ctx.drawImage(layer.canvas, 0, 0);
      }
      return {
        ...layer,
        x: Math.round(layer.x - bounds.x),
        y: Math.round(layer.y - bounds.y),
        canvas: newCanvas,
      };
    });

    const updatedDoc: DocumentProject = {
      ...doc,
      width: w,
      height: h,
      layers: newLayers,
      selection: null,
    };
    setDoc(updatedDoc);
    pushHistory('Crop Canvas', updatedDoc);
  };

  // Rotate Entire Canvas
  const handleRotateCanvas = (angleDeg: 90 | 180 | 270) => {
    const rad = (angleDeg * Math.PI) / 180;
    const isSwap = angleDeg === 90 || angleDeg === 270;
    const newW = isSwap ? doc.height : doc.width;
    const newH = isSwap ? doc.width : doc.height;

    const newLayers = doc.layers.map((layer) => {
      let newCanvas = layer.canvas;
      if (layer.canvas) {
        newCanvas = document.createElement('canvas');
        newCanvas.width = isSwap ? layer.canvas.height : layer.canvas.width;
        newCanvas.height = isSwap ? layer.canvas.width : layer.canvas.height;
        const c = newCanvas.getContext('2d');
        if (c) {
          c.translate(newCanvas.width / 2, newCanvas.height / 2);
          c.rotate(rad);
          c.drawImage(layer.canvas, -layer.canvas.width / 2, -layer.canvas.height / 2);
        }
      }
      let newX = layer.x;
      let newY = layer.y;
      if (angleDeg === 90) {
        newX = doc.height - (layer.y + layer.height);
        newY = layer.x;
      } else if (angleDeg === 180) {
        newX = doc.width - (layer.x + layer.width);
        newY = doc.height - (layer.y + layer.height);
      } else if (angleDeg === 270) {
        newX = layer.y;
        newY = doc.width - (layer.x + layer.width);
      }
      return {
        ...layer,
        x: Math.round(newX),
        y: Math.round(newY),
        width: isSwap ? layer.height : layer.width,
        height: isSwap ? layer.width : layer.height,
        canvas: newCanvas,
      };
    });

    const updatedDoc: DocumentProject = {
      ...doc,
      width: newW,
      height: newH,
      layers: newLayers,
      selection: null,
    };
    setDoc(updatedDoc);
    pushHistory(`Rotate Canvas ${angleDeg}°`, updatedDoc);
  };

  // Flip Canvas Horizontally / Vertically
  const handleFlipCanvas = (dir: 'h' | 'v') => {
    const newLayers = doc.layers.map((layer) => {
      let newCanvas = layer.canvas;
      if (layer.canvas) {
        newCanvas = document.createElement('canvas');
        newCanvas.width = layer.canvas.width;
        newCanvas.height = layer.canvas.height;
        const c = newCanvas.getContext('2d');
        if (c) {
          if (dir === 'h') {
            c.translate(newCanvas.width, 0);
            c.scale(-1, 1);
          } else {
            c.translate(0, newCanvas.height);
            c.scale(1, -1);
          }
          c.drawImage(layer.canvas, 0, 0);
        }
      }
      const newX = dir === 'h' ? doc.width - (layer.x + layer.width) : layer.x;
      const newY = dir === 'v' ? doc.height - (layer.y + layer.height) : layer.y;
      return {
        ...layer,
        x: Math.round(newX),
        y: Math.round(newY),
        canvas: newCanvas,
      };
    });

    const updatedDoc: DocumentProject = {
      ...doc,
      layers: newLayers,
      selection: null,
    };
    setDoc(updatedDoc);
    pushHistory(`Flip Canvas ${dir === 'h' ? 'Horizontal' : 'Vertical'}`, updatedDoc);
  };

  // Select All Canvas Area
  const handleSelectAll = () => {
    setDoc((prev) => ({
      ...prev,
      selection: {
        active: true,
        type: 'rect',
        bounds: { x: 0, y: 0, width: prev.width, height: prev.height },
        points: [],
        feather: 0,
      },
    }));
    pushHistory('Select All');
  };

  // Clear / Deselect Selection
  const handleDeselect = () => {
    setDoc((prev) => ({ ...prev, selection: null }));
    pushHistory('Deselect');
  };

  // Invert Selection Bounds
  const handleInvertSelection = () => {
    setDoc((prev) => {
      if (!prev.selection) return prev;
      return {
        ...prev,
        selection: {
          ...prev.selection,
          bounds: { x: 0, y: 0, width: prev.width, height: prev.height },
        },
      };
    });
    pushHistory('Invert Selection');
  };

  // Delete Selection or Active Layer
  const handleDeleteSelection = () => {
    if (doc.selection && doc.selection.active && activeLayer && activeLayer.canvas) {
      const ctx = activeLayer.canvas.getContext('2d');
      if (ctx) {
        const b = doc.selection.bounds;
        const localX = b.x - activeLayer.x;
        const localY = b.y - activeLayer.y;
        ctx.save();
        if (doc.selection.type === 'ellipse') {
          ctx.beginPath();
          ctx.ellipse(
            localX + b.width / 2,
            localY + b.height / 2,
            b.width / 2,
            b.height / 2,
            0,
            0,
            Math.PI * 2
          );
          ctx.clip();
          ctx.clearRect(localX, localY, b.width, b.height);
        } else if (doc.selection.points && doc.selection.points.length > 2) {
          ctx.beginPath();
          ctx.moveTo(doc.selection.points[0].x - activeLayer.x, doc.selection.points[0].y - activeLayer.y);
          for (let i = 1; i < doc.selection.points.length; i++) {
            ctx.lineTo(doc.selection.points[i].x - activeLayer.x, doc.selection.points[i].y - activeLayer.y);
          }
          ctx.closePath();
          ctx.clip();
          ctx.clearRect(localX, localY, b.width, b.height);
        } else {
          ctx.clearRect(localX, localY, b.width, b.height);
        }
        ctx.restore();
        handleUpdateLayer(activeLayer.id, { canvas: activeLayer.canvas });
        pushHistory('Clear Selection');
        return;
      }
    }
    if (activeLayerId) {
      handleDeleteLayer(activeLayerId);
    }
  };

  // Align Active Layer within Canvas Bounds
  const handleAlignLayers = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!activeLayer) return;
    let newX = activeLayer.x;
    let newY = activeLayer.y;
    if (alignment === 'left') newX = 0;
    else if (alignment === 'center') newX = Math.round((doc.width - activeLayer.width) / 2);
    else if (alignment === 'right') newX = doc.width - activeLayer.width;
    else if (alignment === 'top') newY = 0;
    else if (alignment === 'middle') newY = Math.round((doc.height - activeLayer.height) / 2);
    else if (alignment === 'bottom') newY = doc.height - activeLayer.height;

    handleUpdateLayer(activeLayer.id, { x: newX, y: newY });
    pushHistory(`Align ${alignment}`);
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut if user is typing inside an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Duplicate Layer: Ctrl+J
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        if (activeLayerId) handleDuplicateLayer(activeLayerId);
        return;
      }

      // Merge Down: Ctrl+E
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleMergeDown();
        return;
      }

      // Fit Screen: Ctrl+0
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setDoc((prev) => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }));
        return;
      }

      // Toggle Rulers: Ctrl+R / Cmd+R
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setDoc((prev) => {
          const nextVal = !(prev.showRulers ?? prev.rulersVisible);
          return { ...prev, showRulers: nextVal, rulersVisible: nextVal };
        });
        return;
      }

      // Delete / Clear: Del or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelection();
        return;
      }

      // Select All: Ctrl+A
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      // Deselect: Ctrl+D or Escape
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') || e.key === 'Escape') {
        e.preventDefault();
        handleDeselect();
        return;
      }

      // Invert Selection: Ctrl+Shift+I
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleInvertSelection();
        return;
      }

      // Tool Single Key Shortcuts
      const key = e.key.toLowerCase();
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (key === 'v') setActiveTool('move');
        else if (key === 'm') setActiveTool('marquee-rect');
        else if (key === 'l') setActiveTool('lasso-free');
        else if (key === 'w') setActiveTool('magic-wand');
        else if (key === 'c') setActiveTool('crop');
        else if (key === 'i') setActiveTool('eyedropper');
        else if (key === 'b') setActiveTool('brush');
        else if (key === 'e') setActiveTool('eraser');
        else if (key === 's') setActiveTool('clone-stamp');
        else if (key === 'j') setActiveTool('spot-healing');
        else if (key === 'g') setActiveTool('gradient');
        else if (key === 't') setActiveTool('text');
        else if (key === 'u') setActiveTool('shape-rect');
        else if (key === 'h') setActiveTool('hand');
        else if (key === 'z') setActiveTool('zoom');
        else if (key === 'x') {
          // Swap colors
          const temp = fgColor;
          setFgColor(bgColor);
          setBgColor(temp);
        } else if (key === 'd') {
          // Default colors
          setFgColor('#000000');
          setBgColor('#ffffff');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, activeLayerId, fgColor, bgColor, activeTool]);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden select-none">
      {/* 1. Top ImageMate Menu Bar */}
      <TopMenuBar
        projectName={doc.title}
        zoomLevel={doc.zoom}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        showRulers={doc.showRulers ?? doc.rulersVisible}
        showGrid={doc.showGrid ?? doc.gridVisible}
        onNewDocument={() => setIsNewDocOpen(true)}
        onNewDoc={() => setIsNewDocOpen(true)}
        onOpenDocument={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*,.json,.psd';
          input.onchange = (e) => handleOpenImageFile(e as any);
          input.click();
        }}
        onOpenImage={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*,.json,.psd';
          input.onchange = (e) => handleOpenImageFile(e as any);
          input.click();
        }}
        onSaveProject={() => FileExporter.saveProjectJson(doc)}
        onExportImage={() => setIsExportOpen(true)}
        onExport={() => setIsExportOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDuplicateLayer={() => activeLayerId && handleDuplicateLayer(activeLayerId)}
        onDeleteLayer={handleDeleteSelection}
        onNewLayer={handleAddNewBlankLayer}
        onMergeDown={handleMergeDown}
        onFlattenImage={handleFlattenImage}
        onOpenLayerStyles={() => setIsLayerStylesOpen(true)}
        onOpenFilterGallery={() => setIsFilterGalleryOpen(true)}
        onAutoEnhance={handleAutoEnhance}
        onAIEnhance={handleAutoEnhance}
        onOpenAdjustments={(type) => {
          setActiveAdjModalType(type);
          setIsAdjustmentsOpen(true);
        }}
        onToggleRulers={() =>
          setDoc((prev) => {
            const nextVal = !(prev.showRulers ?? prev.rulersVisible);
            return { ...prev, showRulers: nextVal, rulersVisible: nextVal };
          })
        }
        onToggleGrid={() =>
          setDoc((prev) => {
            const nextVal = !(prev.showGrid ?? prev.gridVisible);
            return { ...prev, showGrid: nextVal, gridVisible: nextVal };
          })
        }
        onZoomIn={() => setDoc((prev) => ({ ...prev, zoom: Math.min(5, prev.zoom * 1.25) }))}
        onZoomOut={() => setDoc((prev) => ({ ...prev, zoom: Math.max(0.1, prev.zoom * 0.8) }))}
        onFitScreen={() => setDoc((prev) => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }))}
        onZoom100={() => setDoc((prev) => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }))}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenCanvasSize={(mode) => {
          setCanvasSizeMode(mode);
          setIsCanvasSizeOpen(true);
        }}
        onRotateCanvas={handleRotateCanvas}
        onFlipCanvas={handleFlipCanvas}
        onSelectAll={handleSelectAll}
        onDeselect={handleDeselect}
        onInvertSelection={handleInvertSelection}
      />

      {/* 2. Tool Options Header Bar */}
      <ToolOptionsBar
        activeTool={activeTool}
        options={toolOptions}
        onOptionsChange={(updates) => setToolOptions((prev) => ({ ...prev, ...updates }))}
        activeLayer={activeLayer}
        onUpdateLayer={(updates) => activeLayerId && handleUpdateLayer(activeLayerId, updates)}
        fgColor={fgColor}
        bgColor={bgColor}
        onChangeFgColor={setFgColor}
        cropRatio={cropRatio}
        onChangeCropRatio={setCropRatio}
        gradientType={gradientType}
        onChangeGradientType={setGradientType}
        onAlignLayers={handleAlignLayers}
        zoomLevel={Math.round(doc.zoom * 100)}
        onSetZoom={(zoom) => setDoc((prev) => ({ ...prev, zoom }))}
        onFitScreen={() => setDoc((prev) => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }))}
      />

      {/* 3. Main Workspace Area: Left Toolbar + Canvas Viewport + Right Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left ImageMate Toolbar */}
        <Toolbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          fgColor={fgColor}
          bgColor={bgColor}
          onChangeFgColor={setFgColor}
          onChangeBgColor={setBgColor}
          onSwapColors={() => {
            const temp = fgColor;
            setFgColor(bgColor);
            setBgColor(temp);
          }}
          onResetColors={() => {
            setFgColor('#000000');
            setBgColor('#ffffff');
          }}
        />

        {/* Central Canvas Stage */}
        <CanvasStage
          document={doc}
          activeTool={activeTool}
          toolOptions={toolOptions}
          activeLayerId={activeLayerId}
          fgColor={fgColor}
          bgColor={bgColor}
          onUpdateLayer={handleUpdateLayer}
          onAddLayerDirect={handleAddLayerDirect}
          onSetZoom={(zoom) => setDoc((prev) => ({ ...prev, zoom }))}
          onSetPan={(pan) => setDoc((prev) => ({ ...prev, pan }))}
          onSampleColor={(hex) => setFgColor(hex)}
          onSelectLayer={setActiveLayerId}
          onPushHistory={pushHistory}
          onAddGuide={(guide) => {
            setDoc((prev) => ({ ...prev, guides: [...(prev.guides || []), guide] }));
            pushHistory(`Add ${guide.orientation} guide`);
          }}
          onSetSelection={(sel) => setDoc((prev) => ({ ...prev, selection: sel }))}
          onCropDocument={handleCropDocument}
          cropRatio={cropRatio}
          gradientType={gradientType}
        />

        {/* Right Dockable Palettes (Layers, Color, Navigator, Properties, History, Adjustments) */}
        <RightDock
          document={doc}
          activeLayerId={activeLayerId}
          history={history}
          historyIndex={historyIndex}
          fgColor={fgColor}
          bgColor={bgColor}
          onSelectLayer={setActiveLayerId}
          onUpdateLayer={handleUpdateLayer}
          onAddLayer={handleAddNewBlankLayer}
          onDuplicateLayer={handleDuplicateLayer}
          onDeleteLayer={handleDeleteLayer}
          onMoveLayer={handleMoveLayer}
          onAddAdjustmentLayer={handleAddAdjustmentLayer}
          onAddLayerMask={handleAddLayerMask}
          onOpenLayerStyles={() => setIsLayerStylesOpen(true)}
          onChangeFgColor={setFgColor}
          onChangeBgColor={setBgColor}
          onJumpToHistoryStep={handleJumpToHistoryStep}
          onSetPan={(pan) => setDoc((prev) => ({ ...prev, pan }))}
          onSetZoom={(zoom) => setDoc((prev) => ({ ...prev, zoom }))}
        />
      </div>

      {/* 4. Interactive Modals */}
      <NewDocumentModal
        isOpen={isNewDocOpen}
        onClose={() => setIsNewDocOpen(false)}
        onCreateDocument={handleCreateDocument}
        onOpenSample={handleOpenSample}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        document={doc}
      />

      <FilterGalleryModal
        isOpen={isFilterGalleryOpen}
        onClose={() => setIsFilterGalleryOpen(false)}
        activeLayer={activeLayer}
        onApplyFilter={(newCanvas, filterName) => {
          if (activeLayerId) {
            handleUpdateLayer(activeLayerId, { canvas: newCanvas });
            pushHistory(`Filter: ${filterName}`);
          }
        }}
      />

      <ImageAdjustmentsModal
        isOpen={isAdjustmentsOpen}
        onClose={() => setIsAdjustmentsOpen(false)}
        adjustmentType={activeAdjModalType}
        activeLayer={activeLayer}
        onApplyAdjustment={(params) => {
          if (activeLayerId && activeLayer?.canvas) {
            const ctx = activeLayer.canvas.getContext('2d');
            if (ctx) {
              const imgData = ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
              let adjusted = imgData;
              if (activeAdjModalType === 'brightness-contrast') {
                adjusted = FilterEngine.applyBrightnessContrast(
                  imgData,
                  Number(params.brightness || 0),
                  Number(params.contrast || 0)
                );
              } else if (activeAdjModalType === 'hue-saturation') {
                adjusted = FilterEngine.applyHueSaturation(
                  imgData,
                  Number(params.hue || 0),
                  Number(params.saturation || 0),
                  Number(params.lightness || 0)
                );
              } else if (activeAdjModalType === 'levels') {
                adjusted = FilterEngine.applyLevels(
                  imgData,
                  Number(params.levelsInBlack || 0),
                  Number(params.levelsGamma || 1),
                  Number(params.levelsInWhite || 255),
                  Number(params.levelsOutBlack || 0),
                  Number(params.levelsOutWhite || 255)
                );
              } else if (activeAdjModalType === 'invert') {
                adjusted = FilterEngine.applyInvert(imgData);
              } else if (activeAdjModalType === 'black-white') {
                adjusted = FilterEngine.applyGrayscale(imgData);
              } else if (activeAdjModalType === 'sepia') {
                adjusted = FilterEngine.applySepia(imgData, Number(params.sepiaIntensity || 100));
              } else if (activeAdjModalType === 'posterize') {
                adjusted = FilterEngine.applyPosterize(imgData, Number(params.posterizeLevels || 4));
              } else if (activeAdjModalType === 'threshold') {
                adjusted = FilterEngine.applyThreshold(imgData, Number(params.threshold || 128));
              } else if (activeAdjModalType === 'color-balance') {
                adjusted = FilterEngine.applyColorBalance(
                  imgData,
                  Number(params.cyanRed || 0),
                  Number(params.magentaGreen || 0),
                  Number(params.yellowBlue || 0)
                );
              }

              ctx.putImageData(adjusted, 0, 0);
              handleUpdateLayer(activeLayerId, { canvas: activeLayer.canvas });
              pushHistory(`Adjustment: ${activeAdjModalType}`);
            }
          }
        }}
      />

      <LayerStylesModal
        isOpen={isLayerStylesOpen}
        onClose={() => setIsLayerStylesOpen(false)}
        activeLayer={activeLayer}
        onUpdateEffects={(effects: LayerEffects) => {
          if (activeLayerId) {
            handleUpdateLayer(activeLayerId, { effects });
            pushHistory('Update Layer Styles');
          }
        }}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <CanvasSizeModal
        isOpen={isCanvasSizeOpen}
        onClose={() => setIsCanvasSizeOpen(false)}
        document={doc}
        mode={canvasSizeMode}
        onResize={handleResize}
      />
    </div>
  );
};

export default App;
