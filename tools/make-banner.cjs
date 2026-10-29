const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");

const out = process.argv[2] || path.join(__dirname, "..", "assets", "banner.svg");

const load = (pkg, file) => {
  const dir = path.dirname(require.resolve(`@fontsource/${pkg}/package.json`));
  const buf = fs.readFileSync(path.join(dir, "files", file));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const F = {
  black: load("schibsted-grotesk", "schibsted-grotesk-latin-800-normal.woff"),
  bold: load("schibsted-grotesk", "schibsted-grotesk-latin-700-normal.woff"),
  semi: load("schibsted-grotesk", "schibsted-grotesk-latin-600-normal.woff"),
  med: load("schibsted-grotesk", "schibsted-grotesk-latin-500-normal.woff"),
  mono: load("jetbrains-mono", "jetbrains-mono-latin-500-normal.woff"),
};

const C = {
  paper: "#f4efe6",
  edge: "#e2dacb",
  ink: "#16181d",
  station: "#ffffff",
  platforms: "#8d153a",
  commerce: "#eb7400",
  tools: "#00534e",
};

function layout(f, str, size, tracking) {
  const glyphs = f.stringToGlyphs(str);
  const scale = size / f.unitsPerEm;
  const xs = [];
  let x = 0;
  glyphs.forEach((g, i) => {
    xs.push(x);
    x += g.advanceWidth * scale;
    if (i < glyphs.length - 1) x += f.getKerningValue(g, glyphs[i + 1]) * scale + tracking;
  });
  return { glyphs, xs, width: x };
}

const measure = (f, str, size, tracking = 0) => layout(f, str, size, tracking).width;

function text(f, str, x, y, size, { tracking = 0, anchor = "start", opacity, fill } = {}) {
  const { glyphs, xs, width } = layout(f, str, size, tracking);
  const x0 = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  const d = glyphs.map((g, i) => g.getPath(x0 + xs[i], y, size).toPathData(2)).join("");
  const attrs = (fill ? ` fill="${fill}"` : "") + (opacity ? ` fill-opacity="${opacity}"` : "");
  return { svg: `<path${attrs} d="${d}"/>`, x0, x1: x0 + width };
}

function sample(d) {
  const tokens = d.match(/[MLHVQ]|-?[\d.]+/g);
  const pts = [];
  let i = 0, x = 0, y = 0, s = 0, cmd;
  const num = () => parseFloat(tokens[i++]);
  const step = (nx, ny) => {
    s += Math.hypot(nx - x, ny - y);
    x = nx;
    y = ny;
    pts.push({ x, y, s });
  };
  const line = (nx, ny) => {
    const n = Math.max(1, Math.ceil(Math.hypot(nx - x, ny - y)));
    const [x0, y0] = [x, y];
    for (let k = 1; k <= n; k++) step(x0 + ((nx - x0) * k) / n, y0 + ((ny - y0) * k) / n);
  };
  while (i < tokens.length) {
    if (/[MLHVQ]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === "M") {
      x = num();
      y = num();
      pts.push({ x, y, s });
    } else if (cmd === "L") line(num(), num());
    else if (cmd === "H") line(num(), y);
    else if (cmd === "V") line(x, num());
    else if (cmd === "Q") {
      const [cx, cy, ex, ey] = [num(), num(), num(), num()];
      const [x0, y0] = [x, y];
      for (let k = 1; k <= 200; k++) {
        const t = k / 200, u = 1 - t;
        step(u * u * x0 + 2 * u * t * cx + t * t * ex, u * u * y0 + 2 * u * t * cy + t * t * ey);
      }
    }
  }
  return pts;
}
const distanceTo = (pts, x, y) =>
  pts.reduce((best, p) => (Math.hypot(p.x - x, p.y - y) < Math.hypot(best.x - x, best.y - y) ? p : best)).s;

const M = 56;
const tag = { size: 9.5, tracking: 1.1, opacity: 0.62 };
const sec = n => `${n.toFixed(2)}s`;
const delayed = (cls, at, inner) => `<g class="a ${cls}" style="animation-delay:${sec(at)}">${inner}</g>`;

function typed(f, str, x, y, size, { tracking = 0, start, speed }) {
  const { glyphs, xs, width } = layout(f, str, size, tracking);
  const scale = size / f.unitsPerEm;
  const stops = [{ t: start, x }];
  let t = start;
  const svg = glyphs
    .map((g, i) => {
      t += speed * (1 + 0.35 * Math.sin(i * 2.7)) + (g.unicode === 32 ? speed * 0.8 : 0);
      t = Math.round(t * 100) / 100;
      stops.push({ t, x: x + xs[i] + g.advanceWidth * scale + 3 });
      const d = g.getPath(x + xs[i], y, size).toPathData(2);
      return d ? `<path class="key" style="animation-delay:${sec(t)}" d="${d}"/>` : "";
    })
    .join("");
  return { svg, stops, end: t, x0: x, x1: x + width };
}

const O = { x: 716, y: 198 };
const E = { x: 1104, y: 198 };
const Y = { platforms: 118, commerce: 198, tools: 278 };

const routes = {
  platforms: `M${O.x} ${O.y}L${O.x + 80} ${Y.platforms}H${E.x - 20}Q${E.x} ${Y.platforms} ${E.x} ${Y.platforms + 20}V${E.y}`,
  commerce: `M${O.x} ${O.y}H${E.x}`,
  tools: `M${O.x} ${O.y}L${O.x + 80} ${Y.tools}H${E.x - 20}Q${E.x} ${Y.tools} ${E.x} ${Y.tools - 20}V${E.y}`,
};
const stations = [
  { route: "platforms", x: 860, name: "BizUpward", tag: "LIVE", side: "above" },
  { route: "platforms", x: 1000, name: "REM Nexus", tag: "LIVE · CLIENT", side: "above" },
  { route: "commerce", x: 848, name: "WingZ Topup", tag: "LIVE", side: "above" },
  { route: "commerce", x: 980, name: "Fulfilment API", tag: "IN-HOUSE", side: "above" },
  { route: "tools", x: 860, name: "VPS Manager", tag: "IN-HOUSE", side: "below" },
  { route: "tools", x: 1000, name: "Zipizy", tag: "OPEN SOURCE", side: "below" },
];

const T = {
  kicker: 0.1,
  caret: 0.3,
  typeName: 0.55,
  origin: 1.5,
  draw: { commerce: 1.75, platforms: 1.85, tools: 1.95 },
  drawFor: 1.9,
  legend: 4.1,
  cue: 4.4,
};
const arrival = Math.max(...Object.values(T.draw)) + T.drawFor;
const trains = { platforms: arrival + 0.5, commerce: arrival + 1.4, tools: arrival + 2.3 };
const train = { speed: 105, dwell: 0.8, rest: 1.2 };

const sampled = Object.fromEntries(Object.entries(routes).map(([k, d]) => [k, sample(d)]));
for (const st of stations) {
  st.y = Y[st.route];
  const pts = sampled[st.route];
  st.along = distanceTo(pts, st.x, st.y) / pts.at(-1).s;
  st.at = T.draw[st.route] + st.along * T.drawFor - 0.04;
}

const parts = [];
const boxes = [];
const box = (t, y0, y1, name) => (boxes.push({ name, x0: t.x0, x1: t.x1, y0, y1 }), t);

parts.push(delayed("fade", T.kicker, box(text(F.mono, "BASED IN SRI LANKA", M, 104, 10.5, { tracking: 1.5, opacity: 0.62 }), 96, 104, "kicker").svg));

const track = s => -0.025 * s;
const S = Math.min(64, Math.floor((100 * 580) / measure(F.black, "Deneth Raveesha", 100, track(100))));
const nameY = 166, roleY = 208;
const nameTyped = box(typed(F.black, "Deneth Raveesha", M - 2, nameY, S, { tracking: track(S), start: T.typeName, speed: 0.06 }), nameY - S * 0.74, nameY, "name");
const roleTyped = box(typed(F.semi, "Full-stack Developer", M, roleY, 26, { tracking: -0.3, start: nameTyped.end + 0.35, speed: 0.045 }), roleY - 19, roleY, "role");
parts.push(nameTyped.svg, roleTyped.svg);

const caret = { name: { w: 4, h: S * 0.8, base: nameY + 6 }, role: { w: 2.5, h: 22.8, base: roleY + 4 } };
const caretSpan = roleTyped.end - T.caret;
const at = t => `${(((t - T.caret) / caretSpan) * 100).toFixed(3)}%`;
const pose = (x, c) => `transform:translate(${x.toFixed(1)}px,${c.base.toFixed(1)}px) scale(${c.w},${c.h.toFixed(1)})`;
const caretFrames = [
  `0%{opacity:0;${pose(nameTyped.stops[0].x, caret.name)}}`,
  `0.5%{opacity:1;${pose(nameTyped.stops[0].x, caret.name)}}`,
  ...nameTyped.stops.slice(1).map(s => `${at(s.t)}{${pose(s.x, caret.name)}}`),
  `${at(roleTyped.stops[0].t)}{${pose(roleTyped.stops[0].x, caret.role)}}`,
  ...roleTyped.stops.slice(1, -1).map(s => `${at(s.t)}{${pose(s.x, caret.role)}}`),
  `100%{opacity:1;${pose(roleTyped.stops.at(-1).x, caret.role)}}`,
];
parts.push(
  `<g class="caret" style="animation-delay:${sec(T.caret)};animation-duration:${sec(caretSpan)}">` +
    `<rect class="blink" x="0" y="-1" width="1" height="1" fill="${C.commerce}" style="animation-delay:${sec(roleTyped.end)}"/></g>`
);

const about = ["I design and build complete web products,", "from the interface to the servers they run on."];
parts.push(
  delayed("fade", roleTyped.end + 0.15, about.map((l, i) => box(text(F.med, l, M, 246 + i * 23, 16, { opacity: 0.7 }), 234 + i * 23, 246 + i * 23, "about" + i).svg).join(""))
);

const cueA = box(text(F.med, "Every station is a real system I built.", M, 348, 14, { opacity: 0.7 }), 337, 348, "cue");
const cueB = box(text(F.semi, "Scroll down to ride along", cueA.x1 + 5, 348, 14), 337, 348, "cue-cta");
const ax = cueB.x1 + 11;
const arrow = `<g class="bob"><path d="M${ax.toFixed(1)} 337.5V347.5M${(ax - 3.6).toFixed(1)} 343.9L${ax.toFixed(1)} 347.5L${(ax + 3.6).toFixed(1)} 343.9" fill="none" stroke="${C.ink}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></g>`;
parts.push(delayed("fade", T.cue, cueA.svg + cueB.svg + arrow));

for (const [k, d] of Object.entries(routes)) {
  parts.push(
    `<path class="a draw" pathLength="1" d="${d}" fill="none" stroke="${C[k]}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" style="animation-delay:${sec(T.draw[k])};animation-duration:${sec(T.drawFor)}"/>`
  );
}
for (const st of stations) {
  parts.push(`<circle class="a pop" cx="${st.x}" cy="${st.y}" r="8" fill="${C.station}" stroke="${C.ink}" stroke-width="3.5" style="animation-delay:${sec(st.at)}"/>`);
}

const f4 = n => +n.toFixed(4);
for (const [k, d] of Object.entries(routes)) {
  const len = sampled[k].at(-1).s;
  const stops = stations.filter(st => st.route === k).map(st => st.along * len).sort((a, b) => a - b);
  const kp = [0], kt = [0];
  let t = 0, prev = 0;
  for (const s of stops) {
    t += (s - prev) / train.speed;
    kp.push(s / len, s / len);
    kt.push(t, t + train.dwell);
    t += train.dwell;
    prev = s;
  }
  t += (len - prev) / train.speed;
  kp.push(1, 1);
  kt.push(t, t + train.rest);
  const dur = t + train.rest;
  parts.push(
    `<g class="train" opacity="0"><set attributeName="opacity" to="1" begin="${sec(trains[k])}" fill="freeze"/>` +
      `<rect x="-9.5" y="-4.75" width="19" height="9.5" rx="4.75" fill="${C.station}" stroke="${C.ink}" stroke-width="2.5"/>` +
      `<animateMotion begin="${sec(trains[k])}" dur="${sec(dur)}" repeatCount="indefinite" rotate="auto" calcMode="linear" ` +
      `keyPoints="${kp.map(f4).join(";")}" keyTimes="${kt.map(x => f4(x / dur)).join(";")}" path="${d}"/></g>`
  );
}

parts.push(`<circle class="ripple" cx="${O.x}" cy="${O.y}" r="24" fill="none" stroke="${C.ink}" stroke-width="2" style="animation-delay:${sec(T.origin + 0.15)}"/>`);
parts.push(
  delayed(
    "pop",
    T.origin,
    `<circle cx="${O.x}" cy="${O.y}" r="24" fill="${C.ink}"/>` + text(F.bold, "DR", O.x, O.y + 6, 16, { anchor: "middle", tracking: 0.4, fill: C.paper }).svg
  )
);

parts.push(
  delayed(
    "pop",
    arrival,
    `<g class="spin"><circle cx="${E.x}" cy="${E.y}" r="17" fill="${C.paper}" stroke="${C.ink}" stroke-width="3.5" stroke-dasharray="5.2 4.2"/></g>` +
      `<g class="pulse"><path d="M${E.x - 6} ${E.y}H${E.x + 6}M${E.x} ${E.y - 6}V${E.y + 6}" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/></g>`
  )
);

for (const st of stations) {
  const nameY = st.side === "above" ? st.y - 20 : st.y + 30;
  const tagY = st.side === "above" ? st.y - 36 : st.y + 46;
  const name = box(text(F.semi, st.name, st.x, nameY, 15, { anchor: "middle", tracking: -0.1 }), nameY - 11, nameY, st.name);
  let label;
  if (st.tag.startsWith("LIVE")) {
    const w = measure(F.mono, st.tag, tag.size, tag.tracking);
    const x0 = st.x - (w + 10.4) / 2;
    const t = box(text(F.mono, st.tag, x0 + 10.4, tagY, tag.size, { tracking: tag.tracking, opacity: tag.opacity }), tagY - 7, tagY, st.tag + " @ " + st.name);
    const dot = { x: (x0 + 2.6).toFixed(1), y: (tagY - 3.4).toFixed(1) };
    label =
      `<circle class="ping" cx="${dot.x}" cy="${dot.y}" r="2.6" fill="${C.tools}"/>` +
      `<circle cx="${dot.x}" cy="${dot.y}" r="2.6" fill="${C.tools}"/>` +
      t.svg;
  } else {
    label = box(text(F.mono, st.tag, st.x, tagY, tag.size, { anchor: "middle", tracking: tag.tracking, opacity: tag.opacity }), tagY - 7, tagY, st.tag + " @ " + st.name).svg;
  }
  parts.push(delayed("fade", st.at + 0.15, name.svg + label));
}
parts.push(
  delayed(
    "fade",
    arrival + 0.2,
    box(text(F.semi, "Your project?", E.x - 30, E.y + 32, 15, { anchor: "end", tracking: -0.1 }), E.y + 21, E.y + 32, "next").svg +
      box(text(F.mono, "NEXT STOP", E.x - 30, E.y + 48, tag.size, { anchor: "end", tracking: tag.tracking, opacity: tag.opacity }), E.y + 41, E.y + 48, "next-tag").svg
  )
);

const legend = [["platforms", "PLATFORMS"], ["commerce", "COMMERCE"], ["tools", "TOOLS"]];
const swatch = 22, gap = 8, between = 22;
const widths = legend.map(([, l]) => swatch + gap + measure(F.mono, l, 10, 1.3));
let lx = 1200 - M - widths.reduce((a, b) => a + b, 0) - between * (legend.length - 1);
let legendSvg = "";
legend.forEach(([k, l], i) => {
  legendSvg += `<path d="M${(lx + 2.5).toFixed(1)} 344.5H${(lx + swatch - 2.5).toFixed(1)}" stroke="${C[k]}" stroke-width="5" stroke-linecap="round"/>`;
  legendSvg += box(text(F.mono, l, lx + swatch + gap, 348, 10, { tracking: 1.3, opacity: 0.68 }), 340, 348, "legend " + l).svg;
  lx += widths[i] + between;
});
parts.push(delayed("fade", T.legend, legendSvg));

const clash = [];
for (let i = 0; i < boxes.length; i++)
  for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.name.startsWith("cue") && b.name.startsWith("cue")) continue;
    if (a.x0 < b.x1 + 8 && b.x0 < a.x1 + 8 && a.y0 < b.y1 + 2 && b.y0 < a.y1 + 2) clash.push(`${a.name} / ${b.name}`);
  }
const outside = boxes.filter(b => b.x0 < M - 4 || b.x1 > 1200 - M + 4).map(b => b.name);

const css = `
.a{animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.7,.2,1)}
.fade{animation-name:fade;animation-duration:.6s}
.key{animation:key .01s step-start both}
.caret{animation-name:caret;animation-timing-function:step-end;animation-fill-mode:both}
.blink{animation:blink 1.05s step-end infinite}
.pop{animation-name:pop;animation-duration:.55s;animation-timing-function:cubic-bezier(.34,1.56,.64,1);transform-box:fill-box;transform-origin:center}
.draw{stroke-dasharray:1 1;animation-name:draw;animation-timing-function:linear}
.ripple{opacity:0;animation:ripple 1.3s cubic-bezier(0,0,.2,1) both;transform-box:fill-box;transform-origin:center}
.spin{animation:spin 16s linear infinite;transform-box:fill-box;transform-origin:center}
.pulse{animation:pulse 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.ping{animation:ping 2.2s cubic-bezier(0,0,.2,1) infinite;transform-box:fill-box;transform-origin:center}
.bob{animation:bob 1.8s ease-in-out infinite}
@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes key{from{opacity:0}to{opacity:1}}
@keyframes caret{${caretFrames.join("")}}
@keyframes blink{50%{opacity:0}}
@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
@keyframes draw{0%{stroke-dashoffset:1;stroke-opacity:0}1%{stroke-opacity:1}100%{stroke-dashoffset:0;stroke-opacity:1}}
@keyframes ripple{0%{opacity:0;transform:scale(1)}15%{opacity:.4}100%{opacity:0;transform:scale(2.6)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{50%{transform:scale(1.2)}}
@keyframes ping{0%{opacity:.55;transform:scale(1)}100%{opacity:0;transform:scale(3.2)}}
@keyframes bob{50%{transform:translateY(3px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.train,.ripple,.caret{display:none}}
`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400" role="img" aria-labelledby="title desc">
<title id="title">Deneth Raveesha · Full-stack Developer · Sri Lanka</title>
<desc id="desc">Deneth Raveesha, full-stack developer based in Sri Lanka. I design and build complete web products. A transit map of my work: BizUpward and REM Nexus on the platforms line, WingZ Topup and its fulfilment API on the commerce line, VPS Manager and Zipizy on the tools line. Every line arrives at the next stop: your project.</desc>
<style>${css}</style>
<rect x=".5" y=".5" width="1199" height="399" rx="18" fill="${C.paper}" stroke="${C.edge}"/>
<g fill="${C.ink}">
${parts.join("\n")}
</g>
</svg>
`;
fs.writeFileSync(out, svg);
console.log(JSON.stringify({ nameSize: S, typedBy: +roleTyped.end.toFixed(2), arrival: +arrival.toFixed(2), bytes: svg.length, clash, outside }));
