import create from 'zustand';
import { SceneManagementService, SceneMetadata, SceneData } from '../services/sceneManagement';
import { CloudSyncService } from '../services/cloudSync';
import { SceneSearchService, SearchFilters, SortOptions } from '../services/sceneSearch';
import { GLTFHandler } from '../utils/gltfHandler';
import { ThumbnailGenerator } from '../utils/thumbnailGenerator';
import { useSceneStore } from './sceneStore';
import { Scene } from 'three';

interface AdvancedSceneState {
  currentScene: SceneMetadata | null;
  templates: SceneMetadata[];
  versions: SceneMetadata[];
  searchResults: SceneMetadata[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;

  // Scene Management
  createNewScene: (name: string, description: string, templateId?: string) => Promise<void>;
  saveCurrentScene: () => Promise<void>;
  loadScene: (sceneId: string, version?: number) => Promise<void>;
  
  // Template Management
  saveAsTemplate: (name: string, description: string) => Promise<void>;
  loadTemplates: () => Promise<void>;
  
  // Version Control
  loadVersions: (sceneId: string) => Promise<void>;
  compareVersions: (versionA: string, versionB: string) => Promise<void>;
  
  // Sharing
  shareScene: (sceneId: string, userId: string) => Promise<void>;
  
  // Import/Export
  exportScene: () => Promise<Blob>;
  importScene: (file: File) => Promise<void>;
  
  // Search and Filter
  searchScenes: (query: string, filters?: SearchFilters, sort?: SortOptions) => Promise<void>;
  getUniqueTags: () => string[];
  getUniqueCreators: () => string[];
  
  // Cloud Sync
  syncWithCloud: () => Promise<void>;
  checkSyncStatus: () => { lastSync: Date | null; isOnline: boolean };
}

export const useAdvancedSceneStore = create<AdvancedSceneState>((set, get) => {
  const sceneService = SceneManagementService.getInstance();
  const cloudSync = CloudSyncService.getInstance();
  const searchService = SceneSearchService.getInstance();

  return {
    currentScene: null,
    templates: [],
    versions: [],
    searchResults: [],
    isLoading: false,
    error: null,
    lastSyncTime: null,

    createNewScene: async (name: string, description: string, templateId?: string) => {
      set({ isLoading: true, error: null });
      try {
        let scene: Scene;
        
        if (templateId) {
          const templateData = await sceneService.loadScene(templateId);
          scene = new Scene().copy(templateData.sceneJson);
        } else {
          scene = new Scene();
        }

        const metadata: Partial<SceneMetadata> = {
          name,
          description,
          createdBy: 'current-user',
          tags: [],
          sharedWith: []
        };

        // Generate thumbnail
        const thumbnail = await ThumbnailGenerator.generateThumbnail(scene);
        metadata.thumbnail = thumbnail;

        const sceneId = await sceneService.saveScene(scene, metadata);
        const newScene = await sceneService.loadScene(sceneId);
        
        set({ currentScene: newScene.metadata });
        useSceneStore.getState().loadScene(scene.toJSON());

        // Sync with cloud
        await cloudSync.syncScene(newScene);
        set({ lastSyncTime: new Date() });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to create scene' });
      } finally {
        set({ isLoading: false });
      }
    },

    saveCurrentScene: async () => {
      set({ isLoading: true, error: null });
      try {
        const currentState = useSceneStore.getState();
        const scene = new Scene();
        // Convert current state to scene
        Object.values(currentState.shapes).forEach(shape => {
          const mesh = GLTFHandler.shapeToMesh(shape);
          scene.add(mesh);
        });

        const metadata = get().currentScene;
        if (!metadata) {
          throw new Error('No active scene');
        }

        // Generate new thumbnail
        const thumbnail = await ThumbnailGenerator.generateThumbnail(scene);
        metadata.thumbnail = thumbnail;

        const sceneData = await sceneService.saveScene(scene, metadata);
        
        // Sync with cloud
        await cloudSync.syncScene(sceneData);
        set({ lastSyncTime: new Date() });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to save scene' });
      } finally {
        set({ isLoading: false });
      }
    },

    loadScene: async (sceneId: string, version?: number) => {
      set({ isLoading: true, error: null });
      try {
        const sceneData = await sceneService.loadScene(sceneId, version);
        const scene = new Scene().copy(sceneData.sceneJson);
        
        set({ currentScene: sceneData.metadata });
        useSceneStore.getState().loadScene(scene.toJSON());
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to load scene' });
      } finally {
        set({ isLoading: false });
      }
    },

    saveAsTemplate: async (name: string, description: string) => {
      set({ isLoading: true, error: null });
      try {
        const currentState = useSceneStore.getState();
        const scene = new Scene();
        // Convert current state to scene
        Object.values(currentState.shapes).forEach(shape => {
          const mesh = GLTFHandler.shapeToMesh(shape);
          scene.add(mesh);
        });

        const metadata: Partial<SceneMetadata> = {
          name,
          description,
          createdBy: 'current-user',
          isTemplate: true,
          tags: [],
          sharedWith: []
        };

        // Generate thumbnail
        const thumbnail = await ThumbnailGenerator.generateThumbnail(scene);
        metadata.thumbnail = thumbnail;

        await sceneService.createTemplate(scene, metadata);
        await get().loadTemplates();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to save template' });
      } finally {
        set({ isLoading: false });
      }
    },

    loadTemplates: async () => {
      set({ isLoading: true, error: null });
      try {
        const templates = await sceneService.getTemplates();
        set({ templates });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to load templates' });
      } finally {
        set({ isLoading: false });
      }
    },

    loadVersions: async (sceneId: string) => {
      set({ isLoading: true, error: null });
      try {
        const versions = await sceneService.getSceneVersions(sceneId);
        set({ versions });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to load versions' });
      } finally {
        set({ isLoading: false });
      }
    },

    compareVersions: async (versionA: string, versionB: string) => {
      // TO DO: implement version comparison logic
    },

    shareScene: async (sceneId: string, userId: string) => {
      set({ isLoading: true, error: null });
      try {
        await sceneService.shareScene(sceneId, userId);
        
        if (get().currentScene?.id === sceneId) {
          const sceneData = await sceneService.loadScene(sceneId);
          set({ currentScene: sceneData.metadata });
        }
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to share scene' });
      } finally {
        set({ isLoading: false });
      }
    },

    exportScene: async () => {
      set({ isLoading: true, error: null });
      try {
        const currentState = useSceneStore.getState();
        const scene = new Scene();
        // Convert current state to scene
        Object.values(currentState.shapes).forEach(shape => {
          const mesh = GLTFHandler.shapeToMesh(shape);
          scene.add(mesh);
        });

        return new Promise<Blob>((resolve, reject) => {
          const exporter = new GLTFExporter();
          exporter.parse(
            scene,
            (gltf) => {
              const blob = new Blob([JSON.stringify(gltf)], { type: 'model/gltf+json' });
              resolve(blob);
            },
            (error) => {
              reject(error);
            },
            { binary: false }
          );
        });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to export scene' });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    importScene: async (file: File) => {
      set({ isLoading: true, error: null });
      try {
        const text = await file.text();
        const gltf = JSON.parse(text);
        
        // Convert GLTF to Scene
        const scene = new Scene();
        // Implementation needed: Add GLTF import logic
        
        const metadata: Partial<SceneMetadata> = {
          name: file.name.replace(/\.[^/.]+$/, ''),
          description: 'Imported scene',
          createdBy: 'current-user',
          tags: ['imported'],
          sharedWith: []
        };

        const sceneId = await sceneService.saveScene(scene, metadata);
        await get().loadScene(sceneId);
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to import scene' });
      } finally {
        set({ isLoading: false });
      }
    },

    searchScenes: async (query: string, filters?: SearchFilters, sort?: SortOptions) => {
      set({ isLoading: true, error: null });
      try {
        const scenes = await sceneService.getAllScenes();
        searchService.updateSearchIndex(scenes);
        const results = searchService.search(query, scenes, filters, sort);
        set({ searchResults: results });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to search scenes' });
      } finally {
        set({ isLoading: false });
      }
    },

    getUniqueTags: () => {
      const scenes = get().searchResults;
      return searchService.getUniqueTags(scenes);
    },

    getUniqueCreators: () => {
      const scenes = get().searchResults;
      return searchService.getUniqueCreators(scenes);
    },

    syncWithCloud: async () => {
      set({ isLoading: true, error: null });
      try {
        if (!cloudSync.isOnline()) {
          throw new Error('No internet connection');
        }

        const currentScene = get().currentScene;
        if (currentScene) {
          await cloudSync.syncScene({
            metadata: currentScene,
            sceneJson: useSceneStore.getState().shapes,
            version: currentScene.version
          });
        }

        set({ lastSyncTime: new Date() });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to sync with cloud' });
      } finally {
        set({ isLoading: false });
      }
    },

    checkSyncStatus: () => ({
      lastSync: get().lastSyncTime,
      isOnline: cloudSync.isOnline()
    })
  };
});
