import create from 'zustand';
import * as THREE from 'three';
import { useTextureStore } from './textureStore';

export type MaterialType = 
  | 'standard'
  | 'physical'
  | 'toon'
  | 'matcap'
  | 'normal'
  | 'phong'
  | 'lambert';

export interface MaterialPreset {
  id: string;
  name: string;
  type: MaterialType;
  properties: Partial<MaterialProperties>;
}

export interface MaterialProperties {
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
  side: THREE.Side;
  wireframe: boolean;
  flatShading: boolean;
  emissive: string;
  emissiveIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  thickness: number;
  attenuationDistance: number;
  attenuationColor: string;
  sheen: number;
  sheenRoughness: number;
  sheenColor: string;
  iridescence: number;
  iridescenceIOR: number;
  textureMaps: {
    [key: string]: string | null; // texture id
  };
}

interface AdvancedMaterialState {
  materials: { [key: string]: MaterialProperties };
  presets: MaterialPreset[];
  selectedMaterialId: string | null;

  // Material operations
  addMaterial: (properties: Partial<MaterialProperties>) => string;
  updateMaterial: (id: string, properties: Partial<MaterialProperties>) => void;
  removeMaterial: (id: string) => void;
  selectMaterial: (id: string | null) => void;
  duplicateMaterial: (id: string) => string;

  // Preset operations
  addPreset: (preset: Omit<MaterialPreset, 'id'>) => void;
  removePreset: (id: string) => void;
  applyPreset: (materialId: string, presetId: string) => void;

  // Texture operations
  assignTexture: (materialId: string, mapType: string, textureId: string | null) => void;
  removeTexture: (materialId: string, mapType: string) => void;

  // Material conversion
  convertMaterialType: (materialId: string, newType: MaterialType) => void;

  // Three.js material creation
  createThreeMaterial: (id: string) => THREE.Material;
}

export const useAdvancedMaterialStore = create<AdvancedMaterialState>((set, get) => ({
  materials: {},
  presets: [
    {
      id: 'metal',
      name: 'Polished Metal',
      type: 'physical',
      properties: {
        color: '#ffffff',
        metalness: 1,
        roughness: 0.1,
      },
    },
    {
      id: 'plastic',
      name: 'Plastic',
      type: 'physical',
      properties: {
        color: '#ffffff',
        metalness: 0,
        roughness: 0.3,
      },
    },
    {
      id: 'glass',
      name: 'Glass',
      type: 'physical',
      properties: {
        color: '#ffffff',
        metalness: 0,
        roughness: 0,
        transmission: 1,
        opacity: 0.5,
        transparent: true,
      },
    },
  ],
  selectedMaterialId: null,

  addMaterial: (properties) => {
    const id = Math.random().toString(36).substr(2, 9);
    const defaultProperties: MaterialProperties = {
      color: '#ffffff',
      metalness: 0,
      roughness: 0.5,
      opacity: 1,
      transparent: false,
      side: THREE.FrontSide,
      wireframe: false,
      flatShading: false,
      emissive: '#000000',
      emissiveIntensity: 0,
      clearcoat: 0,
      clearcoatRoughness: 0,
      transmission: 0,
      thickness: 0,
      attenuationDistance: 1,
      attenuationColor: '#ffffff',
      sheen: 0,
      sheenRoughness: 0,
      sheenColor: '#ffffff',
      iridescence: 0,
      iridescenceIOR: 1.3,
      textureMaps: {},
    };

    set((state) => ({
      materials: {
        ...state.materials,
        [id]: {
          ...defaultProperties,
          ...properties,
        },
      },
    }));

    return id;
  },

  updateMaterial: (id, properties) => {
    set((state) => ({
      materials: {
        ...state.materials,
        [id]: {
          ...state.materials[id],
          ...properties,
        },
      },
    }));
  },

  removeMaterial: (id) => {
    set((state) => {
      const { [id]: removed, ...remaining } = state.materials;
      return {
        materials: remaining,
        selectedMaterialId: state.selectedMaterialId === id ? null : state.selectedMaterialId,
      };
    });
  },

  selectMaterial: (id) => {
    set({ selectedMaterialId: id });
  },

  duplicateMaterial: (id) => {
    const material = get().materials[id];
    if (!material) return id;

    const newId = get().addMaterial({ ...material });
    return newId;
  },

  addPreset: (preset) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      presets: [...state.presets, { ...preset, id }],
    }));
  },

  removePreset: (id) => {
    set((state) => ({
      presets: state.presets.filter((preset) => preset.id !== id),
    }));
  },

  applyPreset: (materialId, presetId) => {
    const preset = get().presets.find((p) => p.id === presetId);
    if (!preset) return;

    set((state) => ({
      materials: {
        ...state.materials,
        [materialId]: {
          ...state.materials[materialId],
          ...preset.properties,
        },
      },
    }));
  },

  assignTexture: (materialId, mapType, textureId) => {
    set((state) => ({
      materials: {
        ...state.materials,
        [materialId]: {
          ...state.materials[materialId],
          textureMaps: {
            ...state.materials[materialId].textureMaps,
            [mapType]: textureId,
          },
        },
      },
    }));
  },

  removeTexture: (materialId, mapType) => {
    set((state) => ({
      materials: {
        ...state.materials,
        [materialId]: {
          ...state.materials[materialId],
          textureMaps: {
            ...state.materials[materialId].textureMaps,
            [mapType]: null,
          },
        },
      },
    }));
  },

  convertMaterialType: (materialId, newType) => {
    // Preserve compatible properties when converting between material types
    const material = get().materials[materialId];
    if (!material) return;

    const commonProperties = {
      color: material.color,
      opacity: material.opacity,
      transparent: material.transparent,
      side: material.side,
      wireframe: material.wireframe,
    };

    let newProperties: Partial<MaterialProperties> = { ...commonProperties };

    switch (newType) {
      case 'physical':
        newProperties = {
          ...newProperties,
          metalness: material.metalness || 0,
          roughness: material.roughness || 0.5,
          clearcoat: material.clearcoat || 0,
          transmission: material.transmission || 0,
        };
        break;
      case 'toon':
        // Toon-specific properties
        break;
      case 'matcap':
        // Matcap-specific properties
        break;
      // Add other material type conversions
    }

    set((state) => ({
      materials: {
        ...state.materials,
        [materialId]: {
          ...material,
          ...newProperties,
        },
      },
    }));
  },

  createThreeMaterial: (id) => {
    const material = get().materials[id];
    if (!material) return new THREE.MeshStandardMaterial();

    const textureStore = useTextureStore.getState();
    const loadedTextures: { [key: string]: THREE.Texture } = {};

    // Load textures
    Object.entries(material.textureMaps).forEach(([mapType, textureId]) => {
      if (textureId) {
        const texture = textureStore.textures[textureId]?.texture;
        if (texture) {
          loadedTextures[mapType] = texture;
        }
      }
    });

    // Create material based on type
    let threeMaterial: THREE.Material;

    switch (material.type) {
      case 'physical':
        threeMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(material.color),
          metalness: material.metalness,
          roughness: material.roughness,
          clearcoat: material.clearcoat,
          clearcoatRoughness: material.clearcoatRoughness,
          transmission: material.transmission,
          thickness: material.thickness,
          attenuationDistance: material.attenuationDistance,
          attenuationColor: new THREE.Color(material.attenuationColor),
          sheen: material.sheen,
          sheenRoughness: material.sheenRoughness,
          sheenColor: new THREE.Color(material.sheenColor),
          iridescence: material.iridescence,
          iridescenceIOR: material.iridescenceIOR,
          ...loadedTextures,
        });
        break;
      
      // Add other material types
      
      default:
        threeMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(material.color),
          metalness: material.metalness,
          roughness: material.roughness,
          ...loadedTextures,
        });
    }

    // Apply common properties
    threeMaterial.transparent = material.transparent;
    threeMaterial.opacity = material.opacity;
    threeMaterial.side = material.side;
    threeMaterial.wireframe = material.wireframe;
    threeMaterial.flatShading = material.flatShading;

    return threeMaterial;
  },
}));
