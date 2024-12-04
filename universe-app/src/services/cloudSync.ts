import { SceneData, SceneMetadata } from './sceneManagement';
import { ThumbnailGenerator } from '../utils/thumbnailGenerator';

interface CloudSyncConfig {
  apiUrl: string;
  apiKey: string;
  userId: string;
}

export class CloudSyncService {
  private static instance: CloudSyncService;
  private config: CloudSyncConfig;
  private syncQueue: Map<string, Promise<void>>;
  private lastSyncTime: Date | null = null;

  private constructor(config: CloudSyncConfig) {
    this.config = config;
    this.syncQueue = new Map();
  }

  static getInstance(config?: CloudSyncConfig): CloudSyncService {
    if (!CloudSyncService.instance && config) {
      CloudSyncService.instance = new CloudSyncService(config);
    }
    return CloudSyncService.instance;
  }

  async syncScene(sceneData: SceneData): Promise<void> {
    const sceneId = sceneData.metadata.id;

    // Check if sync is already in progress for this scene
    if (this.syncQueue.has(sceneId)) {
      return this.syncQueue.get(sceneId);
    }

    const syncPromise = this.performSync(sceneData);
    this.syncQueue.set(sceneId, syncPromise);

    try {
      await syncPromise;
    } finally {
      this.syncQueue.delete(sceneId);
    }
  }

  private async performSync(sceneData: SceneData): Promise<void> {
    try {
      // Generate thumbnail
      const thumbnail = await ThumbnailGenerator.generateThumbnail(sceneData.sceneJson);
      
      // Prepare data for upload
      const uploadData = {
        ...sceneData,
        metadata: {
          ...sceneData.metadata,
          thumbnail,
          lastSyncTime: new Date().toISOString(),
          userId: this.config.userId
        }
      };

      // Upload to cloud
      const response = await fetch(`${this.config.apiUrl}/scenes/${sceneData.metadata.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(uploadData)
      });

      if (!response.ok) {
        throw new Error(`Failed to sync scene: ${response.statusText}`);
      }

      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('Scene sync failed:', error);
      throw error;
    }
  }

  async pullScene(sceneId: string, version?: number): Promise<SceneData> {
    try {
      const versionQuery = version ? `?version=${version}` : '';
      const response = await fetch(
        `${this.config.apiUrl}/scenes/${sceneId}${versionQuery}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to pull scene: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Scene pull failed:', error);
      throw error;
    }
  }

  async listScenes(filters?: {
    userId?: string;
    isTemplate?: boolean;
    tags?: string[];
    search?: string;
  }): Promise<SceneMetadata[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const response = await fetch(
        `${this.config.apiUrl}/scenes?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list scenes: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Scene listing failed:', error);
      throw error;
    }
  }

  async deleteScene(sceneId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/scenes/${sceneId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete scene: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Scene deletion failed:', error);
      throw error;
    }
  }

  async syncAllPending(): Promise<void> {
    // Implementation for syncing all pending changes
    // This would typically be called when coming back online
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  isOnline(): boolean {
    return navigator.onLine;
  }
}
