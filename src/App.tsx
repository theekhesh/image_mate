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
import { ThemeModal } from './components/modals/ThemeModal';
import { ThemeEngine } from './utils/themeEngine';
import { Theme } from './types/theme';

export const App: React.FC = () => {
  // Theme State (Tokyo Night, Dracula, Nord, etc.)
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedId = ThemeEngine.getActiveThemeId();
    const theme = ThemeEngine.getThemeById(savedId);
    ThemeEngine.applyTheme(theme);
    return theme;
  });

  useEffect(() => {
    ThemeEngine.applyTheme(currentTheme);
  }, [currentTheme]);

  const handleSelectTheme = (themeOrId: Theme | string) => {
    const applied = ThemeEngine.applyTheme(themeOrId);
    setCurrentTheme(applied);
    setToastMessage(`Theme: ${applied.name}`);
  };

  // 1. Initial State: Start with clean blank document (standard Photoshop blank canvas)
  const [doc, setDoc] = useState<DocumentProject>(() =>
    createBlankProject('Untitled-1.imate', 1920, 1080, 72, 'white', '#ffffff')
  );
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [activeLayerId, setActiveLayerId] = useState<string | null>('layer-1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');

  const [toolOptions, setToolOptions] = useState<ToolOptions>({
    brushSize: 24,
    brushHardness: 80,
    brushOpacity: 100,
    brushFlow: 100,
    brushSizeJitter: 0,
    brushOpacityJitter: 0,
    brushPressureSim: true,
    feather: 0,
    tolerance: 32,
    contiguous: true,
    fontFamily: 'Inter, sans-serif',
    fontSize: 48,
    textAlign: 'left',
    fillColor: '#000000',
    strokeColor: '#000000',
    strokeWidth: 2,
    shapeType: 'rect',
    zoomLevel: 100,
    sampleAllLayers: false,
  });

  // History Stack
  const [history, setHistory] = useState<HistoryStep[]>(() => [
    {
      id: 'init',
      name: 'New Document',
      document: createBlankProject('Untitled-1.imate', 1920, 1080, 72, 'white', '#ffffff'),
      timestamp: Date.now(),
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Clipboard & Drag-Drop State
  const clipboardRef = useRef<{
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    name: string;
    x?: number;
    y?: number;
  } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

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
    const topEditableLayer = newDoc.layers[newDoc.layers.length - 1] || newDoc.layers[0];
    setActiveLayerId(topEditableLayer?.id || null);
    setHistory([{ id: 'init', name: 'New Document', document: newDoc, timestamp: Date.now() }]);
    setHistoryIndex(0);
  };

  // Smart Fit Canvas to available Screen Viewport
  const handleFitScreen = useCallback(() => {
    const stageWidth = window.innerWidth - 48 - 300;
    const stageHeight = window.innerHeight - 38 - 36;
    const padding = 64;
    const availW = Math.max(100, stageWidth - padding);
    const availH = Math.max(100, stageHeight - padding);
    const fitScale = Math.min(availW / doc.width, availH / doc.height, 1);
    const roundedScale = Math.max(0.05, Math.min(3, Math.round(fitScale * 100) / 100));
    setDoc((prev) => ({ ...prev, zoom: roundedScale, pan: { x: 0, y: 0 } }));
  }, [doc.width, doc.height]);

  // Save Document Project (.imate)
  const handleSaveProject = useCallback(() => {
    try {
      const savedName = FileExporter.saveImateDocument(doc);
      setDoc((prev) => ({
        ...prev,
        title: savedName,
        isDirty: false,
      }));
      setToastMessage(`Project saved as ${savedName}`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('Save failed:', err);
      setToastMessage('Failed to save document. Please try again.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  }, [doc]);

  // Save As Document Project (.imate)
  const handleSaveAsProject = useCallback(() => {
    const defaultName = (doc.title || 'Untitled').replace(/\.(imate|json|psd|png|jpg|jpeg|webp)$/i, '');
    const chosenName = window.prompt('Save Document As (.imate):', defaultName);
    if (chosenName === null) return; // cancelled
    const cleanName = chosenName.trim() || defaultName;
    try {
      const savedName = FileExporter.saveImateDocument(doc, cleanName);
      setDoc((prev) => ({
        ...prev,
        title: savedName,
        isDirty: false,
      }));
      setToastMessage(`Project saved as ${savedName}`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('Save As failed:', err);
      setToastMessage('Failed to save document.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  }, [doc]);

  // Unified File Loader: loads native .imate projects, JSON backups, or places image layers
  const handleLoadFile = useCallback(
    async (file: File) => {
      const fileNameLower = file.name.toLowerCase();
      if (
        fileNameLower.endsWith('.imate') ||
        fileNameLower.endsWith('.json') ||
        file.type === 'application/x-imagemate'
      ) {
        try {
          setToastMessage(`Loading ${file.name}...`);
          const loadedDoc = await FileExporter.loadImateDocument(file);
          setDoc(loadedDoc);
          const topLayerId = loadedDoc.activeLayerId || loadedDoc.layers[loadedDoc.layers.length - 1]?.id || null;
          setActiveLayerId(topLayerId);
          setHistory([
            {
              id: `open-${Date.now()}`,
              name: `Open ${file.name}`,
              document: loadedDoc,
              timestamp: Date.now(),
            },
          ]);
          setHistoryIndex(0);
          setToastMessage(`Opened ${file.name} (${loadedDoc.layers.length} layers, ${loadedDoc.width}×${loadedDoc.height}px)`);
          setTimeout(() => setToastMessage(null), 4000);
        } catch (err: any) {
          console.error('Error opening document:', err);
          setToastMessage(err.message || 'Could not parse document file.');
          setTimeout(() => setToastMessage(null), 5000);
        }
      } else if (file.type.startsWith('image/')) {
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
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: file.name.replace(/\.[^/.]+$/, ''),
              type: 'raster',
              visible: true,
              locked: false,
              opacity: 100,
              blendMode: 'normal',
              x: Math.max(0, Math.round((doc.width - img.width) / 2)),
              y: Math.max(0, Math.round((doc.height - img.height) / 2)),
              width: img.width,
              height: img.height,
              canvas: imgCanvas,
              effects: {},
            };

            handleAddLayerDirect(newLayer);
            pushHistory(`Place ${file.name}`);
            setToastMessage(`Placed image layer "${newLayer.name}"`);
            setTimeout(() => setToastMessage(null), 3000);
          };
          img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        setToastMessage(`Unsupported file format. Please open a .imate project or image.`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    },
    [doc.width, doc.height, handleAddLayerDirect, pushHistory]
  );

  // File Picker Trigger
  const handleOpenFileDialog = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.imate,.json,.psd,image/*';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        handleLoadFile(file);
      }
    };
    input.click();
  }, [handleLoadFile]);

  // Open Local Image as Layer / Document (legacy file input handler)
  const handleOpenImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleLoadFile(file);
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
    if (doc.selection && doc.selection.active && activeLayer) {
      let target = activeLayer;
      if (target.type !== 'raster' || !target.canvas) {
        handleRasterizeLayer(target.id);
        target = doc.layers.find((l) => l.id === activeLayer.id) || activeLayer;
      }
      if (target.canvas) {
        const ctx = target.canvas.getContext('2d');
        if (ctx) {
          const b = doc.selection.bounds;
          const localX = b.x - target.x;
          const localY = b.y - target.y;
          ctx.save();
          if (doc.selection.maskCanvas) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.drawImage(doc.selection.maskCanvas, -target.x, -target.y);
          } else if (doc.selection.type === 'ellipse') {
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
            ctx.clearRect(localX - 2, localY - 2, b.width + 4, b.height + 4);
          } else if (doc.selection.points && doc.selection.points.length > 2) {
            ctx.beginPath();
            ctx.moveTo(doc.selection.points[0].x - target.x, doc.selection.points[0].y - target.y);
            for (let i = 1; i < doc.selection.points.length; i++) {
              ctx.lineTo(doc.selection.points[i].x - target.x, doc.selection.points[i].y - target.y);
            }
            ctx.closePath();
            ctx.clip();
            ctx.clearRect(localX - 2, localY - 2, b.width + 4, b.height + 4);
          } else {
            ctx.clearRect(localX, localY, b.width, b.height);
          }
          ctx.restore();
          handleUpdateLayer(target.id, { canvas: target.canvas });
          pushHistory('Clear Selection');
          return;
        }
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

  // Copy Active Layer or Selection to Internal Clipboard
  const handleCopy = useCallback(() => {
    if (!activeLayer) return;
    let srcCanvas = activeLayer.canvas;
    if (!srcCanvas) {
      const temp = document.createElement('canvas');
      temp.width = Math.max(1, Math.round(activeLayer.width || doc.width));
      temp.height = Math.max(1, Math.round(activeLayer.height || doc.height));
      const tCtx = temp.getContext('2d');
      if (tCtx) {
        CanvasRenderer.renderLayer(tCtx, { ...activeLayer, x: 0, y: 0, rotation: 0 }, temp.width, temp.height);
        srcCanvas = temp;
      }
    }
    if (!srcCanvas) return;

    if (doc.selection && doc.selection.active) {
      const b = doc.selection.bounds;
      const w = Math.max(1, Math.round(b.width));
      const h = Math.max(1, Math.round(b.height));
      const clipCanvas = document.createElement('canvas');
      clipCanvas.width = w;
      clipCanvas.height = h;
      const cCtx = clipCanvas.getContext('2d');
      if (cCtx) {
        cCtx.clearRect(0, 0, w, h);
        cCtx.save();

        // 1. Clip path to exact contour boundary so outside pixels remain 100% transparent
        if (doc.selection.type === 'ellipse') {
          cCtx.beginPath();
          cCtx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          cCtx.clip();
        } else if (doc.selection.points && doc.selection.points.length > 2) {
          cCtx.beginPath();
          cCtx.moveTo(doc.selection.points[0].x - b.x, doc.selection.points[0].y - b.y);
          for (let i = 1; i < doc.selection.points.length; i++) {
            cCtx.lineTo(doc.selection.points[i].x - b.x, doc.selection.points[i].y - b.y);
          }
          cCtx.closePath();
          cCtx.clip();
        }

        // 2. Draw source layer offset by selection coordinates
        const localX = b.x - activeLayer.x;
        const localY = b.y - activeLayer.y;
        cCtx.drawImage(srcCanvas, -localX, -localY);
        cCtx.restore();

        // 3. Mask if custom mask canvas exists
        if (doc.selection.maskCanvas) {
          cCtx.save();
          cCtx.globalCompositeOperation = 'destination-in';
          cCtx.drawImage(doc.selection.maskCanvas, -b.x, -b.y);
          cCtx.restore();
        }
      }

      clipboardRef.current = {
        canvas: clipCanvas,
        width: w,
        height: h,
        x: Math.round(b.x),
        y: Math.round(b.y),
        name: `${activeLayer.name} Selection`,
      };
      setToastMessage('Copied contour selection (transparent background)');
    } else {
      const clipCanvas = document.createElement('canvas');
      clipCanvas.width = activeLayer.width || srcCanvas.width;
      clipCanvas.height = activeLayer.height || srcCanvas.height;
      const cCtx = clipCanvas.getContext('2d');
      if (cCtx) {
        cCtx.drawImage(srcCanvas, 0, 0);
      }
      clipboardRef.current = {
        canvas: clipCanvas,
        width: clipCanvas.width,
        height: clipCanvas.height,
        x: activeLayer.x,
        y: activeLayer.y,
        name: `${activeLayer.name} Copy`,
      };
      setToastMessage('Copied layer to clipboard');
    }
  }, [activeLayer, doc.selection, doc.width, doc.height]);

  // Cut Active Selection or Layer
  const handleCut = useCallback(() => {
    if (!activeLayer) return;
    handleCopy();
    handleDeleteSelection();
  }, [activeLayer, handleCopy, handleDeleteSelection]);

  // Paste from Internal Clipboard as New Layer
  const handlePaste = useCallback(() => {
    if (!clipboardRef.current) return;
    const item = clipboardRef.current;
    const newCanvas = document.createElement('canvas');
    newCanvas.width = item.width;
    newCanvas.height = item.height;
    const ctx = newCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(item.canvas, 0, 0);
    }
    const newLayer: Layer = {
      id: `paste-${Date.now()}`,
      name: item.name || `Pasted Layer ${doc.layers.length + 1}`,
      type: 'raster',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: item.x !== undefined ? item.x : Math.max(0, Math.round((doc.width - item.width) / 2)),
      y: item.y !== undefined ? item.y : Math.max(0, Math.round((doc.height - item.height) / 2)),
      width: item.width,
      height: item.height,
      canvas: newCanvas,
    };
    handleAddLayerDirect(newLayer);
    pushHistory('Paste Layer');
    setToastMessage(`Pasted "${newLayer.name}"`);
  }, [doc.width, doc.height, doc.layers.length, handleAddLayerDirect, pushHistory]);

  // Rasterize active text or shape layer
  const handleRasterizeLayer = useCallback(
    (layerId?: string) => {
      const targetId = layerId || activeLayerId;
      if (!targetId) return;
      const target = doc.layers.find((l) => l.id === targetId);
      if (!target || target.type === 'raster') return;

      const rasterCanvas = document.createElement('canvas');
      rasterCanvas.width = target.width || doc.width;
      rasterCanvas.height = target.height || doc.height;
      const rCtx = rasterCanvas.getContext('2d');
      if (rCtx) {
        CanvasRenderer.renderLayer(rCtx, { ...target, x: 0, y: 0 }, rasterCanvas.width, rasterCanvas.height);
      }

      handleUpdateLayer(targetId, {
        type: 'raster',
        canvas: rasterCanvas,
        text: undefined,
        shapeType: undefined,
      });
      pushHistory(`Rasterize ${target.name}`);
    },
    [activeLayerId, doc.layers, doc.width, doc.height, handleUpdateLayer, pushHistory]
  );

  // Invert colors on active layer
  const handleInvertLayer = useCallback(() => {
    if (!activeLayer) return;
    let target = activeLayer;
    if (target.type !== 'raster') {
      handleRasterizeLayer(target.id);
      target = doc.layers.find((l) => l.id === activeLayer.id) || activeLayer;
    }
    const canvas = target.canvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 0) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
      }
    }
    ctx.putImageData(imgData, 0, 0);
    handleUpdateLayer(target.id, { canvas });
    pushHistory('Invert Colors');
  }, [activeLayer, doc.layers, handleRasterizeLayer, handleUpdateLayer, pushHistory]);

  // Fill active layer or selection with color
  const handleFillColor = useCallback(
    (color: string) => {
      if (!activeLayer) return;
      let target = activeLayer;
      if (target.type !== 'raster') {
        handleRasterizeLayer(target.id);
        target = doc.layers.find((l) => l.id === activeLayer.id) || activeLayer;
      }
      const canvas = target.canvas || document.createElement('canvas');
      canvas.width = target.width || doc.width;
      canvas.height = target.height || doc.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.fillStyle = color;
        if (doc.selection && doc.selection.active) {
          const b = doc.selection.bounds;
          const localX = b.x - target.x;
          const localY = b.y - target.y;
          if (doc.selection.maskCanvas) {
            const fillTemp = document.createElement('canvas');
            fillTemp.width = canvas.width;
            fillTemp.height = canvas.height;
            const ftCtx = fillTemp.getContext('2d');
            if (ftCtx) {
              ftCtx.fillStyle = color;
              ftCtx.fillRect(0, 0, fillTemp.width, fillTemp.height);
              ftCtx.globalCompositeOperation = 'destination-in';
              ftCtx.drawImage(doc.selection.maskCanvas, -target.x, -target.y);
              ctx.drawImage(fillTemp, 0, 0);
            }
          } else if (doc.selection.type === 'ellipse') {
            ctx.beginPath();
            ctx.ellipse(localX + b.width / 2, localY + b.height / 2, b.width / 2, b.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (doc.selection.points && doc.selection.points.length > 2) {
            ctx.beginPath();
            ctx.moveTo(doc.selection.points[0].x - target.x, doc.selection.points[0].y - target.y);
            for (let i = 1; i < doc.selection.points.length; i++) {
              ctx.lineTo(doc.selection.points[i].x - target.x, doc.selection.points[i].y - target.y);
            }
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(localX, localY, b.width, b.height);
          }
        } else {
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.restore();
      }
      handleUpdateLayer(target.id, { canvas });
      pushHistory(`Fill with ${color === fgColor ? 'Foreground' : 'Background'}`);
    },
    [activeLayer, doc.layers, doc.selection, doc.width, doc.height, fgColor, handleRasterizeLayer, handleUpdateLayer, pushHistory]
  );

  // Drag and Drop files handling (supports .imate projects and image assets)
  const handleFilesDrop = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      // If an .imate or .json project file is dropped, open it directly
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith('.imate') || lowerName.endsWith('.json')) {
          handleLoadFile(file);
          return;
        }
      }
      // Otherwise load images
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          handleLoadFile(file);
        }
      });
    },
    [handleLoadFile]
  );

  // Global Paste Listener (Ctrl+V with system clipboard image / screenshot)
  useEffect(() => {
    const handleSystemPaste = (e: ClipboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (ev) => {
              const img = new Image();
              img.onload = () => {
                const c = document.createElement('canvas');
                c.width = img.width;
                c.height = img.height;
                const ctx = c.getContext('2d');
                if (ctx) ctx.drawImage(img, 0, 0);

                const newLayer: Layer = {
                  id: `pasted-${Date.now()}`,
                  name: `Pasted Image ${doc.layers.length + 1}`,
                  type: 'raster',
                  visible: true,
                  locked: false,
                  opacity: 100,
                  blendMode: 'normal',
                  x: Math.max(0, Math.round((doc.width - img.width) / 2)),
                  y: Math.max(0, Math.round((doc.height - img.height) / 2)),
                  width: img.width,
                  height: img.height,
                  canvas: c,
                };
                handleAddLayerDirect(newLayer);
                pushHistory('Paste Image');
              };
              img.src = ev.target?.result as string;
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handleSystemPaste);
    return () => window.removeEventListener('paste', handleSystemPaste);
  }, [doc.width, doc.height, doc.layers.length, handleAddLayerDirect, pushHistory]);

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

      // Save Project: Ctrl+S / Ctrl+Shift+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAsProject();
        } else {
          handleSaveProject();
        }
        return;
      }

      // Open Document: Ctrl+O
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFileDialog();
        return;
      }

      // New Document: Ctrl+N
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsNewDocOpen(true);
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

      // Invert Layer Colors: Ctrl+I
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleInvertLayer();
        return;
      }

      // Copy: Ctrl+C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Cut: Ctrl+X
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCut();
        return;
      }

      // Paste: Ctrl+V (internal layer clipboard)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Free Transform: Ctrl+T
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setActiveTool('move');
        return;
      }

      // Fill with Foreground: Alt + Backspace / Alt + Delete
      if (e.altKey && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        handleFillColor(fgColor);
        return;
      }

      // Fill with Background: Ctrl + Backspace / Ctrl + Delete
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        handleFillColor(bgColor);
        return;
      }

      // Brush Size Decrease: [
      if (e.key === '[') {
        e.preventDefault();
        setToolOptions((prev) => ({ ...prev, brushSize: Math.max(1, (prev.brushSize || 20) - 5) }));
        return;
      }

      // Brush Size Increase: ]
      if (e.key === ']') {
        e.preventDefault();
        setToolOptions((prev) => ({ ...prev, brushSize: Math.min(500, (prev.brushSize || 20) + 5) }));
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
  }, [
    handleUndo,
    handleRedo,
    activeLayerId,
    fgColor,
    bgColor,
    activeTool,
    handleCopy,
    handleCut,
    handlePaste,
    handleInvertLayer,
    handleFillColor,
  ]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        handleFilesDrop(e.dataTransfer.files);
      }}
      className="flex flex-col w-screen h-screen bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden select-none relative"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-[#007acc]/20 border-4 border-dashed border-[#0099ff] pointer-events-none flex items-center justify-center backdrop-blur-xs">
          <div className="bg-[#1e1e1e]/90 text-white px-6 py-4 rounded-xl border border-[#007acc] text-sm font-semibold shadow-2xl flex items-center gap-3">
            <span>Drop .imate project or image files to open or place</span>
          </div>
        </div>
      )}

      {/* 1. Top ImageMate Menu Bar */}
      <TopMenuBar
        currentThemeId={currentTheme.id}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onSelectTheme={handleSelectTheme}
        projectName={doc.title}
        zoomLevel={doc.zoom}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        showRulers={doc.showRulers ?? doc.rulersVisible}
        showGrid={doc.showGrid ?? doc.gridVisible}
        onNewDocument={() => setIsNewDocOpen(true)}
        onNewDoc={() => setIsNewDocOpen(true)}
        onOpenDocument={handleOpenFileDialog}
        onOpenImage={handleOpenFileDialog}
        onSaveProject={handleSaveProject}
        onSaveAsProject={handleSaveAsProject}
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
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onRasterizeLayer={() => activeLayerId && handleRasterizeLayer(activeLayerId)}
        onInvertLayer={handleInvertLayer}
        onFillForeground={() => handleFillColor(fgColor)}
        onFillBackground={() => handleFillColor(bgColor)}
        onFreeTransform={() => setActiveTool('move')}
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
        onFitScreen={handleFitScreen}
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
        onFitScreen={handleFitScreen}
        canvasBg={doc.background}
        onChangeCanvasBg={(bg) => setDoc((prev) => ({ ...prev, background: bg }))}
        onFlipCanvas={handleFlipCanvas}
        onRotateCanvas={handleRotateCanvas}
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

      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentThemeId={currentTheme.id}
        onThemeChange={(theme) => {
          setCurrentTheme(theme);
          setToastMessage(`Theme: ${theme.name}`);
        }}
      />

      {/* Dynamic Toast Feedback Pill */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#252526]/95 border border-[#007acc] text-white text-xs font-medium rounded-full shadow-2xl backdrop-blur flex items-center gap-2.5 pointer-events-none transition-all">
          <span className="w-2 h-2 rounded-full bg-[#00c8ff]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
