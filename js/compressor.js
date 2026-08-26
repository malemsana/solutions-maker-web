// In-Browser HTML5 Canvas WebP Compressor & Cropper Engine
class ImageCompressor {
  static generate16BitHex() {
    return Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  }

  static async cropCanvasToWebP(sourceCanvas, cropCoords, quality = 0.85) {
    const { x, y, w, h } = cropCoords;
    if (w < 5 || h < 5) return null;

    const workCanvas = document.createElement('canvas');
    workCanvas.width = w;
    workCanvas.height = h;

    const ctx = workCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, x, y, w, h, 0, 0, w, h);

    return new Promise((resolve) => {
      workCanvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve({
          blob: blob,
          dataUrl: URL.createObjectURL(blob),
          width: w,
          height: h,
          ext: 'webp'
        });
      }, 'image/webp', quality);
    });
  }

  static async compressFileToWebP(file, maxDimension = 1600, quality = 0.85) {
    if (!file) return null;

    // Direct SVG pass-through without compression
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    if (isSvg) {
      return {
        blob: file,
        dataUrl: URL.createObjectURL(file),
        ext: 'svg',
        isSvg: true
      };
    }

    // Raster image compression via Canvas
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const workCanvas = document.createElement('canvas');
        workCanvas.width = width;
        workCanvas.height = height;

        const ctx = workCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        workCanvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve({
            blob: blob,
            dataUrl: URL.createObjectURL(blob),
            width: width,
            height: height,
            ext: 'webp',
            isSvg: false
          });
        }, 'image/webp', quality);
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image file for compression.'));
      };

      img.src = objectUrl;
    });
  }

  static blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

window.Compressor = ImageCompressor;