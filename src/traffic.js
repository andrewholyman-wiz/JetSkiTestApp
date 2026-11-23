import * as THREE from 'three';
import { GRID_SIZE, TILE_SIZE } from './catalog.js';
import { getStandardMaterial } from './textures.js';

const CAR_COLORS = ['#c74b3f', '#2b6b8f', '#d9a441', '#e8e5dc', '#4b7b59', '#5c6675', '#d97736'];
const DIRS = [
  { dx: 0, dz: -1, rot: 0 },       // N
  { dx: 1, dz: 0, rot: -Math.PI / 2 },  // E
  { dx: 0, dz: 1, rot: Math.PI },  // S
  { dx: -1, dz: 0, rot: Math.PI / 2 },  // W
];

const CAR_BODY_GEO = new THREE.BoxGeometry(0.22, 0.11, 0.42);
const CAR_CABIN_GEO = new THREE.BoxGeometry(0.18, 0.09, 0.22);
const CAR_LIGHT_GEO = new THREE.BoxGeometry(0.05, 0.03, 0.02);

export class TrafficSystem {
  constructor(scene, tileToWorld) {
    this.scene = scene;
    this.tileToWorld = tileToWorld;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.cars = [];
    this.roadMap = new Map();
    this.enabled = true;
    this.maxCars = 18;
    this.isNight = false;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.group.visible = enabled;
  }

  setMaxCars(n) {
    this.maxCars = n;
    this.rebuild(this.lastTiles);
  }

  setNight(isNight) {
    if (this.isNight === isNight) return;
    this.isNight = isNight;
    this.rebuild(this.lastTiles);
  }

  rebuild(tiles) {
    this.lastTiles = tiles;
    this.roadMap.clear();
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.cars = [];
    if (!tiles) return;

    const roadCoords = [];
    for (const [key, tile] of tiles.entries()) {
      if (tile.type === 'road') {
        this.roadMap.set(key, tile);
        roadCoords.push({ x: tile.x, z: tile.z });
      }
    }
    if (roadCoords.length < 2) return;

    const targetCount = Math.min(this.maxCars, Math.max(2, Math.floor(roadCoords.length * 0.35)));
    for (let i = 0; i < targetCount; i++) {
      const start = roadCoords[Math.floor((i * 7 + 3) % roadCoords.length)];
      const neighbors = this.getValidDirs(start.x, start.z, -1);
      if (neighbors.length === 0) continue;
      const dirIdx = neighbors[i % neighbors.length];
      const mesh = this.createCarMesh(CAR_COLORS[i % CAR_COLORS.length]);
      this.group.add(mesh);
      this.cars.push({
        mesh,
        x: start.x,
        z: start.z,
        dir: dirIdx,
        progress: (i * 0.37) % 1,
        speed: 0.72 + (i % 5) * 0.14,
      });
    }
  }

  createCarMesh(color) {
    const car = new THREE.Group();
    const body = new THREE.Mesh(CAR_BODY_GEO, getStandardMaterial(color, 0.45, 0.2));
    body.position.y = 0.16;
    body.castShadow = true;
    car.add(body);

    const cabin = new THREE.Mesh(CAR_CABIN_GEO, getStandardMaterial('#d8e2eb', 0.25, 0.25));
    cabin.position.set(0, 0.24, -0.02);
    car.add(cabin);

    if (this.isNight) {
      const headMat = getStandardMaterial('#fff4cc', 0.1, 0.0, '#ffe399', 2.8);
      const tailMat = getStandardMaterial('#ff5252', 0.1, 0.0, '#ff3b30', 2.2);
      for (const lx of [-0.07, 0.07]) {
        const hl = new THREE.Mesh(CAR_LIGHT_GEO, headMat);
        hl.position.set(lx, 0.16, -0.215);
        car.add(hl);
        const tl = new THREE.Mesh(CAR_LIGHT_GEO, tailMat);
        tl.position.set(lx, 0.16, 0.215);
        car.add(tl);
      }
    }
    return car;
  }

  getValidDirs(x, z, forbidDir) {
    const valid = [];
    for (let i = 0; i < 4; i++) {
      if (i === forbidDir) continue;
      const nx = x + DIRS[i].dx;
      const nz = z + DIRS[i].dz;
      if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE && this.roadMap.has(`${nx},${nz}`)) {
        valid.push(i);
      }
    }
    return valid;
  }

  update(dt) {
    if (!this.enabled || this.cars.length === 0) return;
    const stepDt = Math.min(dt, 0.08);

    for (const c of this.cars) {
      c.progress += c.speed * stepDt;
      if (c.progress >= 1) {
        c.progress -= 1;
        c.x += DIRS[c.dir].dx;
        c.z += DIRS[c.dir].dz;

        const opposite = (c.dir + 2) % 4;
        let choices = this.getValidDirs(c.x, c.z, opposite);
        if (choices.length === 0) {
          choices = this.getValidDirs(c.x, c.z, -1);
        }
        if (choices.length > 0) {
          // Slight preference for going straight
          if (choices.includes(c.dir) && Math.random() < 0.55) {
            // keep going straight
          } else {
            c.dir = choices[Math.floor(Math.random() * choices.length)];
          }
        }
      }

      const d = DIRS[c.dir];
      const currW = this.tileToWorld(c.x, c.z);
      const nextW = this.tileToWorld(c.x + d.dx, c.z + d.dz);
      // Right-hand traffic lane offset
      const laneOffset = 0.26;
      const rightX = -d.dz * laneOffset;
      const rightZ = d.dx * laneOffset;

      c.mesh.position.set(
        THREE.MathUtils.lerp(currW.x, nextW.x, c.progress) + rightX,
        0,
        THREE.MathUtils.lerp(currW.z, nextW.z, c.progress) + rightZ
      );
      c.mesh.rotation.y = d.rot;
    }
  }
}
