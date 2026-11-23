import { CATEGORIES, BLOCK_CATALOG, DENSITY_META, createDefaultOptions } from './catalog.js';
import { getPresetTiles } from './presets.js';
import { CityEngine } from './cityEngine.js';

const STORAGE_KEY = 'civitas-city-designer-v1';
const MAX_HISTORY = 50;

// Application State
const state = {
  mode: 'build',
  activeType: 'apartment',
  activeOptionsByType: {},
  activeRotation: 0,
  selectedKey: null,
  history: [],
  historyIndex: -1,
  strokeSnapshotPending: false,
};

for (const type of Object.keys(BLOCK_CATALOG)) {
  state.activeOptionsByType[type] = createDefaultOptions(type);
}

// DOM References
const canvas = document.getElementById('city-canvas');
const catalogContainer = document.getElementById('catalog-container');
const inspectorControls = document.getElementById('inspector-controls');
const inspectorTitle = document.getElementById('inspector-title');
const inspectorSubtitle = document.getElementById('inspector-subtitle');
const rotationSection = document.getElementById('rotation-section');
const rotationReadout = document.getElementById('rotation-readout');
const selectedActions = document.getElementById('selected-actions');
const toastEl = document.getElementById('toast');

let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2400);
}

// Engine Initialization
const engine = new CityEngine(canvas, {
  onPlaceTile: (x, z, isDrag) => {
    const type = state.activeType;
    const tile = {
      x,
      z,
      type,
      rotation: state.activeRotation,
      options: { ...state.activeOptionsByType[type] },
    };
    engine.upsertTile(tile, !isDrag);
    if (isDrag) {
      state.strokeSnapshotPending = true;
    } else {
      commitSnapshot();
    }
    updateCityStats();
  },

  onEraseTile: (x, z, isDrag) => {
    const removed = engine.removeTile(x, z);
    if (!removed) return;
    if (isDrag) {
      state.strokeSnapshotPending = true;
    } else {
      commitSnapshot();
    }
    if (state.selectedKey === `${x},${z}`) {
      state.selectedKey = null;
      renderInspector();
    }
    updateCityStats();
  },

  onEndStroke: () => {
    if (state.strokeSnapshotPending) {
      state.strokeSnapshotPending = false;
      commitSnapshot();
    }
  },

  onSelectTile: (x, z) => {
    const key = `${x},${z}`;
    if (engine.tiles.has(key)) {
      state.selectedKey = key;
    } else {
      state.selectedKey = null;
    }
    syncEngineTool();
    renderInspector();
  },

  onSampleTile: (x, z) => {
    const t = engine.tiles.get(`${x},${z}`);
    if (!t) return;
    state.activeType = t.type;
    state.activeOptionsByType[t.type] = { ...t.options };
    state.activeRotation = t.rotation || 0;
    setMode('build');
    renderCatalog();
    renderInspector();
    showToast(`Sampled ${BLOCK_CATALOG[t.type].name}`);
  },

  onPerfTick: ({ fps, calls, triangles }) => {
    document.getElementById('perf-fps').textContent = `${fps} FPS`;
    document.getElementById('perf-calls').textContent = `${calls} calls`;
    document.getElementById('perf-tris').textContent =
      triangles >= 1000 ? `${(triangles / 1000).toFixed(1)}k tris` : `${triangles} tris`;
  },
});

// ============================================================================
// History (Undo / Redo) & Persistence
// ============================================================================
function serializeCity() {
  return Array.from(engine.tiles.values()).map((t) => ({
    x: t.x,
    z: t.z,
    type: t.type,
    rotation: t.rotation,
    options: { ...t.options },
  }));
}

function commitSnapshot() {
  const snap = JSON.stringify(serializeCity());
  if (state.history[state.historyIndex] === snap) return;
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(snap);
  if (state.history.length > MAX_HISTORY) {
    state.history.shift();
  }
  state.historyIndex = state.history.length - 1;
  updateUndoRedoButtons();
  try {
    localStorage.setItem(STORAGE_KEY, snap);
  } catch {
    // Ignore quota errors
  }
}

function restoreSnapshot(index) {
  if (index < 0 || index >= state.history.length) return;
  state.historyIndex = index;
  const tiles = JSON.parse(state.history[index]);
  state.selectedKey = null;
  engine.setCityTiles(tiles);
  syncEngineTool();
  renderInspector();
  updateCityStats();
  updateUndoRedoButtons();
  try {
    localStorage.setItem(STORAGE_KEY, state.history[index]);
  } catch {
    // Ignore
  }
}

function updateUndoRedoButtons() {
  document.getElementById('btn-undo').disabled = state.historyIndex <= 0;
  document.getElementById('btn-redo').disabled = state.historyIndex >= state.history.length - 1;
}

// ============================================================================
// UI Rendering: Catalog, Inspector, Stats
// ============================================================================
function syncEngineTool() {
  engine.setToolState({
    mode: state.mode,
    activeType: state.activeType,
    activeOptions: state.activeOptionsByType[state.activeType],
    activeRotation: state.activeRotation,
    selectedKey: state.selectedKey,
  });
}

function setMode(mode) {
  state.mode = mode;
  if (mode !== 'select') {
    state.selectedKey = null;
  }
  document.querySelectorAll('#mode-controls .tool-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  syncEngineTool();
  renderInspector();
}

function renderCatalog() {
  catalogContainer.innerHTML = '';
  for (const cat of CATEGORIES) {
    const group = document.createElement('section');
    group.className = 'catalog-group';

    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = cat.label;
    group.appendChild(title);

    const list = document.createElement('div');
    list.className = 'block-list';

    const items = Object.values(BLOCK_CATALOG).filter((b) => b.category === cat.id);
    for (const block of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `block-item${state.activeType === block.type ? ' active' : ''}`;
      btn.dataset.type = block.type;
      btn.innerHTML = `
        <span class="block-swatch" style="background:${block.swatch}">${block.icon}</span>
        <span class="block-meta">
          <span class="block-name">${block.name}</span>
          <span class="block-desc">${block.desc}</span>
        </span>
      `;
      btn.addEventListener('click', () => {
        state.activeType = block.type;
        if (state.mode !== 'build') setMode('build');
        renderCatalog();
        syncEngineTool();
        renderInspector();
      });
      list.appendChild(btn);
    }

    group.appendChild(list);
    catalogContainer.appendChild(group);
  }
}

function renderInspector() {
  inspectorControls.innerHTML = '';

  const isEditingPlaced = state.mode === 'select' && state.selectedKey && engine.tiles.has(state.selectedKey);
  const targetTile = isEditingPlaced ? engine.tiles.get(state.selectedKey) : null;
  const blockType = targetTile ? targetTile.type : state.activeType;
  const def = BLOCK_CATALOG[blockType];

  if (state.mode === 'select' && !targetTile) {
    inspectorTitle.textContent = 'Customize Mode';
    inspectorSubtitle.textContent = 'Click any placed block on the map';
    rotationSection.classList.add('hidden');
    selectedActions.classList.add('hidden');
    const hint = document.createElement('p');
    hint.className = 'empty-inspector';
    hint.textContent =
      'Select any apartment, office tower, park, shop, or road to live-edit its stories, architectural style, color palette, roof, or rotation.';
    inspectorControls.appendChild(hint);
    return;
  }

  if (state.mode === 'erase') {
    inspectorTitle.textContent = 'Bulldoze Tool';
    inspectorSubtitle.textContent = 'Click or drag across tiles to clear';
    rotationSection.classList.add('hidden');
    selectedActions.classList.add('hidden');
    return;
  }

  if (!def) return;

  inspectorTitle.textContent = def.name;
  inspectorSubtitle.textContent = isEditingPlaced
    ? `Editing placed tile (${targetTile.x}, ${targetTile.z})`
    : 'Configure options before placing';

  const currentOptions = targetTile ? targetTile.options : state.activeOptionsByType[blockType];
  const currentRotation = targetTile ? targetTile.rotation : state.activeRotation;

  rotationSection.classList.toggle('hidden', !def.rotatable);
  rotationReadout.textContent = `${currentRotation}°`;
  selectedActions.classList.toggle('hidden', !isEditingPlaced);

  // Live per-block capacity readout (Residents / Jobs) that reacts instantly to Stories & Density
  const capacityCard = document.createElement('div');
  capacityCard.className = 'block-capacity-card';
  const refreshCapacityCard = () => {
    const s = def.stats(currentOptions || {});
    if (s.residents === 0 && s.jobs === 0) {
      capacityCard.classList.add('hidden');
      return;
    }
    capacityCard.classList.remove('hidden');
    const parts = [];
    if (s.residents > 0) parts.push(`<div><span class="cap-label">Residents</span><strong class="cap-val">${s.residents.toLocaleString()}</strong></div>`);
    if (s.jobs > 0) parts.push(`<div><span class="cap-label">Jobs</span><strong class="cap-val">${s.jobs.toLocaleString()}</strong></div>`);
    if (currentOptions.floors) parts.push(`<div><span class="cap-label">Height</span><strong class="cap-val">${currentOptions.floors} fl</strong></div>`);
    capacityCard.innerHTML = parts.join('');
  };
  refreshCapacityCard();
  inspectorControls.appendChild(capacityCard);

  const onOptionChange = (key, value) => {
    if (targetTile) {
      targetTile.options[key] = value;
      engine.upsertTile(targetTile, false);
      commitSnapshot();
      updateCityStats();
    } else {
      state.activeOptionsByType[blockType][key] = value;
      syncEngineTool();
    }
    refreshCapacityCard();
  };

  for (const ctrl of def.controls) {
    if (ctrl.kind === 'range') {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      const val = currentOptions[ctrl.key] ?? def.defaults[ctrl.key];
      wrap.innerHTML = `
        <div class="field-header">
          <label for="ctrl-${ctrl.key}">${ctrl.label}</label>
          <span class="mono-tag" id="val-${ctrl.key}">${val}${ctrl.unit || ''}</span>
        </div>
        <input id="ctrl-${ctrl.key}" type="range" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${val}" />
      `;
      const input = wrap.querySelector('input');
      const readout = wrap.querySelector(`#val-${ctrl.key}`);
      input.addEventListener('input', () => {
        const num = Number(input.value);
        readout.textContent = `${num}${ctrl.unit || ''}`;
        if (targetTile) {
          targetTile.options[ctrl.key] = num;
          engine.upsertTile(targetTile, false);
          updateCityStats();
        } else {
          state.activeOptionsByType[blockType][ctrl.key] = num;
          syncEngineTool();
        }
        refreshCapacityCard();
      });
      input.addEventListener('change', () => {
        if (targetTile) commitSnapshot();
      });
      inspectorControls.appendChild(wrap);
    } else if (ctrl.kind === 'segmented') {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      const val = currentOptions[ctrl.key] ?? def.defaults[ctrl.key];
      const header = document.createElement('div');
      header.className = 'field-header';
      const label = document.createElement('label');
      label.textContent = ctrl.label;
      const tag = document.createElement('span');
      tag.className = 'mono-tag';
      const activeOpt = ctrl.options.find((o) => o.value === val) || ctrl.options[0];
      tag.textContent = DENSITY_META[val]?.label || activeOpt?.label || val;
      header.appendChild(label);
      header.appendChild(tag);
      wrap.appendChild(header);

      const seg = document.createElement('div');
      seg.className = `segmented full-width cols-${ctrl.options.length}`;
      const hint = document.createElement('span');
      hint.className = 'field-hint';
      hint.textContent = DENSITY_META[val]?.desc || '';

      for (const opt of ctrl.options) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `seg-btn${opt.value === val ? ' active' : ''}`;
        btn.textContent = opt.label;
        btn.title = DENSITY_META[opt.value]?.desc || opt.label;
        btn.addEventListener('click', () => {
          seg.querySelectorAll('.seg-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          tag.textContent = DENSITY_META[opt.value]?.label || opt.label;
          hint.textContent = DENSITY_META[opt.value]?.desc || '';
          onOptionChange(ctrl.key, opt.value);
        });
        seg.appendChild(btn);
      }
      wrap.appendChild(seg);
      if (hint.textContent) wrap.appendChild(hint);
      inspectorControls.appendChild(wrap);
    } else if (ctrl.kind === 'select') {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      const val = currentOptions[ctrl.key] ?? def.defaults[ctrl.key];
      const optionsHtml = ctrl.options
        .map((o) => `<option value="${o.value}" ${o.value === val ? 'selected' : ''}>${o.label}</option>`)
        .join('');
      wrap.innerHTML = `
        <label for="ctrl-${ctrl.key}">${ctrl.label}</label>
        <select id="ctrl-${ctrl.key}">${optionsHtml}</select>
      `;
      wrap.querySelector('select').addEventListener('change', (e) => {
        onOptionChange(ctrl.key, e.target.value);
      });
      inspectorControls.appendChild(wrap);
    } else if (ctrl.kind === 'swatches') {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      const val = currentOptions[ctrl.key] ?? def.defaults[ctrl.key];
      const label = document.createElement('label');
      label.textContent = ctrl.label;
      wrap.appendChild(label);

      const row = document.createElement('div');
      row.className = 'swatch-row';
      for (const sw of ctrl.palette) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `color-swatch${sw.hex.toLowerCase() === String(val).toLowerCase() ? ' active' : ''}`;
        btn.style.background = sw.hex;
        btn.title = sw.name;
        btn.addEventListener('click', () => {
          row.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('active'));
          btn.classList.add('active');
          onOptionChange(ctrl.key, sw.hex);
        });
        row.appendChild(btn);
      }
      wrap.appendChild(row);
      inspectorControls.appendChild(wrap);
    } else if (ctrl.kind === 'toggle') {
      const wrap = document.createElement('div');
      wrap.className = 'toggle-row';
      const checked = Boolean(currentOptions[ctrl.key] ?? def.defaults[ctrl.key]);
      wrap.innerHTML = `
        <label for="ctrl-${ctrl.key}">${ctrl.label}</label>
        <input id="ctrl-${ctrl.key}" type="checkbox" ${checked ? 'checked' : ''} />
      `;
      wrap.querySelector('input').addEventListener('change', (e) => {
        onOptionChange(ctrl.key, e.target.checked);
      });
      inspectorControls.appendChild(wrap);
    }
  }
}

function updateCityStats() {
  let residents = 0;
  let jobs = 0;
  let greeneryPts = 0;
  const totalBlocks = engine.tiles.size;

  for (const t of engine.tiles.values()) {
    const def = BLOCK_CATALOG[t.type];
    if (!def) continue;
    const s = def.stats(t.options || {});
    residents += s.residents;
    jobs += s.jobs;
    greeneryPts += s.greenery;
  }

  const greeneryPct = totalBlocks > 0 ? Math.min(100, Math.round((greeneryPts / Math.max(12, totalBlocks * 0.48)) * 100)) : 0;

  document.getElementById('stat-residents').textContent = residents.toLocaleString();
  document.getElementById('stat-jobs').textContent = jobs.toLocaleString();
  document.getElementById('stat-greenery').textContent = `${greeneryPct}%`;
  document.getElementById('stat-blocks').textContent = totalBlocks.toLocaleString();
}

// ============================================================================
// Event Wiring
// ============================================================================
function rotateActive(delta) {
  const isEditingPlaced = state.mode === 'select' && state.selectedKey && engine.tiles.has(state.selectedKey);
  if (isEditingPlaced) {
    const t = engine.tiles.get(state.selectedKey);
    if (!BLOCK_CATALOG[t.type]?.rotatable) return;
    t.rotation = ((t.rotation || 0) + delta + 360) % 360;
    engine.upsertTile(t, false);
    commitSnapshot();
    rotationReadout.textContent = `${t.rotation}°`;
  } else {
    state.activeRotation = (state.activeRotation + delta + 360) % 360;
    rotationReadout.textContent = `${state.activeRotation}°`;
    syncEngineTool();
  }
}

document.querySelectorAll('#mode-controls .tool-btn').forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

document.querySelectorAll('#time-controls .seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#time-controls .seg-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    engine.applyTimeOfDay(btn.dataset.time, true);
  });
});

document.querySelectorAll('#camera-controls .seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#camera-controls .seg-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    engine.flyToPreset(btn.dataset.cam);
  });
});

document.querySelectorAll('#quality-controls .seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#quality-controls .seg-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    engine.applyQuality(btn.dataset.quality);
    showToast(`Graphics preset: ${btn.textContent}`);
  });
});

document.getElementById('toggle-traffic').addEventListener('change', (e) => {
  engine.setTrafficEnabled(e.target.checked);
});

document.getElementById('toggle-pedestrians').addEventListener('change', (e) => {
  engine.setPedestriansEnabled(e.target.checked);
});

document.getElementById('toggle-grid').addEventListener('change', (e) => {
  engine.setGridVisible(e.target.checked);
});

document.getElementById('btn-rotate-cw').addEventListener('click', () => rotateActive(90));
document.getElementById('btn-rotate-ccw').addEventListener('click', () => rotateActive(-90));

document.getElementById('btn-duplicate-style').addEventListener('click', () => {
  if (!state.selectedKey || !engine.tiles.has(state.selectedKey)) return;
  const t = engine.tiles.get(state.selectedKey);
  state.activeType = t.type;
  state.activeOptionsByType[t.type] = { ...t.options };
  state.activeRotation = t.rotation || 0;
  setMode('build');
  renderCatalog();
  renderInspector();
  showToast(`Ready to place ${BLOCK_CATALOG[t.type].name}`);
});

document.getElementById('btn-delete-selected').addEventListener('click', () => {
  if (!state.selectedKey || !engine.tiles.has(state.selectedKey)) return;
  const t = engine.tiles.get(state.selectedKey);
  engine.removeTile(t.x, t.z);
  state.selectedKey = null;
  commitSnapshot();
  renderInspector();
  updateCityStats();
  showToast('Demolished block');
});

document.getElementById('btn-undo').addEventListener('click', () => restoreSnapshot(state.historyIndex - 1));
document.getElementById('btn-redo').addEventListener('click', () => restoreSnapshot(state.historyIndex + 1));

// Presets
document.getElementById('preset-select').addEventListener('change', (e) => {
  const tiles = getPresetTiles(e.target.value);
  state.selectedKey = null;
  engine.setCityTiles(tiles);
  commitSnapshot();
  renderInspector();
  updateCityStats();
  showToast(`Loaded ${e.target.options[e.target.selectedIndex].text}`);
});

// PNG Snapshot
document.getElementById('btn-snapshot').addEventListener('click', () => {
  const url = engine.capturePNG();
  const a = document.createElement('a');
  a.href = url;
  a.download = `civitas-city-${Date.now()}.png`;
  a.click();
  showToast('Downloaded PNG snapshot');
});

// JSON Export / Import
document.getElementById('btn-export').addEventListener('click', () => {
  const payload = JSON.stringify({ version: 1, tiles: serializeCity() }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `civitas-city-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Exported city JSON');
});

const fileImport = document.getElementById('file-import');
document.getElementById('btn-import').addEventListener('click', () => fileImport.click());
fileImport.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const tiles = Array.isArray(parsed) ? parsed : parsed.tiles;
    if (!Array.isArray(tiles)) throw new Error('Invalid city file');
    engine.setCityTiles(tiles);
    state.selectedKey = null;
    commitSnapshot();
    renderInspector();
    updateCityStats();
    showToast(`Imported ${tiles.length} city blocks`);
  } catch {
    showToast('Invalid JSON city file');
  }
  fileImport.value = '';
});

// Collapsible Side Drawers
const leftPanel = document.getElementById('left-panel');
const rightPanel = document.getElementById('right-panel');
const btnReopenLeft = document.getElementById('btn-reopen-left');
const btnReopenRight = document.getElementById('btn-reopen-right');

document.getElementById('btn-toggle-left').addEventListener('click', () => {
  leftPanel.classList.add('collapsed');
  btnReopenLeft.classList.remove('hidden');
});
btnReopenLeft.addEventListener('click', () => {
  leftPanel.classList.remove('collapsed');
  btnReopenLeft.classList.add('hidden');
});

document.getElementById('btn-toggle-right').addEventListener('click', () => {
  rightPanel.classList.add('collapsed');
  btnReopenRight.classList.remove('hidden');
});
btnReopenRight.addEventListener('click', () => {
  rightPanel.classList.remove('collapsed');
  btnReopenRight.classList.add('hidden');
});

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if ((e.metaKey || e.ctrlKey) && k === 'z') {
    e.preventDefault();
    if (e.shiftKey) restoreSnapshot(state.historyIndex + 1);
    else restoreSnapshot(state.historyIndex - 1);
    return;
  }
  if (k === 'b') setMode('build');
  else if (k === 'v') setMode('select');
  else if (k === 'x') setMode('erase');
  else if (k === 'i') setMode('sample');
  else if (k === 'r') rotateActive(90);
});

// ============================================================================
// Bootstrap: Restore saved city or load Harborview Commons starter town
// ============================================================================
function bootstrap() {
  let initialTiles = null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) initialTiles = parsed;
    }
  } catch {
    // Fallback to preset
  }

  engine.setCityTiles(initialTiles || getPresetTiles('harborview'));
  renderCatalog();
  syncEngineTool();
  renderInspector();
  commitSnapshot();
  updateCityStats();
}

bootstrap();
