/**
 * Photoshop Web Studio - Layer Composite & Drawing Engine
 */

import { Layer, DocumentProject, Guide, SelectionState, BlendMode } from '../types/photoshop';
import { FilterEngine } from './filterEngine';

export class CanvasRenderer {
  /**
   * Render the entire document project onto a target HTML5 Canvas
   */
  static renderDocument(
    ctx: CanvasRenderingContext2D,
    doc: DocumentProject,
    options: {
      renderBackground?: boolean;
      renderOverlays?: boolean;
      activeLayerId?: string | null;
      showGuides?: boolean;
      showGrid?: boolean;
    } = {}
  ) {
    const {
      renderBackground = true,
      renderOverlays = true,
      activeLayerId = doc.activeLayerId,
      showGuides = doc.rulersVisible,
      showGrid = doc.gridVisible,
    } = options;

    const { width, height } = doc;
    ctx.clearRect(0, 0, width, height);

    // 1. Render Background
    if (renderBackground) {
      if (doc.background === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      } else if (doc.background === 'black') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
      } else if (doc.background === 'custom' && doc.backgroundColor) {
        ctx.fillStyle = doc.backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }
      // 'transparent' leaves empty for checkerboard
    }

    // 2. Render Layers in bottom-up order
    for (let i = 0; i < doc.layers.length; i++) {
      const layer = doc.layers[i];
      if (!layer.visible) continue;
      this.renderLayer(ctx, layer, width, height);
    }

    // 3. Render Overlays (Guides, Grid, Selection Marquee, Transform Box)
    if (renderOverlays) {
      if (showGrid) {
        this.renderGrid(ctx, width, height);
      }
      if (showGuides && doc.guides) {
        this.renderGuides(ctx, doc.guides, width, height);
      }
      if (doc.selection && doc.selection.active) {
        this.renderSelection(ctx, doc.selection);
      }
      if (activeLayerId) {
        const activeLayer = doc.layers.find((l) => l.id === activeLayerId);
        if (activeLayer && !activeLayer.locked && activeLayer.visible) {
          this.renderTransformHandles(ctx, activeLayer);
        }
      }
    }
  }

  /**
   * Render an individual layer
   */
  static renderLayer(
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    docWidth: number,
    docHeight: number
  ) {
    // Adjustment layers apply to composite below
    if (layer.type === 'adjustment' && layer.adjustmentType) {
      this.renderAdjustmentLayer(ctx, layer, docWidth, docHeight);
      return;
    }

    ctx.save();

    // Set Blend Mode
    ctx.globalCompositeOperation = this.getCanvasCompositeOp(layer.blendMode);
    ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity / 100));

    // Transformations
    ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }
    ctx.scale(layer.scaleX || 1, layer.scaleY || 1);
    ctx.translate(-layer.width / 2, -layer.height / 2);

    // If layer has effects or mask, render into an offscreen buffer
    const hasEffects =
      layer.effects?.dropShadow?.enabled ||
      layer.effects?.stroke?.enabled ||
      layer.effects?.colorOverlay?.enabled ||
      layer.effects?.outerGlow?.enabled;
    const hasMask = layer.maskCanvas && layer.maskEnabled;

    if (hasEffects || hasMask) {
      this.renderLayerWithBuffer(ctx, layer);
    } else {
      this.renderLayerDirect(ctx, layer);
    }

    ctx.restore();
  }

  /**
   * Direct drawing for raster, shape, or text
   */
  private static renderLayerDirect(ctx: CanvasRenderingContext2D, layer: Layer) {
    if (layer.type === 'raster') {
      if (layer.canvas) {
        ctx.drawImage(layer.canvas, 0, 0, layer.width, layer.height);
      } else if (layer.imageData) {
        const temp = document.createElement('canvas');
        temp.width = layer.imageData.width;
        temp.height = layer.imageData.height;
        const tCtx = temp.getContext('2d');
        if (tCtx) {
          tCtx.putImageData(layer.imageData, 0, 0);
          ctx.drawImage(temp, 0, 0, layer.width, layer.height);
        }
      }
    } else if (layer.type === 'text') {
      this.renderText(ctx, layer);
    } else if (layer.type === 'shape') {
      this.renderShape(ctx, layer);
    }
  }

  /**
   * Render layer with effects and masks
   */
  private static renderLayerWithBuffer(ctx: CanvasRenderingContext2D, layer: Layer) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = Math.max(1, Math.round(layer.width));
    offCanvas.height = Math.max(1, Math.round(layer.height));
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    // 1. Draw raw content
    this.renderLayerDirect(offCtx, { ...layer, x: 0, y: 0 });

    // 2. Color Overlay
    if (layer.effects?.colorOverlay?.enabled) {
      offCtx.save();
      offCtx.globalCompositeOperation = 'source-in';
      offCtx.globalAlpha = layer.effects.colorOverlay.opacity / 100;
      offCtx.fillStyle = layer.effects.colorOverlay.color;
      offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
      offCtx.restore();
    }

    // 3. Layer Mask
    if (layer.maskCanvas && layer.maskEnabled) {
      offCtx.save();
      offCtx.globalCompositeOperation = 'destination-in';
      offCtx.drawImage(layer.maskCanvas, 0, 0, offCanvas.width, offCanvas.height);
      offCtx.restore();
    }

    // 4. Drop Shadow (rendered on parent context before main buffer)
    if (layer.effects?.dropShadow?.enabled) {
      const ds = layer.effects.dropShadow;
      ctx.save();
      ctx.shadowColor = ds.color;
      ctx.shadowBlur = ds.blur;
      ctx.shadowOffsetX = ds.offsetX;
      ctx.shadowOffsetY = ds.offsetY;
      ctx.globalAlpha = (ds.opacity / 100) * (layer.opacity / 100);
      ctx.drawImage(offCanvas, 0, 0);
      ctx.restore();
    }

    // 5. Outer Glow
    if (layer.effects?.outerGlow?.enabled) {
      const og = layer.effects.outerGlow;
      ctx.save();
      ctx.shadowColor = og.color;
      ctx.shadowBlur = og.blur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.globalAlpha = (og.opacity / 100) * (layer.opacity / 100);
      ctx.drawImage(offCanvas, 0, 0);
      ctx.restore();
    }

    // 6. Draw the layer
    ctx.drawImage(offCanvas, 0, 0);

    // 7. Stroke effect
    if (layer.effects?.stroke?.enabled) {
      const st = layer.effects.stroke;
      ctx.save();
      ctx.strokeStyle = st.color;
      ctx.lineWidth = st.size;
      ctx.strokeRect(0, 0, layer.width, layer.height);
      ctx.restore();
    }
  }

  /**
   * Render text with rich formatting and optional warp
   */
  private static renderText(ctx: CanvasRenderingContext2D, layer: Layer) {
    const text = layer.text || 'Text Layer';
    const fontSize = layer.fontSize || 48;
    const fontFamily = layer.fontFamily || 'Inter, sans-serif';
    const fontWeight = layer.fontWeight || '600';
    const fontStyle = layer.fontStyle || 'normal';
    const color = layer.textColor || '#ffffff';
    const align = layer.textAlign || 'left';

    ctx.save();
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.textAlign = align;

    let textX = 0;
    if (align === 'center') textX = layer.width / 2;
    if (align === 'right') textX = layer.width;

    const lines = text.split('\n');
    const lineHeight = (layer.lineHeight || 1.2) * fontSize;

    lines.forEach((line, idx) => {
      ctx.fillText(line, textX, idx * lineHeight);
    });

    ctx.restore();
  }

  /**
   * Render vector shapes
   */
  private static renderShape(ctx: CanvasRenderingContext2D, layer: Layer) {
    const {
      shapeType = 'rect',
      fillColor = '#3b82f6',
      strokeColor = '#ffffff',
      strokeWidth = 0,
      cornerRadius = 0,
      width,
      height,
    } = layer;

    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();

    if (shapeType === 'rect') {
      ctx.rect(0, 0, width, height);
    } else if (shapeType === 'rounded-rect') {
      const r = Math.min(cornerRadius, width / 2, height / 2);
      ctx.roundRect(0, 0, width, height, r);
    } else if (shapeType === 'ellipse') {
      ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    } else if (shapeType === 'polygon') {
      const sides = layer.sides || 5;
      const rx = width / 2;
      const ry = height / 2;
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const x = rx + rx * Math.cos(angle);
        const y = ry + ry * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else if (shapeType === 'star') {
      const points = layer.starPoints || 5;
      const rx = width / 2;
      const ry = height / 2;
      const innerRx = rx * 0.45;
      const innerRy = ry * 0.45;
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const isOuter = i % 2 === 0;
        const curRx = isOuter ? rx : innerRx;
        const curRy = isOuter ? ry : innerRy;
        const x = rx + curRx * Math.cos(angle);
        const y = ry + curRy * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else if (shapeType === 'line') {
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
    } else if (shapeType === 'arrow') {
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width - height / 2, height / 2);
      ctx.lineTo(width - height / 2, 0);
      ctx.lineTo(width, height / 2);
      ctx.lineTo(width - height / 2, height);
      ctx.lineTo(width - height / 2, height / 2);
    }

    if (fillColor && fillColor !== 'transparent') {
      ctx.fill();
    }
    if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Apply dynamic adjustment layer
   */
  private static renderAdjustmentLayer(
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    w: number,
    h: number
  ) {
    try {
      const current = ctx.getImageData(0, 0, w, h);
      const params = layer.adjustmentParams || {};
      let adjusted = current;

      if (layer.adjustmentType === 'brightness-contrast') {
        const b = (params.brightness as number) || 0;
        const c = (params.contrast as number) || 0;
        adjusted = FilterEngine.applyBrightnessContrast(current, b, c);
      } else if (layer.adjustmentType === 'hue-saturation') {
        const hu = (params.hue as number) || 0;
        const sat = (params.saturation as number) || 0;
        const lgt = (params.lightness as number) || 0;
        adjusted = FilterEngine.applyHueSaturation(current, hu, sat, lgt);
      } else if (layer.adjustmentType === 'color-balance') {
        const cr = (params.cyanRed as number) || 0;
        const mg = (params.magentaGreen as number) || 0;
        const yb = (params.yellowBlue as number) || 0;
        adjusted = FilterEngine.applyColorBalance(current, cr, mg, yb);
      } else if (layer.adjustmentType === 'black-white') {
        adjusted = FilterEngine.applyBlackAndWhite(current);
      } else if (layer.adjustmentType === 'invert') {
        adjusted = FilterEngine.applyInvert(current);
      } else if (layer.adjustmentType === 'sepia') {
        adjusted = FilterEngine.applySepia(current, (params.intensity as number) || 100);
      } else if (layer.adjustmentType === 'posterize') {
        adjusted = FilterEngine.applyPosterize(current, (params.levels as number) || 4);
      } else if (layer.adjustmentType === 'threshold') {
        adjusted = FilterEngine.applyThreshold(current, (params.threshold as number) || 128);
      }

      ctx.putImageData(adjusted, 0, 0);
    } catch {
      // Ignore if out-of-bounds
    }
  }

  /**
   * Render Transform Bounding Box with 8 Resize Handles and Rotation Handle
   */
  static renderTransformHandles(ctx: CanvasRenderingContext2D, layer: Layer) {
    ctx.save();
    ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }
    ctx.translate(-layer.width / 2, -layer.height / 2);

    const w = layer.width;
    const h = layer.height;
    const handleSize = 8;

    // Bounding Box
    ctx.strokeStyle = '#00a8ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0, 0, w, h);
    ctx.setLineDash([]);

    // 8 handles (TL, T, TR, R, BR, B, BL, L)
    const handles = [
      { x: 0, y: 0 },
      { x: w / 2, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h / 2 },
      { x: w, y: h },
      { x: w / 2, y: h },
      { x: 0, y: h },
      { x: 0, y: h / 2 },
    ];

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#00a8ff';
    ctx.lineWidth = 1.5;

    handles.forEach((pt) => {
      ctx.beginPath();
      ctx.rect(
        pt.x - handleSize / 2,
        pt.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.fill();
      ctx.stroke();
    });

    // Rotation Handle (top extension)
    const rotY = -24;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, rotY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(w / 2, rotY, handleSize / 2 + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Center Anchor point
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00a8ff';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Render selection marching ants
   */
  static renderSelection(ctx: CanvasRenderingContext2D, sel: SelectionState) {
    if (!sel.active || !sel.bounds) return;
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const { x, y, width, height } = sel.bounds;
    if (sel.type === 'rect') {
      ctx.strokeRect(x, y, width, height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineDashOffset = 4;
      ctx.strokeRect(x, y, width, height);
    } else if (sel.type === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineDashOffset = 4;
      ctx.stroke();
    } else if (sel.points && sel.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(sel.points[0].x, sel.points[0].y);
      for (let i = 1; i < sel.points.length; i++) {
        ctx.lineTo(sel.points[i].x, sel.points[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineDashOffset = 4;
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Render Guides
   */
  static renderGuides(
    ctx: CanvasRenderingContext2D,
    guides: Guide[],
    w: number,
    h: number
  ) {
    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    guides.forEach((g) => {
      ctx.beginPath();
      if (g.orientation === 'horizontal') {
        ctx.moveTo(0, g.position);
        ctx.lineTo(w, g.position);
      } else {
        ctx.moveTo(g.position, 0);
        ctx.lineTo(g.position, h);
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  /**
   * Render Pixel Grid
   */
  static renderGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const step = 50;

    for (let x = 0; x <= w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Map blend mode enum to 2D Canvas globalCompositeOperation
   */
  private static getCanvasCompositeOp(
    blend: BlendMode
  ): GlobalCompositeOperation {
    switch (blend) {
      case 'multiply':
        return 'multiply';
      case 'screen':
        return 'screen';
      case 'overlay':
        return 'overlay';
      case 'darken':
        return 'darken';
      case 'lighten':
        return 'lighten';
      case 'color-dodge':
        return 'color-dodge';
      case 'color-burn':
        return 'color-burn';
      case 'hard-light':
        return 'hard-light';
      case 'soft-light':
        return 'soft-light';
      case 'difference':
        return 'difference';
      case 'exclusion':
        return 'exclusion';
      case 'hue':
        return 'hue';
      case 'saturation':
        return 'saturation';
      case 'color':
        return 'color';
      case 'luminosity':
        return 'luminosity';
      case 'normal':
      default:
        return 'source-over';
    }
  }

  /**
   * Determine if a point hits any transform handle of a layer
   */
  static getHandleAtPoint(
    pt: { x: number; y: number },
    layer: Layer,
    tolerance = 10
  ): string | null {
    const { x, y, width: w, height: h } = layer;

    // Check corners
    if (Math.abs(pt.x - (x + w)) <= tolerance && Math.abs(pt.y - (y + h)) <= tolerance) return 'se';
    if (Math.abs(pt.x - x) <= tolerance && Math.abs(pt.y - y) <= tolerance) return 'nw';
    if (Math.abs(pt.x - (x + w)) <= tolerance && Math.abs(pt.y - y) <= tolerance) return 'ne';
    if (Math.abs(pt.x - x) <= tolerance && Math.abs(pt.y - (y + h)) <= tolerance) return 'sw';

    // Check edges
    if (Math.abs(pt.x - (x + w)) <= tolerance && pt.y >= y && pt.y <= y + h) return 'e';
    if (Math.abs(pt.y - (y + h)) <= tolerance && pt.x >= x && pt.x <= x + w) return 's';
    if (Math.abs(pt.x - x) <= tolerance && pt.y >= y && pt.y <= y + h) return 'w';
    if (Math.abs(pt.y - y) <= tolerance && pt.x >= x && pt.x <= x + w) return 'n';

    return null;
  }

  /**
   * Hit test layers from top to bottom to find the layer under a point
   */
  static hitTestLayer(pt: { x: number; y: number }, layers: Layer[]): Layer | null {
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (!l.visible || l.locked) continue;
      if (
        pt.x >= l.x &&
        pt.x <= l.x + l.width &&
        pt.y >= l.y &&
        pt.y <= l.y + l.height
      ) {
        return l;
      }
    }
    return null;
  }
}
