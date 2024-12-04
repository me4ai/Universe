import create from 'zustand';
import { cloudStorage } from '../services/cloudStorage';
import { SceneData } from '../types/scene';

interface CloudStorageState {
  isLoading: boolean;
  error: string | null;
  scenes: {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    author: string;
    collaborators: string[];
    thumbnail?: string;
    tags: string[];
    size: number;
    version: number;
  }[];
  currentScene: {
    data: SceneData | null;
    metadata: any;
  } | null;
  totalScenes: number;
  currentPage: number;
  itemsPerPage: number;
  sortBy: 'name' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
  filter: {
    author?: string;
    tags?: string[];
    dateRange?: { start: number; end: number };
  };
  
  // Actions
  loadScenes: (page?: number) => Promise<void>;
  loadScene: (sceneId: string) => Promise<void>;
  saveScene: (sceneData: SceneData, metadata: any) => Promise<void>;
  deleteScene: (sceneId: string) => Promise<void>;
  updateMetadata: (sceneId: string, metadata: any) => Promise<void>;
  generateThumbnail: (sceneId: string) => Promise<void>;
  setSort: (sortBy: 'name' | 'date' | 'size', order: 'asc' | 'desc') => void;
  setFilter: (filter: any) => void;
  setItemsPerPage: (count: number) => void;
  clearError: () => void;
}

const useCloudStorageStore = create<CloudStorageState>((set, get) => ({
  isLoading: false,
  error: null,
  scenes: [],
  currentScene: null,
  totalScenes: 0,
  currentPage: 1,
  itemsPerPage: 20,
  sortBy: 'date',
  sortOrder: 'desc',
  filter: {},

  loadScenes: async (page = 1) => {
    try {
      set({ isLoading: true, error: null });
      const { scenes, total } = await cloudStorage.listScenes({
        page,
        limit: get().itemsPerPage,
        sort: get().sortBy,
        order: get().sortOrder,
        filter: get().filter,
      });
      set({
        scenes,
        totalScenes: total,
        currentPage: page,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load scenes',
        isLoading: false,
      });
    }
  },

  loadScene: async (sceneId: string) => {
    try {
      set({ isLoading: true, error: null });
      const sceneData = await cloudStorage.loadScene(sceneId);
      set({
        currentScene: sceneData,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load scene',
        isLoading: false,
      });
    }
  },

  saveScene: async (sceneData: SceneData, metadata: any) => {
    try {
      set({ isLoading: true, error: null });
      await cloudStorage.saveScene(sceneData, metadata);
      await get().loadScenes(get().currentPage);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save scene',
        isLoading: false,
      });
    }
  },

  deleteScene: async (sceneId: string) => {
    try {
      set({ isLoading: true, error: null });
      await cloudStorage.deleteScene(sceneId);
      await get().loadScenes(get().currentPage);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete scene',
        isLoading: false,
      });
    }
  },

  updateMetadata: async (sceneId: string, metadata: any) => {
    try {
      set({ isLoading: true, error: null });
      await cloudStorage.updateMetadata(sceneId, metadata);
      await get().loadScenes(get().currentPage);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update metadata',
        isLoading: false,
      });
    }
  },

  generateThumbnail: async (sceneId: string) => {
    try {
      set({ isLoading: true, error: null });
      const thumbnailUrl = await cloudStorage.generateThumbnail(sceneId);
      set({
        scenes: get().scenes.map((scene) =>
          scene.id === sceneId ? { ...scene, thumbnail: thumbnailUrl } : scene
        ),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to generate thumbnail',
        isLoading: false,
      });
    }
  },

  setSort: (sortBy, order) => {
    set({ sortBy, sortOrder: order });
    get().loadScenes(1);
  },

  setFilter: (filter) => {
    set({ filter });
    get().loadScenes(1);
  },

  setItemsPerPage: (count) => {
    set({ itemsPerPage: count });
    get().loadScenes(1);
  },

  clearError: () => set({ error: null }),
}));

export default useCloudStorageStore;
