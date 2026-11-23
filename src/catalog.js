// Building Block Catalog, Curated Architectural Palettes, Density Models & Stats

export const GRID_SIZE = 24;
export const TILE_SIZE = 2.0;

export const DENSITY_META = {
  low: { label: 'Low', factor: 0.65, desc: 'Airy footprint with green setback' },
  medium: { label: 'Med', factor: 1.0, desc: 'Balanced urban block coverage' },
  high: { label: 'High', factor: 1.5, desc: 'Full-lot high-density massing' },
  ultra: { label: 'Ultra', factor: 2.1, desc: 'Twin-core maximum urban density' },
};

export const DENSITY_OPTIONS_4 = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Med' },
  { value: 'high', label: 'High' },
  { value: 'ultra', label: 'Ultra' },
];

export const DENSITY_OPTIONS_3 = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Med' },
  { value: 'high', label: 'High' },
];

export function getDensityFactor(density = 'medium') {
  return DENSITY_META[density]?.factor ?? 1.0;
}

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

export const HIGHRISE_PALETTES = [
  { id: 'glacier', name: 'Glacier Glass', hex: '#6d98b5' },
  { id: 'limestone', name: 'Warm Limestone', hex: '#d8d0c1' },
  { id: 'silver', name: 'Silver Aluminum', hex: '#99aab8' },
  { id: 'bronze', name: 'Champagne Bronze', hex: '#9a846c' },
  { id: 'terracotta', name: 'Urban Terracotta', hex: '#b36b54' },
  { id: 'charcoal', name: 'Graphite Steel', hex: '#424e5e' },
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

export const BRAND_PALETTES = [
  { id: 'emerald', name: 'Fresh Emerald', hex: '#2e7d4f' },
  { id: 'crimson', name: 'Market Crimson', hex: '#b83a34' },
  { id: 'cobalt', name: 'Harbor Cobalt', hex: '#225c8a' },
  { id: 'amber', name: 'Harvest Amber', hex: '#c98628' },
  { id: 'teal', name: 'Electric Teal', hex: '#237a82' },
  { id: 'plum', name: 'Artisan Plum', hex: '#6d4675' },
];

export const GARAGE_PALETTES = [
  { id: 'concrete', name: 'Warm Concrete', hex: '#bfb9ad' },
  { id: 'limestone', name: 'Limestone', hex: '#dfd7c8' },
  { id: 'slate', name: 'Nordic Slate', hex: '#6c7c8c' },
  { id: 'terracotta', name: 'Urban Brick', hex: '#b36b54' },
  { id: 'charcoal', name: 'Anthracite', hex: '#434b56' },
];

export const OCCUPANCY_OPTIONS = [
  { value: 'empty', label: 'Empty' },
  { value: 'light', label: 'Light' },
  { value: 'busy', label: 'Busy' },
  { value: 'full', label: 'Full' },
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

  parking_garage: {
    type: 'parking_garage',
    category: 'infrastructure',
    name: 'Parking Structure',
    desc: 'Multi-level deck (2–10 fl) & solar/park roof',
    swatch: '#5b6775',
    icon: '🅿',
    paintable: false,
    rotatable: true,
    defaults: {
      floors: 4,
      density: 'medium', // low | medium | high
      style: 'concrete', // concrete | louvered | brick
      color: '#bfb9ad',
      roofFeature: 'open', // open | solar | green
      groundRetail: true,
      pSign: true,
    },
    controls: [
      { key: 'floors', label: 'Deck Levels', kind: 'range', min: 2, max: 10, step: 1, unit: ' lvl' },
      { key: 'density', label: 'Footprint Size', kind: 'segmented', options: DENSITY_OPTIONS_3 },
      {
        key: 'style',
        label: 'Deck Facade',
        kind: 'select',
        options: [
          { value: 'concrete', label: 'Open Architectural Concrete' },
          { value: 'louvered', label: 'Modern Slatted Louver Screen' },
          { value: 'brick', label: 'Historic Brick-Wrapped Deck' },
        ],
      },
      { key: 'color', label: 'Structure Color', kind: 'swatches', palette: GARAGE_PALETTES },
      {
        key: 'roofFeature',
        label: 'Roof Deck Feature',
        kind: 'select',
        options: [
          { value: 'open', label: 'Open Rooftop Parking' },
          { value: 'solar', label: 'Solar Canopy Array' },
          { value: 'green', label: 'Rooftop Pocket Park' },
        ],
      },
      { key: 'groundRetail', label: 'Ground-Floor Retail', kind: 'toggle' },
      { key: 'pSign', label: 'Illuminated "P" Sign', kind: 'toggle' },
    ],
    stats: (o) => {
      const f = getDensityFactor(o.density);
      const levels = o.floors || 4;
      const stalls = Math.round(levels * 48 * f);
      return {
        residents: 0,
        jobs: Math.round(levels * 2 * f + (o.groundRetail ? 10 : 0)),
        parking: stalls,
        greenery: o.roofFeature === 'green' ? 0.65 : o.roofFeature === 'solar' ? 0.2 : 0,
      };
    },
  },

  parking_lot: {
    type: 'parking_lot',
    category: 'infrastructure',
    name: 'Surface Parking Lot',
    desc: 'Paintable lot, EV chargers & solar carports',
    swatch: '#4b535e',
    icon: 'P',
    paintable: true,
    rotatable: true,
    defaults: {
      layout: 'standard', // standard | ev | shaded
      occupancy: 'busy', // empty | light | busy | full
      solarCanopy: false,
      lamps: true,
    },
    controls: [
      {
        key: 'layout',
        label: 'Lot Type',
        kind: 'select',
        options: [
          { value: 'standard', label: 'Standard Asphalt Bays' },
          { value: 'ev', label: 'EV Fast-Charger Lot' },
          { value: 'shaded', label: 'Tree-Island Eco Lot' },
        ],
      },
      { key: 'occupancy', label: 'Parked Cars', kind: 'segmented', options: OCCUPANCY_OPTIONS },
      { key: 'solarCanopy', label: 'Solar Carport Canopy', kind: 'toggle' },
      { key: 'lamps', label: 'Lot Floodlights', kind: 'toggle' },
    ],
    stats: (o) => ({
      residents: 0,
      jobs: o.layout === 'ev' ? 2 : 1,
      parking: o.layout === 'shaded' ? 20 : 28,
      greenery: (o.layout === 'shaded' ? 0.6 : 0.05) + (o.solarCanopy ? 0.2 : 0),
    }),
  },

  transit: {
    type: 'transit',
    category: 'infrastructure',
    name: 'Transit & Mobility Hub',
    desc: 'Metro pavilion, BRT terminal, or bike-share',
    swatch: '#225c8a',
    icon: '🚇',
    paintable: false,
    rotatable: true,
    defaults: {
      hubType: 'metro', // metro | bus | bikeshare
      brandColor: '#225c8a',
    },
    controls: [
      {
        key: 'hubType',
        label: 'Transit Mode',
        kind: 'select',
        options: [
          { value: 'metro', label: 'Metro Glass Entrance Pavilion' },
          { value: 'bus', label: 'Bus Rapid Transit Terminal' },
          { value: 'bikeshare', label: 'E-Bike Share Mobility Dock' },
        ],
      },
      { key: 'brandColor', label: 'Line Accent Color', kind: 'swatches', palette: BRAND_PALETTES },
    ],
    stats: () => ({ residents: 0, jobs: 8, greenery: 0.35 }),
  },

  highrise: {
    type: 'highrise',
    category: 'residential',
    name: 'Residential High-Rise',
    desc: 'Tall residential tower (10–60 fl) & density',
    swatch: '#466c8c',
    icon: '▥',
    paintable: false,
    rotatable: true,
    defaults: {
      floors: 26,
      density: 'medium', // low | medium | high | ultra
      massing: 'point', // point | stepped | twin | skybridge
      style: 'modern', // modern | limestone | brick | midcentury
      color: '#6d98b5',
      crown: 'penthouse', // penthouse | garden | fin | spire
      balconies: true,
      groundRetail: true,
    },
    controls: [
      { key: 'floors', label: 'Stories', kind: 'range', min: 10, max: 60, step: 1, unit: ' fl' },
      { key: 'density', label: 'Density', kind: 'segmented', options: DENSITY_OPTIONS_4 },
      {
        key: 'massing',
        label: 'Tower Massing',
        kind: 'select',
        options: [
          { value: 'point', label: 'Slender Point Tower' },
          { value: 'stepped', label: 'Stepped Skyscraper' },
          { value: 'twin', label: 'Twin Residential Towers' },
          { value: 'skybridge', label: 'Twin Towers + Skybridge' },
        ],
      },
      {
        key: 'style',
        label: 'Facade Style',
        kind: 'select',
        options: [
          { value: 'modern', label: 'Curtain Glass & Concrete' },
          { value: 'limestone', label: 'Limestone & Ribbon Glass' },
          { value: 'brick', label: 'Urban Brick High-Rise' },
          { value: 'midcentury', label: 'Banded Balcony Tower' },
        ],
      },
      { key: 'color', label: 'Tower Palette', kind: 'swatches', palette: HIGHRISE_PALETTES },
      {
        key: 'crown',
        label: 'Rooftop Crown',
        kind: 'select',
        options: [
          { value: 'penthouse', label: 'Illuminated Sky Penthouse' },
          { value: 'garden', label: 'Sky Park Terrace' },
          { value: 'fin', label: 'Architectural Fin Crown' },
          { value: 'spire', label: 'Observation Spire' },
        ],
      },
      { key: 'balconies', label: 'Sky Balconies', kind: 'toggle' },
      { key: 'groundRetail', label: 'Podium Lobby & Retail', kind: 'toggle' },
    ],
    stats: (o) => {
      const f = getDensityFactor(o.density);
      return {
        residents: Math.round((o.floors || 26) * 18 * f),
        jobs: o.groundRetail ? Math.round(14 * f) : 3,
        greenery: (o.crown === 'garden' ? 0.65 : 0) + (o.density === 'low' ? 0.45 : 0),
      };
    },
  },

  apartment: {
    type: 'apartment',
    category: 'residential',
    name: 'Apartment Block',
    desc: 'Customizable floors (2–24 fl), density & roofs',
    swatch: '#b96b52',
    icon: '▤',
    paintable: false,
    rotatable: true,
    defaults: {
      floors: 6,
      density: 'medium', // low | medium | high | ultra
      style: 'brick', // modern | brick | timber | midcentury
      color: '#b96b52',
      roofStyle: 'terrace', // terrace | gable | green | penthouse
      balconies: true,
      groundRetail: true,
    },
    controls: [
      { key: 'floors', label: 'Stories', kind: 'range', min: 2, max: 24, step: 1, unit: ' fl' },
      { key: 'density', label: 'Density', kind: 'segmented', options: DENSITY_OPTIONS_4 },
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
    stats: (o) => {
      const f = getDensityFactor(o.density);
      return {
        residents: Math.round((o.floors || 6) * 14 * f),
        jobs: o.groundRetail ? Math.round(8 * f) : 1,
        greenery: (o.roofStyle === 'green' ? 0.6 : 0) + (o.density === 'low' ? 0.35 : 0),
      };
    },
  },

  townhouse: {
    type: 'townhouse',
    category: 'residential',
    name: 'Townhouse Row',
    desc: 'Detached home, duplex, or dense rowhomes',
    swatch: '#d4a66a',
    icon: '⌂',
    paintable: false,
    rotatable: true,
    defaults: {
      floors: 2,
      density: 'medium', // low | medium | high
      color: '#dfd7c8',
      roofColor: '#9c4f3d',
      garden: true,
    },
    controls: [
      { key: 'floors', label: 'Stories', kind: 'range', min: 1, max: 4, step: 1, unit: ' fl' },
      { key: 'density', label: 'Density', kind: 'segmented', options: DENSITY_OPTIONS_3 },
      { key: 'color', label: 'Facade Color', kind: 'swatches', palette: FACADE_PALETTES },
      { key: 'roofColor', label: 'Roof Color', kind: 'swatches', palette: ROOF_PALETTES },
      { key: 'garden', label: 'Front Yard & Hedges', kind: 'toggle' },
    ],
    stats: (o) => {
      const units = o.density === 'high' ? 3 : o.density === 'low' ? 1 : 2;
      return {
        residents: Math.round((o.floors || 2) * 3.5 * units),
        jobs: 0,
        greenery: (o.garden ? 0.45 : 0.1) + (o.density === 'low' ? 0.3 : 0),
      };
    },
  },

  office: {
    type: 'office',
    category: 'commercial',
    name: 'Office High-Rise',
    desc: 'Mid-rise to supertall office tower (4–60 fl)',
    swatch: '#527987',
    icon: '▯',
    paintable: false,
    rotatable: true,
    defaults: {
      floors: 18,
      density: 'medium', // low | medium | high | ultra
      massing: 'stepped', // curtain | stepped | twin | tapered
      color: '#6d98b5',
      crown: 'mechanical', // mechanical | spire | helipad | garden
    },
    controls: [
      { key: 'floors', label: 'Stories', kind: 'range', min: 4, max: 60, step: 1, unit: ' fl' },
      { key: 'density', label: 'Density', kind: 'segmented', options: DENSITY_OPTIONS_4 },
      {
        key: 'massing',
        label: 'Tower Massing',
        kind: 'select',
        options: [
          { value: 'curtain', label: 'Glass Curtain Wall' },
          { value: 'stepped', label: 'Stepped Setback Supertall' },
          { value: 'twin', label: 'Twin Atrium Wings' },
          { value: 'tapered', label: 'Tapered Diagrid Pinnacle' },
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
    stats: (o) => {
      const f = getDensityFactor(o.density);
      return {
        residents: 0,
        jobs: Math.round((o.floors || 18) * 20 * f),
        greenery: (o.crown === 'garden' ? 0.45 : 0) + (o.density === 'low' ? 0.35 : 0),
      };
    },
  },

  shop: {
    type: 'shop',
    category: 'commercial',
    name: 'Corner Café & Shop',
    desc: 'Boutique storefront or dense retail block',
    swatch: '#2f6f4e',
    icon: '◫',
    paintable: false,
    rotatable: true,
    defaults: {
      floors: 2,
      density: 'medium', // low | medium | high
      color: '#dfd7c8',
      awningColor: '#2f6f4e',
      patio: true,
    },
    controls: [
      { key: 'floors', label: 'Stories', kind: 'range', min: 1, max: 4, step: 1, unit: ' fl' },
      { key: 'density', label: 'Density', kind: 'segmented', options: DENSITY_OPTIONS_3 },
      { key: 'color', label: 'Building Color', kind: 'swatches', palette: FACADE_PALETTES },
      { key: 'awningColor', label: 'Awning Color', kind: 'swatches', palette: AWNING_PALETTES },
      { key: 'patio', label: 'Outdoor Seating', kind: 'toggle' },
    ],
    stats: (o) => {
      const f = getDensityFactor(o.density);
      const floors = o.floors || 2;
      return {
        residents: floors > 1 ? Math.round((floors - 1) * 6 * f) : 0,
        jobs: Math.round(14 * f),
        greenery: (o.patio ? 0.2 : 0) + (o.density === 'low' ? 0.25 : 0),
      };
    },
  },

  grocery: {
    type: 'grocery',
    category: 'commercial',
    name: 'Major Grocery Store',
    desc: 'Supermarket, organic market hall & supercenter',
    swatch: '#2e7d4f',
    icon: '🛒',
    paintable: false,
    rotatable: true,
    defaults: {
      format: 'supermarket', // supermarket | organic | hypermarket
      density: 'medium', // low | medium | high
      brandColor: '#2e7d4f',
      color: '#dfd7c8',
      outdoorDisplay: true,
      solar: false,
    },
    controls: [
      {
        key: 'format',
        label: 'Store Format',
        kind: 'select',
        options: [
          { value: 'supermarket', label: 'Neighborhood Supermarket' },
          { value: 'organic', label: 'Organic Market Hall' },
          { value: 'hypermarket', label: 'Flagship Supercenter' },
        ],
      },
      { key: 'density', label: 'Store Footprint', kind: 'segmented', options: DENSITY_OPTIONS_3 },
      { key: 'brandColor', label: 'Brand Accent', kind: 'swatches', palette: BRAND_PALETTES },
      { key: 'color', label: 'Wall Finish', kind: 'swatches', palette: FACADE_PALETTES },
      { key: 'outdoorDisplay', label: 'Cart Corral & Produce Stand', kind: 'toggle' },
      { key: 'solar', label: 'Rooftop Solar Panels', kind: 'toggle' },
    ],
    stats: (o) => {
      const f = getDensityFactor(o.density);
      const baseJobs = o.format === 'hypermarket' ? 68 : o.format === 'organic' ? 42 : 52;
      return {
        residents: 0,
        jobs: Math.round(baseJobs * f),
        parking: Math.round(12 * f),
        greenery: (o.format === 'organic' ? 0.4 : 0.1) + (o.solar ? 0.2 : 0),
      };
    },
  },

  retail: {
    type: 'retail',
    category: 'commercial',
    name: 'Standalone Retail',
    desc: 'Big-box, strip mall, flagship, pharmacy & diner',
    swatch: '#b83a34',
    icon: '🛍',
    paintable: false,
    rotatable: true,
    defaults: {
      storeType: 'strip', // strip | bigbox | department | pharmacy | restaurant
      floors: 1,
      density: 'medium', // low | medium | high
      brandColor: '#b83a34',
      color: '#dfd7c8',
      signage: true,
    },
    controls: [
      {
        key: 'storeType',
        label: 'Retail Format',
        kind: 'select',
        options: [
          { value: 'strip', label: 'Retail Strip (3 Shops)' },
          { value: 'bigbox', label: 'Big-Box Home & Tech' },
          { value: 'department', label: 'Flagship Department Store' },
          { value: 'pharmacy', label: 'Corner Pharmacy + Drive-Thru' },
          { value: 'restaurant', label: 'Standalone Bistro / Diner' },
        ],
      },
      { key: 'floors', label: 'Stories', kind: 'range', min: 1, max: 3, step: 1, unit: ' fl' },
      { key: 'density', label: 'Footprint Size', kind: 'segmented', options: DENSITY_OPTIONS_3 },
      { key: 'brandColor', label: 'Brand Accent', kind: 'swatches', palette: BRAND_PALETTES },
      { key: 'color', label: 'Facade Color', kind: 'swatches', palette: FACADE_PALETTES },
      { key: 'signage', label: 'Illuminated Signage', kind: 'toggle' },
    ],
    stats: (o) => {
      const f = getDensityFactor(o.density);
      const floors = o.floors || 1;
      const baseJobs =
        o.storeType === 'bigbox'
          ? 48
          : o.storeType === 'department'
            ? 38
            : o.storeType === 'strip'
              ? 30
              : 24;
      return {
        residents: 0,
        jobs: Math.round(baseJobs * (0.7 + floors * 0.35) * f),
        parking: o.storeType === 'pharmacy' || o.storeType === 'restaurant' ? 6 : 0,
        greenery: o.density === 'low' ? 0.3 : 0.1,
      };
    },
  },

  service_station: {
    type: 'service_station',
    category: 'commercial',
    name: 'EV Hub & Service Station',
    desc: 'Fast-charge lounge or fuel & convenience mart',
    swatch: '#237a82',
    icon: '⚡',
    paintable: false,
    rotatable: true,
    defaults: {
      stationType: 'ev_lounge', // ev_lounge | classic
      brandColor: '#237a82',
      solar: true,
    },
    controls: [
      {
        key: 'stationType',
        label: 'Station Style',
        kind: 'select',
        options: [
          { value: 'ev_lounge', label: 'EV Supercharger + Café Lounge' },
          { value: 'classic', label: 'Fuel & Convenience Station' },
        ],
      },
      { key: 'brandColor', label: 'Canopy Accent', kind: 'swatches', palette: BRAND_PALETTES },
      { key: 'solar', label: 'Solar Canopy Roof', kind: 'toggle' },
    ],
    stats: (o) => ({
      residents: 0,
      jobs: 14,
      parking: 8,
      greenery: (o.stationType === 'ev_lounge' ? 0.25 : 0.05) + (o.solar ? 0.25 : 0),
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
