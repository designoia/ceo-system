const sharp = require('sharp');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'icons', 'icon.svg');
const outDir = path.join(__dirname, '..', 'public', 'icons');

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 512, name: 'maskable-512.png', maskable: true },
  { size: 180, name: 'apple-touch-icon.png' },
];

async function run() {
  for (const { size, name, maskable } of sizes) {
    const image = sharp(svgPath).resize(size, size);
    if (maskable) {
      // Maskable icons need ~safe zone padding (icon content within the
      // inner 80% circle) — pad with the same dark background so nothing
      // critical gets cropped by OS icon masks.
      const padded = Math.round(size * 0.1);
      await sharp(svgPath)
        .resize(size - padded * 2, size - padded * 2)
        .extend({
          top: padded, bottom: padded, left: padded, right: padded,
          background: { r: 11, g: 15, b: 25, alpha: 1 },
        })
        .png()
        .toFile(path.join(outDir, name));
    } else {
      await image.png().toFile(path.join(outDir, name));
    }
    console.log('generated', name);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
