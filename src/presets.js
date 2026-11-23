import { createDefaultOptions } from './catalog.js';

function tile(x, z, type, overrides = {}, rotation = 0) {
  return {
    x,
    z,
    type,
    rotation,
    options: { ...createDefaultOptions(type), ...overrides },
  };
}

// ============================================================================
// Preset 1: Harborview Commons — Curated starter small city showcasing every block
// ============================================================================
export function buildHarborviewPreset() {
  const list = [];

  // Canal along the south-east waterfront
  for (let x = 3; x <= 20; x++) {
    list.push(tile(x, 18, 'water', { dock: x === 11 || x === 12 }));
    if (x >= 15) list.push(tile(x, 17, 'water'));
  }

  // Main street grid (roads auto-connect into turns & crosswalk intersections!)
  for (let x = 4; x <= 19; x++) {
    list.push(tile(x, 7, 'road', { lamps: x % 2 === 0 }));
    list.push(tile(x, 12, 'road', { lamps: x % 2 === 0, boulevardTrees: x % 3 === 0 }));
    list.push(tile(x, 16, 'road', { lamps: x % 2 === 1 }));
  }
  for (let z = 5; z <= 16; z++) {
    if (z !== 7 && z !== 12 && z !== 16) {
      list.push(tile(7, z, 'road', { lamps: z % 2 === 0 }));
      list.push(tile(12, z, 'road', { lamps: z % 2 === 1 }));
      list.push(tile(16, z, 'road', { lamps: z % 2 === 0 }));
    }
  }

  // Central Civic Square & Parks
  list.push(tile(9, 9, 'civic', { variant: 'townhall', color: '#dfd7c8', accentColor: '#4f8574' }, 0));
  list.push(tile(10, 9, 'plaza', { centerpiece: 'clock' }));
  list.push(tile(9, 10, 'park', { theme: 'fountain', season: 'spring' }));
  list.push(tile(10, 10, 'park', { theme: 'botanical', season: 'spring' }));
  list.push(tile(8, 10, 'plaza', { centerpiece: 'kiosk' }));
  list.push(tile(11, 10, 'plaza', { centerpiece: 'planter' }));

  // Downtown Office District (north-east block)
  list.push(tile(13, 8, 'office', { floors: 13, massing: 'stepped', color: '#6d98b5', crown: 'spire' }, 0));
  list.push(tile(14, 8, 'office', { floors: 9, massing: 'curtain', color: '#527987', crown: 'garden' }, 90));
  list.push(tile(15, 8, 'office', { floors: 11, massing: 'twin', color: '#98a9b8', crown: 'helipad' }, 0));
  list.push(tile(13, 9, 'office', { floors: 7, massing: 'curtain', color: '#8e7c6a', crown: 'mechanical' }, 180));
  list.push(tile(14, 10, 'civic', { variant: 'museum', color: '#dfd7c8', accentColor: '#47505c' }, 0));
  list.push(tile(15, 10, 'plaza', { centerpiece: 'planter' }));

  // Customizable Residential Apartments District (west & midtown blocks)
  list.push(tile(5, 8, 'apartment', { floors: 6, style: 'brick', color: '#b96b52', roofStyle: 'terrace', balconies: true, groundRetail: true }, 90));
  list.push(tile(6, 8, 'apartment', { floors: 5, style: 'timber', color: '#d4a66a', roofStyle: 'green', balconies: true, groundRetail: true }, 0));
  list.push(tile(5, 9, 'apartment', { floors: 8, style: 'modern', color: '#6c7c8c', roofStyle: 'penthouse', balconies: true, groundRetail: false }, 90));
  list.push(tile(6, 10, 'apartment', { floors: 4, style: 'midcentury', color: '#dfd7c8', roofStyle: 'gable', balconies: true, groundRetail: true }, 180));
  list.push(tile(5, 11, 'apartment', { floors: 5, style: 'brick', color: '#9eb09f', roofStyle: 'green', balconies: true, groundRetail: true }, 0));

  // Car-free Pedestrian Promenade (connecting Cafés, Civic Square & Waterfront with corners!)
  list.push(tile(8, 11, 'pedestrian', { paving: 'cobble', bikeLane: true, lamps: true, planters: true }));
  list.push(tile(9, 11, 'pedestrian', { paving: 'cobble', bikeLane: true, lamps: false, planters: true }));
  list.push(tile(10, 11, 'pedestrian', { paving: 'cobble', bikeLane: true, lamps: true, planters: true }));
  list.push(tile(11, 11, 'pedestrian', { paving: 'cobble', bikeLane: true, lamps: false, planters: true }));
  list.push(tile(8, 14, 'pedestrian', { paving: 'brick', bikeLane: true, lamps: true, planters: true }));
  list.push(tile(9, 14, 'pedestrian', { paving: 'brick', bikeLane: true, lamps: false, planters: true }));
  list.push(tile(10, 14, 'pedestrian', { paving: 'brick', bikeLane: true, lamps: true, planters: true }));
  list.push(tile(11, 14, 'pedestrian', { paving: 'brick', bikeLane: true, lamps: false, planters: true }));
  list.push(tile(11, 13, 'pedestrian', { paving: 'brick', bikeLane: true, lamps: false, planters: false }));

  // South Waterfront Mixed-Use (Cafés, Apartments & Library)
  list.push(tile(8, 13, 'shop', { floors: 2, color: '#dfd7c8', awningColor: '#2f6f4e', patio: true }, 0));
  list.push(tile(9, 13, 'shop', { floors: 2, color: '#d4a66a', awningColor: '#a63d33', patio: true }, 0));
  list.push(tile(10, 13, 'apartment', { floors: 4, style: 'brick', color: '#b96b52', roofStyle: 'green', balconies: true, groundRetail: true }, 0));
  list.push(tile(8, 15, 'apartment', { floors: 6, style: 'modern', color: '#dfd7c8', roofStyle: 'penthouse', balconies: true, groundRetail: true }, 180));
  list.push(tile(9, 15, 'civic', { variant: 'library', color: '#dfd7c8', accentColor: '#4f8574' }, 180));
  list.push(tile(10, 15, 'plaza', { centerpiece: 'kiosk' }));
  list.push(tile(11, 15, 'park', { theme: 'meadow', season: 'spring' }));

  // Cozy Townhouse Neighborhood (north & east edge)
  list.push(tile(8, 6, 'townhouse', { floors: 2, color: '#dfd7c8', roofColor: '#9c4f3d', garden: true }, 0));
  list.push(tile(9, 6, 'townhouse', { floors: 2, color: '#d4a66a', roofColor: '#47505c', garden: true }, 0));
  list.push(tile(10, 6, 'townhouse', { floors: 3, color: '#9eb09f', roofColor: '#4f8574', garden: true }, 0));
  list.push(tile(11, 6, 'townhouse', { floors: 2, color: '#b96b52', roofColor: '#47505c', garden: true }, 0));
  list.push(tile(17, 9, 'townhouse', { floors: 2, color: '#dfd7c8', roofColor: '#9c4f3d', garden: true }, 270));
  list.push(tile(17, 10, 'townhouse', { floors: 2, color: '#d4a66a', roofColor: '#47505c', garden: true }, 270));
  list.push(tile(17, 13, 'apartment', { floors: 5, style: 'timber', color: '#dfd7c8', roofStyle: 'green', balconies: true, groundRetail: true }, 270));
  list.push(tile(18, 13, 'park', { theme: 'courts', season: 'summer' }));

  // Greenbelt & Sports Park
  list.push(tile(13, 14, 'park', { theme: 'courts', season: 'spring' }));
  list.push(tile(14, 14, 'park', { theme: 'meadow', season: 'autumn' }));
  list.push(tile(5, 14, 'park', { theme: 'meadow', season: 'spring' }));
  list.push(tile(6, 14, 'trees', { density: 'balanced', season: 'spring' }));

  // Surrounding urban forest framing
  const woods = [
    [3, 5, 'dense', 'pine'], [4, 5, 'balanced', 'summer'], [5, 5, 'sparse', 'spring'],
    [17, 6, 'balanced', 'autumn'], [18, 6, 'dense', 'pine'], [19, 8, 'balanced', 'summer'],
    [19, 10, 'dense', 'autumn'], [19, 14, 'balanced', 'spring'], [3, 11, 'dense', 'summer'],
    [3, 14, 'balanced', 'pine'], [4, 17, 'sparse', 'spring'], [13, 6, 'sparse', 'autumn'],
  ];
  for (const [x, z, density, season] of woods) {
    list.push(tile(x, z, 'trees', { density, season }));
  }

  return list;
}

// ============================================================================
// Preset 2: Riverside Grid — Clean symmetric avenues split by a canal
// ============================================================================
export function buildRiversidePreset() {
  const list = [];
  for (let x = 2; x <= 21; x++) {
    list.push(tile(x, 11, 'water', { dock: x === 8 || x === 15 }));
    list.push(tile(x, 12, 'water'));
  }
  for (let x = 4; x <= 19; x++) {
    list.push(tile(x, 6, 'road', { lamps: x % 2 === 0 }));
    list.push(tile(x, 10, 'road', { lamps: x % 2 === 0, boulevardTrees: true }));
    list.push(tile(x, 13, 'road', { lamps: x % 2 === 0, boulevardTrees: true }));
    list.push(tile(x, 17, 'road', { lamps: x % 2 === 0 }));
  }
  for (let z = 6; z <= 17; z++) {
    if (z !== 11 && z !== 12) {
      list.push(tile(6, z, 'road', { lamps: z % 2 === 0 }));
      list.push(tile(11, z, 'road', { lamps: z % 2 === 0 }));
      list.push(tile(17, z, 'road', { lamps: z % 2 === 0 }));
    }
  }
  // North side apartments & offices
  list.push(tile(8, 8, 'office', { floors: 12, massing: 'stepped', color: '#6d98b5', crown: 'spire' }));
  list.push(tile(9, 8, 'office', { floors: 8, massing: 'curtain', color: '#527987', crown: 'garden' }));
  list.push(tile(13, 8, 'apartment', { floors: 6, style: 'brick', color: '#b96b52', roofStyle: 'green', balconies: true, groundRetail: true }));
  list.push(tile(14, 8, 'apartment', { floors: 7, style: 'modern', color: '#dfd7c8', roofStyle: 'penthouse', balconies: true, groundRetail: true }));
  list.push(tile(15, 8, 'apartment', { floors: 5, style: 'timber', color: '#d4a66a', roofStyle: 'terrace', balconies: true, groundRetail: false }));
  // South side civic & parks
  list.push(tile(8, 15, 'civic', { variant: 'townhall', color: '#dfd7c8', accentColor: '#4f8574' }));
  list.push(tile(9, 15, 'park', { theme: 'fountain', season: 'spring' }));
  list.push(tile(13, 15, 'park', { theme: 'botanical', season: 'autumn' }));
  list.push(tile(14, 15, 'shop', { floors: 2, color: '#dfd7c8', awningColor: '#2f6f4e', patio: true }));
  list.push(tile(15, 15, 'townhouse', { floors: 2, color: '#9eb09f', roofColor: '#9c4f3d', garden: true }));
  return list;
}

export function getPresetTiles(name) {
  if (name === 'riverside') return buildRiversidePreset();
  if (name === 'blank') return [];
  return buildHarborviewPreset();
}
