#!/usr/bin/env node
/**
 * AI Fast Track rebrand: replaces the upstream Presenton purple accent family
 * used in Tailwind arbitrary-value classes (e.g. `bg-[#7A5AF8]`) of the web UI
 * with the AI Fast Track palette, keeping text contrast accessible:
 *
 *   - solid fills (bg/from/via/to/shadow)  -> #FFDB05 (yellow) / #E6C500 (hover)
 *   - light tints                          -> #FFFADC (tint)   / #FFED82 (soft)
 *   - text, borders, rings, outlines       -> #0A0A0A (ink)
 *   - `text-white` paired with a new yellow fill on the same line and variant
 *     becomes `text-[#0A0A0A]` (white on yellow fails WCAG contrast)
 *   - rgba() purple shadows                -> rgba(255,219,5,<alpha>)
 *
 * The script is idempotent; re-run it after merging upstream/translation
 * branches:  node scripts/aifasttrack-rebrand-colors.mjs [servers/nextjs]
 *
 * Hex colours outside Tailwind brackets (inline styles, JS constants) are only
 * rewritten through the explicit LITERALS table below; anything else is
 * reported. Intentionally kept as-is: slide-content defaults (chart palettes,
 * new shape colours), the onboarding confetti, and the Konva/canvas selection
 * handles, alignment guides and inline-editor outlines, which must stay
 * visible on top of both light and dark slides.
 */
import fs from "node:fs";
import path from "node:path";

const nextRoot = path.resolve(process.argv[2] ?? "servers/nextjs");
const SCAN_DIRS = ["app", "components"];
// Slide-content defaults (user deck colours), not UI chrome.
const EXCLUDE = new Set([
  path.join("components", "slide-editor", "charts", "ChartColorPalette.tsx"),
  path.join("components", "slide-editor", "insert", "insert-elements.ts"),
  path.join("components", "slide-editor", "model", "chart-model.ts"),
]);

const YELLOW = "#FFDB05";
const YELLOW_HOVER = "#E6C500";
const TINT = "#FFFADC";
const SOFT = "#FFED82";
const INK = "#0A0A0A";

function toHsl(hex) {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

function isPurple(hex) {
  const [h, s, l] = toHsl(hex);
  return h >= 235 && h <= 285 && s > 0.4 && l < 0.985;
}

const FILL = new Set(["bg", "from", "via", "to", "shadow"]);
const LINE = new Set([
  "border", "border-x", "border-y", "border-t", "border-b", "border-l", "border-r",
  "border-s", "border-e", "ring", "ring-offset", "outline", "divide", "decoration",
  "stroke", "caret",
]);

function mapHex(hex, utility) {
  const [, , l] = toHsl(hex);
  const kind = FILL.has(utility) ? "fill" : LINE.has(utility) ? "line" : "text";
  if (l >= 0.93) return kind === "fill" ? TINT : kind === "line" ? SOFT : INK;
  if (l >= 0.78) return kind === "text" ? INK : SOFT;
  if (kind === "fill") return l >= 0.57 ? YELLOW : YELLOW_HOVER;
  return INK;
}

// Upstream signature pastel gradient used on primary CTAs -> brand yellow.
const PASTEL_GRADIENT_RE =
  /#(?:D5CAFC|FFED82)([ _])2\.4%,(\s?)#E3D2EB[ _]27\.88%,\s?#F4DCD3[ _]69\.23%,\s?#FDE4C2[ _]100%/gi;

// Inline-style / JS colour literals in UI chrome (file-scoped, exact strings).
const LITERALS = [
  ["app/(presentation-generator)/(dashboard)/settings/ImageProvider.tsx", "'#F4F3FF'", "'#FFFADC'"],
  ["components/OnBoarding/PresentonMode.tsx", "'#F4F3FF'", "'#FFFADC'"],
  ["app/(presentation-generator)/components/TemplateListUi.tsx", '"#5146E5"', `"${INK}"`],
  ["app/(presentation-generator)/custom-template/CustomTemplatePage.tsx", 'const pillGradient = "#7A5AF8";', `const pillGradient = "${YELLOW}";`],
  ["app/(presentation-generator)/presentation/components/chat/chat-widgets.tsx", 'fill="#7A5AF8"', `fill="${INK}"`],
  ["app/(presentation-generator)/presentation/components/chat/chat-prompts.tsx", 'stroke="#7F22FE"', `stroke="${INK}"`],
  ["app/(presentation-generator)/presentation/components/Chat.tsx", 'fill="#7A5AF8"', `fill="${INK}"`],
  ["app/(presentation-generator)/presentation/components/Chat.tsx", 'stroke={isFollowAgentEnabled ? "#7A5AF8" : "#191919"}', `stroke={isFollowAgentEnabled ? "${INK}" : "#9A9A9A"}`],
  ["app/(presentation-generator)/presentation/components/Chat.tsx", 'stroke={isFollowAgentEnabled ? "#7A5AF8" : "#000000"}', `stroke={isFollowAgentEnabled ? "${INK}" : "#9A9A9A"}`],
  ["app/(presentation-generator)/upload/components/GenerateUserGuide.tsx", '"2px solid #7A5AF8"', `"2px solid ${INK}"`],
  ["app/(presentation-generator)/presentation/components/SlideContent.tsx", "#F2E1FB_0%", "#FFF3A8_0%"],
  ["app/globals.css", "background: #f2e1fb;", "background: #fff3a8;"],
  ["app/globals.css", "rgb(122 90 248 /", "rgb(10 10 10 /"],
  ["app/globals.css", "#7a5af8 90%", "#0a0a0a 90%"],
  ["components/ui/overlay-loader.tsx", 'stopColor="#D9D6FE"', `stopColor="${SOFT}"`],
  ["components/ui/overlay-loader.tsx", "#7a5af8 92%", "#0a0a0a 92%"],
  ["components/slide-editor/text/TextToolbar.tsx", 'color: "#7C51F8"', `color: "${INK}"`],
  ["components/slide-editor/text/TextToolbar.tsx", 'background: "#7C51F8"', `background: "${INK}"`],
  ["components/slide-editor/text/TextToolbar.tsx", 'background: "#F4F1FF"', `background: "${TINT}"`],
  ["components/slide-editor/text/TextToolbar.tsx", 'background: "#EFEAFF"', `background: "${TINT}"`],
  ["components/slide-editor/text/TextToolbar.tsx", 'border: "1px solid #CBB6FF"', `border: "1px solid ${SOFT}"`],
  ["components/slide-editor/tables/TableToolbar.tsx", 'background: "#F6F3FF"', `background: "${TINT}"`],
  ["components/slide-editor/toolbar/inlineStyles.ts", 'primary: "#7C51F8"', `primary: "${INK}"`],
  ["components/slide-editor/toolbar/inlineStyles.ts", 'primarySoft: "#F4F3FF"', `primarySoft: "${TINT}"`],
];

function applyLiterals() {
  let n = 0;
  for (const [rel, from, to] of LITERALS) {
    const file = path.join(nextRoot, rel);
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, "utf8");
    const next = src.split(from).join(to);
    if (next !== src) {
      fs.writeFileSync(file, next);
      n += 1;
    }
  }
  return n;
}

const TOKEN_RE = /((?:[^\s"'`:{}()]+:)*)(!?)([a-z][a-z-]*?)-\[([^\]\s"'`]+)\]/g;
const RGBA_RE = /rgba\(\s*(122\s*,\s*90\s*,\s*248|124\s*,\s*81\s*,\s*248|105\s*,\s*65\s*,\s*198)\s*,/g;

let changedFiles = 0;
const review = [];
const leftovers = [];

function processLine(line) {
  const yellowVariants = new Set();
  let out = line.replace(
    PASTEL_GRADIENT_RE,
    (m, sep, ws) => `${YELLOW}${sep}0%,${ws}#FFE45C${sep}100%`,
  );
  out = out.replace(TOKEN_RE, (full, variants, bang, utility, value) => {
    if (!/#[0-9a-fA-F]{6}\b/.test(value)) return full;
    let newValue = value.replace(/#([0-9a-fA-F]{6})\b/g, (m, hex) => {
      if (!isPurple(hex)) return m;
      const mapped = mapHex(hex, utility);
      if (utility === "bg" && (mapped === YELLOW || mapped === YELLOW_HOVER)) {
        yellowVariants.add(variants);
      }
      return mapped;
    });
    return `${variants}${bang}${utility}-[${newValue}]`;
  });
  out = out.replace(RGBA_RE, "rgba(255,219,5,");
  // Keep a visible hover state: yellow -> darker yellow on hover.
  out = out.replace(/hover:bg-\[#FFDB05\](?!\/)/g, `hover:bg-[${YELLOW_HOVER}]`);
  if (yellowVariants.size) {
    let paired = false;
    for (const variants of yellowVariants) {
      const esc = variants.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(^|[\\s"'\`])${esc}text-white(?:\\/\\d+)?(?=$|[\\s"'\`])`, "g");
      out = out.replace(re, (m, pre) => {
        paired = true;
        return `${pre}${variants}text-[${INK}]`;
      });
    }
    if (!paired && !/text-\[#0A0A0A\]/.test(out)) review.push(out.trim().slice(0, 160));
  }
  return out;
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".next-build"].includes(entry.name)) continue;
      walk(full);
      continue;
    }
    if (!/\.(tsx?|css)$/.test(entry.name)) continue;
    const rel = path.relative(nextRoot, full);
    if (EXCLUDE.has(rel)) continue;
    const src = fs.readFileSync(full, "utf8");
    const next = src.split("\n").map(processLine).join("\n");
    if (next !== src) {
      fs.writeFileSync(full, next);
      changedFiles += 1;
    }
    next.split("\n").forEach((line, i) => {
      for (const m of line.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
        if (isPurple(m[1])) leftovers.push(`${rel}:${i + 1}: #${m[1]}`);
      }
    });
  }
}

const literalFiles = applyLiterals();
for (const d of SCAN_DIRS) walk(path.join(nextRoot, d));
console.log(`Rewrote ${changedFiles} files (+${literalFiles} literal passes).`);
if (review.length) {
  console.log(`\nLines with a new yellow fill but no paired text colour (review):`);
  for (const r of review) console.log(`  ${r}`);
}
if (leftovers.length) {
  console.log(`\nPurple hex values left outside Tailwind brackets (manual review):`);
  for (const l of leftovers) console.log(`  ${l}`);
}
