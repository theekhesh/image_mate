/**
 * Photoshop Web Studio - Main Application Orchestrator
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
} from './types/photoshop';
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

      // Delete Layer: Del or Backspace
      if (e.key === 'Delete' && activeLayerId) {
        e.preventDefault();
        handleDeleteLayer(activeLayerId);
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
      {/* 1. Top Photoshop Menu Bar */}
      <TopMenuBar
        projectName={doc.title}
        zoomLevel={doc.zoom}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        showRulers={doc.showRulers}
        showGrid={doc.showGrid}
        onNewDocument={() => setIsNewDocOpen(true)}
        onOpenDocument={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*,.json,.psd';
          input.onchange = (e) => handleOpenImageFile(e as any);
          input.click();
        }}
        onSaveProject={() => FileExporter.saveProjectJson(doc)}
        onExportImage={() => setIsExportOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDuplicateLayer={() => activeLayerId && handleDuplicateLayer(activeLayerId)}
        onDeleteLayer={() => activeLayerId && handleDeleteLayer(activeLayerId)}
        onNewLayer={handleAddNewBlankLayer}
        onMergeDown={handleMergeDown}
        onFlattenImage={handleFlattenImage}
        onOpenLayerStyles={() => setIsLayerStylesOpen(true)}
        onOpenFilterGallery={() => setIsFilterGalleryOpen(true)}
        onAutoEnhance={handleAutoEnhance}
        onOpenAdjustments={(type) => {
          setActiveAdjModalType(type);
          setIsAdjustmentsOpen(true);
        }}
        onToggleRulers={() => setDoc((prev) => ({ ...prev, showRulers: !prev.showRulers }))}
        onToggleGrid={() => setDoc((prev) => ({ ...prev, showGrid: !prev.showGrid }))}
        onZoomIn={() => setDoc((prev) => ({ ...prev, zoom: Math.min(5, prev.zoom * 1.25) }))}
        onZoomOut={() => setDoc((prev) => ({ ...prev, zoom: Math.max(0.1, prev.zoom * 0.8) }))}
        onFitScreen={() => setDoc((prev) => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }))}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenCanvasSize={(mode) => {
          setCanvasSizeMode(mode);
          setIsCanvasSizeOpen(true);
        }}
      />

      {/* 2. Tool Options Header Bar */}
      <ToolOptionsBar
        activeTool={activeTool}
        options={toolOptions}
        onOptionsChange={(updates) => setToolOptions((prev) => ({ ...prev, ...updates }))}
        activeLayer={activeLayer}
        onUpdateLayer={(updates) => activeLayerId && handleUpdateLayer(activeLayerId, updates)}
      />

      {/* 3. Main Workspace Area: Left Toolbar + Canvas Viewport + Right Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Photoshop Toolbar */}
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
