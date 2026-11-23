// Building Block Catalog, Curated Architectural Palettes, and Stats Calculators

export const GRID_SIZE = 24;
export const TILE_SIZE = 2.0;

export const FACADE_PALETTES = [
  { id: 'limestone', name: 'Warm Limestone', hex: '#dfd7c8' },
  { id: 'terracotta', name: 'Terracotta Brick', hex: '#b96b52' },
  { id: 'slate', name: 'Nordic Slate', hex: '#6c7c8c' },
  { id: 'sage', name: 'Sage Plaster', hex: '#9eb09f' },
  { id: 'ochre', name: 'Sunlit Ochre', hex: '#d4a66a' },
  { id: 'charcoal', name: 'Anthracite', hex: '#434b56' },
];

export const GLASS_PALETTES = [
  { id: 'glacier', name: 'Glacier Blue', hex: '#6d98b5' },
  { id: 'steel', name: 'Steel Teal', hex: '#527987' },
  { id: 'bronze', name: 'Warm Bronze', hex: '#8e7c6a' },
  { id: 'silver', name: 'Silver Mist', hex: '#98a9b8' },
  { id: 'obsidian', name: 'Deep Graphite', hex: '#3e4f63' },
];

export const ROOF_PALETTES = [
  { id: 'slateRoof', name: 'Slate Grey', hex: '#47505c' },
  { id: 'clay', name: 'Clay Tile', hex: '#9c4f3d' },
  { id: 'copper', name: 'Patina Copper', hex: '#4f8574' },
  { id: 'sand', name: 'Warm Concrete', hex: '#bcb4a5' },
];

export const AWNING_PALETTES = [
  { id: 'forest', name: 'Forest', hex: '#2f6f4e' },
  { id: 'bistro', name: 'Bistro Red', hex: '#a63d33' },
  { id: 'navy', name: 'Harbor Navy', hex: '#244c6b' },
  { id: 'mustard', name: 'Saffron', hex: '#c2882b' },
];

export const FOLIAGE_PALETTES = {
  spring: { name: 'Spring Green', colors: ['#5d9b52', '#6faf5f', '#4e8846'] },
  summer: { name: 'Summer Lush', colors: ['#3f7c44', '#4e8f4f', '#326839'] },
  autumn: { name: 'Autumn Gold', colors: ['#c87b35', '#d99a3c', '#a85134'] },
  pine: { name: 'Alpine Pine', colors: ['#2e5c45', '#386d52', '#244a38'] },
};

export const CATEGORIES = [
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'residential', label: 'Residential' },
  { id: 'commercial', label: 'Commercial & Civic' },
  { id: 'parks', label: 'Parks & Nature' },
];

export const BLOCK_CATALOG = {
  road: {
    type: 'road',
    category: 'infrastructure',
    name: 'City Street',
    desc: 'Auto-connects turns & crosswalks',
    swatch: '#4a525c',
    icon: '═',
    paintable: true,
    rotatable: false,
    defaults: {
      lamps: true,
      boulevardTrees: false,
    },
    controls: [
      { key: 'lamps', label: 'Streetlamps', kind: 'toggle' },
      { key: 'boulevardTrees', label: 'Sidewalk Trees', kind: 'toggle' },
    ],
    stats: () => ({ residents: 0, jobs: 0, greenery: 0.1 }),
  },

  pedestrian: {
    type: 'pedestrian',
    category: 'infrastructure',
    name: 'Pedestrian Street',
    desc: 'Car-free promenade with cyclists & walkers',
    swatch: '#a66b52',
    icon: '🚲',
    paintable: true,
    rotatable: false,
    defaults: {
      paving: 'cobble', // cobble | brick | sandstone
      bikeLane: true,
      lamps: true,
      planters: true,
    },
    controls: [
      {
        key: 'paving',
        label: 'Paving Style',
        kind: 'select',
        options: [
          { value: 'cobble', label: 'Granite Cobblestone' },
          { value: 'brick', label: 'European Red Brick' },
          { value: 'sandstone', label: 'Nordic Sandstone Slabs' },
        ],
      },
      { key: 'bikeLane', label: 'Dedicated Cycle Track', kind: 'toggle' },
      { key: 'lamps', label: 'Promenade Lamps', kind: 'toggle' },
      { key: 'planters', label: 'Planters & Benches', kind: 'toggle' },
    ],
    stats: (o) => ({
      residents: 0,
      jobs: 1,
      greenery: o.planters ? 0.45 : 0.2,
    }),
  },

  plaza: {
    type: 'plaza',
    category: 'infrastructure',
    name: 'Pedestrian Plaza',
    desc: 'Stone walkway, benches & planters',
    swatch: '#c4bba8',
    icon: '▦',
    paintable: true,
    rotatable: true,
    defaults: {
      centerpiece: 'planter', // planter | kiosk | clock | open
    },
    controls: [
      {
        key: 'centerpiece',
        label: 'Plaza Feature',
        kind: 'select',
        options: [
          { value: 'planter', label: 'Tree Planter & Benches' },
          { value: 'kiosk', label: 'Coffee Kiosk' },
          { value: 'clock', label: 'Civic Clock Pillar' },
          { value: 'open', label: 'Open Courtyard' },
        ],
      },
    ],
    stats: () => ({ residents: 0, jobs: 2, greenery: 0.4 }),
  },

  water: {
    type: 'water',
    category: 'infrastructure',
    name: 'Canal & Pond',
    desc: 'Auto-blending stone waterfront',
    swatch: '#3f84a8',
    icon: '≈',
    paintable: true,
    rotatable: false,
    defaults: {
      dock: false,
    },
    controls: [
      { key: 'dock', label: 'Wooden Pier Accent', kind: 'toggle' },
    ],
    stats: () => ({ residents: 0, jobs: 0, greenery: 0.8 }),
  },

  apartment: {
    type: 'apartment',
    category: 'residential',
    name: 'Apartment Block',
    desc: 'Customizable floors, roofs & retail',
    swatch: '#b96b52',
    icon: '▤',
    paintable: false,
    rotatable: true,
    defaults: {
      floors: 5,
      style: 'brick', // modern | brick | timber | midcentury
      color: '#b96b52',
      roofStyle: 'terrace', // terrace | gable | green | penthouse
      balconies: true,
      groundRetail: true,
    },
    controls: [
      { key: 'floors', label: 'Stories', kind: 'range', min: 2, max: 12, step: 1, unit: ' fl' },
      {
        key: 'style',
        label: 'Facade Style',
        kind: 'select',
        options: [
          { value: 'modern', label: 'Modern Concrete & Glass' },
          { value: 'brick', label: 'Warm Urban Brick' },
          { value: 'timber', label: 'Nordic Timber Slats' },
          { value: 'midcentury', label: 'Mid-Century Banded' },
        ],
      },
      { key: 'color', label: 'Facade Color', kind: 'swatches', palette: FACADE_PALETTES },
      {
        key: 'roofStyle',
        label: 'Roof Style',
        kind: 'select',
        options: [
          { value: 'terrace', label: 'Flat Terrace + HVAC' },
          { value: 'green', label: 'Green Rooftop Garden' },
          { value: 'penthouse', label: 'Glass Penthouse Loft' },
          { value: 'gable', label: 'Pitched Gable Roof' },
        ],
      },
      { key: 'balconies', label: 'Balconies', kind: 'toggle' },
      { key: 'groundRetail', label: 'Ground-Floor Retail', kind: 'toggle' },
    ],
    stats: (o) => ({
      residents: Math.round((o.floors || 5) * 14),
      jobs: o.groundRetail ? 8 : 1,
      greenery: o.roofStyle === 'green' ? 0.6 : 0,
    }),
  },

  townhouse: {
    type: 'townhouse',
    category: 'residential',
    name: 'Townhouse Row',
    desc: 'Low-rise rowhomes with pitched roofs',
    swatch: '#d4a66a',
    icon: '⌂',
    paintable: false,
    rotatable: true,
    defaults: {
      floors: 2,
      color: '#dfd7c8',
      roofColor: '#9c4f3d',
      garden: true,
    },
    controls: [
      { key: 'floors', label: 'Stories', kind: 'range', min: 1, max: 3, step: 1, unit: ' fl' },
      { key: 'color', label: 'Facade Color', kind: 'swatches', palette: FACADE_PALETTES },
      { key: 'roofColor', label: 'Roof Color', kind: 'swatches', palette: ROOF_PALETTES },
      { key: 'garden', label: 'Front Yard & Hedges', kind: 'toggle' },
    ],
    stats: (o) => ({
      residents: Math.round((o.floors || 2) * 6),
      jobs: 0,
      greenery: o.garden ? 0.45 : 0.1,
    }),
  },

  office: {
    type: 'office',
    category: 'commercial',
    name: 'Office Tower',
    desc: 'Mid-to-high-rise commercial tower',
    swatch: '#527987',
    icon: '▯',
    paintable: false,
    rotatable: true,
    defaults: {
      floors: 9,
      massing: 'stepped', // curtain | stepped | twin
      color: '#6d98b5',
      crown: 'mechanical', // mechanical | spire | helipad | garden
    },
    controls: [
      { key: 'floors', label: 'Stories', kind: 'range', min: 4, max: 18, step: 1, unit: ' fl' },
      {
        key: 'massing',
        label: 'Tower Massing',
        kind: 'select',
        options: [
          { value: 'curtain', label: 'Glass Curtain Wall' },
          { value: 'stepped', label: 'Stepped Setback Tower' },
          { value: 'twin', label: 'Twin Atrium Wings' },
        ],
      },
      { key: 'color', label: 'Glass Tint', kind: 'swatches', palette: GLASS_PALETTES },
      {
        key: 'crown',
        label: 'Rooftop Crown',
        kind: 'select',
        options: [
          { value: 'mechanical', label: 'Architectural Parapet' },
          { value: 'spire', label: 'Communications Spire' },
          { value: 'helipad', label: 'Rooftop Helipad' },
          { value: 'garden', label: 'Sky Terrace Garden' },
        ],
      },
    ],
    stats: (o) => ({
      residents: 0,
      jobs: Math.round((o.floors || 9) * 18),
      greenery: o.crown === 'garden' ? 0.4 : 0,
    }),
  },

  shop: {
    type: 'shop',
    category: 'commercial',
    name: 'Corner Café & Shop',
    desc: 'Boutique storefront with awning & patio',
    swatch: '#2f6f4e',
    icon: '◫',
    paintable: false,
    rotatable: true,
    defaults: {
      floors: 2,
      color: '#dfd7c8',
      awningColor: '#2f6f4e',
      patio: true,
    },
    controls: [
      { key: 'floors', label: 'Stories', kind: 'range', min: 1, max: 3, step: 1, unit: ' fl' },
      { key: 'color', label: 'Building Color', kind: 'swatches', palette: FACADE_PALETTES },
      { key: 'awningColor', label: 'Awning Color', kind: 'swatches', palette: AWNING_PALETTES },
      { key: 'patio', label: 'Outdoor Seating', kind: 'toggle' },
    ],
    stats: (o) => ({
      residents: (o.floors || 2) > 1 ? 6 : 0,
      jobs: 14,
      greenery: o.patio ? 0.2 : 0,
    }),
  },

  civic: {
    type: 'civic',
    category: 'commercial',
    name: 'Civic Landmark',
    desc: 'Town hall, museum, or library',
    swatch: '#4f8574',
    icon: '🏛',
    paintable: false,
    rotatable: true,
    defaults: {
      variant: 'townhall', // townhall | museum | library
      color: '#dfd7c8',
      accentColor: '#4f8574',
    },
    controls: [
      {
        key: 'variant',
        label: 'Landmark Type',
        kind: 'select',
        options: [
          { value: 'townhall', label: 'Town Hall (Domed)' },
          { value: 'museum', label: 'Modern Art Museum' },
          { value: 'library', label: 'Central Library' },
        ],
      },
      { key: 'color', label: 'Stone Facade', kind: 'swatches', palette: FACADE_PALETTES },
      { key: 'accentColor', label: 'Roof / Dome Accent', kind: 'swatches', palette: ROOF_PALETTES },
    ],
    stats: () => ({ residents: 0, jobs: 45, greenery: 0.5 }),
  },

  park: {
    type: 'park',
    category: 'parks',
    name: 'City Park',
    desc: 'Meadow, fountain, botanical, or courts',
    swatch: '#5d9b52',
    icon: '♣',
    paintable: true,
    rotatable: true,
    defaults: {
      theme: 'fountain', // meadow | fountain | botanical | courts
      season: 'spring', // spring | summer | autumn | pine
    },
    controls: [
      {
        key: 'theme',
        label: 'Park Design',
        kind: 'select',
        options: [
          { value: 'meadow', label: 'Meadow Grove & Path' },
          { value: 'fountain', label: 'Fountain Plaza' },
          { value: 'botanical', label: 'Botanical Pergola' },
          { value: 'courts', label: 'Sports Court & Trees' },
        ],
      },
      {
        key: 'season',
        label: 'Foliage Palette',
        kind: 'select',
        options: [
          { value: 'spring', label: 'Spring Green' },
          { value: 'summer', label: 'Summer Lush' },
          { value: 'autumn', label: 'Autumn Gold' },
          { value: 'pine', label: 'Alpine Pine' },
        ],
      },
    ],
    stats: () => ({ residents: 0, jobs: 2, greenery: 2.2 }),
  },

  trees: {
    type: 'trees',
    category: 'parks',
    name: 'Urban Forest',
    desc: 'Dense stylized grove for greenbelts',
    swatch: '#3f7c44',
    icon: '▲',
    paintable: true,
    rotatable: false,
    defaults: {
      density: 'balanced', // sparse | balanced | dense
      season: 'summer',
    },
    controls: [
      {
        key: 'density',
        label: 'Tree Density',
        kind: 'select',
        options: [
          { value: 'sparse', label: 'Open Grove (3 trees)' },
          { value: 'balanced', label: 'Balanced Woods (5 trees)' },
          { value: 'dense', label: 'Dense Canopy (8 trees)' },
        ],
      },
      {
        key: 'season',
        label: 'Foliage Palette',
        kind: 'select',
        options: [
          { value: 'spring', label: 'Spring Green' },
          { value: 'summer', label: 'Summer Lush' },
          { value: 'autumn', label: 'Autumn Gold' },
          { value: 'pine', label: 'Alpine Pine' },
        ],
      },
    ],
    stats: (o) => ({
      residents: 0,
      jobs: 0,
      greenery: o.density === 'dense' ? 2.6 : o.density === 'sparse' ? 1.5 : 2.1,
    }),
  },
};

export function createDefaultOptions(type) {
  const def = BLOCK_CATALOG[type];
  return def ? { ...def.defaults } : {};
}
