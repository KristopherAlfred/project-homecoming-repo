/**
 * Punch near-black backgrounds to alpha so uploaded / AI logos stay transparent.
 * Returns a PNG data URL.
 */
export async function makeLogoBackgroundTransparent(
  file: File,
  threshold = 28,
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process logo");
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < threshold && g < threshold && b < threshold) {
      data[i + 3] = 0;
    } else if (r < threshold + 20 && g < threshold + 20 && b < threshold + 20) {
      const lum = (r + g + b) / 3;
      data[i + 3] = Math.max(0, Math.min(255, Math.round(((lum - threshold) / 20) * 255)));
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}
