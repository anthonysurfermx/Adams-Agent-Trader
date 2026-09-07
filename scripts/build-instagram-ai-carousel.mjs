import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const width = 1080;
const height = 1350;
const sourceDir = path.join(rootDir, "docs/instagram/3-tipos-era-ai/backgrounds");
const outputDir = path.join(rootDir, "docs/instagram/3-tipos-era-ai/final");
await mkdir(outputDir, { recursive: true });

const green = "#75FF9E";
const softGreen = "#B8FFCE";
const white = "#FFFFFF";
const muted = "#D8DDD9";
const orange = "#D76018";

const escapeXml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const textBlock = ({ lines, x, y, size, lineHeight, color = white, weight = 700,
  anchor = "start", letterSpacing = 0, family = "Helvetica Neue, Helvetica, Arial, sans-serif",
  italic = false }) => `
  <text x="${x}" y="${y}" fill="${color}" font-family="${family}" font-size="${size}"
    font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${letterSpacing}"
    ${italic ? 'font-style="italic"' : ""}>
    ${lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join("")}
  </text>`;

const header = (index) => `
  <circle cx="72" cy="53" r="5" fill="${green}"/>
  <text x="91" y="59" fill="${softGreen}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-size="17" font-weight="700" letter-spacing="4">ERA DE LA IA // 3 TIPOS DE PERSONAS</text>
  <text x="1008" y="59" fill="${softGreen}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-size="17" font-weight="700" text-anchor="end" letter-spacing="2">${String(index).padStart(2, "0")} / 08</text>`;

const footer = () => `
  <rect x="72" y="1291" width="52" height="5" rx="2.5" fill="${green}"/>
  <text x="1008" y="1298" fill="#A8B0AA" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-size="14" font-weight="600" text-anchor="end" letter-spacing="2">MENTALIDAD MULTIDIMENSIONAL</text>`;

const gradients = `
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#020403" stop-opacity="0.97"/>
      <stop offset="0.31" stop-color="#020403" stop-opacity="0.53"/>
      <stop offset="0.57" stop-color="#020403" stop-opacity="0.02"/>
      <stop offset="0.76" stop-color="#020403" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#020403" stop-opacity="0.97"/>
    </linearGradient>
    <radialGradient id="glow" cx="82%" cy="15%" r="62%">
      <stop offset="0" stop-color="#59FF9A" stop-opacity="0.11"/>
      <stop offset="1" stop-color="#59FF9A" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.82"/>
    </filter>
  </defs>
  <rect width="1080" height="1350" fill="url(#shade)"/>
  <rect width="1080" height="1350" fill="url(#glow)"/>`;

const slides = [
  {
    file: "01-hook.png",
    headline: ["HAY 3 TIPOS DE PERSONAS", "EN LA ERA DE LA AI"],
    highlightFrom: 1,
    headlineSize: 60,
    headlineY: 145,
    headlineLineHeight: 72,
    body: ["Y la distancia entre ellas", "crece cada día."],
    bodyY: 1020,
    bodySize: 42,
    bodyLineHeight: 53,
    bodyWeight: 800,
    swipe: true,
  },
  {
    file: "02-los-puristas.png",
    eyebrow: "TIPO 01",
    headline: ["LOS PURISTAS"],
    highlightFrom: 0,
    headlineSize: 74,
    headlineY: 180,
    quote: ["“Nosotros nos mantuvimos limpios.”"],
    quoteY: 275,
    body: [
      "Rechazaron la IA y convirtieron",
      "el rechazo en identidad.",
      "",
      "Si la herramienta que resuelve tus problemas",
      "es “el enemigo”, solo queda jugar a la víctima.",
    ],
    bodyY: 950,
    bodySize: 29,
    bodyLineHeight: 39,
  },
  {
    file: "03-los-automatas.png",
    eyebrow: "TIPO 02  //  EL EXTREMO OPUESTO",
    headline: ["LOS AUTÓMATAS"],
    highlightFrom: 0,
    headlineSize: 72,
    headlineY: 180,
    body: [
      "Delegan cada decisión. Alérgicos a la fricción;",
      "adictos a optimizar.",
      "",
      "Ya no saben dónde termina la IA",
      "y dónde empieza su vida.",
      "Tanto output que su humanidad ya no aparece.",
    ],
    bodyY: 905,
    bodySize: 29,
    bodyLineHeight: 38,
  },
  {
    file: "04-la-trampa.png",
    eyebrow: "LA TRAMPA",
    headline: ["TE HICIERON CREER", "QUE HAY QUE ELEGIR BANDO"],
    highlightFrom: 1,
    headlineSize: 56,
    headlineY: 178,
    headlineLineHeight: 69,
    body: [
      "Tecnología o humanidad. Pantalla o naturaleza.",
      "Todo o nada.",
      "",
      "Es una trampa vieja: “elige un carril”.",
      "Antes de las fábricas, ser multidimensional era",
      "lo normal: el artesano entendía la obra completa.",
    ],
    bodyY: 895,
    bodySize: 27,
    bodyLineHeight: 37,
  },
  {
    file: "05-el-multidimensional.png",
    eyebrow: "TIPO 03",
    headline: ["EL MULTIDIMENSIONAL"],
    highlightFrom: 0,
    headlineSize: 61,
    headlineY: 180,
    body: [
      "En el Renacimiento importaba de qué eras capaz,",
      "no tu “nicho”.",
      "",
      "Da Vinci aprendió pintura, anatomía,",
      "ingeniería y óptica.",
      "",
      "PROOF OF WORK > CV   ·   CRITERIO > CREDENCIALES",
    ],
    bodyY: 865,
    bodySize: 27,
    bodyLineHeight: 36,
  },
  {
    file: "06-una-persona-equipo.png",
    eyebrow: "POR QUÉ AHORA",
    headline: ["LO QUE ANTES HACÍA", "UN EQUIPO DE 10,", "HOY LO PUEDE HACER", "UNA PERSONA"],
    highlightFrom: 2,
    headlineSize: 49,
    headlineY: 168,
    headlineLineHeight: 58,
    body: [
      "Con IA operas investigación, código,",
      "diseño y distribución.",
      "",
      "Ella toma lo mecánico. Tú elevas el trabajo:",
      "dirección, criterio y gusto.",
      "LA IA NO TIENE PERSPECTIVA. TÚ SÍ.",
    ],
    bodyY: 900,
    bodySize: 28,
    bodyLineHeight: 38,
  },
  {
    file: "07-el-stack.png",
    eyebrow: "CÓMO SE JUEGA",
    headline: ["ELIGE UN CRAFT.", "USA LA IA PARA OPERARLO TODO."],
    highlightFrom: 1,
    headlineSize: 50,
    headlineY: 174,
    headlineLineHeight: 60,
    custom: "stack",
  },
  {
    file: "08-cierre-cta.png",
    eyebrow: "AHORA TE TOCA",
    headline: ["GUÁRDALO PARA CUANDO", "VUELVA ESA VOZ:"],
    highlightFrom: 1,
    headlineSize: 53,
    headlineY: 180,
    headlineLineHeight: 64,
    quote: ["“ESTO NO ES PARA MÍ.”"],
    quoteY: 320,
    body: [
      "SÍGUEME",
      "si quieres desarrollar la mentalidad",
      "para vivir en la era de la IA.",
    ],
    bodyY: 950,
    bodySize: 34,
    bodyLineHeight: 45,
    bodyWeight: 800,
  },
];

const headlineMarkup = (slide) => slide.headline.map((line, index) => textBlock({
  lines: [line],
  x: 540,
  y: slide.headlineY + index * (slide.headlineLineHeight ?? 72),
  size: slide.headlineSize,
  lineHeight: slide.headlineLineHeight ?? 72,
  color: index >= slide.highlightFrom ? green : white,
  weight: 900,
  anchor: "middle",
  letterSpacing: -1.8,
})).join("");

const stackMarkup = `
  <g filter="url(#shadow)" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
    <rect x="500" y="615" width="500" height="76" rx="8" fill="#05110C" fill-opacity="0.88" stroke="#75FF9E" stroke-opacity="0.35"/>
    <text x="525" y="646" fill="${green}" font-size="17" font-weight="800" letter-spacing="2">CAPA 3 // HERRAMIENTAS</text>
    <text x="525" y="674" fill="${white}" font-size="20" font-weight="700">La IA resuelve lo mecánico.</text>

    <rect x="485" y="741" width="515" height="90" rx="8" fill="#B9480E" fill-opacity="0.96" stroke="#FF9A55" stroke-opacity="0.65"/>
    <text x="512" y="777" fill="#FFFFFF" font-size="19" font-weight="900" letter-spacing="2">CAPA 2 // TUS OBSESIONES</text>
    <text x="512" y="809" fill="#FFFFFF" font-size="23" font-weight="800">Aquí vive tu ventaja.</text>

    <rect x="495" y="876" width="505" height="91" rx="8" fill="#040706" fill-opacity="0.92" stroke="#FFFFFF" stroke-opacity="0.2"/>
    <text x="522" y="911" fill="${softGreen}" font-size="17" font-weight="800" letter-spacing="2">CAPA 1 // NATURALEZA HUMANA</text>
    <text x="522" y="944" fill="${white}" font-size="20" font-weight="700">Escribir. Vender. Entender atención.</text>

    <rect x="72" y="1005" width="936" height="108" rx="18" fill="#050706" fill-opacity="0.84" stroke="#FFFFFF" stroke-opacity="0.13"/>
    <text x="101" y="1068" fill="${white}" font-size="27" font-weight="800">Esto lo puedes empezar el sábado. Deja de pensarlo.</text>
  </g>`;

const swipeMarkup = `
  <g filter="url(#shadow)" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
    <rect x="657" y="1157" width="351" height="64" rx="32" fill="#07110C" fill-opacity="0.86"
      stroke="${green}" stroke-opacity="0.55"/>
    <text x="832" y="1197" fill="${green}" font-size="19" font-weight="900"
      text-anchor="middle" letter-spacing="2">DESLIZA PARA VER LOS 3 TIPOS →</text>
  </g>`;

for (const [index, slide] of slides.entries()) {
  const eyebrow = slide.eyebrow ? textBlock({
    lines: [slide.eyebrow], x: 540, y: 103, size: 17, lineHeight: 20,
    color: softGreen, weight: 800, anchor: "middle", letterSpacing: 4,
  }) : "";
  const quote = slide.quote ? textBlock({
    lines: slide.quote, x: 540, y: slide.quoteY, size: index === 7 ? 43 : 29,
    lineHeight: 48, color: index === 7 ? green : muted, weight: 800,
    anchor: "middle", italic: index !== 7,
  }) : "";
  const body = slide.body ? textBlock({
    lines: slide.body, x: 72, y: slide.bodyY, size: slide.bodySize,
    lineHeight: slide.bodyLineHeight, color: white, weight: slide.bodyWeight ?? 650,
  }) : "";
  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${gradients}
      <g filter="url(#shadow)">
        ${header(index + 1)}
        ${eyebrow}
        ${headlineMarkup(slide)}
        ${quote}
        ${body}
        ${slide.custom === "stack" ? stackMarkup : ""}
        ${slide.swipe ? swipeMarkup : ""}
        ${footer()}
      </g>
    </svg>
  `);

  await sharp(path.join(sourceDir, slide.file))
    .resize(width, height, { fit: "cover", position: "centre" })
    .composite([{ input: svg }])
    .flatten({ background: "#020403" })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, slide.file));
}

const previewWidth = 270;
const previewHeight = 338;
const gutter = 16;
const previews = await Promise.all(slides.map((slide) => sharp(path.join(outputDir, slide.file))
  .resize(previewWidth, previewHeight, { fit: "fill" })
  .jpeg({ quality: 88 })
  .toBuffer()));

await sharp({
  create: {
    width: previewWidth * 4 + gutter * 5,
    height: previewHeight * 2 + gutter * 3,
    channels: 3,
    background: "#080A09",
  },
})
  .composite(previews.map((input, index) => ({
    input,
    left: gutter + (index % 4) * (previewWidth + gutter),
    top: gutter + Math.floor(index / 4) * (previewHeight + gutter),
  })))
  .jpeg({ quality: 92 })
  .toFile(path.join(outputDir, "contact-sheet.jpg"));

console.log(outputDir);
