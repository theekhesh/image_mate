/**
 * ImageMate Studio - Multi-Format Export & Import Engine
 */

import { DocumentProject, Layer, ImateFilePackage, ImateSerializedLayer } from '../types/imagemate';
import { CanvasRenderer } from './canvasRenderer';

export class FileExporter {
  /**
   * Render document to an offscreen full-resolution canvas and return data URL or blob
   */
  static exportToCanvas(
    doc: DocumentProject,
    scale = 1,
    includeBackground = true
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(doc.width * scale));
    canvas.height = Math.max(1, Math.round(doc.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    if (scale !== 1) {
      ctx.scale(scale, scale);
    }

    CanvasRenderer.renderDocument(ctx, doc, {
      renderBackground: includeBackground,
      renderOverlays: false,
      activeLayerId: null,
      showGuides: false,
      showGrid: false,
    });

    return canvas;
  }

  /**
   * Download as PNG / JPEG / WebP image
   */
  static downloadImage(
    doc: DocumentProject,
    format: 'png' | 'jpeg' | 'webp' = 'png',
    quality = 0.92,
    scale = 1,
    includeBackground = true
  ) {
    const canvas = this.exportToCanvas(doc, scale, includeBackground);
    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const dataUrl = canvas.toDataURL(mimeType, quality);

    const filename = doc.title.replace(/\.[^/.]+$/, '') + `.${format}`;
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export single active layer as PNG
   */
  static exportLayerAsPNG(layer: Layer) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(layer.width));
    canvas.height = Math.max(1, Math.round(layer.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    CanvasRenderer.renderLayer(ctx, { ...layer, x: 0, y: 0 }, layer.width, layer.height);
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${layer.name || 'layer'}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Save Document Project as .imate (Native ImageMate Studio Project format)
   * Captures all document metadata, guides, layers, raster pixel data, masks,
   * vector shapes, typography, blend modes, adjustments, and layer effects losslessly.
   */
  static saveImateDocument(doc: DocumentProject, customFileName?: string): string {
    // Clean and normalize filename to always end with .imate
    let baseName = customFileName || doc.title || 'Untitled';
    baseName = baseName.replace(/\.(imate|json|psd|png|jpg|jpeg|webp)$/i, '');
    if (!baseName.trim()) baseName = 'Untitled';
    const filename = `${baseName}.imate`;

    // Serialize layers with full lossless PNG base64 encoding for raster/masks
    const serializedLayers: ImateSerializedLayer[] = doc.layers.map((layer) => {
      const { canvas, maskCanvas, ...rest } = layer;
      let dataUrl: string | undefined = undefined;
      let maskDataUrl: string | undefined = undefined;

      if (canvas) {
        try {
          dataUrl = canvas.toDataURL('image/png');
        } catch {
          // ignore potential canvas extraction error
        }
      }

      if (maskCanvas) {
        try {
          maskDataUrl = maskCanvas.toDataURL('image/png');
        } catch {
          // ignore
        }
      }

      return {
        ...rest,
        dataUrl,
        maskDataUrl,
      };
    });

    const imatePackage: ImateFilePackage = {
      format: 'IMATELAYERS',
      version: '1.0',
      generator: 'ImageMate Studio',
      savedAt: Date.now(),
      title: filename,
      document: {
        id: doc.id || `doc-${Date.now()}`,
        title: filename,
        width: doc.width,
        height: doc.height,
        dpi: doc.dpi || 72,
        colorMode: doc.colorMode || 'RGB',
        background: doc.background || 'white',
        backgroundColor: doc.backgroundColor || '#ffffff',
        activeLayerId: doc.activeLayerId,
        selectedLayerIds: doc.selectedLayerIds || (doc.activeLayerId ? [doc.activeLayerId] : []),
        zoom: doc.zoom || 1,
        pan: doc.pan || { x: 0, y: 0 },
        guides: doc.guides || [],
        rulersVisible: doc.rulersVisible ?? true,
        gridVisible: doc.gridVisible ?? false,
        showRulers: doc.showRulers ?? true,
        showGrid: doc.showGrid ?? false,
        showGuides: doc.showGuides ?? true,
        snapToGuides: doc.snapToGuides ?? true,
        snapToGrid: doc.snapToGrid ?? false,
        selection: doc.selection || null,
        historyIndex: 0,
        layers: serializedLayers,
      },
    };

    // Use Blob and URL.createObjectURL for memory safety with high-resolution graphics
    const jsonString = JSON.stringify(imatePackage, null, 2);
    const blob = new Blob([jsonString], { type: 'application/x-imagemate' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Free memory
    setTimeout(() => URL.revokeObjectURL(url), 3000);

    return filename;
  }

  /**
   * Load and parse a .imate (or .json / .psd.json) file and reconstitute a complete DocumentProject
   * with restored canvas elements, masks, typography, shapes, and layer hierarchies.
   */
  static async loadImateDocument(file: File): Promise<DocumentProject> {
    const text = await file.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('Invalid file format. Could not parse document data.');
    }

    // Support both the IMATELAYERS container format and raw DocumentProject JSON
    const docData = parsed.format === 'IMATELAYERS' && parsed.document ? parsed.document : parsed;

    if (!docData || !Array.isArray(docData.layers)) {
      throw new Error('The selected file does not appear to be a valid ImageMate (.imate) document.');
    }

    // Reconstitute all layers and their canvas elements asynchronously
    const reconstitutedLayers: Layer[] = await Promise.all(
      docData.layers.map(async (rawLayer: any, idx: number) => {
        let canvas: HTMLCanvasElement | undefined = undefined;
        let maskCanvas: HTMLCanvasElement | undefined = undefined;

        if (rawLayer.dataUrl) {
          canvas = await new Promise<HTMLCanvasElement>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const c = document.createElement('canvas');
              c.width = rawLayer.width || img.naturalWidth || img.width;
              c.height = rawLayer.height || img.naturalHeight || img.height;
              const ctx = c.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
              }
              resolve(c);
            };
            img.onerror = () => {
              const fallback = document.createElement('canvas');
              fallback.width = Math.max(1, rawLayer.width || 100);
              fallback.height = Math.max(1, rawLayer.height || 100);
              resolve(fallback);
            };
            img.src = rawLayer.dataUrl;
          });
        } else if (rawLayer.type === 'raster') {
          canvas = document.createElement('canvas');
          canvas.width = Math.max(1, rawLayer.width || docData.width || 1920);
          canvas.height = Math.max(1, rawLayer.height || docData.height || 1080);
        }

        if (rawLayer.maskDataUrl) {
          maskCanvas = await new Promise<HTMLCanvasElement>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const c = document.createElement('canvas');
              c.width = rawLayer.width || img.naturalWidth || img.width;
              c.height = rawLayer.height || img.naturalHeight || img.height;
              const ctx = c.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
              }
              resolve(c);
            };
            img.onerror = () => resolve(document.createElement('canvas'));
            img.src = rawLayer.maskDataUrl;
          });
        }

        return {
          id: rawLayer.id || `layer-${Date.now()}-${idx}`,
          name: rawLayer.name || `Layer ${idx + 1}`,
          type: rawLayer.type || 'raster',
          visible: rawLayer.visible !== undefined ? rawLayer.visible : true,
          locked: rawLayer.locked !== undefined ? rawLayer.locked : false,
          opacity: typeof rawLayer.opacity === 'number' ? rawLayer.opacity : 100,
          blendMode: rawLayer.blendMode || 'normal',
          x: rawLayer.x || 0,
          y: rawLayer.y || 0,
          width: rawLayer.width || docData.width || 1920,
          height: rawLayer.height || docData.height || 1080,
          rotation: rawLayer.rotation || 0,
          scaleX: rawLayer.scaleX ?? 1,
          scaleY: rawLayer.scaleY ?? 1,
          canvas,
          maskCanvas,
          maskEnabled: rawLayer.maskEnabled,
          isEditingMask: rawLayer.isEditingMask,
          // Text specific properties
          text: rawLayer.text,
          fontFamily: rawLayer.fontFamily,
          fontSize: rawLayer.fontSize,
          fontWeight: rawLayer.fontWeight,
          fontStyle: rawLayer.fontStyle,
          textColor: rawLayer.textColor,
          textAlign: rawLayer.textAlign,
          letterSpacing: rawLayer.letterSpacing,
          lineHeight: rawLayer.lineHeight,
          warp: rawLayer.warp,
          // Shape specific properties
          shapeType: rawLayer.shapeType,
          fillColor: rawLayer.fillColor,
          strokeColor: rawLayer.strokeColor,
          strokeWidth: rawLayer.strokeWidth,
          cornerRadius: rawLayer.cornerRadius,
          sides: rawLayer.sides,
          starPoints: rawLayer.starPoints,
          // Adjustment specific properties
          adjustmentType: rawLayer.adjustmentType,
          adjustmentParams: rawLayer.adjustmentParams,
          // Group properties
          children: rawLayer.children,
          // Layer styles / effects
          effects: rawLayer.effects || {},
        };
      })
    );

    const title = file.name || docData.title || 'Untitled.imate';

    return {
      id: docData.id || `doc-${Date.now()}`,
      title,
      width: docData.width || 1920,
      height: docData.height || 1080,
      dpi: docData.dpi || 72,
      colorMode: docData.colorMode || 'RGB',
      background: docData.background || 'white',
      backgroundColor: docData.backgroundColor || '#ffffff',
      layers: reconstitutedLayers,
      activeLayerId: docData.activeLayerId || reconstitutedLayers[reconstitutedLayers.length - 1]?.id || null,
      selectedLayerIds: docData.selectedLayerIds || (docData.activeLayerId ? [docData.activeLayerId] : []),
      history: [],
      historyIndex: 0,
      zoom: docData.zoom || 1,
      pan: docData.pan || { x: 0, y: 0 },
      guides: Array.isArray(docData.guides) ? docData.guides : [],
      rulersVisible: docData.rulersVisible ?? true,
      gridVisible: docData.gridVisible ?? false,
      showRulers: docData.showRulers ?? true,
      showGrid: docData.showGrid ?? false,
      showGuides: docData.showGuides ?? true,
      snapToGuides: docData.snapToGuides ?? true,
      snapToGrid: docData.snapToGrid ?? false,
      selection: docData.selection || null,
    };
  }

  /**
   * Save Project as JSON (backward compatibility alias for saveImateDocument)
   */
  static saveProjectJson(doc: DocumentProject) {
    return this.saveImateDocument(doc);
  }

  /**
   * Load image file and create a new project or insert as a new layer
   */
  static async loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert Image element into a Canvas Layer
   */
  static imageToLayer(img: HTMLImageElement, name: string, docWidth: number, docHeight: number): Layer {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
    }

    // Scale to fit canvas if larger
    let w = canvas.width;
    let h = canvas.height;
    if (w > docWidth || h > docHeight) {
      const ratio = Math.min(docWidth / w, docHeight / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const x = Math.round((docWidth - w) / 2);
    const y = Math.round((docHeight - h) / 2);

    return {
      id: `layer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      type: 'raster',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x,
      y,
      width: w,
      height: h,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      canvas,
      effects: {},
    };
  }
}
