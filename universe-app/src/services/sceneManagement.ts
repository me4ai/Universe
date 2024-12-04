import { Scene } from 'three';
import { IndexedDBService } from './indexedDB';

export interface SceneMetadata {
  id: string;
  name: string;
  description: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isTemplate: boolean;
  tags: string[];
  thumbnail?: string;
  sharedWith: string[];
}

export interface SceneData {
  metadata: SceneMetadata;
  sceneJson: any;
  version: number;
}

export class SceneManagementService {
  private static instance: SceneManagementService;
  private dbService: IndexedDBService;
  
  private constructor() {
    this.dbService = IndexedDBService.getInstance();
    this.dbService.initialize().catch(console.error);
  }

  static getInstance(): SceneManagementService {
    if (!SceneManagementService.instance) {
      SceneManagementService.instance = new SceneManagementService();
    }
    return SceneManagementService.instance;
  }

  async saveScene(scene: Scene, metadata: Partial<SceneMetadata>): Promise<string> {
    const sceneJson = scene.toJSON();
    const timestamp = new Date();
    
    const sceneData: SceneData = {
      metadata: {
        id: metadata.id || crypto.randomUUID(),
        name: metadata.name || 'Untitled Scene',
        description: metadata.description || '',
        version: (metadata.version || 0) + 1,
        createdAt: metadata.createdAt || timestamp,
        updatedAt: timestamp,
        createdBy: metadata.createdBy || 'unknown',
        isTemplate: metadata.isTemplate || false,
        tags: metadata.tags || [],
        thumbnail: metadata.thumbnail,
        sharedWith: metadata.sharedWith || []
      },
      sceneJson,
      version: (metadata.version || 0) + 1
    };

    // Store in IndexedDB
    await this.dbService.saveScene(sceneData, sceneData.metadata.isTemplate);
    
    // If user is online, sync with cloud storage
    if (navigator.onLine) {
      await this.syncSceneWithCloud(sceneData);
    }

    return sceneData.metadata.id;
  }

  async loadScene(sceneId: string, version?: number): Promise<SceneData> {
    // Try to load specific version if requested
    if (version) {
      const versions = await this.dbService.getSceneVersions(sceneId);
      const specificVersion = versions.find(v => v.version === version);
      if (specificVersion) {
        return specificVersion;
      }
    }

    // Load latest version from IndexedDB
    const sceneData = await this.dbService.getScene(sceneId);
    
    if (!sceneData) {
      // If not found locally and online, try cloud
      if (navigator.onLine) {
        const cloudData = await this.loadSceneFromCloud(sceneId, version);
        if (cloudData) {
          await this.dbService.saveScene(cloudData);
          return cloudData;
        }
      }
      throw new Error('Scene not found');
    }

    return sceneData;
  }

  async getSceneVersions(sceneId: string): Promise<SceneMetadata[]> {
    const versions = await this.dbService.getSceneVersions(sceneId);
    return versions.map(v => v.metadata);
  }

  async createTemplate(scene: Scene, metadata: Partial<SceneMetadata>): Promise<string> {
    return this.saveScene(scene, { ...metadata, isTemplate: true });
  }

  async getTemplates(): Promise<SceneMetadata[]> {
    const templates = await this.dbService.getAllTemplates();
    return templates.map(t => t.metadata);
  }

  async shareScene(sceneId: string, userId: string): Promise<void> {
    const sceneData = await this.loadScene(sceneId);
    if (!sceneData.metadata.sharedWith.includes(userId)) {
      sceneData.metadata.sharedWith.push(userId);
      await this.saveScene(new Scene(), sceneData.metadata);
    }
  }

  private async syncSceneWithCloud(sceneData: SceneData): Promise<void> {
    // Implement cloud storage sync
    // This would typically involve making API calls to your backend
    console.log('Syncing with cloud:', sceneData);
  }

  private async loadSceneFromCloud(sceneId: string, version?: number): Promise<SceneData | null> {
    // Implement cloud storage retrieval
    // This would typically involve making API calls to your backend
    console.log('Loading from cloud:', sceneId, version);
    return null;
  }
}
