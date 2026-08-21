// In-Browser HTML5 Canvas WebP Compressor & Cropper Engine
class ImageCompressor {
  static async cropCanvasToWebP(sourceCanvas, cropCoords, quality = 0.80) {
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
          height: h
        });
      }, 'image/webp', quality);
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