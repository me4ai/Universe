import create from 'zustand';
import * as THREE from 'three';

export interface Texture {
  id: string;
  name: string;
  type: 'map' | 'normalMap' | 'roughnessMap' | 'metalnessMap' | 'aoMap';
  url: string;
}

export interface Material {
  id: string;
  name: string;
  type: 'standard' | 'physical' | 'basic';
  color: string;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  transparent?: boolean;
  wireframe?: boolean;
  textures: Texture[];
}

interface MaterialState {
  materials: Material[];
  selectedMaterialId: string | null;
  addMaterial: (material: Omit<Material, 'id' | 'textures'>) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  removeMaterial: (id: string) => void;
  selectMaterial: (id: string | null) => void;
  addTexture: (materialId: string, texture: Omit<Texture, 'id'>) => void;
  removeTexture: (materialId: string, textureId: string) => void;
  updateTexture: (materialId: string, textureId: string, updates: Partial<Texture>) => void;
}

const defaultMaterials: Omit<Material, 'id'>[] = [
  {
    name: 'Default',
    type: 'standard',
    color: '#ffffff',
    metalness: 0,
    roughness: 0.5,
    textures: [],
  },
  {
    name: 'Metal',
    type: 'physical',
    color: '#888888',
    metalness: 1,
    roughness: 0.2,
    textures: [],
  },
  {
    name: 'Glass',
    type: 'physical',
    color: '#ffffff',
    metalness: 0,
    roughness: 0,
    opacity: 0.5,
    transparent: true,
    textures: [],
  },
];

export const useMaterialStore = create<MaterialState>((set) => ({
  materials: defaultMaterials.map((material) => ({
    ...material,
    id: Math.random().toString(36).substr(2, 9),
  })),
  selectedMaterialId: null,
  
  addMaterial: (material) => {
    const newMaterial = {
      ...material,
      id: Math.random().toString(36).substr(2, 9),
      textures: [],
    };
    set((state) => ({
      materials: [...state.materials, newMaterial],
    }));
  },
  
  updateMaterial: (id, updates) => {
    set((state) => ({
      materials: state.materials.map((material) =>
        material.id === id ? { ...material, ...updates } : material
      ),
    }));
  },
  
  removeMaterial: (id) => {
    set((state) => ({
      materials: state.materials.filter((material) => material.id !== id),
      selectedMaterialId:
        state.selectedMaterialId === id ? null : state.selectedMaterialId,
    }));
  },
  
  selectMaterial: (id) => {
    set({ selectedMaterialId: id });
  },
  
  addTexture: (materialId, texture) => {
    const newTexture = {
      ...texture,
      id: Math.random().toString(36).substr(2, 9),
    };
    set((state) => ({
      materials: state.materials.map((material) =>
        material.id === materialId
          ? { ...material, textures: [...material.textures, newTexture] }
          : material
      ),
    }));
  },
  
  removeTexture: (materialId, textureId) => {
    set((state) => ({
      materials: state.materials.map((material) =>
        material.id === materialId
          ? {
              ...material,
              textures: material.textures.filter((t) => t.id !== textureId),
            }
          : material
      ),
    }));
  },
  
  updateTexture: (materialId, textureId, updates) => {
    set((state) => ({
      materials: state.materials.map((material) =>
        material.id === materialId
          ? {
              ...material,
              textures: material.textures.map((texture) =>
                texture.id === textureId
                  ? { ...texture, ...updates }
                  : texture
              ),
            }
          : material
      ),
    }));
  },
}));
