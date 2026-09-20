/**
 * ImageMate Studio - High Performance Filter & Adjustment Engine
 */

export class FilterEngine {
  /**
   * Clone ImageData
   */
  static cloneImageData(imageData: ImageData): ImageData {
    const copy = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    return copy;
  }

  /**
   * Adjust Brightness & Contrast
   * @param brightness -100 to 100
   * @param contrast -100 to 100
   */
  static applyBrightnessContrast(
    src: ImageData,
    brightness: number,
    contrast: number
  ): ImageData {
    const dst = this.cloneImageData(src);
    const data = dst.data;
    const b = (brightness / 100) * 255;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      // Contrast then Brightness
      data[i] = factor * (data[i] - 128) + 128 + b;
      data[i + 1] = factor * (data[i + 1] - 128) + 128 + b;
      data[i + 2] = factor * (data[i + 2] - 128) + 128 + b;
    }
    return dst;
  }

  /**
   * Adjust Hue, Saturation and Lightness
   * @param hue -180 to 180
   * @param saturation -100 to 100
   * @param lightness -100 to 100
   */
  static applyHueSaturation(
    src: ImageData,
    hue: number,
    saturation: number,
    lightness: number
  ): ImageData {
    const dst = this.cloneImageData(src);
    const data = dst.data;
    const satMul = (saturation + 100) / 100;
    const lightMul = lightness / 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const [h, s, l] = this.rgbToHsl(r, g, b);

      let newH = (h + hue / 360) % 1;
      if (newH < 0) newH += 1;

      const newS = Math.max(0, Math.min(1, s * satMul));
      let newL = l;
      if (lightMul > 0) {
        newL = l + (1 - l) * lightMul;
      } else {
        newL = l + l * lightMul;
      }
      newL = Math.max(0, Math.min(1, newL));

      const [newR, newG, newB] = this.hslToRgb(newH, newS, newL);
      data[i] = newR;
      data[i + 1] = newG;
      data[i + 2] = newB;
    }
    return dst;
  }

  /**
   * Apply Levels adjustment
   */
  static applyLevels(
    src: ImageData,
    inBlack = 0,
    gamma = 1.0,
    inWhite = 255,
    outBlack = 0,
    outWhite = 255
  ): ImageData {
    const dst = this.cloneImageData(src);
    const data = dst.data;

    // Precompute LUT table for fast 256 byte mapping
    const lut = new Uint8Array(256);
    const inRange = Math.max(1, inWhite - inBlack);
    const outRange = outWhite - outBlack;

    for (let i = 0; i < 256; i++) {
      let val = Math.max(0, Math.min(255, i));
      // Normalize input range
      let norm = (val - inBlack) / inRange;
      norm = Math.max(0, Math.min(1, norm));
      // Gamma correction
      const g = Math.pow(norm, 1 / gamma);
      // Map to output range
      lut[i] = Math.round(outBlack + g * outRange);
    }

    for (let i = 0; i < data.length; i += 4) {
      data[i] = lut[data[i]];
      data[i + 1] = lut[data[i + 1]];
      data[i + 2] = lut[data[i + 2]];
    }
    return dst;
  }

  /**
   * Apply Curves mapping
   */
  static applyCurves(
    src: ImageData,
    curveLUT: { r: Uint8Array; g: Uint8Array; b: Uint8Array }
  ): ImageData {
    const dst = this.cloneImageData(src);
    const data = dst.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = curveLUT.r[data[i]];
      data[i + 1] = curveLUT.g[data[i + 1]];
      data[i + 2] = curveLUT.b[data[i + 2]];
    }
    return dst;
  }

  /**
   * Color Balance (Shadows, Midtones, Highlights)
   */
  static applyColorBalance(
    src: ImageData,
    cyanRed: number, // -100 to 100
    magentaGreen: number,
    yellowBlue: number
  ): ImageData {
    const dst = this.cloneImageData(src);
    const data = dst.data;

    const rShift = (cyanRed / 100) * 40;
    const gShift = (magentaGreen / 100) * 40;
    const bShift = (yellowBlue / 100) * 40;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + rShift));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + gShift));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + bShift));
    }
    return dst;
  }

  /**
   * Invert Colors
   */
  static applyInvert(src: ImageData): ImageData {
    const dst = this.cloneImageData(src);
    const data = dst.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    return dst;
  }

  /**
   * Black and White conversion with channel weights
   */
  static applyBlackAndWhite(
    src: ImageData,
    redWeight = 0.3,
    greenWeight = 0.59,
    blueWeight = 0.11
  ): ImageData {
    const dst = this.cloneImageData(src);
    const data = dst.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray =
        data[i] * redWeight + data[i + 1] * greenWeight + data[i + 2] * blueWeight;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    return dst;
  }

  static applyGrayscale(src: ImageData): ImageData {
    return this.applyBlackAndWhite(src);
  }

  /**
   * Posterize to N levels
   */
  static applyPosterize(src: ImageData, levels = 4): ImageData {
    const dst = this.cloneImageData(src);
    const data = dst.data;
    const step = 255 / Math.max(2, levels - 1);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / step) * step;
      data[i + 1] = Math.round(data[i + 1] / step) * step;
      data[i + 2] = Math.round(data[i + 2] / step) * step;
    }
    return dst;
  }

  /**
   * Threshold binary conversion
   */
  static applyThreshold(src: ImageData, threshold = 128): ImageData {
    const dst = this.cloneImageData(src);
    const data = dst.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const v = gray >= threshold ? 255 : 0;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
    return dst;
  }

  /**
   * Sepia Tone
   */
  static applySepia(src: ImageData, intensity = 100): ImageData {
    const dst = this.cloneImageData(src);
    const data = dst.data;
    const factor = intensity / 100;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const tr = 0.393 * r + 0.769 * g + 0.189 * b;
      const tg = 0.349 * r + 0.686 * g + 0.168 * b;
      const tb = 0.272 * r + 0.534 * g + 0.131 * b;

      data[i] = r + (tr - r) * factor;
      data[i + 1] = g + (tg - g) * factor;
      data[i + 2] = b + (tb - b) * factor;
    }
    return dst;
  }

  /**
   * Fast Separable Gaussian Blur
   */
  static applyGaussianBlur(src: ImageData, radius = 5): ImageData {
    if (radius <= 0) return src;
    const dst = this.cloneImageData(src);
    const w = src.width;
    const h = src.height;

    // Approximate Gaussian blur using 3-pass fast box blur
    const boxes = this.boxesForGauss(radius, 3);
    this.boxBlur(src.data, dst.data, w, h, (boxes[0] - 1) / 2);
    this.boxBlur(dst.data, dst.data, w, h, (boxes[1] - 1) / 2);
    this.boxBlur(dst.data, dst.data, w, h, (boxes[2] - 1) / 2);

    return dst;
  }

  private static boxesForGauss(sigma: number, n: number): number[] {
    const wIdeal = Math.sqrt((12 * sigma * sigma) / n + 1);
    let wl = Math.floor(wIdeal);
    if (wl % 2 === 0) wl--;
    const wu = wl + 2;
    const mIdeal =
      (12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4);
    const m = Math.round(mIdeal);
    const sizes: number[] = [];
    for (let i = 0; i < n; i++) sizes.push(i < m ? wl : wu);
    return sizes;
  }

  private static boxBlur(
    scl: Uint8ClampedArray,
    tcl: Uint8ClampedArray,
    w: number,
    h: number,
    r: number
  ) {
    for (let i = 0; i < scl.length; i++) tcl[i] = scl[i];
    this.boxBlurH(tcl, scl, w, h, r);
    this.boxBlurT(scl, tcl, w, h, r);
  }

  private static boxBlurH(
    scl: Uint8ClampedArray,
    tcl: Uint8ClampedArray,
    w: number,
    h: number,
    r: number
  ) {
    const arr = Math.round(r);
    const iarr = 1 / (arr + arr + 1);
    for (let i = 0; i < h; i++) {
      let ti = i * w * 4;
      let li = ti;
      let ri = ti + arr * 4;
      const fv0 = scl[ti];
      const fv1 = scl[ti + 1];
      const fv2 = scl[ti + 2];
      const fv3 = scl[ti + 3];
      const lv0 = scl[ti + (w - 1) * 4];
      const lv1 = scl[ti + (w - 1) * 4 + 1];
      const lv2 = scl[ti + (w - 1) * 4 + 2];
      const lv3 = scl[ti + (w - 1) * 4 + 3];

      let val0 = (arr + 1) * fv0;
      let val1 = (arr + 1) * fv1;
      let val2 = (arr + 1) * fv2;
      let val3 = (arr + 1) * fv3;

      for (let j = 0; j < arr; j++) {
        val0 += scl[ti + j * 4];
        val1 += scl[ti + j * 4 + 1];
        val2 += scl[ti + j * 4 + 2];
        val3 += scl[ti + j * 4 + 3];
      }
      for (let j = 0; j <= arr; j++) {
        val0 += scl[ri] - fv0;
        val1 += scl[ri + 1] - fv1;
        val2 += scl[ri + 2] - fv2;
        val3 += scl[ri + 3] - fv3;
        tcl[ti] = Math.round(val0 * iarr);
        tcl[ti + 1] = Math.round(val1 * iarr);
        tcl[ti + 2] = Math.round(val2 * iarr);
        tcl[ti + 3] = Math.round(val3 * iarr);
        ri += 4;
        ti += 4;
      }
      for (let j = arr + 1; j < w - arr; j++) {
        val0 += scl[ri] - scl[li];
        val1 += scl[ri + 1] - scl[li + 1];
        val2 += scl[ri + 2] - scl[li + 2];
        val3 += scl[ri + 3] - scl[li + 3];
        tcl[ti] = Math.round(val0 * iarr);
        tcl[ti + 1] = Math.round(val1 * iarr);
        tcl[ti + 2] = Math.round(val2 * iarr);
        tcl[ti + 3] = Math.round(val3 * iarr);
        ri += 4;
        li += 4;
        ti += 4;
      }
      for (let j = w - arr; j < w; j++) {
        val0 += lv0 - scl[li];
        val1 += lv1 - scl[li + 1];
        val2 += lv2 - scl[li + 2];
        val3 += lv3 - scl[li + 3];
        tcl[ti] = Math.round(val0 * iarr);
        tcl[ti + 1] = Math.round(val1 * iarr);
        tcl[ti + 2] = Math.round(val2 * iarr);
        tcl[ti + 3] = Math.round(val3 * iarr);
        li += 4;
        ti += 4;
      }
    }
  }

  private static boxBlurT(
    scl: Uint8ClampedArray,
    tcl: Uint8ClampedArray,
    w: number,
    h: number,
    r: number
  ) {
    const arr = Math.round(r);
    const iarr = 1 / (arr + arr + 1);
    for (let i = 0; i < w; i++) {
      let ti = i * 4;
      let li = ti;
      let ri = ti + arr * w * 4;
      const fv0 = scl[ti];
      const fv1 = scl[ti + 1];
      const fv2 = scl[ti + 2];
      const fv3 = scl[ti + 3];
      const lv0 = scl[ti + (h - 1) * w * 4];
      const lv1 = scl[ti + (h - 1) * w * 4 + 1];
      const lv2 = scl[ti + (h - 1) * w * 4 + 2];
      const lv3 = scl[ti + (h - 1) * w * 4 + 3];

      let val0 = (arr + 1) * fv0;
      let val1 = (arr + 1) * fv1;
      let val2 = (arr + 1) * fv2;
      let val3 = (arr + 1) * fv3;

      for (let j = 0; j < arr; j++) {
        val0 += scl[ti + j * w * 4];
        val1 += scl[ti + j * w * 4 + 1];
        val2 += scl[ti + j * w * 4 + 2];
        val3 += scl[ti + j * w * 4 + 3];
      }
      for (let j = 0; j <= arr; j++) {
        val0 += scl[ri] - fv0;
        val1 += scl[ri + 1] - fv1;
        val2 += scl[ri + 2] - fv2;
        val3 += scl[ri + 3] - fv3;
        tcl[ti] = Math.round(val0 * iarr);
        tcl[ti + 1] = Math.round(val1 * iarr);
        tcl[ti + 2] = Math.round(val2 * iarr);
        tcl[ti + 3] = Math.round(val3 * iarr);
        ri += w * 4;
        ti += w * 4;
      }
      for (let j = arr + 1; j < h - arr; j++) {
        val0 += scl[ri] - scl[li];
        val1 += scl[ri + 1] - scl[li + 1];
        val2 += scl[ri + 2] - scl[li + 2];
        val3 += scl[ri + 3] - scl[li + 3];
        tcl[ti] = Math.round(val0 * iarr);
        tcl[ti + 1] = Math.round(val1 * iarr);
        tcl[ti + 2] = Math.round(val2 * iarr);
        tcl[ti + 3] = Math.round(val3 * iarr);
        ri += w * 4;
        li += w * 4;
        ti += w * 4;
      }
      for (let j = h - arr; j < h; j++) {
        val0 += lv0 - scl[li];
        val1 += lv1 - scl[li + 1];
        val2 += lv2 - scl[li + 2];
        val3 += lv3 - scl[li + 3];
        tcl[ti] = Math.round(val0 * iarr);
        tcl[ti + 1] = Math.round(val1 * iarr);
        tcl[ti + 2] = Math.round(val2 * iarr);
        tcl[ti + 3] = Math.round(val3 * iarr);
        li += w * 4;
        ti += w * 4;
      }
    }
  }

  /**
   * Sharpen via convolution kernel
   */
  static applySharpen(src: ImageData, amount = 50): ImageData {
    const factor = (amount / 100) * 1.5;
    const kernel = [
      0, -factor, 0,
      -factor, 1 + 4 * factor, -factor,
      0, -factor, 0
    ];
    return this.applyConvolution(src, kernel);
  }

  /**
   * Emboss filter
   */
  static applyEmboss(src: ImageData, intensity = 1): ImageData {
    const kernel = [
      -2 * intensity, -1 * intensity, 0,
      -1 * intensity, 1, 1 * intensity,
      0, 1 * intensity, 2 * intensity
    ];
    return this.applyConvolution(src, kernel, 128);
  }

  /**
   * Edge Detection (Sobel-like)
   */
  static applyFindEdges(src: ImageData): ImageData {
    const kernel = [
      -1, -1, -1,
      -1,  8, -1,
      -1, -1, -1
    ];
    return this.applyConvolution(src, kernel);
  }

  /**
   * Pixelate / Mosaic
   */
  static applyPixelate(src: ImageData, blockSize = 12): ImageData {
    if (blockSize <= 1) return src;
    const dst = this.cloneImageData(src);
    const data = dst.data;
    const w = src.width;
    const h = src.height;

    for (let y = 0; y < h; y += blockSize) {
      for (let x = 0; x < w; x += blockSize) {
        let r = 0, g = 0, b = 0, count = 0;

        for (let dy = 0; dy < blockSize && y + dy < h; dy++) {
          for (let dx = 0; dx < blockSize && x + dx < w; dx++) {
            const idx = ((y + dy) * w + (x + dx)) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        for (let dy = 0; dy < blockSize && y + dy < h; dy++) {
          for (let dx = 0; dx < blockSize && x + dx < w; dx++) {
            const idx = ((y + dy) * w + (x + dx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
        }
      }
    }
    return dst;
  }

  /**
   * Add Noise (Uniform / Color)
   */
  static applyNoise(src: ImageData, amount = 25, monochromatic = false): ImageData {
    const dst = this.cloneImageData(src);
    const data = dst.data;
    const range = (amount / 100) * 128;

    for (let i = 0; i < data.length; i += 4) {
      if (monochromatic) {
        const n = (Math.random() - 0.5) * range * 2;
        data[i] = Math.max(0, Math.min(255, data[i] + n));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
      } else {
        data[i] = Math.max(0, Math.min(255, data[i] + (Math.random() - 0.5) * range * 2));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + (Math.random() - 0.5) * range * 2));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + (Math.random() - 0.5) * range * 2));
      }
    }
    return dst;
  }

  /**
   * Vignette shading around perimeter
   */
  static applyVignette(src: ImageData, amount = 60, radius = 0.8): ImageData {
    const dst = this.cloneImageData(src);
    const data = dst.data;
    const w = src.width;
    const h = src.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy) * radius;
    const factor = amount / 100;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist * 0.4) {
          const norm = (dist - maxDist * 0.4) / (maxDist * 0.6);
          const shade = Math.max(0, 1 - Math.min(1, norm * factor));
          data[idx] *= shade;
          data[idx + 1] *= shade;
          data[idx + 2] *= shade;
        }
      }
    }
    return dst;
  }

  /**
   * RGB Split Glitch effect
   */
  static applyGlitchRgbSplit(src: ImageData, offset = 10): ImageData {
    const dst = this.cloneImageData(src);
    const srcData = src.data;
    const dstData = dst.data;
    const w = src.width;
    const h = src.height;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const redX = Math.min(w - 1, Math.max(0, x + offset));
        const blueX = Math.min(w - 1, Math.max(0, x - offset));

        const rIdx = (y * w + redX) * 4;
        const bIdx = (y * w + blueX) * 4;

        dstData[idx] = srcData[rIdx]; // Red shifted
        dstData[idx + 1] = srcData[idx + 1]; // Green stays
        dstData[idx + 2] = srcData[bIdx + 2]; // Blue shifted
      }
    }
    return dst;
  }

  /**
   * AI Smart Photo Auto-Enhance
   * Enhances dynamic range, smart white balance, vibrant clarity, and midtone contrast
   */
  static applyAutoEnhance(src: ImageData): ImageData {
    // 1. Auto levels stretch
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    const data = src.data;

    for (let i = 0; i < data.length; i += 16) {
      if (data[i + 3] > 10) {
        minR = Math.min(minR, data[i]);
        maxR = Math.max(maxR, data[i]);
        minG = Math.min(minG, data[i + 1]);
        maxG = Math.max(maxG, data[i + 1]);
        minB = Math.min(minB, data[i + 2]);
        maxB = Math.max(maxB, data[i + 2]);
      }
    }

    const res = this.applyLevels(src, Math.max(0, minR - 5), 1.05, Math.min(255, maxR + 5));
    // 2. Add subtle vibrance & warm glow
    const brightContrast = this.applyBrightnessContrast(res, 5, 12);
    return this.applyHueSaturation(brightContrast, 0, 15, 2);
  }

  /**
   * Cinema Teal & Orange Hollywood Color Grade
   */
  static applyTealAndOrange(src: ImageData): ImageData {
    const dst = this.cloneImageData(src);
    const data = dst.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (lum < 128) {
        // Shadows -> Push Teal (Cyan-Blue)
        const t = (128 - lum) / 128;
        data[i] = Math.max(0, r - t * 25);
        data[i + 1] = Math.min(255, g + t * 15);
        data[i + 2] = Math.min(255, b + t * 35);
      } else {
        // Highlights -> Push Warm Orange (Red-Yellow)
        const t = (lum - 128) / 128;
        data[i] = Math.min(255, r + t * 35);
        data[i + 1] = Math.min(255, g + t * 15);
        data[i + 2] = Math.max(0, b - t * 30);
      }
    }
    return dst;
  }

  /**
   * General 3x3 Convolution Helper
   */
  private static applyConvolution(
    src: ImageData,
    weights: number[],
    offset = 0
  ): ImageData {
    const dst = this.cloneImageData(src);
    const srcData = src.data;
    const dstData = dst.data;
    const w = src.width;
    const h = src.height;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let r = 0, g = 0, b = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * w + (x + kx)) * 4;
            const weight = weights[(ky + 1) * 3 + (kx + 1)];
            r += srcData[idx] * weight;
            g += srcData[idx + 1] * weight;
            b += srcData[idx + 2] * weight;
          }
        }

        const dstIdx = (y * w + x) * 4;
        dstData[dstIdx] = Math.max(0, Math.min(255, r + offset));
        dstData[dstIdx + 1] = Math.max(0, Math.min(255, g + offset));
        dstData[dstIdx + 2] = Math.max(0, Math.min(255, b + offset));
      }
    }
    return dst;
  }

  /**
   * Color conversion utilities
   */
  static rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return [h, s, l];
  }

  static hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  /**
   * Compute RGB & Luminance Histogram for Navigator / Adjustments
   */
  static computeHistogram(imageData: ImageData): {
    r: number[];
    g: number[];
    b: number[];
    lum: number[];
  } {
    const r = new Array(256).fill(0);
    const g = new Array(256).fill(0);
    const b = new Array(256).fill(0);
    const lum = new Array(256).fill(0);

    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const l = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);

        r[red]++;
        g[green]++;
        b[blue]++;
        lum[l]++;
      }
    }
    return { r, g, b, lum };
  }
}
