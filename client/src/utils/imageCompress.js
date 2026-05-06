// Compress an image File to a base64 data URL.
// Downscales to maxDim and re-encodes as JPEG to keep payloads small.
export async function compressImage(file, { maxDim = 1600, quality = 0.82 } = {}) {
  if (!file) return null;
  // If it's already small AND not huge dimensions, fast-path
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  let { width: w, height: h } = img;
  if (w > maxDim || h > maxDim) {
    const scale = maxDim / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  // Always JPEG for small size; PNG fallback only if alpha matters (rare for photos)
  let out = canvas.toDataURL('image/jpeg', quality);
  // If still too large (>800KB base64), try lower quality
  if (out.length > 800 * 1024 * 1.37) {
    out = canvas.toDataURL('image/jpeg', 0.65);
  }
  return out;
}

export async function compressMany(files, opts) {
  return Promise.all(Array.from(files).map(f => compressImage(f, opts)));
}
