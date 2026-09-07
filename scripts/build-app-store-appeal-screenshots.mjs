import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const outputDirectory = path.join(rootDir, "docs/app-store/final-v4");

const width = 1284;
const height = 2778;
const captureWidth = 930;
const captureHeight = Math.round((2868 / 1320) * captureWidth);
const frameWidth = captureWidth + 24;
const frameHeight = captureHeight + 24;
const phoneTop = 650;
const cornerRadius = 70;

const frames = [
  {
    file: "01-no-trade-is-a-verdict.png",
    capture: "no-trade-current-en.png",
    line1: "NO TRADE IS",
    line2: "A REAL VERDICT.",
    subtitle: "When the agents cannot agree, the risk gate protects your capital.",
  },
  {
    file: "02-live-market-context.png",
    capture: "chart-current-en.png",
    line1: "LIVE MARKET CONTEXT.",
    line2: "NOT GENERIC CHAT.",
    subtitle: "Price, timeframe, levels and invalidation stay visible in one view.",
  },
  {
    file: "03-voice-or-text.png",
    capture: "desk-current-en.png",
    line1: "ASK ANY MARKET.",
    line2: "VOICE OR TEXT.",
    subtitle: "Open the live desk, name an asset and start the three-agent review.",
  },
];

const escapeXml = (value) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const backgroundSvg = Buffer.from(`
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#07100B"/>
        <stop offset="0.42" stop-color="#040706"/>
        <stop offset="1" stop-color="#020303"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="20%" r="62%">
        <stop offset="0" stop-color="#43F57A" stop-opacity="0.16"/>
        <stop offset="0.58" stop-color="#2B75FF" stop-opacity="0.04"/>
        <stop offset="1" stop-color="#020303" stop-opacity="0"/>
      </radialGradient>
      <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
        <path d="M64 0H0V64" fill="none" stroke="#8DFFAE" stroke-opacity="0.035" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#base)"/>
    <rect width="${width}" height="${height}" fill="url(#glow)"/>
    <rect width="${width}" height="${height}" fill="url(#grid)"/>
  </svg>
`);

const mask = Buffer.from(`
  <svg width="${captureWidth}" height="${captureHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${captureWidth}" height="${captureHeight}" rx="${cornerRadius}" fill="#fff"/>
  </svg>
`);

const frameSvg = Buffer.from(`
  <svg width="${frameWidth}" height="${frameHeight}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-40%" y="-25%" width="180%" height="170%">
        <feDropShadow dx="0" dy="32" stdDeviation="38" flood-color="#000" flood-opacity="0.88"/>
      </filter>
      <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#C7FFD7" stop-opacity="0.82"/>
        <stop offset="0.24" stop-color="#26322A"/>
        <stop offset="0.75" stop-color="#080B09"/>
        <stop offset="1" stop-color="#57F58A" stop-opacity="0.78"/>
      </linearGradient>
    </defs>
    <rect x="12" y="12" width="${captureWidth}" height="${captureHeight}" rx="${cornerRadius + 2}"
      fill="#050505" stroke="url(#edge)" stroke-width="12" filter="url(#shadow)"/>
  </svg>
`);

const makeHeadline = (frame) => Buffer.from(`
  <svg width="${width}" height="620" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="copyShadow" x="-20%" y="-30%" width="140%" height="180%">
        <feDropShadow dx="0" dy="9" stdDeviation="15" flood-color="#000" flood-opacity="0.78"/>
      </filter>
    </defs>
    <g filter="url(#copyShadow)" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
      <text x="642" y="105" fill="#A8F5BE" font-size="23" font-weight="700" letter-spacing="6">BOBBY // THREE-AGENT MARKET DESK</text>
      <text x="642" y="252" fill="#FFFFFF" font-size="78" font-weight="900" letter-spacing="-3">${escapeXml(frame.line1)}</text>
      <text x="642" y="360" fill="#75FF9E" font-size="82" font-weight="900" letter-spacing="-3">${escapeXml(frame.line2)}</text>
      <text x="642" y="438" fill="#FFFFFF" fill-opacity="0.78" font-size="25" font-weight="600">${escapeXml(frame.subtitle)}</text>
    </g>
  </svg>
`);

await mkdir(outputDirectory, { recursive: true });

for (const frame of frames) {
  const capturePath = path.join(rootDir, "docs/app-store/ui-captures", frame.capture);
  const capture = await sharp(capturePath)
    .resize(captureWidth, captureHeight, { fit: "fill" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  await sharp({
    create: { width, height, channels: 3, background: "#020303" },
  })
    .composite([
      { input: backgroundSvg, top: 0, left: 0 },
      { input: makeHeadline(frame), top: 0, left: 0 },
      { input: frameSvg, top: phoneTop, left: Math.round((width - frameWidth) / 2) },
      { input: capture, top: phoneTop + 12, left: Math.round((width - captureWidth) / 2) },
    ])
    .flatten({ background: "#020303" })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDirectory, frame.file));
}

const previewWidth = 330;
const previewHeight = Math.round((height / width) * previewWidth);
const gutter = 18;
const previews = await Promise.all(
  frames.map((frame) =>
    sharp(path.join(outputDirectory, frame.file))
      .resize(previewWidth, previewHeight)
      .jpeg({ quality: 90 })
      .toBuffer(),
  ),
);

await sharp({
  create: {
    width: previewWidth * frames.length + gutter * (frames.length + 1),
    height: previewHeight + gutter * 2,
    channels: 3,
    background: "#080A09",
  },
})
  .composite(previews.map((input, index) => ({
    input,
    left: gutter + index * (previewWidth + gutter),
    top: gutter,
  })))
  .jpeg({ quality: 92 })
  .toFile(path.join(outputDirectory, "contact-sheet.jpg"));

console.log(`Built ${frames.length} App Store screenshots in ${outputDirectory}`);
