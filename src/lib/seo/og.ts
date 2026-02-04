import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import config from "@/config/config.json";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const THEME_CSS_PATH = path.resolve(process.cwd(), "src/styles/theme.css");

type ThemeVars = Record<string, string>;
let cachedThemeVars: ThemeVars | null = null;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const wrapText = (text: string, maxChars: number, maxLines: number) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (test.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });

  if (line) lines.push(line);
  return lines.slice(0, maxLines);
};

const resolveLogoPath = async (logoPath?: string) => {
  if (!logoPath) return null;
  const filePath = path.resolve(process.cwd(), logoPath);
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
};

const loadThemeVars = async (): Promise<ThemeVars> => {
  if (cachedThemeVars) return cachedThemeVars;
  try {
    const css = await fs.readFile(THEME_CSS_PATH, "utf8");
    const themeMatch = css.match(/@theme\s*{([\s\S]*?)}/);
    const block = themeMatch ? themeMatch[1] : css;
    const vars: ThemeVars = {};
    const varRegex = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
    let match: RegExpExecArray | null;
    while ((match = varRegex.exec(block))) {
      vars[match[1]] = match[2].trim();
    }
    cachedThemeVars = vars;
    return vars;
  } catch {
    cachedThemeVars = {};
    return cachedThemeVars;
  }
};

const buildTextSvg = ({
  title,
  subtitle,
  withImage,
  themeVars,
}: {
  title: string;
  subtitle?: string;
  withImage: boolean;
  themeVars: ThemeVars;
}) => {
  const titleLines = wrapText(title, withImage ? 28 : 22, 3);
  const titleSize = clamp(84 - (titleLines.length - 1) * 10, 52, 84);
  const titleLineHeight = Math.round(titleSize * 1.12);
  const titleX = 80;
  const titleY = withImage ? 240 : 220;

  const serif =
    themeVars["font-serif"] || themeVars["font-display"] || "ui-serif, serif";
  const sans =
    themeVars["font-sans"] ||
    themeVars["font-primary"] ||
    "ui-sans-serif, system-ui, sans-serif";

  const subtitleText = subtitle ? wrapText(subtitle, 46, 2) : [];
  const subtitleSize = 30;
  const subtitleLineHeight = 40;
  const subtitleY = titleY + titleLines.length * titleLineHeight + 24;

  const outlineText = wrapText(title, 12, 1)[0] || title;

  return `
    <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="overlay" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="rgba(0,0,0,0.55)" />
          <stop offset="55%" stop-color="rgba(0,0,0,0.2)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.65)" />
        </linearGradient>
      </defs>
      ${withImage ? `<rect width="100%" height="100%" fill="url(#overlay)" />` : ""}
      ${
        withImage
          ? ""
          : `<text x="60" y="230" font-family="${escapeXml(
              serif
            )}" font-size="180" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" letter-spacing="8">${escapeXml(
              outlineText.toUpperCase()
            )}</text>`
      }
      ${titleLines
        .map(
          (line, idx) => `
        <text
          x="${titleX}"
          y="${titleY + idx * titleLineHeight}"
          font-family="${escapeXml(serif)}"
          font-size="${titleSize}"
          font-weight="700"
          fill="${withImage ? "#FFFFFF" : "#F8F8F8"}"
        >${escapeXml(line)}</text>
      `
        )
        .join("")}
      ${subtitleText
        .map(
          (line, idx) => `
        <text
          x="${titleX}"
          y="${subtitleY + idx * subtitleLineHeight}"
          font-family="${escapeXml(sans)}"
          font-size="${subtitleSize}"
          font-weight="500"
          fill="${withImage ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.75)"}"
        >${escapeXml(line)}</text>
      `
        )
        .join("")}
      <text x="${titleX}" y="${OG_HEIGHT - 72}" font-family="${escapeXml(
        sans
      )}" font-size="22" letter-spacing="0.2em" fill="${
    withImage ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.55)"
  }">${escapeXml(config.site.title.toUpperCase())}</text>
    </svg>
  `;
};

const buildSolidBackground = (themeVars: ThemeVars) => {
  const primary = themeVars["color-primary"] || "#1B8A62";
  const accent = themeVars["color-accent"] || "#D65A00";
  return sharp({
    create: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      channels: 3,
      background: primary,
    },
  })
    .png()
    .composite([
      {
        input: Buffer.from(
          `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="${primary}" />
                <stop offset="100%" stop-color="${accent}" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg)" opacity="0.35" />
          </svg>`
        ),
        top: 0,
        left: 0,
      },
    ]);
};

export const renderOgImage = async ({
  title,
  subtitle,
  backgroundImagePath,
  logoPath,
}: {
  title: string;
  subtitle?: string;
  backgroundImagePath?: string;
  logoPath?: string;
}) => {
  const themeVars = await loadThemeVars();
  let baseImage: sharp.Sharp;
  let hasBackgroundImage = false;

  if (backgroundImagePath) {
    try {
      await fs.access(backgroundImagePath);
      baseImage = sharp(backgroundImagePath)
        .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "center" })
        .modulate({ brightness: 0.9 });
      hasBackgroundImage = true;
    } catch {
      baseImage = buildSolidBackground(themeVars);
    }
  } else {
    baseImage = buildSolidBackground(themeVars);
  }

  const textSvg = buildTextSvg({
    title,
    subtitle,
    withImage: hasBackgroundImage,
    themeVars,
  });

  const layers: sharp.OverlayOptions[] = [
    { input: Buffer.from(textSvg), top: 0, left: 0 },
  ];

  const resolvedLogoPath = await resolveLogoPath(
    logoPath || `public${config.site.logo_public}`
  );
  if (resolvedLogoPath) {
    const logoBuffer = await sharp(resolvedLogoPath)
      .resize(120, 120, { fit: "contain" })
      .png()
      .toBuffer();
    layers.push({
      input: logoBuffer,
      top: OG_HEIGHT - 120 - 48,
      left: OG_WIDTH - 120 - 48,
    });
  }

  return baseImage.composite(layers).png().toBuffer();
};
