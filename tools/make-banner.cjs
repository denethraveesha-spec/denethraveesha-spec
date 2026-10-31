const fs = require("fs");
const path = require("path");
const fontkit = require("fontkit");
const { decompress } = require("wawoff2");

const out = process.argv.find(a => a.endsWith(".svg")) || path.join(__dirname, "..", "assets", "banner.svg");
const withPhoto = !process.argv.includes("--no-photo");

const W = 1200;
const H = 400;
const M = 56;
const C = {
  bg: "#0a0a0b",
  edge: "#1f1f23",
  text: "#f3f1ed",
  muted: "#a5a3a0",
  red: "#d0141f",
  hot: "#ff2b38",
};
const ease = "cubic-bezier(.2,.7,.2,1)";

const file = (pkg, name) => path.join(path.dirname(require.resolve(`${pkg}/package.json`)), "files", name);
const round = d => d.replace(/-?\d*\.\d+/g, n => String(Math.round(n * 10) / 10));
const sec = n => `${Math.round(n * 1000) / 1000}s`;

function random(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function layout(font, str, size, tracking = 0) {
  const { glyphs, positions } = font.layout(str);
  const s = size / font.unitsPerEm;
  const xs = [];
  let x = 0;
  glyphs.forEach((g, i) => {
    xs.push(x + positions[i].xOffset * s);
    x += positions[i].xAdvance * s;
    if (i < glyphs.length - 1) x += tracking * size;
  });
  return { glyphs, xs, s, advances: positions.map(p => p.xAdvance * s), width: x };
}

const outline = (g, x, y, s, sy = 1) => round(g.path.scale(s, -s * sy).translate(x, y).toSVG());

function text(font, str, x, y, size, { tracking = 0, anchor = "start" } = {}) {
  const t = layout(font, str, size, tracking);
  const x0 = anchor === "middle" ? x - t.width / 2 : anchor === "end" ? x - t.width : x;
  return { d: t.glyphs.map((g, i) => outline(g, x0 + t.xs[i], y, t.s)).join(""), x0, x1: x0 + t.width };
}

async function main() {
  const archivo = fontkit.create(
    Buffer.from(await decompress(fs.readFileSync(file("@fontsource-variable/archivo", "archivo-latin-wdth-normal.woff2"))))
  );
  const mono = fontkit.openSync(file("@fontsource/jetbrains-mono", "jetbrains-mono-latin-500-normal.woff"));
  const faces = new Map();
  const face = (wdth, wght) => {
    const key = `${wdth}/${wght}`;
    if (!faces.has(key)) faces.set(key, archivo.getVariation({ wdth, wght }));
    return faces.get(key);
  };

  const giant = {
    words: ["DEVELOPER", "FULL-STACK", "BUILDER"],
    room: W - 72,
    top: 30,
    sy: 1.6,
    step: 3.6,
    start: 0.15,
    stagger: 0.055,
    flicker: 0.09,
    flickers: 3,
    noise: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/+=<>*",
  };
  const MIN = 62;
  const MAX = 125;
  const widthAt = (word, wdth, size) => layout(face(wdth, 900), word, size, -0.004).width;
  const size = Math.min(...giant.words.map(w => (giant.room / widthAt(w, MIN, 100)) * 100));
  const fit = word => {
    let lo = MIN;
    let hi = MAX;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (widthAt(word, mid, size) > giant.room) hi = mid;
      else lo = mid;
    }
    return Math.round(lo * 10) / 10;
  };
  const cap = face(MIN, 900).glyphForCodePoint(72).bbox.maxY * (size / 1000) * giant.sy;
  const baseline = giant.top + cap;
  const cycle = giant.step * giant.words.length;
  const pct = t => `${((t / cycle) * 100).toFixed(3)}%`;
  const rand = random(404);
  const windows = new Map();
  const frame = on => {
    const name = `f${Math.round(on * 1000)}`;
    windows.set(name, `@keyframes ${name}{0%{opacity:1}${pct(on)}{opacity:0}100%{opacity:0}}`);
    return name;
  };
  const flash = frame(giant.flicker);
  const wdths = {};
  const sets = giant.words.map(word => {
    const wdth = (wdths[word] = fit(word));
    const f = face(wdth, 900);
    const t = layout(f, word, size, -0.004);
    return { f, t, x0: W / 2 - t.width / 2 };
  });
  const sweep = (k, x) => {
    const { t, x0 } = sets[k % sets.length];
    const reach = Math.min(1, Math.max(0, (x - x0) / t.width));
    return reach * (t.glyphs.length - 1) * giant.stagger;
  };
  const words = sets
    .map(({ f, t, x0 }, k) => {
      const begin = giant.start + k * giant.step;
      const parts = t.glyphs.map((g, i) => {
        const center = x0 + t.xs[i] + t.advances[i] / 2;
        const at = begin + i * giant.stagger;
        const noise = Array.from({ length: giant.flickers }, (_, j) => {
          const ch = giant.noise[Math.floor(rand() * giant.noise.length)];
          const n = layout(f, ch, size);
          const d = outline(n.glyphs[0], center - n.advances[0] / 2, baseline, n.s, giant.sy);
          return `<path class="n" style="animation-name:${flash};animation-delay:${sec(at + j * giant.flicker)}" d="${d}"/>`;
        });
        const settle = at + giant.flickers * giant.flicker;
        const leave = begin + giant.step + Math.max(0, sweep(k + 1, x0 + t.xs[i]) - giant.stagger);
        const final = `<path class="f" style="animation-name:${frame(Math.round((leave - settle) * 100) / 100)};animation-delay:${sec(settle)}" d="${outline(g, x0 + t.xs[i], baseline, t.s, giant.sy)}"/>`;
        return noise.join("") + final;
      });
      return `<g class="w${k}">${parts.join("")}</g>`;
    })
    .join("\n");

  const name = { size: 72, wdth: 70, wght: 860, y2: 261 };
  name.y1 = name.y2 - Math.round(name.size * 0.84);
  const nameFace = face(name.wdth, name.wght);
  const nameCap = nameFace.glyphForCodePoint(72).bbox.maxY * (name.size / 1000);
  const lines = ["DENETH", "RAVEESHA"].map((word, i) => {
    const y = i ? name.y2 : name.y1;
    const t = text(nameFace, word, M - 3, y, name.size, { tracking: -0.004 });
    return (
      `<clipPath id="line${i}"><rect x="0" y="${(y - nameCap - 8).toFixed(1)}" width="${W / 2}" height="${(nameCap + 16).toFixed(1)}"/></clipPath>` +
      `<g clip-path="url(#line${i})"><g class="a line" style="animation-delay:${sec(0.4 + i * 0.1)}"><path d="${t.d}"/></g></g>`
    );
  });

  const intro = (i, inner) => `<g class="a rise" style="animation-delay:${sec(0.45 + i * 0.07)}">${inner}</g>`;
  const labelY = name.y2 + 33;
  const label = text(face(112, 600), "FULL-STACK DEVELOPER", M, labelY, 11.5, { tracking: 0.24 });
  const ruleY = labelY + 18;
  const tagline = ["From idea to interface.", "From code to the server it runs on."].map((l, i) =>
    text(face(100, 300), l, M, ruleY + 34 + i * 23, 17.5)
  );

  const whereFace = face(112, 650);
  const where = ["BASED IN", "SRI LANKA"];
  const whereW = Math.max(...where.map(l => layout(whereFace, l, 10.9, 0.22).width));
  const whereX = W - M - whereW;
  const whereY = 318;
  const whereText = where.map((l, i) => text(whereFace, l, whereX, whereY + i * 17.5, 10.9, { tracking: 0.22 }).d).join("");
  const time = text(mono, "GMT+5:30", whereX, whereY + 41, 11.2, { tracking: 0.04 });
  const pin = `<g transform="translate(${(whereX - 34).toFixed(1)} ${whereY - 15}) scale(.84)" fill="none" stroke="${C.hot}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></g>`;

  const ph = 380;
  const pw = Math.round(ph * (936 / 1015));
  const portrait = withPhoto
    ? `<g class="a photo"><image href="data:image/webp;base64,${fs.readFileSync(path.join(__dirname, "..", "assets", "portrait.webp")).toString("base64")}" x="${Math.round(W * 0.56 - ph * 0.3)}" y="${H - ph}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMax meet"/></g>`
    : "";

  const css = `
.a{animation-fill-mode:backwards;animation-timing-function:${ease}}
.giant{animation-name:giant;animation-duration:1.4s;animation-delay:.05s;transform-box:fill-box}
.photo{animation-name:photo;animation-duration:1.6s;animation-delay:.15s;transform-box:fill-box;transform-origin:50% 100%}
.line{animation-name:line;animation-duration:1.2s;transform-box:fill-box}
.rise{animation-name:rise;animation-duration:1.1s}
.g path{opacity:0;animation-duration:${sec(cycle)};animation-timing-function:step-end;animation-iteration-count:infinite}
.glow{animation:pulse 7s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes giant{from{opacity:0;transform:translateY(6%)}}
@keyframes photo{from{transform:translateY(7%) scale(1.06)}}
@keyframes line{from{transform:translateY(110%)}}
@keyframes rise{from{opacity:0;transform:translateY(22px)}}
@keyframes pulse{50%{opacity:.78;transform:scale(1.05)}}
${[...windows.values()].join("\n")}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.w0 .f{opacity:1}}
`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">Deneth Raveesha · Full-stack developer · Sri Lanka</title>
<desc id="desc">Deneth Raveesha, full-stack developer based in Sri Lanka. From idea to interface. From code to the server it runs on. Behind the name, a giant word changes letter by letter: developer, full-stack, builder.</desc>
<style>${css}</style>
<defs>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
<linearGradient id="giant" x1="0" y1="${giant.top}" x2="0" y2="${baseline.toFixed(1)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e3161f"/><stop offset=".46" stop-color="#a10f19"/><stop offset=".92" stop-color="#5a080e" stop-opacity="0"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#e61420" stop-opacity=".55"/><stop offset=".62" stop-color="#e61420" stop-opacity="0"/></radialGradient>
<linearGradient id="fade" x1="0" y1="${H * 0.64}" x2="0" y2="${H * 0.98}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.bg}" stop-opacity="0"/><stop offset="1" stop-color="${C.bg}"/></linearGradient>
</defs>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<g class="a giant"><g class="g" fill="url(#giant)">
${words}
</g></g>
<circle class="glow" cx="${Math.round(W * 0.61)}" cy="${Math.round(H * 0.42)}" r="${Math.round(H * 0.85)}" fill="url(#glow)" style="mix-blend-mode:screen"/>
${portrait}
<rect y="${H * 0.64}" width="${W}" height="${H * 0.36}" fill="url(#fade)"/>
<g fill="${C.text}">
${lines.join("\n")}
${intro(0, `<path d="${label.d}"/>`)}
${intro(1, `<rect x="${M}" y="${ruleY}" width="40" height="2" fill="${C.red}"/>`)}
${intro(2, tagline.map(t => `<path d="${t.d}"/>`).join(""))}
${intro(4, `${pin}<path d="${whereText}"/><path fill="${C.muted}" d="${time.d}"/>`)}
</g>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="17.5" fill="none" stroke="${C.edge}"/>
</svg>
`;
  fs.writeFileSync(out, svg);
  console.log(JSON.stringify({ size: Math.round(size), wdths, cap: Math.round(cap), photo: withPhoto, bytes: svg.length }));
}

main();
