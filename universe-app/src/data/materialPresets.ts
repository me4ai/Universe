import { MaterialPreset } from '../store/advancedMaterialStore';

export const materialPresets: MaterialPreset[] = [
  // Metals
  {
    id: 'polished-steel',
    name: 'Polished Steel',
    type: 'physical',
    properties: {
      color: '#ffffff',
      metalness: 1,
      roughness: 0.1,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
    },
  },
  {
    id: 'brushed-aluminum',
    name: 'Brushed Aluminum',
    type: 'physical',
    properties: {
      color: '#e8e8e8',
      metalness: 0.9,
      roughness: 0.5,
      clearcoat: 0.1,
    },
  },
  {
    id: 'aged-copper',
    name: 'Aged Copper',
    type: 'physical',
    properties: {
      color: '#7c9c88',
      metalness: 0.85,
      roughness: 0.6,
      clearcoat: 0.1,
      clearcoatRoughness: 0.4,
    },
  },

  // Glass
  {
    id: 'clear-glass',
    name: 'Clear Glass',
    type: 'physical',
    properties: {
      color: '#ffffff',
      metalness: 0,
      roughness: 0,
      transmission: 1,
      thickness: 0.5,
      ior: 1.5,
      transparent: true,
      opacity: 0.3,
    },
  },
  {
    id: 'frosted-glass',
    name: 'Frosted Glass',
    type: 'physical',
    properties: {
      color: '#ffffff',
      metalness: 0,
      roughness: 0.5,
      transmission: 0.8,
      thickness: 0.5,
      ior: 1.5,
      transparent: true,
      opacity: 0.5,
    },
  },
  {
    id: 'tinted-glass',
    name: 'Tinted Glass',
    type: 'physical',
    properties: {
      color: '#88ccff',
      metalness: 0,
      roughness: 0,
      transmission: 0.9,
      thickness: 0.5,
      ior: 1.5,
      transparent: true,
      opacity: 0.4,
    },
  },

  // Plastics
  {
    id: 'glossy-plastic',
    name: 'Glossy Plastic',
    type: 'physical',
    properties: {
      color: '#ffffff',
      metalness: 0,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    },
  },
  {
    id: 'matte-plastic',
    name: 'Matte Plastic',
    type: 'physical',
    properties: {
      color: '#ffffff',
      metalness: 0,
      roughness: 0.9,
      clearcoat: 0,
    },
  },
  {
    id: 'rubber',
    name: 'Rubber',
    type: 'physical',
    properties: {
      color: '#202020',
      metalness: 0,
      roughness: 0.9,
      clearcoat: 0,
    },
  },

  // Car Paint
  {
    id: 'metallic-car-paint',
    name: 'Metallic Car Paint',
    type: 'physical',
    properties: {
      color: '#ff0000',
      metalness: 0.9,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    },
  },
  {
    id: 'pearlescent-paint',
    name: 'Pearlescent Paint',
    type: 'physical',
    properties: {
      color: '#ffffff',
      metalness: 0.7,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      iridescence: 1,
      iridescenceIOR: 1.5,
    },
  },

  // Fabric
  {
    id: 'cotton',
    name: 'Cotton',
    type: 'physical',
    properties: {
      color: '#ffffff',
      metalness: 0,
      roughness: 1,
      sheen: 1,
      sheenRoughness: 0.8,
      sheenColor: '#ffffff',
    },
  },
  {
    id: 'silk',
    name: 'Silk',
    type: 'physical',
    properties: {
      color: '#ffffff',
      metalness: 0,
      roughness: 0.3,
      sheen: 1,
      sheenRoughness: 0.2,
      sheenColor: '#ffffff',
    },
  },
  {
    id: 'velvet',
    name: 'Velvet',
    type: 'physical',
    properties: {
      color: '#400040',
      metalness: 0,
      roughness: 1,
      sheen: 1,
      sheenRoughness: 0.4,
      sheenColor: '#ff00ff',
    },
  },

  // Wood
  {
    id: 'polished-wood',
    name: 'Polished Wood',
    type: 'physical',
    properties: {
      color: '#8b4513',
      metalness: 0,
      roughness: 0.3,
      clearcoat: 0.7,
      clearcoatRoughness: 0.1,
    },
  },
  {
    id: 'rough-wood',
    name: 'Rough Wood',
    type: 'physical',
    properties: {
      color: '#8b4513',
      metalness: 0,
      roughness: 0.9,
    },
  },

  // Stylized
  {
    id: 'toon',
    name: 'Toon',
    type: 'toon',
    properties: {
      color: '#ffffff',
      gradientMap: 'threeTone',
    },
  },
  {
    id: 'wireframe',
    name: 'Wireframe',
    type: 'standard',
    properties: {
      color: '#00ff00',
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    },
  },
  {
    id: 'hologram',
    name: 'Hologram',
    type: 'physical',
    properties: {
      color: '#00ffff',
      metalness: 0,
      roughness: 0,
      transmission: 0.9,
      transparent: true,
      opacity: 0.3,
      emissive: '#00ffff',
      emissiveIntensity: 0.5,
    },
  },
];
