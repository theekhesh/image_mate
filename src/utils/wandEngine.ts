/**
 * ImageMate Studio - Chroma & Tonal Wand Engine
 * Professional flood-fill selection, color distance thresholding,
 * contiguous vs global sampling, boundary contour tracing, and selection mask generation.
 */

import { DocumentProject, Layer, SelectionState } from '../types/imagemate';
import { CanvasRenderer } from './canvasRenderer';

export interface WandOptions {
  tolerance: number; // 0 - 255 (default 32)
  contiguous: boolean; // true: 4-way BFS flood-fill; false: global color range
  sampleAllLayers: boolean; // true: sample entire composite; false: active layer only
  feather?: number;
}

/**
 * Check if a pixel matches the target color within tolerance.
 * Supports standard RGB Euclidean color distance and transparency handling.
 */
function isColorMatch(
  r: number,
  g: number,
  b: number,
  a: number,
  tr: number,
  tg: number,
  tb: number,
  ta: number,
  tolerance: number
): boolean {
  // If target is transparent, match transparent pixels
  if (ta < 10) {
    return a < 10;
  }
  // If target is opaque but pixel is transparent, don't match
  if (a < 10) {
    return false;
  }

  // Tolerance in 0-255 range:
  // Euclidean color distance in RGBA space
  const dr = r - tr;
  const dg = g - tg;
  const db = b - tb;
  const da = (a - ta) * 0.5;
  const dist = Math.sqrt(dr * dr + dg * dg + db * db + da * da);

  // Scaled threshold: tolerance 32 matches dist <= 32 * 1.732 (~55.4)
  return dist <= Math.max(1, tolerance * 1.732);
}

/**
 * Trace the outer perimeter of a 2D binary mask to extract closed polygon contour vertices.
 * Uses 8-connected Moore-Neighbor tracing with path reduction for smooth marching ants rendering.
 */
export function traceContour(
  visited: Uint8Array,
  width: number,
  height: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): { x: number; y: number }[] {
  // Find top-leftmost starting pixel
  let startX = -1;
  let startY = -1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (visited[y * width + x] === 1) {
        startX = x;
        startY = y;
        break;
      }
    }
    if (startX !== -1) break;
  }
  if (startX === -1) return [];

  // 8 neighborhood directions clockwise starting from top:
  // 0: (0,-1), 1: (1,-1), 2: (1,0), 3: (1,1), 4: (0,1), 5: (-1,1), 6: (-1,0), 7: (-1,-1)
  const dx = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1];

  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
  let cx = startX;
  let cy = startY;
  let dir = 7; // backtrack direction

  const maxSteps = (maxX - minX + maxY - minY) * 12 + 1000;
  let step = 0;

  while (step++ < maxSteps) {
    let found = false;
    const checkDir = (dir + 2) % 8;
    for (let i = 0; i < 8; i++) {
      const nd = (checkDir + i) % 8;
      const nx = cx + dx[nd];
      const ny = cy + dy[nd];
      if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY && visited[ny * width + nx] === 1) {
        cx = nx;
        cy = ny;
        dir = (nd + 4) % 8;
        found = true;
        break;
      }
    }
    if (!found || (cx === startX && cy === startY)) break;
    points.push({ x: cx, y: cy });
  }

  // Ensure minimum polygon points for geometric rendering
  if (points.length < 3) {
    return [
      { x: minX, y: minY },
      { x: maxX + 1, y: minY },
      { x: maxX + 1, y: maxY + 1 },
      { x: minX, y: maxY + 1 },
    ];
  }

  // Reduce collinear / dense points to keep UI responsive
  if (points.length > 250) {
    const stride = Math.ceil(points.length / 250);
    const reduced: { x: number; y: number }[] = [];
    for (let i = 0; i < points.length; i += stride) {
      reduced.push(points[i]);
    }
    return reduced;
  }

  return points;
}

/**
 * Execute Chroma & Tonal Wand selection on the document.
 */
export function computeWandSelection(
  doc: DocumentProject,
  activeLayer: Layer | null,
  docPt: { x: number; y: number },
  options: WandOptions
): SelectionState | null {
  const tolerance = Math.max(0, Math.min(255, options.tolerance ?? 32));
  const contiguous = options.contiguous ?? true;
  const sampleAll = options.sampleAllLayers ?? false;

  let srcCanvas: HTMLCanvasElement;
  let layerOffsetX = 0;
  let layerOffsetY = 0;

  // 1. Choose sampling source
  if (!sampleAll && activeLayer) {
    const lx = Math.floor(docPt.x - activeLayer.x);
    const ly = Math.floor(docPt.y - activeLayer.y);

    // If click is within active layer bounds
    if (lx >= 0 && lx < activeLayer.width && ly >= 0 && ly < activeLayer.height) {
      layerOffsetX = activeLayer.x;
      layerOffsetY = activeLayer.y;
      if (activeLayer.canvas) {
        srcCanvas = activeLayer.canvas;
      } else {
        // Render text/shape layer to offscreen buffer
        srcCanvas = document.createElement('canvas');
        srcCanvas.width = Math.max(1, Math.round(activeLayer.width));
        srcCanvas.height = Math.max(1, Math.round(activeLayer.height));
        const ctx = srcCanvas.getContext('2d');
        if (ctx) {
          CanvasRenderer.renderLayer(ctx, { ...activeLayer, x: 0, y: 0, rotation: 0 }, srcCanvas.width, srcCanvas.height);
        }
      }
    } else {
      // Click was outside active layer -> sample document composite
      srcCanvas = document.createElement('canvas');
      srcCanvas.width = doc.width;
      srcCanvas.height = doc.height;
      const ctx = srcCanvas.getContext('2d');
      if (ctx) {
        CanvasRenderer.renderDocument(ctx, doc, {
          renderBackground: true,
          renderOverlays: false,
        });
      }
    }
  } else {
    // Sample All Layers -> Composite canvas
    srcCanvas = document.createElement('canvas');
    srcCanvas.width = doc.width;
    srcCanvas.height = doc.height;
    const ctx = srcCanvas.getContext('2d');
    if (ctx) {
      CanvasRenderer.renderDocument(ctx, doc, {
        renderBackground: true,
        renderOverlays: false,
      });
    }
  }

  const sWidth = srcCanvas.width;
  const sHeight = srcCanvas.height;
  const sCtx = srcCanvas.getContext('2d');
  if (!sCtx || sWidth <= 0 || sHeight <= 0) return null;

  const imgData = sCtx.getImageData(0, 0, sWidth, sHeight);
  const data = imgData.data;

  // Click point relative to source canvas
  const startX = Math.max(0, Math.min(sWidth - 1, Math.floor(docPt.x - layerOffsetX)));
  const startY = Math.max(0, Math.min(sHeight - 1, Math.floor(docPt.y - layerOffsetY)));

  const startIdx = (startY * sWidth + startX) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  const visited = new Uint8Array(sWidth * sHeight);
  let minX = sWidth;
  let maxX = 0;
  let minY = sHeight;
  let maxY = 0;
  let matchCount = 0;

  if (contiguous) {
    // 2A. 4-way Breadth-First Search Flood Fill
    const queue = new Int32Array(sWidth * sHeight * 2);
    let qHead = 0;
    let qTail = 0;

    queue[qTail++] = startX;
    queue[qTail++] = startY;
    visited[startY * sWidth + startX] = 1;

    minX = startX;
    maxX = startX;
    minY = startY;
    maxY = startY;
    matchCount = 1;

    while (qHead < qTail) {
      const cx = queue[qHead++];
      const cy = queue[qHead++];

      // 4 neighbors: right, left, down, up
      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];

      for (let i = 0; i < 4; i++) {
        const nx = neighbors[i][0];
        const ny = neighbors[i][1];

        if (nx >= 0 && nx < sWidth && ny >= 0 && ny < sHeight) {
          const nPos = ny * sWidth + nx;
          if (visited[nPos] === 0) {
            const idx = nPos * 4;
            if (
              isColorMatch(
                data[idx],
                data[idx + 1],
                data[idx + 2],
                data[idx + 3],
                targetR,
                targetG,
                targetB,
                targetA,
                tolerance
              )
            ) {
              visited[nPos] = 1;
              queue[qTail++] = nx;
              queue[qTail++] = ny;
              matchCount++;

              if (nx < minX) minX = nx;
              if (nx > maxX) maxX = nx;
              if (ny < minY) minY = ny;
              if (ny > maxY) maxY = ny;
            }
          }
        }
      }
    }
  } else {
    // 2B. Global Tonal & Chroma Wand across entire image
    for (let y = 0; y < sHeight; y++) {
      for (let x = 0; x < sWidth; x++) {
        const idx = (y * sWidth + x) * 4;
        if (
          isColorMatch(
            data[idx],
            data[idx + 1],
            data[idx + 2],
            data[idx + 3],
            targetR,
            targetG,
            targetB,
            targetA,
            tolerance
          )
        ) {
          visited[y * sWidth + x] = 1;
          matchCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  if (matchCount === 0 || maxX < minX || maxY < minY) {
    return null;
  }

  // 3. Create full-document selection mask canvas
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = doc.width;
  maskCanvas.height = doc.height;
  const mCtx = maskCanvas.getContext('2d');
  if (mCtx) {
    const maskImgData = mCtx.createImageData(doc.width, doc.height);
    const mData = maskImgData.data;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (visited[y * sWidth + x] === 1) {
          const docX = layerOffsetX + x;
          const docY = layerOffsetY + y;
          if (docX >= 0 && docX < doc.width && docY >= 0 && docY < doc.height) {
            const mIdx = (docY * doc.width + docX) * 4;
            mData[mIdx] = 255;
            mData[mIdx + 1] = 255;
            mData[mIdx + 2] = 255;
            mData[mIdx + 3] = 255;
          }
        }
      }
    }
    mCtx.putImageData(maskImgData, 0, 0);
  }

  // 4. Trace contour path for visual marching ants
  const rawPoints = traceContour(visited, sWidth, sHeight, minX, maxX, minY, maxY);
  const docPoints = rawPoints.map((p) => ({
    x: p.x + layerOffsetX,
    y: p.y + layerOffsetY,
  }));

  const docBounds = {
    x: minX + layerOffsetX,
    y: minY + layerOffsetY,
    width: Math.max(1, maxX - minX + 1),
    height: Math.max(1, maxY - minY + 1),
  };

  return {
    active: true,
    type: 'polygon',
    points: docPoints,
    bounds: docBounds,
    feather: options.feather || 0,
    maskCanvas,
  };
}
