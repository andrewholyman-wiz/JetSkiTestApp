import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GRID_SIZE, TILE_SIZE, BLOCK_CATALOG } from './catalog.js';
import { getGrassGroundMaterial, getStandardMaterial } from './textures.js';
import { buildTileMesh, createSelectionHighlight } from './meshBuilder.js';
import { TrafficSystem } from './traffic.js';
import { PedestrianSystem } from './pedestrians.js';

const WORLD_SIZE = GRID_SIZE * TILE_SIZE;
const HALF_WORLD = WORLD_SIZE * 0.5;

const TIME_PRESETS = {
  morning: {
    sky: 0xc8ddf0,
    fog: 0xd4e4f2,
    sunColor: 0xfff0d4,
    sunInt: 1.65,
    sunPos: [28, 22, 16],
    hemiSky: 0xd8ecff,
    hemiGround: 0x7c8c6e,
    hemiInt: 0.9,
    night: false,
  },
  midday: {
    sky: 0xc2d8ec,
    fog: 0xd0e1f0,
    sunColor: 0xfffaf0,
    sunInt: 1.85,
    sunPos: [22, 36, 18],
    hemiSky: 0xe6f2ff,
    hemiGround: 0x7d926f,
    hemiInt: 0.95,
    night: false,
  },
  golden: {
    sky: 0xe2b08d,
    fog: 0xe7bfa2,
    sunColor: 0xffae66,
    sunInt: 1.75,
    sunPos: [-32, 13, 22],
    hemiSky: 0xffd5b0,
    hemiGround: 0x625a5c,
    hemiInt: 0.78,
    night: true, // Warm early-dusk window glow!
  },
  night: {
    sky: 0x111a2b,
    fog: 0x141f33,
    sunColor: 0x7da4db,
    sunInt: 0.65,
    sunPos: [-18, 28, -16],
    hemiSky: 0x304870,
    hemiGround: 0x19202d,
    hemiInt: 0.55,
    night: true,
  },
};

export class CityEngine {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    this.tiles = new Map();       // "x,z" -> tile data
    this.tileMeshes = new Map();  // "x,z" -> THREE.Group
    this.popAnims = [];           // { mesh, t }

    this.mode = 'build';
    this.activeType = 'apartment';
    this.activeOptions = {};
    this.activeRotation = 0;
    this.selectedKey = null;
    this.hoverCoord = null;
    this.timeOfDay = 'midday';
    this.isNight = false;
    this.quality = 'balanced';

    this.keysPressed = new Set();
    this.cameraGoal = null;
    this.isPainting = false;
    this.lastPaintedKey = null;

    this.initScene();
    this.initBoard();
    this.initInteractions();

    this.traffic = new TrafficSystem(this.scene, (x, z) => this.tileToWorld(x, z));
    this.pedestrians = new PedestrianSystem(this.scene, (x, z) => this.tileToWorld(x, z));

    this.clock = new THREE.Clock();
    this.fpsFrames = 0;
    this.fpsAccum = 0;

    this.applyTimeOfDay('midday', false);
    this.applyQuality('balanced');
    this.animate();
  }

  initScene() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(TIME_PRESETS.midday.sky);
    this.scene.fog = new THREE.Fog(TIME_PRESETS.midday.fog, 55, 135);

    this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.4, 240);
    this.camera.position.set(27, 25, 29);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.465;
    this.controls.minPolarAngle = 0.14;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 82;
    this.controls.target.set(0, 0, 2);
    this.controls.mouseButtons = {
      LEFT: null,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.ROTATE,
    };

    // Lights
    this.hemiLight = new THREE.HemisphereLight(0xe6f2ff, 0x7d926f, 0.95);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaf0, 1.85);
    this.sunLight.position.set(22, 36, 18);
    this.sunLight.castShadow = true;
    const d = HALF_WORLD + 6;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 4;
    this.sunLight.shadow.camera.far = 110;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);

    this.cityGroup = new THREE.Group();
    this.scene.add(this.cityGroup);

    window.addEventListener('resize', () => this.onResize());
  }

  initBoard() {
    // Ground grass surface
    const groundGeo = new THREE.BoxGeometry(WORLD_SIZE, 0.6, WORLD_SIZE);
    this.groundMesh = new THREE.Mesh(groundGeo, getGrassGroundMaterial());
    this.groundMesh.position.y = -0.3;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Architectural wooden/stone maquette base rim
    const plinthGeo = new THREE.BoxGeometry(WORLD_SIZE + 1.0, 1.35, WORLD_SIZE + 1.0);
    const plinth = new THREE.Mesh(plinthGeo, getStandardMaterial('#645e55', 0.9, 0.04));
    plinth.position.y = -1.25;
    plinth.receiveShadow = true;
    this.scene.add(plinth);

    // Crisp tile grid helper
    this.gridHelper = new THREE.GridHelper(WORLD_SIZE, GRID_SIZE, 0x2c3c2a, 0x2c3c2a);
    this.gridHelper.position.y = 0.012;
    this.gridHelper.material.opacity = 0.16;
    this.gridHelper.material.transparent = true;
    this.scene.add(this.gridHelper);

    // Raycast plane at y = 0
    this.pickPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.pickPlane.rotation.x = -Math.PI / 2;
    this.scene.add(this.pickPlane);

    // Hover footprint indicator + ghost container
    const hoverGeo = new THREE.PlaneGeometry(TILE_SIZE - 0.08, TILE_SIZE - 0.08);
    this.hoverMat = new THREE.MeshBasicMaterial({
      color: 0x22577a,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    this.hoverMarker = new THREE.Mesh(hoverGeo, this.hoverMat);
    this.hoverMarker.rotation.x = -Math.PI / 2;
    this.hoverMarker.position.y = 0.115;
    this.hoverMarker.visible = false;
    this.scene.add(this.hoverMarker);

    this.ghostGroup = new THREE.Group();
    this.ghostGroup.visible = false;
    this.scene.add(this.ghostGroup);

    this.selectionHighlight = createSelectionHighlight();
    this.selectionHighlight.visible = false;
    this.scene.add(this.selectionHighlight);
  }

  initInteractions() {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('pointermove', (e) => {
      this.updatePointer(e);
      const coord = this.raycastTile();
      this.hoverCoord = coord;
      this.updateHoverVisuals();

      if (this.isPainting && coord) {
        const key = `${coord.x},${coord.z}`;
        if (key !== this.lastPaintedKey) {
          this.lastPaintedKey = key;
          if (this.mode === 'erase') {
            this.callbacks.onEraseTile(coord.x, coord.z, true);
          } else if (this.mode === 'build' && BLOCK_CATALOG[this.activeType]?.paintable) {
            this.callbacks.onPlaceTile(coord.x, coord.z, true);
          }
        }
      }
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.shiftKey) {
        // Shift + Left-drag pans cleanly for trackpad users
        this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
        return;
      }
      this.controls.mouseButtons.LEFT = null;
      this.updatePointer(e);
      const coord = this.raycastTile();
      if (!coord) return;

      const key = `${coord.x},${coord.z}`;
      if (this.mode === 'build') {
        this.callbacks.onPlaceTile(coord.x, coord.z, false);
        if (BLOCK_CATALOG[this.activeType]?.paintable) {
          this.isPainting = true;
          this.lastPaintedKey = key;
        }
      } else if (this.mode === 'erase') {
        this.callbacks.onEraseTile(coord.x, coord.z, false);
        this.isPainting = true;
        this.lastPaintedKey = key;
      } else if (this.mode === 'select') {
        this.callbacks.onSelectTile(coord.x, coord.z);
      } else if (this.mode === 'sample') {
        this.callbacks.onSampleTile(coord.x, coord.z);
      }
    });

    window.addEventListener('pointerup', () => {
      if (this.isPainting) {
        this.isPainting = false;
        this.lastPaintedKey = null;
        this.callbacks.onEndStroke();
      }
      this.controls.mouseButtons.LEFT = null;
    });

    this.canvas.addEventListener('pointerleave', () => {
      this.hoverCoord = null;
      this.hoverMarker.visible = false;
      this.ghostGroup.visible = false;
    });

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      this.keysPressed.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.key.toLowerCase());
    });
  }

  updatePointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  raycastTile() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.pickPlane);
    if (hits.length === 0) return null;
    const p = hits[0].point;
    const gx = Math.floor((p.x + HALF_WORLD) / TILE_SIZE);
    const gz = Math.floor((p.z + HALF_WORLD) / TILE_SIZE);
    if (gx < 0 || gx >= GRID_SIZE || gz < 0 || gz >= GRID_SIZE) return null;
    return { x: gx, z: gz };
  }

  tileToWorld(x, z) {
    return {
      x: -HALF_WORLD + (x + 0.5) * TILE_SIZE,
      z: -HALF_WORLD + (z + 0.5) * TILE_SIZE,
    };
  }

  getNeighbors(x, z, matchType) {
    const typeAt = (nx, nz) => this.tiles.get(`${nx},${nz}`)?.type || null;
    if (matchType === 'pedestrian') {
      const nT = typeAt(x, z - 1);
      const sT = typeAt(x, z + 1);
      const eT = typeAt(x + 1, z);
      const wT = typeAt(x - 1, z);
      return {
        n: nT === 'pedestrian' || nT === 'plaza',
        s: sT === 'pedestrian' || sT === 'plaza',
        e: eT === 'pedestrian' || eT === 'plaza',
        w: wT === 'pedestrian' || wT === 'plaza',
        roadN: nT === 'road',
        roadS: sT === 'road',
        roadE: eT === 'road',
        roadW: wT === 'road',
      };
    }
    return {
      n: typeAt(x, z - 1) === matchType,
      s: typeAt(x, z + 1) === matchType,
      e: typeAt(x + 1, z) === matchType,
      w: typeAt(x - 1, z) === matchType,
    };
  }

  // ============================================================================
  // Scene Tile Management (Incremental updates for 60 FPS editing)
  // ============================================================================
  setCityTiles(tileArray) {
    for (const mesh of this.tileMeshes.values()) {
      this.cityGroup.remove(mesh);
    }
    this.tileMeshes.clear();
    this.tiles.clear();
    this.popAnims = [];

    for (const t of tileArray) {
      this.tiles.set(`${t.x},${t.z}`, {
        x: t.x,
        z: t.z,
        type: t.type,
        rotation: t.rotation || 0,
        options: { ...(t.options || {}) },
      });
    }

    for (const t of this.tiles.values()) {
      this.renderTile(t.x, t.z, false);
    }
    this.traffic.rebuild(this.tiles);
    this.pedestrians.rebuild(this.tiles);
    this.updateSelectionVisual();
  }

  upsertTile(tile, animate = true) {
    const key = `${tile.x},${tile.z}`;
    const prev = this.tiles.get(key);
    this.tiles.set(key, {
      x: tile.x,
      z: tile.z,
      type: tile.type,
      rotation: tile.rotation || 0,
      options: { ...(tile.options || {}) },
    });
    this.renderTile(tile.x, tile.z, animate);

    // Refresh orthogonal neighbors when road, pedestrian, plaza, or water topology changes
    const topoTypes = ['road', 'pedestrian', 'plaza', 'water'];
    if (topoTypes.includes(tile.type) || topoTypes.includes(prev?.type)) {
      this.refreshNeighborTiles(tile.x, tile.z);
    }
    if (tile.type === 'road' || prev?.type === 'road') {
      this.traffic.rebuild(this.tiles);
    }
    if (tile.type === 'pedestrian' || prev?.type === 'pedestrian') {
      this.pedestrians.rebuild(this.tiles);
    }
    this.updateHoverVisuals();
    this.updateSelectionVisual();
  }

  removeTile(x, z) {
    const key = `${x},${z}`;
    const prev = this.tiles.get(key);
    if (!prev) return false;
    this.tiles.delete(key);
    const mesh = this.tileMeshes.get(key);
    if (mesh) {
      this.cityGroup.remove(mesh);
      this.tileMeshes.delete(key);
    }
    const topoTypes = ['road', 'pedestrian', 'plaza', 'water'];
    if (topoTypes.includes(prev.type)) {
      this.refreshNeighborTiles(x, z);
    }
    if (prev.type === 'road') {
      this.traffic.rebuild(this.tiles);
    }
    if (prev.type === 'pedestrian') {
      this.pedestrians.rebuild(this.tiles);
    }
    if (this.selectedKey === key) {
      this.selectedKey = null;
      this.updateSelectionVisual();
    }
    this.updateHoverVisuals();
    return true;
  }

  refreshNeighborTiles(x, z) {
    const coords = [
      [x, z - 1],
      [x, z + 1],
      [x + 1, z],
      [x - 1, z],
    ];
    for (const [nx, nz] of coords) {
      const t = this.tiles.get(`${nx},${nz}`);
      if (t && (t.type === 'road' || t.type === 'pedestrian' || t.type === 'water')) {
        this.renderTile(nx, nz, false);
      }
    }
  }

  renderTile(x, z, animate = false) {
    const key = `${x},${z}`;
    const prevMesh = this.tileMeshes.get(key);
    if (prevMesh) {
      this.cityGroup.remove(prevMesh);
      this.tileMeshes.delete(key);
    }
    const tile = this.tiles.get(key);
    if (!tile) return;

    const neighbors =
      tile.type === 'road' || tile.type === 'pedestrian' || tile.type === 'water'
        ? this.getNeighbors(x, z, tile.type)
        : { n: false, s: false, e: false, w: false };

    const mesh = buildTileMesh(tile, neighbors, this.isNight);
    const wp = this.tileToWorld(x, z);
    mesh.position.set(wp.x, 0, wp.z);
    this.cityGroup.add(mesh);
    this.tileMeshes.set(key, mesh);

    if (animate) {
      mesh.scale.set(0.84, 0.72, 0.84);
      this.popAnims.push({ mesh, t: 0 });
    }
  }

  rebuildAllMeshes() {
    for (const t of this.tiles.values()) {
      this.renderTile(t.x, t.z, false);
    }
  }

  // ============================================================================
  // Hover Ghost & Selection Visuals
  // ============================================================================
  setToolState({ mode, activeType, activeOptions, activeRotation, selectedKey }) {
    this.mode = mode;
    this.activeType = activeType;
    this.activeOptions = activeOptions;
    this.activeRotation = activeRotation;
    this.selectedKey = selectedKey;
    this.canvas.className = `mode-${mode}`;
    this.rebuildGhostMesh();
    this.updateHoverVisuals();
    this.updateSelectionVisual();
  }

  rebuildGhostMesh() {
    while (this.ghostGroup.children.length > 0) {
      this.ghostGroup.remove(this.ghostGroup.children[0]);
    }
    if (this.mode !== 'build' || !this.activeType) return;

    const previewTile = {
      x: 0,
      z: 0,
      type: this.activeType,
      rotation: this.activeRotation,
      options: this.activeOptions,
    };
    const neighbors =
      this.hoverCoord && (this.activeType === 'road' || this.activeType === 'pedestrian' || this.activeType === 'water')
        ? this.getNeighbors(this.hoverCoord.x, this.hoverCoord.z, this.activeType)
        : { n: false, s: false, e: false, w: false };

    const ghost = buildTileMesh(previewTile, neighbors, this.isNight);
    ghost.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
        const cloneMat = (m) => {
          const c = m.clone();
          c.transparent = true;
          c.opacity = 0.52;
          return c;
        };
        obj.material = Array.isArray(obj.material) ? obj.material.map(cloneMat) : cloneMat(obj.material);
      }
    });
    this.ghostGroup.add(ghost);
  }

  updateHoverVisuals() {
    if (!this.hoverCoord) {
      this.hoverMarker.visible = false;
      this.ghostGroup.visible = false;
      return;
    }
    const { x, z } = this.hoverCoord;
    const wp = this.tileToWorld(x, z);
    const occupied = this.tiles.has(`${x},${z}`);

    this.hoverMarker.position.set(wp.x, 0.115, wp.z);
    this.hoverMarker.visible = true;

    if (this.mode === 'build') {
      this.hoverMat.color.setHex(occupied ? 0xc77d2b : 0x2f6f4e);
      if (this.activeType === 'road' || this.activeType === 'pedestrian' || this.activeType === 'water') {
        this.rebuildGhostMesh();
      }
      this.ghostGroup.position.set(wp.x, 0.02, wp.z);
      this.ghostGroup.visible = true;
    } else if (this.mode === 'erase') {
      this.hoverMat.color.setHex(occupied ? 0xc43c35 : 0x6b7280);
      this.ghostGroup.visible = false;
    } else {
      this.hoverMat.color.setHex(occupied ? 0x22577a : 0x8a95a5);
      this.ghostGroup.visible = false;
    }
  }

  updateSelectionVisual() {
    if (!this.selectedKey || !this.tiles.has(this.selectedKey)) {
      this.selectionHighlight.visible = false;
      return;
    }
    const t = this.tiles.get(this.selectedKey);
    const wp = this.tileToWorld(t.x, t.z);
    this.selectionHighlight.position.set(wp.x, 0.11, wp.z);
    this.selectionHighlight.visible = true;
  }

  // ============================================================================
  // Atmosphere, Camera Presets, Quality & Snapshot
  // ============================================================================
  applyTimeOfDay(presetKey, rebuildIfNightChanged = true) {
    const p = TIME_PRESETS[presetKey] || TIME_PRESETS.midday;
    const prevNight = this.isNight;
    this.timeOfDay = presetKey;
    this.isNight = p.night;

    this.scene.background.setHex(p.sky);
    this.scene.fog.color.setHex(p.fog);
    this.sunLight.color.setHex(p.sunColor);
    this.sunLight.intensity = p.sunInt;
    this.sunLight.position.set(...p.sunPos);
    this.hemiLight.color.setHex(p.hemiSky);
    this.hemiLight.groundColor.setHex(p.hemiGround);
    this.hemiLight.intensity = p.hemiInt;

    document.body.classList.toggle('theme-night', presetKey === 'night');

    if (rebuildIfNightChanged && prevNight !== this.isNight) {
      this.rebuildAllMeshes();
      this.rebuildGhostMesh();
      this.traffic.setNight(this.isNight);
      this.pedestrians.setNight(this.isNight);
    }
  }

  applyQuality(level) {
    this.quality = level;
    const dpr = window.devicePixelRatio || 1;
    if (level === 'performance') {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
      this.traffic.setMaxCars(8);
      this.pedestrians.setMaxAgents(12);
    } else if (level === 'high') {
      this.renderer.setPixelRatio(Math.min(dpr, 2));
      this.renderer.shadowMap.enabled = true;
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(2048, 2048);
      if (this.sunLight.shadow.map) {
        this.sunLight.shadow.map.dispose();
        this.sunLight.shadow.map = null;
      }
      this.traffic.setMaxCars(24);
      this.pedestrians.setMaxAgents(36);
    } else {
      this.renderer.setPixelRatio(Math.min(dpr, 1.5));
      this.renderer.shadowMap.enabled = true;
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(1024, 1024);
      if (this.sunLight.shadow.map) {
        this.sunLight.shadow.map.dispose();
        this.sunLight.shadow.map = null;
      }
      this.traffic.setMaxCars(16);
      this.pedestrians.setMaxAgents(24);
    }
  }

  setGridVisible(visible) {
    this.gridHelper.visible = visible;
  }

  setTrafficEnabled(enabled) {
    this.traffic.setEnabled(enabled);
  }

  setPedestriansEnabled(enabled) {
    this.pedestrians.setEnabled(enabled);
  }

  flyToPreset(preset) {
    if (preset === 'iso') {
      this.cameraGoal = { pos: new THREE.Vector3(27, 25, 29), target: new THREE.Vector3(0, 0, 2) };
    } else if (preset === 'street') {
      this.cameraGoal = { pos: new THREE.Vector3(-14, 5.2, 18), target: new THREE.Vector3(4, 1.8, -2) };
    } else if (preset === 'top') {
      this.cameraGoal = { pos: new THREE.Vector3(0, 52, 0.01), target: new THREE.Vector3(0, 0, 0) };
    }
  }

  capturePNG() {
    const prevHover = this.hoverMarker.visible;
    const prevGhost = this.ghostGroup.visible;
    const prevSel = this.selectionHighlight.visible;
    this.hoverMarker.visible = false;
    this.ghostGroup.visible = false;
    this.selectionHighlight.visible = false;

    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.canvas.toDataURL('image/png');

    this.hoverMarker.visible = prevHover;
    this.ghostGroup.visible = prevGhost;
    this.selectionHighlight.visible = prevSel;
    return dataUrl;
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ============================================================================
  // Render Loop
  // ============================================================================
  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = this.clock.getDelta();

    // Keyboard WASD / Arrow camera pan
    if (this.keysPressed.size > 0) {
      const panSpeed = 18 * dt;
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      const move = new THREE.Vector3();
      if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) move.addScaledVector(forward, panSpeed);
      if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) move.addScaledVector(forward, -panSpeed);
      if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) move.addScaledVector(right, panSpeed);
      if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) move.addScaledVector(right, -panSpeed);
      if (move.lengthSq() > 0) {
        this.cameraGoal = null;
        this.camera.position.add(move);
        this.controls.target.add(move);
      }
    }

    // Smooth camera preset transition
    if (this.cameraGoal) {
      const alpha = Math.min(1, dt * 6);
      this.camera.position.lerp(this.cameraGoal.pos, alpha);
      this.controls.target.lerp(this.cameraGoal.target, alpha);
      if (this.camera.position.distanceTo(this.cameraGoal.pos) < 0.08) {
        this.cameraGoal = null;
      }
    }

    // Placement pop-in micro-animation
    for (let i = this.popAnims.length - 1; i >= 0; i--) {
      const a = this.popAnims[i];
      a.t = Math.min(1, a.t + dt * 5.8);
      const ease = 1 - Math.pow(1 - a.t, 3);
      const sx = THREE.MathUtils.lerp(0.84, 1, ease);
      const sy = THREE.MathUtils.lerp(0.72, 1, ease);
      a.mesh.scale.set(sx, sy, sx);
      if (a.t >= 1) this.popAnims.splice(i, 1);
    }

    this.traffic.update(dt);
    this.pedestrians.update(dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    // Performance telemetry (updates twice per second)
    this.fpsFrames += 1;
    this.fpsAccum += dt;
    if (this.fpsAccum >= 0.5) {
      const fps = Math.round(this.fpsFrames / this.fpsAccum);
      const info = this.renderer.info.render;
      this.callbacks.onPerfTick?.({ fps, calls: info.calls, triangles: info.triangles });
      this.fpsFrames = 0;
      this.fpsAccum = 0;
    }
  }
}
