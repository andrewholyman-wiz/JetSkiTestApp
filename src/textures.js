import * as THREE from 'three';

// Procedural Canvas Texture Cache — zero network assets, mipmapped, fast GPU reuse.
// Base HTMLCanvasElements are cached separately from vertical repeat factors so resizing
// high-rise towers from 10 to 60 stories performs ZERO Canvas2D redraws!
const canvasCache = new Map();
const textureCache = new Map();
const materialCache = new Map();

function seededRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function getOrDrawCanvas(canvasKey, width, height, drawFn) {
  if (canvasCache.has(canvasKey)) return canvasCache.get(canvasKey);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);
  canvasCache.set(canvasKey, canvas);
  return canvas;
}

function makeCanvasTexture(canvasKey, width, height, drawFn, repeatX = 1, repeatY = 1) {
  const rx = Math.round(repeatX * 100) / 100;
  const ry = Math.round(repeatY * 100) / 100;
  const texKey = `${canvasKey}@${rx}x${ry}`;
  if (textureCache.has(texKey)) return textureCache.get(texKey);
  const canvas = getOrDrawCanvas(canvasKey, width, height, drawFn);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  textureCache.set(texKey, tex);
  return tex;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function shadeHex(hex, factor) {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${clamp(r * factor)}, ${clamp(g * factor)}, ${clamp(b * factor)})`;
}

// ============================================================================
// Facade & Window Emissive Textures (Apartments, High-Rises, Offices, Shops)
// ============================================================================
export function getFacadeMaterial({ style, color, cols = 4, rows = 4, isNight = false, isGlass = false }) {
  const safeRows = Math.max(1, Math.round(rows));
  // For towers taller than 10 stories, draw a crisp 12-story modular tile (256x512)
  // and tile vertically with exact floor proportion!
  const tileRows = safeRows > 10 ? 12 : safeRows;
  const repeatY = safeRows > 10 ? safeRows / 12 : 1;
  const texH = tileRows >= 8 ? 512 : 256;

  const baseKey = `facade:${style}:${color}:${cols}x${tileRows}:${isNight ? 'N' : 'D'}:${isGlass ? 'G' : 'S'}`;
  const matKey = `${baseKey}:r${Math.round(repeatY * 100)}`;
  if (materialCache.has(matKey)) return materialCache.get(matKey);

  const seed = hashStr(baseKey);

  const map = makeCanvasTexture(
    `${baseKey}:map`,
    256,
    texH,
    (ctx, w, h) => {
      const rand = seededRand(seed);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);

      // Subtle architectural surface texture
      if (style === 'brick') {
        ctx.fillStyle = shadeHex(color, 0.88);
        for (let y = 0; y < h; y += 8) {
          ctx.fillRect(0, y, w, 1);
          const offset = (y / 8) % 2 === 0 ? 0 : 12;
          for (let x = offset; x < w; x += 24) {
            ctx.fillRect(x, y, 1, 8);
          }
        }
      } else if (style === 'timber') {
        for (let x = 0; x < w; x += 8) {
          ctx.fillStyle = x % 16 === 0 ? shadeHex(color, 0.92) : shadeHex(color, 1.04);
          ctx.fillRect(x, 0, 2, h);
        }
      } else if (style === 'limestone') {
        // Refined vertical pilasters and subtle horizontal floor spandrels
        const cellW = w / cols;
        const rowH = h / tileRows;
        ctx.fillStyle = shadeHex(color, 1.07);
        for (let c = 0; c <= cols; c++) {
          ctx.fillRect(c * cellW - 2, 0, 4, h);
        }
        ctx.fillStyle = shadeHex(color, 0.9);
        for (let r = 0; r < tileRows; r++) {
          ctx.fillRect(0, r * rowH, w, Math.max(3, rowH * 0.16));
        }
      } else if (style === 'midcentury') {
        ctx.fillStyle = shadeHex(color, 1.12);
        const rowH = h / tileRows;
        for (let r = 0; r < tileRows; r++) {
          ctx.fillRect(0, r * rowH, w, Math.max(3, rowH * 0.16));
        }
      } else {
        // Modern curtain wall / concrete panel grid
        ctx.fillStyle = shadeHex(color, 0.86);
        const rowH = h / tileRows;
        for (let r = 0; r < tileRows; r++) {
          ctx.fillRect(0, r * rowH, w, Math.max(2, rowH * 0.1));
        }
      }

      // Windows
      const cellW = w / cols;
      const cellH = h / tileRows;
      const padX = isGlass ? cellW * 0.09 : style === 'limestone' ? cellW * 0.15 : cellW * 0.19;
      const padY = isGlass ? cellH * 0.14 : cellH * 0.21;

      for (let r = 0; r < tileRows; r++) {
        for (let c = 0; c < cols; c++) {
          const wx = c * cellW + padX;
          const wy = r * cellH + padY;
          const ww = Math.max(4, cellW - padX * 2);
          const wh = Math.max(4, cellH - padY * 2);

          // Window recess frame
          ctx.fillStyle = shadeHex(color, 0.64);
          ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);

          const lit = isNight && rand() > 0.38;
          if (lit) {
            ctx.fillStyle = rand() > 0.24 ? '#ffe39f' : '#d6eeff';
          } else if (isGlass) {
            const sky = 0.88 + rand() * 0.22;
            ctx.fillStyle = shadeHex(color, isNight ? 0.4 : sky * 0.72);
          } else {
            ctx.fillStyle = isNight ? '#243245' : '#4a657d';
          }
          ctx.fillRect(wx, wy, ww, wh);

          // Subtle daylight reflection band
          if (!isNight) {
            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            ctx.fillRect(wx + 2, wy + 2, ww * 0.35, Math.max(1, wh - 4));
          }
          // Center mullion
          if (ww >= 10) {
            ctx.fillStyle = shadeHex(color, 0.6);
            ctx.fillRect(wx + ww * 0.5 - 1, wy, 2, wh);
          }
        }
      }
    },
    1,
    repeatY
  );

  let emissiveMap = null;
  if (isNight) {
    emissiveMap = makeCanvasTexture(
      `${baseKey}:emissive`,
      256,
      texH,
      (ctx, w, h) => {
        const rand = seededRand(seed);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);
        const cellW = w / cols;
        const cellH = h / tileRows;
        const padX = isGlass ? cellW * 0.09 : style === 'limestone' ? cellW * 0.15 : cellW * 0.19;
        const padY = isGlass ? cellH * 0.14 : cellH * 0.21;

        for (let r = 0; r < tileRows; r++) {
          for (let c = 0; c < cols; c++) {
            const lit = rand() > 0.38;
            if (lit) {
              ctx.fillStyle = rand() > 0.24 ? '#ffcf70' : '#a8d8ff';
              ctx.fillRect(
                c * cellW + padX,
                r * cellH + padY,
                Math.max(4, cellW - padX * 2),
                Math.max(4, cellH - padY * 2)
              );
            }
          }
        }
      },
      1,
      repeatY
    );
  }

  const mat = new THREE.MeshStandardMaterial({
    map,
    emissive: isNight ? new THREE.Color('#ffda8c') : new THREE.Color('#000000'),
    emissiveMap,
    emissiveIntensity: isNight ? 1.15 : 0,
    roughness: isGlass ? 0.26 : 0.78,
    metalness: isGlass ? 0.35 : 0.04,
  });

  materialCache.set(matKey, mat);
  return mat;
}

// ============================================================================
// Ground, Road & Plaza Procedural Materials
// ============================================================================
export function getGrassGroundMaterial() {
  const key = 'ground:grass';
  if (materialCache.has(key)) return materialCache.get(key);
  const map = makeCanvasTexture(key, 256, 256, (ctx, w, h) => {
    const rand = seededRand(42);
    ctx.fillStyle = '#89ad6e';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 600; i++) {
      const x = rand() * w;
      const y = rand() * h;
      ctx.fillStyle = rand() > 0.5 ? 'rgba(116,154,90,0.35)' : 'rgba(154,187,123,0.3)';
      ctx.fillRect(x, y, 4, 4);
    }
  }, 12, 12);

  const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.94, metalness: 0.0 });
  materialCache.set(key, mat);
  return mat;
}

export function getPlazaStoneMaterial() {
  const key = 'ground:plaza';
  if (materialCache.has(key)) return materialCache.get(key);
  const map = makeCanvasTexture(key, 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#cfc7b8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(70,65,55,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      const p = (i * w) / 4;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(w, p); ctx.stroke();
    }
  });
  const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.88, metalness: 0.02 });
  materialCache.set(key, mat);
  return mat;
}

export function getAsphaltMaterial() {
  const key = 'road:asphalt';
  if (materialCache.has(key)) return materialCache.get(key);
  const map = makeCanvasTexture(key, 128, 128, (ctx, w, h) => {
    const rand = seededRand(99);
    ctx.fillStyle = '#3f4650';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(rand() * w, rand() * h, 2, 2);
    }
  });
  const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0.02 });
  materialCache.set(key, mat);
  return mat;
}

export function getPedestrianPavingMaterial(style = 'cobble') {
  const key = `ped:paving:${style}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const map = makeCanvasTexture(key, 128, 128, (ctx, w, h) => {
    const rand = seededRand(hashStr(key));
    if (style === 'brick') {
      ctx.fillStyle = '#b4745c';
      ctx.fillRect(0, 0, w, h);
      const bh = 8;
      const bw = 16;
      for (let y = 0; y < h; y += bh) {
        const off = (y / bh) % 2 === 0 ? 0 : bw / 2;
        for (let x = -bw; x < w + bw; x += bw) {
          const shade = 0.9 + rand() * 0.18;
          ctx.fillStyle = shadeHex('#b57258', shade);
          ctx.fillRect(x + off + 1, y + 1, bw - 2, bh - 2);
        }
      }
    } else if (style === 'sandstone') {
      ctx.fillStyle = '#d7cfc0';
      ctx.fillRect(0, 0, w, h);
      const s = 32;
      for (let y = 0; y < h; y += s) {
        for (let x = 0; x < w; x += s) {
          const shade = 0.94 + rand() * 0.1;
          ctx.fillStyle = shadeHex('#d8d0c1', shade);
          ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
        }
      }
    } else {
      // Granite cobblestone setts
      ctx.fillStyle = '#aba59a';
      ctx.fillRect(0, 0, w, h);
      const ch = 10;
      const cw = 12;
      for (let y = 0; y < h; y += ch) {
        const off = (y / ch) % 2 === 0 ? 0 : cw / 2;
        for (let x = -cw; x < w + cw; x += cw) {
          const shade = 0.86 + rand() * 0.24;
          ctx.fillStyle = shadeHex('#b6afa4', shade);
          ctx.fillRect(x + off + 1, y + 1, cw - 2, ch - 2);
        }
      }
    }
  });
  const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.89, metalness: 0.02 });
  materialCache.set(key, mat);
  return mat;
}

export function getStandardMaterial(color, roughness = 0.78, metalness = 0.05, emissive = null, emissiveIntensity = 0) {
  const key = `std:${color}:${roughness}:${metalness}:${emissive || ''}:${emissiveIntensity}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
    emissive: emissive ? new THREE.Color(emissive) : new THREE.Color('#000000'),
    emissiveIntensity,
  });
  materialCache.set(key, mat);
  return mat;
}

export function getWaterMaterial(isNight = false) {
  const key = `water:${isNight ? 'N' : 'D'}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(isNight ? '#1e4a6b' : '#3d89b0'),
    roughness: 0.16,
    metalness: 0.35,
  });
  materialCache.set(key, mat);
  return mat;
}

// ============================================================================
// Multi-Level Parking Structure Deck Facade & Illuminated "P" Sign Materials
// ============================================================================
export function getParkingDeckMaterial({ style = 'concrete', color = '#bfb9ad', levels = 4, isNight = false }) {
  const safeLevels = Math.max(1, Math.round(levels));
  const tileLevels = safeLevels > 6 ? 6 : safeLevels;
  const repeatY = safeLevels > 6 ? safeLevels / 6 : 1;
  const baseKey = `parkdeck:${style}:${color}:${tileLevels}:${isNight ? 'N' : 'D'}`;
  const matKey = `${baseKey}:r${Math.round(repeatY * 100)}`;
  if (materialCache.has(matKey)) return materialCache.get(matKey);

  const map = makeCanvasTexture(
    `${baseKey}:map`,
    256,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);

      const levelH = h / tileLevels;
      const cols = 4;
      const colW = w / cols;

      for (let lv = 0; lv < tileLevels; lv++) {
        const y0 = lv * levelH;
        // Bottom concrete spandrel wall (~44% of level height)
        const openH = levelH * 0.46;
        const openY = y0 + levelH * 0.14;

        // Shadowed interior parking deck opening
        ctx.fillStyle = isNight ? '#262d38' : '#2f3640';
        ctx.fillRect(0, openY, w, openH);

        // Subtle interior ceiling fluorescent strip inside each bay
        if (isNight) {
          ctx.fillStyle = '#fff0cc';
          for (let c = 0; c < cols; c++) {
            ctx.fillRect(c * colW + colW * 0.24, openY + 3, colW * 0.52, Math.max(3, openH * 0.14));
          }
        } else {
          // Subtle interior shadow depth gradient
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.fillRect(0, openY, w, openH * 0.32);
        }

        // Architectural style overlay across the open bays
        if (style === 'louvered') {
          ctx.fillStyle = shadeHex('#8f6847', 1.05);
          for (let x = 4; x < w; x += 10) {
            ctx.fillRect(x, openY - 2, 4, openH + 4);
          }
        } else if (style === 'brick') {
          // Subtle brick mortar on spandrel + heavy masonry piers
          ctx.fillStyle = shadeHex(color, 0.86);
          ctx.fillRect(0, y0 + levelH * 0.62, w, 2);
          ctx.fillRect(0, y0 + levelH * 0.82, w, 2);
        }

        // Structural vertical piers between bays
        const pierW = style === 'brick' ? 14 : 10;
        ctx.fillStyle = shadeHex(color, 0.94);
        for (let c = 0; c <= cols; c++) {
          ctx.fillRect(c * colW - pierW * 0.5, y0, pierW, levelH);
        }

        // Crisp concrete slab edge highlight
        ctx.fillStyle = shadeHex(color, 1.08);
        ctx.fillRect(0, y0 + levelH * 0.58, w, Math.max(3, levelH * 0.08));
      }
    },
    1,
    repeatY
  );

  let emissiveMap = null;
  if (isNight) {
    emissiveMap = makeCanvasTexture(
      `${baseKey}:emissive`,
      256,
      512,
      (ctx, w, h) => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);
        const levelH = h / tileLevels;
        const cols = 4;
        const colW = w / cols;
        ctx.fillStyle = '#ffdf9e';
        for (let lv = 0; lv < tileLevels; lv++) {
          const openY = lv * levelH + levelH * 0.16;
          const stripH = Math.max(4, levelH * 0.09);
          for (let c = 0; c < cols; c++) {
            ctx.fillRect(c * colW + colW * 0.22, openY, colW * 0.56, stripH);
          }
        }
      },
      1,
      repeatY
    );
  }

  const mat = new THREE.MeshStandardMaterial({
    map,
    emissive: isNight ? new THREE.Color('#ffda8c') : new THREE.Color('#000000'),
    emissiveMap,
    emissiveIntensity: isNight ? 1.15 : 0,
    roughness: 0.84,
    metalness: 0.06,
  });
  materialCache.set(matKey, mat);
  return mat;
}

export function getParkingSignMaterial(isNight = false) {
  const key = `parksign:${isNight ? 'N' : 'D'}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const map = makeCanvasTexture(key, 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1d5fa7';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 82px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', w * 0.5, h * 0.54);
  });
  const mat = new THREE.MeshStandardMaterial({
    map,
    emissive: isNight ? new THREE.Color('#4ca6ff') : new THREE.Color('#000000'),
    emissiveMap: isNight ? map : null,
    emissiveIntensity: isNight ? 1.15 : 0,
    roughness: 0.35,
    metalness: 0.1,
  });
  materialCache.set(key, mat);
  return mat;
}
