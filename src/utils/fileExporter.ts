/**
 * ImageMate Studio - Multi-Format Export & Import Engine
 */

import { DocumentProject, Layer } from '../types/imagemate';
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
   * Save Project as JSON (ImageMate Project .json)
   */
  static saveProjectJson(doc: DocumentProject) {
    // Serialize raster canvases to base64 data URLs
    const serializableDoc = {
      ...doc,
      layers: doc.layers.map((layer) => {
        const { canvas, maskCanvas, ...rest } = layer;
        let dataUrl: string | undefined = undefined;
        let maskDataUrl: string | undefined = undefined;

        if (canvas) {
          try {
            dataUrl = canvas.toDataURL('image/png');
          } catch {
            // ignore
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
      }),
    };

    const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(serializableDoc, null, 2));
    const filename = doc.title.endsWith('.json') ? doc.title : `${doc.title}.psd.json`;
    const link = document.createElement('a');
    link.download = filename;
    link.href = jsonString;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
