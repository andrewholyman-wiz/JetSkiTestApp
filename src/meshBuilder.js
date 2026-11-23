import * as THREE from 'three';
import { TILE_SIZE, FOLIAGE_PALETTES } from './catalog.js';
import {
  getFacadeMaterial,
  getAsphaltMaterial,
  getPedestrianPavingMaterial,
  getPlazaStoneMaterial,
  getStandardMaterial,
  getWaterMaterial,
} from './textures.js';

// Shared unit geometries (reused across all tiles for minimal memory & high FPS)
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
const UNIT_CONE = new THREE.ConeGeometry(0.5, 1, 7);
const UNIT_SPHERE = new THREE.IcosahedronGeometry(0.5, 1);
const UNIT_RING = new THREE.CylinderGeometry(0.5, 0.5, 1, 16, 1, true);

function makeBox(w, h, d, mat, x = 0, y = 0, z = 0, cast = true, receive = true) {
  const m = new THREE.Mesh(UNIT_BOX, mat);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

function makeCyl(rTop, rBot, h, mat, x = 0, y = 0, z = 0, cast = true, receive = true) {
  const m = new THREE.Mesh(UNIT_CYL, mat);
  const r = (rTop + rBot) * 0.5;
  m.scale.set(r * 2, h, r * 2);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

function makeTree(group, x, z, scale = 1, season = 'spring', pine = false) {
  const palette = FOLIAGE_PALETTES[season]?.colors || FOLIAGE_PALETTES.spring.colors;
  const colorIdx = Math.abs(Math.round((x * 17 + z * 31) * 10)) % palette.length;
  const leafMat = getStandardMaterial(palette[colorIdx], 0.88, 0.0);
  const trunkMat = getStandardMaterial('#6f523b', 0.92, 0.0);

  const trunkH = 0.28 * scale;
  group.add(makeCyl(0.05 * scale, 0.07 * scale, trunkH, trunkMat, x, trunkH * 0.5, z, true, false));

  if (pine || season === 'pine') {
    const c1 = new THREE.Mesh(UNIT_CONE, leafMat);
    c1.scale.set(0.46 * scale, 0.55 * scale, 0.46 * scale);
    c1.position.set(x, trunkH + 0.24 * scale, z);
    c1.castShadow = true;
    group.add(c1);

    const c2 = new THREE.Mesh(UNIT_CONE, leafMat);
    c2.scale.set(0.34 * scale, 0.42 * scale, 0.34 * scale);
    c2.position.set(x, trunkH + 0.48 * scale, z);
    c2.castShadow = true;
    group.add(c2);
  } else {
    const crown = new THREE.Mesh(UNIT_SPHERE, leafMat);
    crown.scale.set(0.44 * scale, 0.4 * scale, 0.44 * scale);
    crown.position.set(x, trunkH + 0.22 * scale, z);
    crown.castShadow = true;
    group.add(crown);

    const crown2 = new THREE.Mesh(UNIT_SPHERE, leafMat);
    crown2.scale.set(0.28 * scale, 0.26 * scale, 0.28 * scale);
    crown2.position.set(x + 0.1 * scale, trunkH + 0.34 * scale, z - 0.06 * scale);
    crown2.castShadow = true;
    group.add(crown2);
  }
}

function makeStreetLamp(group, x, z, isNight) {
  const poleMat = getStandardMaterial('#363d47', 0.5, 0.55);
  const bulbMat = isNight
    ? getStandardMaterial('#fff1c2', 0.2, 0.0, '#ffd470', 2.4)
    : getStandardMaterial('#dce4ec', 0.3, 0.1);

  group.add(makeCyl(0.025, 0.032, 0.62, poleMat, x, 0.35, z, true, false));
  group.add(makeBox(0.11, 0.04, 0.11, bulbMat, x, 0.67, z, false, false));
}

function makeBench(group, x, z, rotY = 0) {
  const woodMat = getStandardMaterial('#8d6241', 0.82, 0.02);
  const ironMat = getStandardMaterial('#343a44', 0.6, 0.4);
  const b = new THREE.Group();
  b.position.set(x, 0.08, z);
  b.rotation.y = rotY;
  b.add(makeBox(0.34, 0.04, 0.12, woodMat, 0, 0.09, 0, true, true));
  b.add(makeBox(0.34, 0.08, 0.03, woodMat, 0, 0.15, -0.05, true, true));
  b.add(makeBox(0.04, 0.09, 0.1, ironMat, -0.13, 0.045, 0, false, false));
  b.add(makeBox(0.04, 0.09, 0.1, ironMat, 0.13, 0.045, 0, false, false));
  group.add(b);
}

// ============================================================================
// 1. ROAD (Auto-connecting Straight / Turn / T / 4-Way Crosswalk)
// ============================================================================
function buildRoad(opts, neighbors, isNight) {
  const g = new THREE.Group();
  const s = TILE_SIZE;
  const sidewalkMat = getStandardMaterial('#c6c1b7', 0.88, 0.02);
  const asphaltMat = getAsphaltMaterial();
  const lineMat = getStandardMaterial('#e8e4d8', 0.75, 0.0);
  const yellowMat = getStandardMaterial('#e5b94c', 0.75, 0.0);

  const { n, e, s: so, w } = neighbors;
  const connCount = (n ? 1 : 0) + (e ? 1 : 0) + (so ? 1 : 0) + (w ? 1 : 0);

  // Full tile sidewalk base
  g.add(makeBox(s, 0.08, s, sidewalkMat, 0, 0.04, 0, false, true));

  // Road surface dimensions
  const roadW = 1.26;
  const half = s * 0.5;
  const roadY = 0.086;

  // Center asphalt square
  g.add(makeBox(roadW, 0.02, roadW, asphaltMat, 0, roadY, 0, false, true));

  // Extend arms toward connected road neighbors (or straight E-W if isolated)
  const armN = n;
  const armS = so;
  const armE = e || connCount === 0;
  const armW = w || connCount === 0;

  const armLen = (s - roadW) * 0.5 + 0.02;
  const armOff = (roadW + armLen) * 0.5 - 0.01;

  if (armN) g.add(makeBox(roadW, 0.02, armLen, asphaltMat, 0, roadY, -armOff, false, true));
  if (armS) g.add(makeBox(roadW, 0.02, armLen, asphaltMat, 0, roadY, armOff, false, true));
  if (armE) g.add(makeBox(armLen, 0.02, roadW, asphaltMat, armOff, roadY, 0, false, true));
  if (armW) g.add(makeBox(armLen, 0.02, roadW, asphaltMat, -armOff, roadY, 0, false, true));

  // Lane markings & crosswalks
  const markY = 0.098;
  const isIntersection = connCount >= 3;
  const isStraightNS = armN && armS && !armE && !armW;
  const isStraightEW = armE && armW && !armN && !armS;

  if (isStraightNS) {
    for (let dz = -0.6; dz <= 0.6; dz += 0.6) {
      g.add(makeBox(0.05, 0.008, 0.34, yellowMat, 0, markY, dz, false, false));
    }
  } else if (isStraightEW) {
    for (let dx = -0.6; dx <= 0.6; dx += 0.6) {
      g.add(makeBox(0.34, 0.008, 0.05, yellowMat, dx, markY, 0, false, false));
    }
  } else if (isIntersection) {
    // Crisp white zebra crosswalk stripes on connected arms
    const drawCrosswalk = (axis, sign) => {
      for (let k = -0.42; k <= 0.43; k += 0.21) {
        if (axis === 'z') {
          g.add(makeBox(0.11, 0.008, 0.26, lineMat, k, markY, sign * 0.72, false, false));
        } else {
          g.add(makeBox(0.26, 0.008, 0.11, lineMat, sign * 0.72, markY, k, false, false));
        }
      }
    };
    if (armN) drawCrosswalk('z', -1);
    if (armS) drawCrosswalk('z', 1);
    if (armE) drawCrosswalk('x', 1);
    if (armW) drawCrosswalk('x', -1);
  }

  // Streetlamps on sidewalk corners
  if (opts.lamps) {
    const cornerOff = half - 0.18;
    if (isStraightEW) {
      makeStreetLamp(g, 0, -cornerOff, isNight);
    } else if (isStraightNS) {
      makeStreetLamp(g, cornerOff, 0, isNight);
    } else {
      makeStreetLamp(g, cornerOff, -cornerOff, isNight);
    }
  }

  // Optional boulevard sidewalk trees on straight segments
  if (opts.boulevardTrees) {
    const cornerOff = half - 0.19;
    if (isStraightEW) {
      makeTree(g, -0.55, cornerOff, 0.62, 'spring');
      makeTree(g, 0.55, -cornerOff, 0.62, 'spring');
    } else if (isStraightNS) {
      makeTree(g, -cornerOff, -0.55, 0.62, 'spring');
      makeTree(g, cornerOff, 0.55, 0.62, 'spring');
    }
  }

  return g;
}

// ============================================================================
// 1b. PEDESTRIAN STREET (Auto-connecting car-free promenade & cycle track)
// ============================================================================
function buildPedestrianStreet(opts, neighbors, isNight) {
  const g = new THREE.Group();
  const s = TILE_SIZE;
  const half = s * 0.5;

  const borderMat = getStandardMaterial('#d8d3c8', 0.88, 0.02);
  const pavingMat = getPedestrianPavingMaterial(opts.paving || 'cobble');
  const cycleMat = getStandardMaterial(opts.paving === 'brick' ? '#3d7866' : '#a85545', 0.82, 0.02);
  const stripeMat = getStandardMaterial('#f0ece2', 0.72, 0.0);
  const planterMat = getStandardMaterial('#9d978c', 0.86, 0.02);
  const shrubMat = getStandardMaterial('#4d8749', 0.9, 0.0);
  const bollardMat = getStandardMaterial('#363d47', 0.45, 0.55);

  const { n, e, s: so, w, roadN, roadE, roadS, roadW } = neighbors;
  const connCount = (n ? 1 : 0) + (e ? 1 : 0) + (so ? 1 : 0) + (w ? 1 : 0);

  // Full-tile raised stone sidewalk bed
  g.add(makeBox(s, 0.08, s, borderMat, 0, 0.04, 0, false, true));

  // Main paved promenade corridor (mirrors road auto-connection logic)
  const promW = 1.38;
  const promY = 0.086;
  g.add(makeBox(promW, 0.02, promW, pavingMat, 0, promY, 0, false, true));

  const armN = n;
  const armS = so;
  const armE = e || connCount === 0;
  const armW = w || connCount === 0;

  const armLen = (s - promW) * 0.5 + 0.02;
  const armOff = (promW + armLen) * 0.5 - 0.01;

  if (armN) g.add(makeBox(promW, 0.02, armLen, pavingMat, 0, promY, -armOff, false, true));
  if (armS) g.add(makeBox(promW, 0.02, armLen, pavingMat, 0, promY, armOff, false, true));
  if (armE) g.add(makeBox(armLen, 0.02, promW, pavingMat, armOff, promY, 0, false, true));
  if (armW) g.add(makeBox(armLen, 0.02, promW, pavingMat, -armOff, promY, 0, false, true));

  // Dedicated Cycle Track running smoothly through straights, corners & junctions
  const cycleY = 0.098;
  const cycleW = 0.36;
  const cycleArmLen = (s - cycleW) * 0.5 + 0.02;
  const cycleArmOff = (cycleW + cycleArmLen) * 0.5 - 0.01;

  if (opts.bikeLane) {
    g.add(makeBox(cycleW, 0.008, cycleW, cycleMat, 0, cycleY, 0, false, true));
    if (armN) g.add(makeBox(cycleW, 0.008, cycleArmLen, cycleMat, 0, cycleY, -cycleArmOff, false, true));
    if (armS) g.add(makeBox(cycleW, 0.008, cycleArmLen, cycleMat, 0, cycleY, cycleArmOff, false, true));
    if (armE) g.add(makeBox(cycleArmLen, 0.008, cycleW, cycleMat, cycleArmOff, cycleY, 0, false, true));
    if (armW) g.add(makeBox(cycleArmLen, 0.008, cycleW, cycleMat, -cycleArmOff, cycleY, 0, false, true));

    // Crisp dashed center divider along straight cycle tracks
    const isStraightNS = armN && armS && !armE && !armW;
    const isStraightEW = armE && armW && !armN && !armS;
    if (isStraightNS) {
      for (let dz = -0.6; dz <= 0.6; dz += 0.6) {
        g.add(makeBox(0.03, 0.006, 0.24, stripeMat, 0, cycleY + 0.004, dz, false, false));
      }
    } else if (isStraightEW) {
      for (let dx = -0.6; dx <= 0.6; dx += 0.6) {
        g.add(makeBox(0.24, 0.006, 0.03, stripeMat, dx, cycleY + 0.004, 0, false, false));
      }
    }
  } else if (connCount >= 3) {
    // Decorative stone intersection medallion on car-free junctions without bike track
    g.add(makeCyl(0.32, 0.34, 0.012, borderMat, 0, cycleY, 0, false, true));
  }

  // Retractable traffic bollards where pedestrian street borders a car road (keeps cars out!)
  const addBollards = (axis, sign) => {
    for (const k of [-0.46, -0.15, 0.15, 0.46]) {
      const bx = axis === 'z' ? k : sign * (half - 0.09);
      const bz = axis === 'z' ? sign * (half - 0.09) : k;
      g.add(makeCyl(0.032, 0.036, 0.2, bollardMat, bx, 0.18, bz, true, false));
      if (isNight) {
        const cap = getStandardMaterial('#ffdf99', 0.2, 0.0, '#ffcb66', 2.0);
        g.add(makeCyl(0.03, 0.03, 0.03, cap, bx, 0.285, bz, false, false));
      }
    }
  };
  if (roadN) addBollards('z', -1);
  if (roadS) addBollards('z', 1);
  if (roadE) addBollards('x', 1);
  if (roadW) addBollards('x', -1);

  // Corner promenade lamps (placed only on free sidewalk corners)
  const cornerOff = half - 0.15;
  if (opts.lamps) {
    makeStreetLamp(g, cornerOff, -cornerOff, isNight);
    if (connCount <= 2) {
      makeStreetLamp(g, -cornerOff, cornerOff, isNight);
    }
  }

  // Side planters & benches along free borders (staying clear of connected arms)
  if (opts.planters) {
    const addPlanter = (px, pz) => {
      g.add(makeBox(0.22, 0.12, 0.22, planterMat, px, 0.14, pz, true, true));
      g.add(makeBox(0.16, 0.11, 0.16, shrubMat, px, 0.22, pz, true, false));
    };
    const isStraightEW = armE && armW && !armN && !armS;
    const isStraightNS = armN && armS && !armE && !armW;
    if (isStraightEW) {
      addPlanter(-0.58, -cornerOff);
      addPlanter(0.58, cornerOff);
      makeBench(g, 0, -cornerOff + 0.02, 0);
    } else if (isStraightNS) {
      addPlanter(-cornerOff, -0.58);
      addPlanter(cornerOff, 0.58);
      makeBench(g, -cornerOff + 0.02, 0, Math.PI / 2);
    } else {
      // Corner / junction accent planter on opposite free corners
      if (!armN && !armW) addPlanter(-cornerOff, -cornerOff);
      if (!armS && !armE) addPlanter(cornerOff, cornerOff);
      if (!armN && !armE) addPlanter(cornerOff, -cornerOff);
      if (!armS && !armW) addPlanter(-cornerOff, cornerOff);
    }
  }

  return g;
}

// ============================================================================
// 2. PLAZA
// ============================================================================
function buildPlaza(opts, isNight) {
  const g = new THREE.Group();
  const s = TILE_SIZE;
  g.add(makeBox(s, 0.09, s, getPlazaStoneMaterial(), 0, 0.045, 0, false, true));

  const planterStone = getStandardMaterial('#aba498', 0.85, 0.02);
  const soilMat = getStandardMaterial('#5c4a38', 0.95, 0.0);

  if (opts.centerpiece === 'planter') {
    g.add(makeBox(0.68, 0.16, 0.68, planterStone, 0, 0.16, 0));
    g.add(makeBox(0.56, 0.17, 0.56, soilMat, 0, 0.165, 0, false, true));
    makeTree(g, 0, 0, 0.85, 'spring');
    makeBench(g, 0, 0.62, 0);
    makeBench(g, 0, -0.62, Math.PI);
  } else if (opts.centerpiece === 'kiosk') {
    const kioskBase = getStandardMaterial('#e4ddd0', 0.78, 0.04);
    const roofMat = getStandardMaterial('#2f6f4e', 0.7, 0.06);
    const counterGlow = isNight
      ? getStandardMaterial('#ffdf9c', 0.3, 0.0, '#ffcb6b', 1.6)
      : getStandardMaterial('#3f5568', 0.3, 0.2);
    g.add(makeBox(0.74, 0.52, 0.62, kioskBase, 0, 0.35, -0.1));
    g.add(makeBox(0.62, 0.26, 0.64, counterGlow, 0, 0.42, -0.1, false, false));
    g.add(makeBox(0.92, 0.08, 0.82, roofMat, 0, 0.65, -0.1));
    makeBench(g, -0.45, 0.58, 0.3);
    makeBench(g, 0.45, 0.58, -0.3);
  } else if (opts.centerpiece === 'clock') {
    const bronze = getStandardMaterial('#4b535e', 0.45, 0.55);
    const face = isNight
      ? getStandardMaterial('#fff3cf', 0.2, 0.0, '#ffe199', 1.8)
      : getStandardMaterial('#f4f1ea', 0.5, 0.0);
    g.add(makeBox(0.46, 0.14, 0.46, planterStone, 0, 0.16, 0));
    g.add(makeBox(0.22, 1.35, 0.22, bronze, 0, 0.88, 0));
    g.add(makeBox(0.26, 0.22, 0.26, face, 0, 1.42, 0));
    makeStreetLamp(g, 0.65, 0.65, isNight);
    makeStreetLamp(g, -0.65, -0.65, isNight);
  } else {
    makeBench(g, -0.58, 0.58, Math.PI * 0.25);
    makeBench(g, 0.58, -0.58, -Math.PI * 0.75);
  }
  return g;
}

// ============================================================================
// 3. WATER (Auto-blending canal & stone embankment walls)
// ============================================================================
function buildWater(opts, neighbors, isNight) {
  const g = new THREE.Group();
  const s = TILE_SIZE;
  const wallMat = getStandardMaterial('#9d978c', 0.86, 0.03);
  const waterMat = getWaterMaterial(isNight);

  // Recessed water plane
  const waterMesh = makeBox(s, 0.04, s, waterMat, 0, 0.025, 0, false, true);
  waterMesh.userData.isWater = true;
  g.add(waterMesh);

  // Stone embankment edges on sides NOT bordering water
  const edgeT = 0.14;
  const edgeH = 0.1;
  const half = s * 0.5 - edgeT * 0.5;
  if (!neighbors.n) g.add(makeBox(s, edgeH, edgeT, wallMat, 0, edgeH * 0.5, -half));
  if (!neighbors.s) g.add(makeBox(s, edgeH, edgeT, wallMat, 0, edgeH * 0.5, half));
  if (!neighbors.e) g.add(makeBox(edgeT, edgeH, s, wallMat, half, edgeH * 0.5, 0));
  if (!neighbors.w) g.add(makeBox(edgeT, edgeH, s, wallMat, -half, edgeH * 0.5, 0));

  if (opts.dock) {
    const wood = getStandardMaterial('#8f6845', 0.88, 0.0);
    g.add(makeBox(0.54, 0.05, 0.96, wood, 0, 0.09, 0.2));
    g.add(makeCyl(0.03, 0.03, 0.22, wood, -0.22, 0.14, -0.22));
    g.add(makeCyl(0.03, 0.03, 0.22, wood, 0.22, 0.14, -0.22));
  }
  return g;
}

// ============================================================================
// 4. APARTMENT BLOCK (2–24 Stories, Customizable Density, Style, Roof & Retail)
// ============================================================================
function buildApartment(opts, isNight) {
  const g = new THREE.Group();
  const s = TILE_SIZE;
  const floors = Math.max(2, Math.min(24, Number(opts.floors) || 6));
  const density = opts.density || 'medium';
  const style = opts.style || 'brick';
  const color = opts.color || '#b96b52';
  const roofStyle = opts.roofStyle || 'terrace';

  // Lot base (low density includes green setback yard & trees)
  if (density === 'low') {
    g.add(makeBox(s, 0.06, s, getStandardMaterial('#7ea463', 0.93, 0.0), 0, 0.03, 0, false, true));
    g.add(makeBox(1.36, 0.08, 1.32, getStandardMaterial('#c7c2b8', 0.9, 0.0), 0, 0.04, 0, false, true));
    makeTree(g, -0.74, 0.72, 0.56, 'spring');
    makeTree(g, 0.74, -0.72, 0.52, 'spring');
  } else {
    g.add(makeBox(s, 0.08, s, getStandardMaterial('#c7c2b8', 0.9, 0.0), 0, 0.04, 0, false, true));
  }

  const floorH = 0.32;
  const isUltra = density === 'ultra';
  const bodyW = density === 'low' ? 1.16 : density === 'high' ? 1.78 : isUltra ? 1.86 : 1.54;
  const bodyD = density === 'low' ? 1.08 : density === 'high' ? 1.7 : isUltra ? 1.76 : 1.42;
  const winCols = density === 'low' ? 3 : density === 'high' ? 5 : isUltra ? 4 : 4;

  // Optional Ground-Floor Retail Podium
  let baseY = 0.08;
  const upperFloors = opts.groundRetail ? Math.max(1, floors - 1) : floors;
  if (opts.groundRetail) {
    const retailH = 0.44;
    const stoneMat = getStandardMaterial('#505863', 0.72, 0.08);
    const shopWindowMat = isNight
      ? getStandardMaterial('#ffe6a8', 0.25, 0.1, '#ffd075', 1.45)
      : getStandardMaterial('#3d5a73', 0.22, 0.3);
    const awningMat = getStandardMaterial('#2f6f4e', 0.78, 0.02);

    g.add(makeBox(bodyW + 0.05, retailH, bodyD + 0.05, stoneMat, 0, baseY + retailH * 0.5, 0));
    g.add(makeBox(bodyW - 0.16, retailH * 0.62, bodyD + 0.07, shopWindowMat, 0, baseY + retailH * 0.44, 0, false, false));
    const awning = makeBox(bodyW + 0.03, 0.06, 0.22, awningMat, 0, baseY + retailH - 0.04, bodyD * 0.5 + 0.1);
    awning.rotation.x = 0.26;
    g.add(awning);
    baseY += retailH;
  }

  const upperH = upperFloors * floorH;
  const facadeMat = getFacadeMaterial({
    style,
    color,
    cols: winCols,
    rows: upperFloors,
    isNight,
    isGlass: style === 'modern',
  });
  const solidWall = getStandardMaterial(color, 0.82, 0.04);
  const roofMat = getStandardMaterial('#787e87', 0.85, 0.05);
  const trimMat = getStandardMaterial('#e5e0d5', 0.78, 0.04);
  const materials = [facadeMat, facadeMat, roofMat, solidWall, facadeMat, facadeMat];
  const topY = baseY + upperH;

  if (isUltra) {
    // Ultra-density twin parallel residential slabs with narrow sunlit courtyard slot
    const slabW = 0.84;
    for (const sx of [-0.49, 0.49]) {
      const slab = new THREE.Mesh(UNIT_BOX, materials);
      slab.scale.set(slabW, upperH, bodyD);
      slab.position.set(sx, baseY + upperH * 0.5, 0);
      slab.castShadow = true;
      slab.receiveShadow = true;
      g.add(slab);
      g.add(makeBox(slabW + 0.05, 0.06, bodyD + 0.05, trimMat, sx, topY + 0.02, 0));
    }
    // Central elevator core bridge linking the twin slabs
    g.add(makeBox(0.24, upperH * 0.92, 0.54, trimMat, 0, baseY + upperH * 0.46, 0));
  } else {
    const tower = new THREE.Mesh(UNIT_BOX, materials);
    tower.scale.set(bodyW, upperH, bodyD);
    tower.position.set(0, baseY + upperH * 0.5, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    g.add(tower);
    g.add(makeBox(bodyW + 0.06, 0.06, bodyD + 0.06, trimMat, 0, topY + 0.02, 0));
  }

  // Optional 3D Balconies (stepped cleanly on tall apartments for low draw calls)
  if (opts.balconies) {
    const slabMat = getStandardMaterial('#d8d3c8', 0.8, 0.04);
    const railMat = getStandardMaterial('#3f4854', 0.4, 0.5);
    const step = Math.max(1, Math.ceil(upperFloors / 7));
    const bxOffsets = density === 'low' ? [0] : isUltra ? [-0.49, 0.49] : [-bodyW * 0.26, bodyW * 0.26];
    const balW = density === 'low' ? 0.56 : isUltra ? 0.54 : 0.44;
    for (let fl = 0; fl < upperFloors; fl += step) {
      const by = baseY + (fl + 0.18) * floorH;
      for (const bx of bxOffsets) {
        g.add(makeBox(balW, 0.04, 0.18, slabMat, bx, by, bodyD * 0.5 + 0.08, true, true));
        g.add(makeBox(balW, 0.1, 0.025, railMat, bx, by + 0.07, bodyD * 0.5 + 0.16, false, false));
      }
    }
  }

  // Customizable Roof Styles
  if (roofStyle === 'terrace') {
    const hvacMat = getStandardMaterial('#9aa2ab', 0.65, 0.25);
    g.add(makeBox(0.42, 0.18, 0.34, hvacMat, -0.34, topY + 0.13, -0.18));
    g.add(makeBox(0.24, 0.24, 0.24, trimMat, 0.38, topY + 0.16, 0.2));
  } else if (roofStyle === 'green') {
    const turfMat = getStandardMaterial('#5c9652', 0.9, 0.0);
    if (isUltra) {
      for (const sx of [-0.49, 0.49]) {
        g.add(makeBox(0.7, 0.06, bodyD - 0.2, turfMat, sx, topY + 0.07, 0, false, true));
        makeTree(g, sx, -0.22, 0.42, 'spring');
      }
    } else {
      g.add(makeBox(bodyW - 0.16, 0.06, bodyD - 0.16, turfMat, 0, topY + 0.07, 0, false, true));
      makeTree(g, -bodyW * 0.24, -0.22, 0.46, 'spring');
      makeTree(g, bodyW * 0.24, 0.2, 0.42, 'spring');
      g.add(makeBox(0.24, 0.06, 0.44, trimMat, 0, topY + 0.08, 0.15));
    }
  } else if (roofStyle === 'penthouse') {
    const phGlass = getFacadeMaterial({ style: 'modern', color: '#6b8da6', cols: 3, rows: 1, isNight, isGlass: true });
    if (isUltra) {
      for (const sx of [-0.49, 0.49]) {
        g.add(makeBox(0.58, 0.34, bodyD * 0.62, phGlass, sx, topY + 0.21, -0.05));
        g.add(makeBox(0.66, 0.05, bodyD * 0.68, trimMat, sx, topY + 0.4, -0.05));
      }
    } else {
      g.add(makeBox(bodyW * 0.64, 0.36, bodyD * 0.62, phGlass, 0, topY + 0.22, -0.06));
      g.add(makeBox(bodyW * 0.72, 0.05, bodyD * 0.7, trimMat, 0, topY + 0.42, -0.06));
    }
  } else if (roofStyle === 'gable') {
    const gableMat = getStandardMaterial('#545e6b', 0.82, 0.06);
    if (isUltra) {
      for (const sx of [-0.49, 0.49]) {
        const peak = new THREE.Mesh(new THREE.ConeGeometry(0.64, 0.48, 4), gableMat);
        peak.rotation.y = Math.PI * 0.25;
        peak.position.set(sx, topY + 0.28, 0);
        peak.scale.set(0.95, 1, 1.9);
        peak.castShadow = true;
        g.add(peak);
      }
    } else {
      const roofPeak = new THREE.Mesh(new THREE.ConeGeometry(bodyW * 0.69, 0.54, 4), gableMat);
      roofPeak.rotation.y = Math.PI * 0.25;
      roofPeak.position.set(0, topY + 0.31, 0);
      roofPeak.scale.set(1.04, 1, bodyD / bodyW);
      roofPeak.castShadow = true;
      roofPeak.receiveShadow = true;
      g.add(roofPeak);
    }
  }

  return g;
}

// ============================================================================
// 4b. RESIDENTIAL HIGH-RISE (10–60 Stories, Density & Skyscraper Massing)
// ============================================================================
function buildResidentialHighRise(opts, isNight) {
  const g = new THREE.Group();
  const s = TILE_SIZE;
  const floors = Math.max(10, Math.min(60, Number(opts.floors) || 26));
  const density = opts.density || 'medium';
  const massing = opts.massing || 'point';
  const style = opts.style || 'modern';
  const color = opts.color || '#6d98b5';
  const crown = opts.crown || 'penthouse';

  const isGlass = style === 'modern';
  const floorH = 0.285;

  // Lot base — low density sits in a landscaped residential pocket park
  if (density === 'low') {
    g.add(makeBox(s, 0.07, s, getStandardMaterial('#76a15c', 0.92, 0.0), 0, 0.035, 0, false, true));
    g.add(makeBox(1.38, 0.09, 1.38, getPlazaStoneMaterial(), 0, 0.045, 0, false, true));
    makeTree(g, -0.76, -0.74, 0.56, 'spring');
    makeTree(g, 0.76, 0.74, 0.52, 'spring');
  } else {
    g.add(makeBox(s, 0.09, s, getPlazaStoneMaterial(), 0, 0.045, 0, false, true));
  }

  const trimMat = getStandardMaterial('#dfe3e8', 0.65, 0.18);
  const frameMat = getStandardMaterial('#3d4652', 0.45, 0.4);
  const roofMat = getStandardMaterial('#646d7a', 0.78, 0.14);
  const podiumW = density === 'low' ? 1.24 : density === 'high' ? 1.8 : density === 'ultra' ? 1.9 : 1.6;
  const podiumD = density === 'low' ? 1.22 : density === 'high' ? 1.76 : density === 'ultra' ? 1.88 : 1.56;

  let baseY = 0.09;
  const towerFloors = opts.groundRetail ? Math.max(8, floors - 2) : floors;
  if (opts.groundRetail) {
    const podiumH = 0.54;
    const stoneMat = getStandardMaterial('#4c5561', 0.7, 0.12);
    const lobbyGlass = isNight
      ? getStandardMaterial('#ffebb3', 0.2, 0.1, '#ffd478', 1.5)
      : getStandardMaterial('#486882', 0.22, 0.35);
    g.add(makeBox(podiumW, podiumH, podiumD, stoneMat, 0, baseY + podiumH * 0.5, 0));
    g.add(makeBox(podiumW - 0.18, podiumH * 0.62, podiumD + 0.03, lobbyGlass, 0, baseY + podiumH * 0.46, 0, false, false));
    g.add(makeBox(podiumW + 0.04, 0.06, podiumD + 0.04, trimMat, 0, baseY + podiumH + 0.02, 0));
    baseY += podiumH + 0.02;
  }

  const towerH = towerFloors * floorH;
  const cols = density === 'low' ? 4 : density === 'high' ? 6 : density === 'ultra' ? 7 : 5;
  const makeMat = (rowsCount, colOverride) =>
    getFacadeMaterial({
      style,
      color,
      cols: colOverride || cols,
      rows: Math.max(2, Math.round(rowsCount)),
      isNight,
      isGlass,
    });

  const addTowerBlock = (w, h, d, rowsCount, x, yBot, z, colOverride) => {
    const fMat = makeMat(rowsCount, colOverride);
    const mats = [fMat, fMat, roofMat, frameMat, fMat, fMat];
    const m = new THREE.Mesh(UNIT_BOX, mats);
    m.scale.set(w, h, d);
    m.position.set(x, yBot + h * 0.5, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  };

  const wScale = density === 'low' ? 0.78 : density === 'high' ? 1.18 : density === 'ultra' ? 1.26 : 1.0;
  let topY = baseY + towerH;
  let crownW = 1.16 * wScale;
  let crownD = 1.12 * wScale;
  let crownX = 0;
  let crownZ = 0;
  let steppedWidths = null;
  let twinInfo = null;

  if (massing === 'stepped') {
    // 3-tier residential setback skyscraper
    const f1 = Math.round(towerFloors * 0.46);
    const f2 = Math.round(towerFloors * 0.32);
    const f3 = Math.max(2, towerFloors - f1 - f2);
    const h1 = f1 * floorH;
    const h2 = f2 * floorH;
    const h3 = f3 * floorH;
    const w1 = Math.min(1.82, 1.38 * wScale);
    const w2 = w1 * 0.78;
    const w3 = w1 * 0.58;
    steppedWidths = { w1, w2, w3 };

    addTowerBlock(w1, h1, w1 * 0.96, f1, 0, baseY, 0, cols);
    g.add(makeBox(w1 + 0.05, 0.06, w1 * 0.96 + 0.05, trimMat, 0, baseY + h1, 0));
    addTowerBlock(w2, h2, w2 * 0.96, f2, 0, baseY + h1, 0, Math.max(3, cols - 1));
    g.add(makeBox(w2 + 0.05, 0.06, w2 * 0.96 + 0.05, trimMat, 0, baseY + h1 + h2, 0));
    addTowerBlock(w3, h3, w3 * 0.96, f3, 0, baseY + h1 + h2, 0, Math.max(3, cols - 2));

    topY = baseY + h1 + h2 + h3;
    crownW = w3;
    crownD = w3 * 0.96;
  } else if (massing === 'twin' || massing === 'skybridge') {
    const wingW = Math.min(0.84, 0.62 * wScale);
    const wingD = Math.min(1.66, 1.24 * wScale);
    const sep = Math.max(0.42, wingW * 0.5 + 0.14);
    const hA = towerH;
    const fB = massing === 'skybridge' ? towerFloors : Math.max(6, Math.round(towerFloors * 0.84));
    const hB = fB * floorH;
    twinInfo = { wingW, wingD, sep, hB };

    addTowerBlock(wingW, hA, wingD, towerFloors, -sep, baseY, 0, Math.max(3, cols - 2));
    addTowerBlock(wingW, hB, wingD, fB, sep, baseY, 0, Math.max(3, cols - 2));
    g.add(makeBox(wingW + 0.04, 0.05, wingD + 0.04, trimMat, sep, baseY + hB + 0.02, 0));

    if (massing === 'skybridge') {
      const bridgeY = baseY + towerH * 0.64;
      const bridgeGlass = isNight
        ? getStandardMaterial('#ffebb3', 0.2, 0.1, '#ffd478', 1.45)
        : getStandardMaterial('#6f9ab8', 0.2, 0.35);
      const bridgeSpan = sep * 2 - wingW + 0.08;
      g.add(makeBox(bridgeSpan, 0.44, wingD * 0.56, bridgeGlass, 0, bridgeY, 0));
      g.add(makeBox(bridgeSpan + 0.06, 0.06, wingD * 0.62, trimMat, 0, bridgeY + 0.24, 0));
      g.add(makeBox(bridgeSpan + 0.06, 0.06, wingD * 0.62, trimMat, 0, bridgeY - 0.24, 0));
    }
    crownX = -sep;
    crownW = wingW;
    crownD = wingD;
    topY = baseY + hA;
  } else {
    // Point tower (ultra density adds a staggered companion tower!)
    if (density === 'ultra') {
      const mainW = 1.06;
      const mainD = 1.18;
      const sideW = 0.72;
      const sideD = 1.04;
      const sideF = Math.max(8, Math.round(towerFloors * 0.76));
      const sideH = sideF * floorH;
      addTowerBlock(mainW, towerH, mainD, towerFloors, -0.34, baseY, -0.14, 5);
      addTowerBlock(sideW, sideH, sideD, sideF, 0.52, baseY, 0.26, 4);
      g.add(makeBox(sideW + 0.05, 0.05, sideD + 0.05, trimMat, 0.52, baseY + sideH + 0.02, 0.26));
      crownX = -0.34;
      crownZ = -0.14;
      crownW = mainW;
      crownD = mainD;
    } else {
      const w = Math.min(1.66, 1.24 * wScale);
      const d = Math.min(1.56, 1.16 * wScale);
      addTowerBlock(w, towerH, d, towerFloors, 0, baseY, 0, cols);
      // Mid-height architectural mechanical band on supertalls (>= 34 floors)
      if (towerFloors >= 34) {
        g.add(makeBox(w + 0.04, 0.2, d + 0.04, frameMat, 0, baseY + towerH * 0.52, 0));
      }
      crownW = w;
      crownD = d;
    }
    topY = baseY + towerH;
  }

  // Sky-loggia horizontal balcony bands (capped at 7 bands for silky 60 FPS even at 60 floors!)
  if (opts.balconies) {
    const slabMat = getStandardMaterial('#dfe3e8', 0.72, 0.12);
    const bandCount = Math.min(7, Math.max(3, Math.floor(towerFloors / 5)));
    for (let i = 1; i <= bandCount; i++) {
      const frac = i / (bandCount + 1);
      const by = baseY + towerH * frac;
      if (steppedWidths) {
        const tierW = frac < 0.45 ? steppedWidths.w1 : frac < 0.77 ? steppedWidths.w2 : steppedWidths.w3;
        g.add(makeBox(tierW + 0.12, 0.045, tierW * 0.96 + 0.12, slabMat, 0, by, 0, false, true));
      } else if (twinInfo) {
        g.add(makeBox(twinInfo.wingW + 0.1, 0.045, twinInfo.wingD + 0.1, slabMat, -twinInfo.sep, by, 0, false, true));
        if (by < baseY + twinInfo.hB - 0.12) {
          g.add(makeBox(twinInfo.wingW + 0.1, 0.045, twinInfo.wingD + 0.1, slabMat, twinInfo.sep, by, 0, false, true));
        }
      } else {
        g.add(makeBox(crownW + 0.12, 0.045, crownD + 0.12, slabMat, crownX, by, crownZ, false, true));
      }
    }
  }

  // Rooftop Parapet & Crown
  g.add(makeBox(crownW + 0.06, 0.07, crownD + 0.06, trimMat, crownX, topY + 0.03, crownZ));

  if (crown === 'penthouse') {
    const phGlass = getFacadeMaterial({ style: 'modern', color: '#7ea3bf', cols: 3, rows: 2, isNight, isGlass: true });
    const phH = Math.min(0.75, 0.42 + floors * 0.005);
    g.add(makeBox(crownW * 0.74, phH, crownD * 0.72, phGlass, crownX, topY + 0.06 + phH * 0.5, crownZ));
    g.add(makeBox(crownW * 0.84, 0.06, crownD * 0.82, trimMat, crownX, topY + 0.08 + phH, crownZ));
  } else if (crown === 'garden') {
    g.add(makeBox(crownW - 0.1, 0.06, crownD - 0.1, getStandardMaterial('#5c9652', 0.9, 0.0), crownX, topY + 0.09, crownZ, false, true));
    makeTree(g, crownX - crownW * 0.2, crownZ - crownD * 0.18, 0.42, 'spring');
    makeTree(g, crownX + crownW * 0.2, crownZ + crownD * 0.18, 0.36, 'spring');
  } else if (crown === 'fin') {
    const finH = 0.55 + floors * 0.015;
    const glowMat = isNight
      ? getStandardMaterial('#d8f0ff', 0.2, 0.1, '#8fd3ff', 2.0)
      : trimMat;
    g.add(makeBox(crownW * 0.84, finH * 0.5, crownD * 0.84, roofMat, crownX, topY + 0.06 + finH * 0.25, crownZ));
    g.add(makeBox(crownW * 0.96, finH, 0.08, glowMat, crownX, topY + 0.06 + finH * 0.5, crownZ));
    g.add(makeBox(0.08, finH, crownD * 0.96, glowMat, crownX, topY + 0.06 + finH * 0.5, crownZ));
  } else if (crown === 'spire') {
    const spireH = 0.95 + Math.min(1.6, floors * 0.025);
    g.add(makeBox(crownW * 0.62, 0.32, crownD * 0.62, roofMat, crownX, topY + 0.2, crownZ));
    g.add(makeCyl(0.02, 0.06, spireH, frameMat, crownX, topY + 0.36 + spireH * 0.5, crownZ));
    if (isNight) {
      const beacon = getStandardMaterial('#ff4d4d', 0.2, 0.0, '#ff3b30', 3.2);
      g.add(makeBox(0.08, 0.08, 0.08, beacon, crownX, topY + 0.38 + spireH, crownZ, false, false));
    }
  }

  return g;
}

// ============================================================================
// 5. TOWNHOUSE ROW (1–4 Stories, Detached / Duplex / 3-Unit Rowhome Density)
// ============================================================================
function buildTownhouse(opts, isNight) {
  const g = new THREE.Group();
  const s = TILE_SIZE;
  const floors = Math.max(1, Math.min(4, Number(opts.floors) || 2));
  const density = opts.density || 'medium';
  const color = opts.color || '#dfd7c8';
  const roofColor = opts.roofColor || '#9c4f3d';

  const lawnMat = getStandardMaterial('#7ea463', 0.94, 0.0);
  const pathMat = getStandardMaterial('#cfc8ba', 0.88, 0.0);
  g.add(makeBox(s, 0.06, s, lawnMat, 0, 0.03, 0, false, true));

  const unitH = floors * 0.35 + 0.16;
  const roofMat = getStandardMaterial(roofColor, 0.82, 0.04);
  const doorMat = getStandardMaterial('#594132', 0.78, 0.05);

  const layout =
    density === 'low'
      ? { offsets: [0], unitW: 1.06, unitD: 1.08, cols: 3, coneR: 0.78, coneZScale: 1.08 }
      : density === 'high'
        ? { offsets: [-0.58, 0, 0.58], unitW: 0.56, unitD: 1.18, cols: 2, coneR: 0.48, coneZScale: 1.75 }
        : { offsets: [-0.42, 0.42], unitW: 0.74, unitD: 1.06, cols: 2, coneR: 0.62, coneZScale: 1.32 };

  const facadeMat = getFacadeMaterial({ style: 'brick', color, cols: layout.cols, rows: Math.max(1, floors), isNight });

  for (const xOff of layout.offsets) {
    const house = makeBox(layout.unitW, unitH, layout.unitD, facadeMat, xOff, 0.06 + unitH * 0.5, -0.14);
    g.add(house);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(layout.coneR, 0.42, 4), roofMat);
    roof.rotation.y = Math.PI * 0.25;
    roof.position.set(xOff, 0.06 + unitH + 0.21, -0.14);
    roof.scale.set(0.95, 1, layout.coneZScale);
    roof.castShadow = true;
    g.add(roof);
    g.add(makeBox(0.13, 0.24, 0.04, doorMat, xOff, 0.18, -0.14 + layout.unitD * 0.5 + 0.01));
    g.add(makeBox(0.18, 0.07, 0.52, pathMat, xOff, 0.035, 0.68, false, true));
  }

  if (opts.garden) {
    const hedgeMat = getStandardMaterial('#487c45', 0.9, 0.0);
    g.add(makeBox(1.76, 0.16, 0.14, hedgeMat, 0, 0.14, 0.86));
    if (density === 'low') {
      makeTree(g, -0.7, 0.54, 0.56, 'spring');
      makeTree(g, 0.7, 0.54, 0.5, 'spring');
    } else {
      makeTree(g, 0, 0.58, 0.46, 'spring');
    }
  }
  return g;
}

// ============================================================================
// 6. OFFICE HIGH-RISE (4–60 Stories, Density & Supertall Silhouettes)
// ============================================================================
function buildOffice(opts, isNight) {
  const g = new THREE.Group();
  const s = TILE_SIZE;
  const floors = Math.max(4, Math.min(60, Number(opts.floors) || 18));
  const density = opts.density || 'medium';
  const color = opts.color || '#6d98b5';
  const massing = opts.massing || 'stepped';
  const crown = opts.crown || 'mechanical';

  // Lot base (low density includes campus greenery around the plaza)
  if (density === 'low') {
    g.add(makeBox(s, 0.07, s, getStandardMaterial('#76a15c', 0.92, 0.0), 0, 0.035, 0, false, true));
    g.add(makeBox(1.44, 0.09, 1.44, getPlazaStoneMaterial(), 0, 0.045, 0, false, true));
    makeTree(g, -0.78, 0.76, 0.54, 'spring');
    makeTree(g, 0.78, -0.76, 0.5, 'spring');
  } else {
    g.add(makeBox(s, 0.09, s, getPlazaStoneMaterial(), 0, 0.045, 0, false, true));
  }

  const floorH = 0.29;
  const totalH = floors * floorH;
  const cols = density === 'low' ? 4 : density === 'high' ? 6 : density === 'ultra' ? 7 : 5;
  const baseW = density === 'low' ? 1.14 : density === 'high' ? 1.72 : density === 'ultra' ? 1.84 : 1.48;
  const frameMat = getStandardMaterial('#3d4652', 0.45, 0.4);
  const roofMat = getStandardMaterial('#596472', 0.75, 0.15);

  const makeGlassMat = (rowsCount, colOverride) =>
    getFacadeMaterial({
      style: 'modern',
      color,
      cols: colOverride || cols,
      rows: Math.max(2, Math.round(rowsCount)),
      isNight,
      isGlass: true,
    });

  const addGlassBlock = (w, h, d, rowsCount, x, yBot, z, colOverride) => {
    const gm = makeGlassMat(rowsCount, colOverride);
    const mats = [gm, gm, roofMat, frameMat, gm, gm];
    const m = new THREE.Mesh(UNIT_BOX, mats);
    m.scale.set(w, h, d);
    m.position.set(x, yBot + h * 0.5, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  };

  let baseY = 0.09;
  if (density === 'ultra' && massing !== 'twin') {
    // Full-lot urban podium anchoring ultra-high-density office towers
    const podH = 0.46;
    g.add(makeBox(1.9, podH, 1.9, frameMat, 0, baseY + podH * 0.5, 0));
    baseY += podH;
  }

  let topY = baseY + totalH;
  let topW = baseW;
  let topD = baseW;
  let crownX = 0;

  if (massing === 'stepped') {
    if (floors >= 22) {
      // Classic 3-tier supertall setback tower
      const f1 = Math.round(floors * 0.45);
      const f2 = Math.round(floors * 0.33);
      const f3 = Math.max(3, floors - f1 - f2);
      const h1 = f1 * floorH;
      const h2 = f2 * floorH;
      const h3 = f3 * floorH;
      const w1 = Math.min(1.86, baseW * 1.04);
      const w2 = w1 * 0.78;
      const w3 = w1 * 0.56;

      addGlassBlock(w1, h1, w1, f1, 0, baseY, 0, cols);
      g.add(makeBox(w1 + 0.05, 0.07, w1 + 0.05, frameMat, 0, baseY + h1, 0));
      addGlassBlock(w2, h2, w2, f2, 0, baseY + h1, 0, Math.max(3, cols - 1));
      g.add(makeBox(w2 + 0.05, 0.07, w2 + 0.05, frameMat, 0, baseY + h1 + h2, 0));
      addGlassBlock(w3, h3, w3, f3, 0, baseY + h1 + h2, 0, Math.max(3, cols - 2));

      topY = baseY + h1 + h2 + h3;
      topW = w3;
      topD = w3;
    } else {
      const f1 = Math.round(floors * 0.55);
      const f2 = Math.max(2, floors - f1);
      const h1 = f1 * floorH;
      const h2 = f2 * floorH;
      const w1 = Math.min(1.84, baseW * 1.05);
      const w2 = w1 * 0.74;
      addGlassBlock(w1, h1, w1, f1, 0, baseY, 0, cols);
      g.add(makeBox(w1 + 0.05, 0.06, w1 + 0.05, frameMat, 0, baseY + h1, 0));
      addGlassBlock(w2, h2, w2, f2, 0, baseY + h1, 0, Math.max(3, cols - 1));
      topY = baseY + h1 + h2;
      topW = w2;
      topD = w2;
    }
  } else if (massing === 'tapered') {
    // Iconic 4-tier tapering skyscraper silhouette
    const splits = [0.38, 0.27, 0.2, 0.15];
    const widths = [1.0, 0.82, 0.64, 0.46];
    let curY = baseY;
    let lastW = baseW;
    for (let i = 0; i < splits.length; i++) {
      const tierF = Math.max(2, Math.round(floors * splits[i]));
      const tierH = tierF * floorH;
      const tw = Math.min(1.86, baseW * widths[i]);
      addGlassBlock(tw, tierH, tw, tierF, 0, curY, 0, Math.max(3, cols - i));
      g.add(makeBox(tw + 0.05, 0.06, tw + 0.05, frameMat, 0, curY + tierH, 0));
      curY += tierH;
      lastW = tw;
    }
    topY = curY;
    topW = lastW;
    topD = lastW;
  } else if (massing === 'twin') {
    const podiumH = 0.44;
    const podW = Math.min(1.9, baseW + 0.14);
    const podD = Math.min(1.84, baseW + 0.04);
    g.add(makeBox(podW, podiumH, podD, frameMat, 0, baseY + podiumH * 0.5, 0));
    const wingF = Math.max(3, floors - 1);
    const wingH = wingF * floorH;
    const wingW = Math.min(0.82, baseW * 0.46);
    const wingD = Math.min(1.68, baseW * 0.9);
    const sep = Math.max(0.38, wingW * 0.5 + 0.1);
    const wingF2 = Math.max(3, Math.round(wingF * 0.85));
    const wingH2 = wingF2 * floorH;

    addGlassBlock(wingW, wingH, wingD, wingF, -sep, baseY + podiumH, 0, Math.max(3, cols - 2));
    addGlassBlock(wingW, wingH2, wingD, wingF2, sep, baseY + podiumH, 0, Math.max(3, cols - 2));
    g.add(makeBox(wingW + 0.04, 0.06, wingD + 0.04, frameMat, sep, baseY + podiumH + wingH2 + 0.03, 0));

    // Add sleek sky-connector bridge on tall or ultra-density twin towers
    if (floors >= 22 || density === 'ultra') {
      const bridgeY = baseY + podiumH + wingH2 * 0.62;
      const bridgeSpan = sep * 2 - wingW + 0.08;
      g.add(makeBox(bridgeSpan, 0.38, wingD * 0.5, makeGlassMat(1, 2), 0, bridgeY, 0));
      g.add(makeBox(bridgeSpan + 0.04, 0.05, wingD * 0.54, frameMat, 0, bridgeY + 0.21, 0));
    }

    topY = baseY + podiumH + wingH;
    topW = wingW;
    topD = wingD;
    crownX = -sep;
  } else {
    // Glass curtain wall tower
    addGlassBlock(baseW, totalH, baseW, floors, 0, baseY, 0, cols);
    // Mechanical sky-lobby accent band on tall curtain-wall skyscrapers
    if (floors >= 26) {
      g.add(makeBox(baseW + 0.04, 0.22, baseW + 0.04, frameMat, 0, baseY + totalH * 0.5, 0));
    }
    if (floors >= 44) {
      g.add(makeBox(baseW + 0.04, 0.22, baseW + 0.04, frameMat, 0, baseY + totalH * 0.78, 0));
    }
    topY = baseY + totalH;
  }

  // Crown
  g.add(makeBox(topW + 0.05, 0.08, topD + 0.05, frameMat, crownX, topY + 0.04, 0));

  if (crown === 'spire') {
    const spireH = 0.95 + Math.min(1.85, floors * 0.03);
    g.add(makeBox(topW * 0.58, 0.28, topD * 0.58, roofMat, crownX, topY + 0.18, 0));
    g.add(makeCyl(0.02, 0.06, spireH, frameMat, crownX, topY + 0.32 + spireH * 0.5, 0));
    if (isNight) {
      const beacon = getStandardMaterial('#ff4d4d', 0.2, 0.0, '#ff3b30', 3.2);
      g.add(makeBox(0.08, 0.08, 0.08, beacon, crownX, topY + 0.35 + spireH, 0, false, false));
    }
  } else if (crown === 'helipad') {
    const padR = Math.min(0.42, Math.min(topW, topD) * 0.38);
    const padMat = getStandardMaterial('#48515c', 0.7, 0.1);
    const hMark = getStandardMaterial('#f2c94c', 0.6, 0.0);
    g.add(makeCyl(padR, padR, 0.06, padMat, crownX, topY + 0.1, 0));
    g.add(makeBox(padR * 0.74, 0.015, padR * 0.16, hMark, crownX, topY + 0.135, 0, false, false));
    g.add(makeBox(padR * 0.16, 0.015, padR * 0.8, hMark, crownX - padR * 0.3, topY + 0.135, 0, false, false));
    g.add(makeBox(padR * 0.16, 0.015, padR * 0.8, hMark, crownX + padR * 0.3, topY + 0.135, 0, false, false));
  } else if (crown === 'garden') {
    g.add(makeBox(topW - 0.12, 0.05, topD - 0.12, getStandardMaterial('#5c9652', 0.9, 0.0), crownX, topY + 0.1, 0));
    makeTree(g, crownX - topW * 0.18, -topD * 0.15, 0.42, 'spring');
    makeTree(g, crownX + topW * 0.18, topD * 0.16, 0.36, 'spring');
  } else {
    g.add(makeBox(topW * 0.62, 0.28, topD * 0.62, roofMat, crownX, topY + 0.19, 0));
  }

  return g;
}

// ============================================================================
// 7. CORNER CAFE & SHOP (1–4 Stories, Boutique / Standard / Dense Retail)
// ============================================================================
function buildShop(opts, isNight) {
  const g = new THREE.Group();
  const s = TILE_SIZE;
  const floors = Math.max(1, Math.min(4, Number(opts.floors) || 2));
  const density = opts.density || 'medium';
  const color = opts.color || '#dfd7c8';
  const awningColor = opts.awningColor || '#2f6f4e';

  g.add(makeBox(s, 0.08, s, getPlazaStoneMaterial(), 0, 0.04, 0, false, true));

  const bodyW = density === 'low' ? 1.12 : density === 'high' ? 1.82 : 1.48;
  const bodyD = density === 'low' ? 0.98 : density === 'high' ? 1.38 : 1.16;
  const bodyZ = density === 'high' ? -0.14 : -0.22;
  const bodyH = 0.46 + (floors - 1) * 0.34;
  const winCols = density === 'low' ? 2 : density === 'high' ? 4 : 3;

  const facadeMat = getFacadeMaterial({ style: 'midcentury', color, cols: winCols, rows: floors, isNight });
  const trimMat = getStandardMaterial('#404854', 0.65, 0.15);
  const awningMat = getStandardMaterial(awningColor, 0.78, 0.02);
  const glowMat = isNight
    ? getStandardMaterial('#ffebb3', 0.2, 0.0, '#ffd478', 1.65)
    : getStandardMaterial('#486882', 0.22, 0.25);

  g.add(makeBox(bodyW, bodyH, bodyD, facadeMat, 0, 0.08 + bodyH * 0.5, bodyZ));
  g.add(makeBox(bodyW + 0.06, 0.07, bodyD + 0.06, trimMat, 0, 0.08 + bodyH + 0.03, bodyZ));

  const frontZ = bodyZ + bodyD * 0.5;
  g.add(makeBox(bodyW * 0.78, 0.28, 0.04, glowMat, 0, 0.27, frontZ + 0.01, false, false));

  const awning = makeBox(bodyW * 0.92, 0.05, 0.3, awningMat, 0, 0.47, frontZ + 0.12);
  awning.rotation.x = 0.32;
  g.add(awning);

  if (density === 'low') {
    makeTree(g, -0.74, -0.66, 0.48, 'spring');
    makeTree(g, 0.74, -0.66, 0.44, 'spring');
  }

  if (opts.patio) {
    const tableMat = getStandardMaterial('#f2eee6', 0.7, 0.05);
    const umbMat = getStandardMaterial(awningColor, 0.78, 0.0);
    const patioZ = density === 'high' ? 0.76 : 0.68;
    const offsets = density === 'high' ? [-0.56, 0, 0.56] : [-0.42, 0.42];
    for (const px of offsets) {
      g.add(makeCyl(0.13, 0.13, 0.03, tableMat, px, 0.22, patioZ));
      g.add(makeCyl(0.02, 0.02, 0.3, trimMat, px, 0.24, patioZ));
      const umb = new THREE.Mesh(UNIT_CONE, umbMat);
      umb.scale.set(0.38, 0.14, 0.38);
      umb.position.set(px, 0.44, patioZ);
      umb.castShadow = true;
      g.add(umb);
    }
  }
  return g;
}

// ============================================================================
// 8. CIVIC LANDMARK (Town Hall / Modern Museum / Central Library)
// ============================================================================
function buildCivic(opts, isNight) {
  const g = new THREE.Group();
  const s = TILE_SIZE;
  const variant = opts.variant || 'townhall';
  const stoneMat = getStandardMaterial(opts.color || '#dfd7c8', 0.82, 0.03);
  const accentMat = getStandardMaterial(opts.accentColor || '#4f8574', 0.55, 0.25);
  const glassMat = isNight
    ? getStandardMaterial('#ffe8ad', 0.25, 0.1, '#ffd070', 1.25)
    : getStandardMaterial('#587991', 0.2, 0.35);

  g.add(makeBox(s, 0.1, s, getPlazaStoneMaterial(), 0, 0.05, 0, false, true));

  if (variant === 'townhall') {
    // Steps & main limestone hall
    g.add(makeBox(1.74, 0.1, 1.56, stoneMat, 0, 0.15, 0));
    g.add(makeBox(1.56, 0.74, 1.26, stoneMat, 0, 0.57, -0.06));
    // Classical front columns
    for (const cx of [-0.56, -0.28, 0, 0.28, 0.56]) {
      g.add(makeCyl(0.05, 0.055, 0.66, stoneMat, cx, 0.53, 0.65));
    }
    // Pediment & dome drum
    g.add(makeBox(1.62, 0.1, 1.48, stoneMat, 0, 0.98, 0.04));
    g.add(makeCyl(0.36, 0.38, 0.32, stoneMat, 0, 1.18, -0.06));
    const dome = new THREE.Mesh(UNIT_SPHERE, accentMat);
    dome.scale.set(0.72, 0.62, 0.72);
    dome.position.set(0, 1.38, -0.06);
    dome.castShadow = true;
    g.add(dome);
  } else if (variant === 'museum') {
    // Sculptural cantilevered wings
    g.add(makeBox(1.56, 0.5, 1.24, stoneMat, 0, 0.35, -0.1));
    g.add(makeBox(0.95, 0.38, 0.84, glassMat, -0.25, 0.35, 0.42));
    const wing = makeBox(1.66, 0.42, 0.88, stoneMat, 0.06, 0.8, 0.12);
    wing.rotation.y = 0.08;
    g.add(wing);
    g.add(makeBox(1.36, 0.06, 0.58, accentMat, 0.06, 1.04, 0.12));
  } else {
    // Central Library with atrium skylight
    g.add(makeBox(1.64, 0.82, 1.44, stoneMat, 0, 0.51, 0));
    g.add(makeBox(1.36, 0.58, 1.48, glassMat, 0, 0.5, 0));
    for (const cx of [-0.55, -0.18, 0.18, 0.55]) {
      g.add(makeBox(0.08, 0.78, 1.52, stoneMat, cx, 0.51, 0));
    }
    g.add(makeBox(1.72, 0.12, 1.54, accentMat, 0, 0.96, 0));
  }
  return g;
}

// ============================================================================
// 9. CITY PARK (Meadow / Fountain / Botanical / Sports Court)
// ============================================================================
function buildPark(opts, isNight) {
  const g = new THREE.Group();
  const s = TILE_SIZE;
  const theme = opts.theme || 'fountain';
  const season = opts.season || 'spring';

  const grassMat = getStandardMaterial('#73a359', 0.92, 0.0);
  const pathMat = getStandardMaterial('#d8d0c0', 0.88, 0.0);
  const stoneMat = getStandardMaterial('#b5afa3', 0.85, 0.02);

  g.add(makeBox(s, 0.07, s, grassMat, 0, 0.035, 0, false, true));

  if (theme === 'fountain') {
    // Cross paths + stone fountain
    g.add(makeBox(0.38, 0.08, s, pathMat, 0, 0.04, 0, false, true));
    g.add(makeBox(s, 0.08, 0.38, pathMat, 0, 0.04, 0, false, true));
    g.add(makeCyl(0.46, 0.48, 0.16, stoneMat, 0, 0.14, 0));
    g.add(makeCyl(0.38, 0.38, 0.17, getWaterMaterial(isNight), 0, 0.15, 0, false, true));
    g.add(makeCyl(0.11, 0.14, 0.36, stoneMat, 0, 0.28, 0));
    makeTree(g, -0.62, -0.62, 0.82, season);
    makeTree(g, 0.62, -0.62, 0.74, season);
    makeTree(g, -0.62, 0.62, 0.72, season);
    makeBench(g, 0.56, 0.56, -Math.PI * 0.75);
  } else if (theme === 'botanical') {
    const wood = getStandardMaterial('#8a603e', 0.85, 0.0);
    const bloom1 = getStandardMaterial('#d96b70', 0.8, 0.0);
    const bloom2 = getStandardMaterial('#e8c15a', 0.8, 0.0);
    // Timber pergola
    for (const [px, pz] of [[-0.45, -0.35], [0.45, -0.35], [-0.45, 0.35], [0.45, 0.35]]) {
      g.add(makeBox(0.06, 0.56, 0.06, wood, px, 0.34, pz));
    }
    for (let bx = -0.45; bx <= 0.46; bx += 0.22) {
      g.add(makeBox(0.05, 0.05, 0.84, wood, bx, 0.62, 0));
    }
    // Flower beds
    g.add(makeBox(0.46, 0.1, 0.28, bloom1, -0.58, 0.11, 0.66));
    g.add(makeBox(0.46, 0.1, 0.28, bloom2, 0.58, 0.11, 0.66));
    makeTree(g, -0.62, -0.66, 0.78, season);
    makeTree(g, 0.62, -0.66, 0.68, season);
  } else if (theme === 'courts') {
    const courtMat = getStandardMaterial('#3f7d6e', 0.84, 0.0);
    const paintMat = getStandardMaterial('#f2f0ea', 0.7, 0.0);
    g.add(makeBox(1.36, 0.085, 1.02, courtMat, 0, 0.045, 0.1, false, true));
    g.add(makeBox(1.24, 0.09, 0.03, paintMat, 0, 0.048, -0.34, false, false));
    g.add(makeBox(1.24, 0.09, 0.03, paintMat, 0, 0.048, 0.54, false, false));
    g.add(makeBox(0.03, 0.16, 0.96, paintMat, 0, 0.14, 0.1, false, false)); // net
    makeTree(g, -0.65, -0.68, 0.75, season);
    makeTree(g, 0.65, -0.68, 0.72, season);
  } else {
    // Meadow grove
    g.add(makeBox(0.32, 0.08, s, pathMat, 0.08, 0.04, 0, false, true));
    makeTree(g, -0.55, -0.52, 0.95, season);
    makeTree(g, -0.42, 0.48, 0.72, season);
    makeTree(g, 0.6, -0.22, 0.86, season);
    makeBench(g, 0.44, 0.52, -Math.PI * 0.5);
  }
  return g;
}

// ============================================================================
// 10. URBAN FOREST (Trees)
// ============================================================================
function buildTrees(opts) {
  const g = new THREE.Group();
  const s = TILE_SIZE;
  const season = opts.season || 'summer';
  const density = opts.density || 'balanced';

  g.add(makeBox(s, 0.07, s, getStandardMaterial('#699851', 0.94, 0.0), 0, 0.035, 0, false, true));

  const layouts = {
    sparse: [
      [-0.45, -0.38, 1.05, false],
      [0.48, -0.15, 0.9, true],
      [-0.1, 0.52, 0.82, false],
    ],
    balanced: [
      [-0.52, -0.48, 1.02, false],
      [0.46, -0.42, 0.94, true],
      [0.02, 0.02, 1.12, false],
      [-0.48, 0.48, 0.82, true],
      [0.52, 0.46, 0.88, false],
    ],
    dense: [
      [-0.58, -0.56, 1.05, true],
      [0.05, -0.62, 0.86, false],
      [0.58, -0.48, 0.96, true],
      [-0.56, 0.05, 0.92, false],
      [0.06, 0.04, 1.16, false],
      [0.6, 0.1, 0.84, true],
      [-0.46, 0.58, 0.88, true],
      [0.44, 0.56, 0.95, false],
    ],
  };

  for (const [x, z, sc, isPine] of layouts[density] || layouts.balanced) {
    makeTree(g, x, z, sc, season, isPine);
  }
  return g;
}

// ============================================================================
// Public Entry Point
// ============================================================================
export function buildTileMesh(tile, neighbors, isNight) {
  let group;
  const opts = tile.options || {};
  switch (tile.type) {
    case 'road':
      group = buildRoad(opts, neighbors, isNight);
      break;
    case 'pedestrian':
      group = buildPedestrianStreet(opts, neighbors, isNight);
      break;
    case 'plaza':
      group = buildPlaza(opts, isNight);
      break;
    case 'water':
      group = buildWater(opts, neighbors, isNight);
      break;
    case 'highrise':
      group = buildResidentialHighRise(opts, isNight);
      break;
    case 'apartment':
      group = buildApartment(opts, isNight);
      break;
    case 'townhouse':
      group = buildTownhouse(opts, isNight);
      break;
    case 'office':
      group = buildOffice(opts, isNight);
      break;
    case 'shop':
      group = buildShop(opts, isNight);
      break;
    case 'civic':
      group = buildCivic(opts, isNight);
      break;
    case 'park':
      group = buildPark(opts, isNight);
      break;
    case 'trees':
      group = buildTrees(opts);
      break;
    default:
      group = new THREE.Group();
  }

  if (tile.rotation && tile.type !== 'road' && tile.type !== 'pedestrian' && tile.type !== 'water') {
    group.rotation.y = (tile.rotation * Math.PI) / 180;
  }
  return group;
}

export function createSelectionHighlight() {
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(TILE_SIZE + 0.06, 0.16, TILE_SIZE + 0.06));
  const mat = new THREE.LineBasicMaterial({ color: 0x22577a });
  const box = new THREE.LineSegments(geo, mat);
  box.position.y = 0.11;
  return box;
}
