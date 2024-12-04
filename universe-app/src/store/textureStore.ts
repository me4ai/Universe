import create from 'zustand';
import * as THREE from 'three';
import { loadTexture } from '../utils/textureLoader';

export interface Texture {
  id: string;
  name: string;
  type: 'map' | 'normalMap' | 'roughnessMap' | 'metalnessMap' | 'aoMap' | 'emissiveMap' | 'bumpMap' | 'displacementMap';
  url: string;
  texture?: THREE.Texture;
  tiling: [number, number];
  offset: [number, number];
  rotation: number;
  encoding: THREE.TextureEncoding;
}

interface TextureState {
  textures: { [key: string]: Texture };
  selectedTextureId: string | null;
  
  addTexture: (texture: Omit<Texture, 'id' | 'texture'>) => Promise<string>;
  removeTexture: (id: string) => void;
  updateTexture: (id: string, updates: Partial<Omit<Texture, 'id' | 'texture'>>) => void;
  selectTexture: (id: string | null) => void;
  
  loadTexture: (id: string) => Promise<THREE.Texture>;
  updateTextureTransform: (id: string, tiling?: [number, number], offset?: [number, number], rotation?: number) => void;
}

export const useTextureStore = create<TextureState>((set, get) => ({
  textures: {},
  selectedTextureId: null,

  addTexture: async (texture) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTexture: Texture = {
      ...texture,
      id,
      tiling: texture.tiling || [1, 1],
      offset: texture.offset || [0, 0],
      rotation: texture.rotation || 0,
      encoding: texture.encoding || THREE.sRGBEncoding,
    };

    try {
      const loadedTexture = await loadTexture(texture.url);
      newTexture.texture = loadedTexture;
      
      loadedTexture.wrapS = THREE.RepeatWrapping;
      loadedTexture.wrapT = THREE.RepeatWrapping;
      loadedTexture.repeat.set(...newTexture.tiling);
      loadedTexture.offset.set(...newTexture.offset);
      loadedTexture.rotation = newTexture.rotation;
      loadedTexture.encoding = newTexture.encoding;
      loadedTexture.needsUpdate = true;

      set((state) => ({
        textures: {
          ...state.textures,
          [id]: newTexture,
        },
      }));

      return id;
    } catch (error) {
      console.error('Failed to load texture:', error);
      throw error;
    }
  },

  removeTexture: (id) => {
    set((state) => {
      const { [id]: removed, ...remainingTextures } = state.textures;
      if (removed?.texture) {
        removed.texture.dispose();
      }
      return {
        textures: remainingTextures,
        selectedTextureId: state.selectedTextureId === id ? null : state.selectedTextureId,
      };
    });
  },

  updateTexture: (id, updates) => {
    set((state) => ({
      textures: {
        ...state.textures,
        [id]: {
          ...state.textures[id],
          ...updates,
        },
      },
    }));
  },

  selectTexture: (id) => {
    set({ selectedTextureId: id });
  },

  loadTexture: async (id) => {
    const texture = get().textures[id];
    if (!texture) throw new Error('Texture not found');

    if (texture.texture) {
      return texture.texture;
    }

    const loadedTexture = await loadTexture(texture.url);
    loadedTexture.wrapS = THREE.RepeatWrapping;
    loadedTexture.wrapT = THREE.RepeatWrapping;
    loadedTexture.repeat.set(...texture.tiling);
    loadedTexture.offset.set(...texture.offset);
    loadedTexture.rotation = texture.rotation;
    loadedTexture.encoding = texture.encoding;
    loadedTexture.needsUpdate = true;

    set((state) => ({
      textures: {
        ...state.textures,
        [id]: {
          ...state.textures[id],
          texture: loadedTexture,
        },
      },
    }));

    return loadedTexture;
  },

  updateTextureTransform: (id, tiling, offset, rotation) => {
    const texture = get().textures[id];
    if (!texture) return;

    const updates: Partial<Texture> = {};
    
    if (tiling) {
      updates.tiling = tiling;
      texture.texture?.repeat.set(...tiling);
    }
    
    if (offset) {
      updates.offset = offset;
      texture.texture?.offset.set(...offset);
    }
    
    if (rotation !== undefined) {
      updates.rotation = rotation;
      if (texture.texture) {
        texture.texture.rotation = rotation;
      }
    }

    if (texture.texture) {
      texture.texture.needsUpdate = true;
    }

    set((state) => ({
      textures: {
        ...state.textures,
        [id]: {
          ...state.textures[id],
          ...updates,
        },
      },
    }));
  },
}));
