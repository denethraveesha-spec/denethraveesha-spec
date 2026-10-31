const fs = require("fs");
const path = require("path");

const outDir = process.argv[2] || path.join(__dirname, "..", "assets", "icons");
fs.mkdirSync(outDir, { recursive: true });

const tiles = {
  red: { fill: "#d0141f", ink: "#ffffff" },
  ink: { fill: "#0a0a0b", edge: "#3a3a3f", ink: "#f3f1ed" },
  accent: { fill: "#0a0a0b", edge: "#3a3a3f", ink: "#ff2b38" },
};

const glyphs = {
  about: { tile: "red", d: `<circle cx="16" cy="12.4" r="3.6"/><path d="M9.5 24.5c0-3.9 2.9-6.6 6.5-6.6s6.5 2.7 6.5 6.6"/>` },
  work: { tile: "red", d: `<path fill="currentColor" stroke="none" d="M16 7.5c.6 4.4 2.5 6.7 7 8.5-4.5 1.8-6.4 4.1-7 8.5-.6-4.4-2.5-6.7-7-8.5 4.5-1.8 6.4-4.1 7-8.5z"/>` },
  more: { tile: "red", d: `<rect x="8" y="12" width="16" height="11.5" rx="2.2"/><path d="M12.8 12v-1.8c0-.9.7-1.6 1.6-1.6h3.2c.9 0 1.6.7 1.6 1.6V12M8 17.2h16"/>` },
  process: { tile: "red", d: `<path d="M9.5 22.5H14a3 3 0 0 0 3-3v-7a3 3 0 0 1 3-3h2.5"/><circle cx="9.5" cy="22.5" r="2.2" fill="currentColor"/><circle cx="22.5" cy="9.5" r="2.2" fill="currentColor"/>` },
  stack: { tile: "red", d: `<path d="M16 8.2l8 4.1-8 4.1-8-4.1z"/><path d="M8 16.3l8 4.1 8-4.1"/><path d="M8 20.3l8 4.1 8-4.1"/>` },
  contact: { tile: "red", d: `<rect x="7.5" y="9.5" width="17" height="13" rx="2.2"/><path d="m8.5 11.5 7.5 5.5 7.5-5.5"/>` },
  live: { tile: "accent", d: `<circle cx="16" cy="16" r="2" fill="currentColor" stroke="none"/><path d="M12.2 12.2a5.4 5.4 0 0 0 0 7.6M19.8 12.2a5.4 5.4 0 0 1 0 7.6M9.4 9.4a9.3 9.3 0 0 0 0 13.2M22.6 9.4a9.3 9.3 0 0 1 0 13.2"/>` },
  design: { tile: "accent", d: `<rect x="8" y="9" width="16" height="14" rx="2.2"/><path d="M8 13.4h16M12.6 13.4V23"/>` },
  now: { tile: "accent", d: `<circle cx="16" cy="16" r="8"/><path d="M16 11.5V16l3.2 2"/>` },
  code: { tile: "accent", d: `<path d="M12.5 11l-5 5 5 5M19.5 11l5 5-5 5M17.6 9.5l-3.2 13"/>` },
  chat: { tile: "accent", d: `<path d="M11.7 8.5h8.6A2.7 2.7 0 0 1 23 11.2v6a2.7 2.7 0 0 1-2.7 2.7h-4.8l-4.2 3.6v-3.6A2.7 2.7 0 0 1 9 17.2v-6a2.7 2.7 0 0 1 2.7-2.7z"/>` },
  nexus: { tile: "ink", d: `<circle cx="13" cy="12.4" r="3"/><path d="M7.5 23.5c0-3.3 2.4-5.6 5.5-5.6s5.5 2.3 5.5 5.6"/><circle cx="20.6" cy="11.4" r="2.6"/><path d="M20.7 16.8c2.6.2 4.3 2.3 4.3 5.1"/>` },
  bizupward: { tile: "ink", d: `<path d="M8 21.5l5-5 3.6 3.2 7.4-7.7M19 12h5v5"/>` },
  wingz: { tile: "ink", d: `<path d="M11.2 11.5h9.6a4.2 4.2 0 0 1 4.1 3.4l.9 4.6a2.4 2.4 0 0 1-4.1 2.1l-2.3-2.4h-6.8l-2.3 2.4a2.4 2.4 0 0 1-4.1-2.1l.9-4.6a4.2 4.2 0 0 1 4.1-3.4z"/><path d="M11.5 14.6v3.6M9.7 16.4h3.6"/><circle cx="19.6" cy="15.4" r="1.1" fill="currentColor" stroke="none"/><circle cx="21.8" cy="17.4" r="1.1" fill="currentColor" stroke="none"/>` },
  vps: { tile: "ink", d: `<rect x="8.5" y="8.5" width="15" height="6.3" rx="1.8"/><rect x="8.5" y="17.2" width="15" height="6.3" rx="1.8"/><circle cx="12" cy="11.65" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="20.35" r="1.1" fill="currentColor" stroke="none"/><path d="M15.5 11.65H20M15.5 20.35H20"/>` },
  zipizy: { tile: "ink", d: `<path d="M10.5 7.8h7l4.5 4.5v11.9h-11.5z"/><path d="M17.5 7.8v4.5H22M13.8 16.3h4.6M13.8 19.8h4.6"/>` },
};

for (const [name, { tile, d }] of Object.entries(glyphs)) {
  const t = tiles[tile];
  const rect = t.edge
    ? `<rect x=".5" y=".5" width="31" height="31" fill="${t.fill}" stroke="${t.edge}"/>`
    : `<rect width="32" height="32" fill="${t.fill}"/>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" color="${t.ink}">` +
    rect +
    `<g fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${d}</g>` +
    `</svg>\n`;
  fs.writeFileSync(path.join(outDir, name + ".svg"), svg);
}
console.log(Object.keys(glyphs).length + " icons");
