import * as THREE from 'three';
import { GRID_SIZE } from './catalog.js';
import { getStandardMaterial } from './textures.js';

const DIRS = [
  { dx: 0, dz: -1, rot: 0 },            // N
  { dx: 1, dz: 0, rot: -Math.PI / 2 },  // E
  { dx: 0, dz: 1, rot: Math.PI },       // S
  { dx: -1, dz: 0, rot: Math.PI / 2 },  // W
];

const COAT_COLORS = ['#22577a', '#b8503c', '#2f6f4e', '#c9933b', '#5d4e6d', '#3e4c59', '#c46b5e', '#487d8c'];
const BIKE_COLORS = ['#2b6b8f', '#c74b3f', '#2f6f4e', '#d9a441', '#3b4252'];
const SKIN_TONES = ['#f0c8a8', '#d9a37c', '#9c6b4a', '#ecc19c'];

// Shared lightweight geometries (minimal draw overhead)
const BODY_GEO = new THREE.CylinderGeometry(0.042, 0.052, 0.17, 6);
const HEAD_GEO = new THREE.SphereGeometry(0.044, 7, 6);
const WHEEL_GEO = new THREE.CylinderGeometry(0.065, 0.065, 0.022, 8);
const FRAME_GEO = new THREE.BoxGeometry(0.024, 0.06, 0.24);
const HANDLE_GEO = new THREE.BoxGeometry(0.11, 0.018, 0.02);
const HELMET_GEO = new THREE.SphereGeometry(0.049, 7, 5);
const DOG_BODY_GEO = new THREE.BoxGeometry(0.045, 0.05, 0.11);
const DOG_HEAD_GEO = new THREE.BoxGeometry(0.042, 0.042, 0.048);
const BIKE_LIGHT_GEO = new THREE.BoxGeometry(0.028, 0.022, 0.018);

export class PedestrianSystem {
  constructor(scene, tileToWorld) {
    this.scene = scene;
    this.tileToWorld = tileToWorld;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.agents = [];
    this.walkMap = new Map();
    this.enabled = true;
    this.maxAgents = 28;
    this.isNight = false;
    this.elapsed = 0;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.group.visible = enabled;
  }

  setMaxAgents(n) {
    this.maxAgents = n;
    this.rebuild(this.lastTiles);
  }

  setNight(isNight) {
    if (this.isNight === isNight) return;
    this.isNight = isNight;
    this.rebuild(this.lastTiles);
  }

  rebuild(tiles) {
    this.lastTiles = tiles;
    this.walkMap.clear();
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.agents = [];
    if (!tiles) return;

    const pedCoords = [];
    for (const [key, tile] of tiles.entries()) {
      if (tile.type === 'pedestrian') {
        this.walkMap.set(key, tile);
        pedCoords.push({ x: tile.x, z: tile.z, tile });
      }
    }
    if (pedCoords.length === 0) return;

    const targetCount = Math.min(this.maxAgents, Math.max(3, Math.floor(pedCoords.length * 1.9)));

    for (let i = 0; i < targetCount; i++) {
      const start = pedCoords[(i * 5 + 1) % pedCoords.length];
      const neighbors = this.getValidDirs(start.x, start.z, -1);

      // Mix: ~38% cyclists, ~42% walkers (some in pairs), ~20% dog walkers
      const roll = i % 10;
      const kind = roll < 4 ? 'cyclist' : roll < 8 ? 'walker' : 'dogwalker';

      // Cyclists prefer connected stretches; if isolated tile, convert to strolling walker
      const effectiveKind = neighbors.length === 0 ? 'walker' : kind;
      const dirIdx = neighbors.length > 0 ? neighbors[i % neighbors.length] : i % 4;
      const hasNeighbor = neighbors.length > 0;

      const mesh =
        effectiveKind === 'cyclist'
          ? this.createCyclistMesh(i)
          : this.createWalkerMesh(i, effectiveKind === 'dogwalker', roll === 5);

      this.group.add(mesh);

      // Cyclists ride near center-right cycle lane; walkers stroll along the outer promenade sides
      const laneOffset =
        effectiveKind === 'cyclist'
          ? 0.14
          : (i % 2 === 0 ? 0.44 : -0.44) + ((i % 3) - 1) * 0.05;

      this.agents.push({
        mesh,
        kind: effectiveKind,
        x: start.x,
        z: start.z,
        dir: dirIdx,
        stationaryLoop: !hasNeighbor,
        loopAngle: (i * 1.7) % (Math.PI * 2),
        progress: (i * 0.29) % 1,
        laneOffset,
        phase: i * 1.37,
        speed:
          effectiveKind === 'cyclist'
            ? 0.62 + (i % 4) * 0.08
            : 0.22 + (i % 4) * 0.035,
      });
    }
  }

  createWalkerMesh(idx, withDog = false, isPair = false) {
    const g = new THREE.Group();

    const addPerson = (ox, oz, coatIdx, scale = 1) => {
      const p = new THREE.Group();
      p.position.set(ox, 0, oz);
      const coatMat = getStandardMaterial(COAT_COLORS[coatIdx % COAT_COLORS.length], 0.82, 0.02);
      const skinMat = getStandardMaterial(SKIN_TONES[coatIdx % SKIN_TONES.length], 0.78, 0.0);

      const body = new THREE.Mesh(BODY_GEO, coatMat);
      body.scale.setScalar(scale);
      body.position.y = 0.095 + 0.085 * scale;
      body.castShadow = true;
      p.add(body);

      const head = new THREE.Mesh(HEAD_GEO, skinMat);
      head.scale.setScalar(scale);
      head.position.y = 0.095 + 0.205 * scale;
      head.castShadow = true;
      p.add(head);

      g.add(p);
    };

    addPerson(0, 0, idx, 1.0);

    if (isPair) {
      addPerson(0.13, 0.05, idx + 3, 0.94);
    }

    if (withDog) {
      const dogMat = getStandardMaterial(idx % 2 === 0 ? '#a87648' : '#4a3d33', 0.88, 0.0);
      const dog = new THREE.Group();
      dog.position.set(0.12, 0.095, -0.14);
      const db = new THREE.Mesh(DOG_BODY_GEO, dogMat);
      db.position.y = 0.035;
      db.castShadow = true;
      dog.add(db);
      const dh = new THREE.Mesh(DOG_HEAD_GEO, dogMat);
      dh.position.set(0, 0.068, -0.055);
      dog.add(dh);
      g.add(dog);
    }

    return g;
  }

  createCyclistMesh(idx) {
    const g = new THREE.Group();
    const frameMat = getStandardMaterial(BIKE_COLORS[idx % BIKE_COLORS.length], 0.42, 0.35);
    const tireMat = getStandardMaterial('#272c33', 0.85, 0.05);
    const coatMat = getStandardMaterial(COAT_COLORS[(idx + 2) % COAT_COLORS.length], 0.78, 0.04);
    const helmetMat = getStandardMaterial(idx % 2 === 0 ? '#f0eee9' : '#e0a93b', 0.45, 0.08);

    // Front & rear wheels
    for (const wz of [-0.12, 0.12]) {
      const w = new THREE.Mesh(WHEEL_GEO, tireMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(0, 0.16, wz);
      w.castShadow = true;
      g.add(w);
    }

    // Frame & handlebars
    const frame = new THREE.Mesh(FRAME_GEO, frameMat);
    frame.position.set(0, 0.19, 0);
    frame.castShadow = true;
    g.add(frame);

    const handle = new THREE.Mesh(HANDLE_GEO, tireMat);
    handle.position.set(0, 0.255, -0.09);
    g.add(handle);

    // Rider leaning slightly forward
    const torso = new THREE.Mesh(BODY_GEO, coatMat);
    torso.position.set(0, 0.285, 0.01);
    torso.rotation.x = -0.26;
    torso.castShadow = true;
    g.add(torso);

    const head = new THREE.Mesh(HELMET_GEO, helmetMat);
    head.position.set(0, 0.4, -0.03);
    head.castShadow = true;
    g.add(head);

    // Warm bike headlamp & red tail light at night
    if (this.isNight) {
      const frontL = new THREE.Mesh(
        BIKE_LIGHT_GEO,
        getStandardMaterial('#fff5cc', 0.1, 0.0, '#ffe499', 2.8)
      );
      frontL.position.set(0, 0.24, -0.15);
      g.add(frontL);

      const rearL = new THREE.Mesh(
        BIKE_LIGHT_GEO,
        getStandardMaterial('#ff5252', 0.1, 0.0, '#ff3b30', 2.4)
      );
      rearL.position.set(0, 0.21, 0.16);
      g.add(rearL);
    }

    return g;
  }

  getValidDirs(x, z, forbidDir) {
    const valid = [];
    for (let i = 0; i < 4; i++) {
      if (i === forbidDir) continue;
      const nx = x + DIRS[i].dx;
      const nz = z + DIRS[i].dz;
      if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE && this.walkMap.has(`${nx},${nz}`)) {
        valid.push(i);
      }
    }
    return valid;
  }

  update(dt) {
    if (!this.enabled || this.agents.length === 0) return;
    const stepDt = Math.min(dt, 0.08);
    this.elapsed += stepDt;

    for (const a of this.agents) {
      if (a.stationaryLoop) {
        // Gentle promenade loop on a single standalone pedestrian tile
        a.loopAngle += a.speed * 1.4 * stepDt;
        const wp = this.tileToWorld(a.x, a.z);
        const r = 0.48;
        a.mesh.position.set(
          wp.x + Math.cos(a.loopAngle) * r,
          Math.abs(Math.sin(this.elapsed * 7 + a.phase)) * 0.018,
          wp.z + Math.sin(a.loopAngle) * r
        );
        a.mesh.rotation.y = -a.loopAngle;
        continue;
      }

      a.progress += a.speed * stepDt;
      if (a.progress >= 1) {
        a.progress -= 1;
        a.x += DIRS[a.dir].dx;
        a.z += DIRS[a.dir].dz;

        const opposite = (a.dir + 2) % 4;
        let choices = this.getValidDirs(a.x, a.z, opposite);
        if (choices.length === 0) {
          choices = this.getValidDirs(a.x, a.z, -1);
        }
        if (choices.length > 0) {
          if (choices.includes(a.dir) && Math.random() < 0.6) {
            // Prefer continuing straight down the promenade
          } else {
            a.dir = choices[Math.floor(Math.random() * choices.length)];
          }
        }
      }

      const d = DIRS[a.dir];
      const currW = this.tileToWorld(a.x, a.z);
      const nextW = this.tileToWorld(a.x + d.dx, a.z + d.dz);

      const rightX = -d.dz * a.laneOffset;
      const rightZ = d.dx * a.laneOffset;

      // Subtle walking stride bob (cyclists glide smoothly)
      const bobY = a.kind === 'cyclist' ? 0 : Math.abs(Math.sin(this.elapsed * 8.5 + a.phase)) * 0.022;

      a.mesh.position.set(
        THREE.MathUtils.lerp(currW.x, nextW.x, a.progress) + rightX,
        bobY,
        THREE.MathUtils.lerp(currW.z, nextW.z, a.progress) + rightZ
      );
      a.mesh.rotation.y = d.rot;
    }
  }
}
