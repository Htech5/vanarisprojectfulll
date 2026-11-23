const sharp = require('sharp');
const path = require('path');

const SRC = String.raw`C:\Users\User\.claude\image-cache\f10b0381-9ebd-4897-81ee-6f414599ff89\5.png`;
const OUT = path.join(__dirname, '..', 'assets');
const BG = '#0a0a0c';

// The source logo sits on a near-white background — key it out to transparency
// so the emblem composites cleanly onto any background color.
async function logoWithTransparentBg() {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 235 && g > 235 && b > 235) {
      data[i + 3] = 0;
    }
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

async function squareOnBg(size, pad, bg = BG) {
  const inner = size - pad * 2;
  const keyed = await logoWithTransparentBg();
  const logo = await sharp(keyed).resize(inner, inner, { fit: 'inside' }).toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function transparentSquare(size, pad) {
  const inner = size - pad * 2;
  const keyed = await logoWithTransparentBg();
  const logo = await sharp(keyed).resize(inner, inner, { fit: 'inside' }).toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function main() {
  const icon = await squareOnBg(1024, 110);
  await sharp(icon).toFile(path.join(OUT, 'icon.png'));

  const androidBg = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: BG },
  })
    .png()
    .toBuffer();
  await sharp(androidBg).toFile(path.join(OUT, 'android-icon-background.png'));

  const androidFg = await transparentSquare(1024, 300);
  await sharp(androidFg).toFile(path.join(OUT, 'android-icon-foreground.png'));

  const keyedForMono = await logoWithTransparentBg();
  const mono = await sharp(keyedForMono)
    .resize(1024 - 600, 1024 - 600, { fit: 'inside' })
    .greyscale()
    .toBuffer();
  const monoCanvas = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: mono, gravity: 'center' }])
    .png()
    .toBuffer();
  await sharp(monoCanvas).toFile(path.join(OUT, 'android-icon-monochrome.png'));

  const favicon = await squareOnBg(196, 24);
  await sharp(favicon).toFile(path.join(OUT, 'favicon.png'));

  const splashIcon = await transparentSquare(512, 80);
  await sharp(splashIcon).toFile(path.join(OUT, 'splash-icon.png'));

  console.log('icons written');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
