import { SceneData, SceneMetadata } from './sceneManagement';

const DB_NAME = 'UniverseDB';
const DB_VERSION = 1;
const SCENES_STORE = 'scenes';
const TEMPLATES_STORE = 'templates';
const VERSIONS_STORE = 'versions';

interface DBStores {
  scenes: SceneData;
  templates: SceneData;
  versions: SceneData;
}

export class IndexedDBService {
  private static instance: IndexedDBService;
  private db: IDBDatabase | null = null;

  private constructor() {}

  static getInstance(): IndexedDBService {
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService();
    }
    return IndexedDBService.instance;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create scenes store
        if (!db.objectStoreNames.contains(SCENES_STORE)) {
          const sceneStore = db.createObjectStore(SCENES_STORE, { keyPath: 'metadata.id' });
          sceneStore.createIndex('createdBy', 'metadata.createdBy', { unique: false });
          sceneStore.createIndex('updatedAt', 'metadata.updatedAt', { unique: false });
        }

        // Create templates store
        if (!db.objectStoreNames.contains(TEMPLATES_STORE)) {
          const templateStore = db.createObjectStore(TEMPLATES_STORE, { keyPath: 'metadata.id' });
          templateStore.createIndex('createdBy', 'metadata.createdBy', { unique: false });
        }

        // Create versions store
        if (!db.objectStoreNames.contains(VERSIONS_STORE)) {
          const versionStore = db.createObjectStore(VERSIONS_STORE, { 
            keyPath: ['metadata.id', 'version'] 
          });
          versionStore.createIndex('sceneId', 'metadata.id', { unique: false });
          versionStore.createIndex('version', 'version', { unique: false });
        }
      };
    });
  }

  async saveScene(sceneData: SceneData, isTemplate: boolean = false): Promise<void> {
    const store = isTemplate ? TEMPLATES_STORE : SCENES_STORE;
    await this.save(store, sceneData);

    // Save version history
    await this.save(VERSIONS_STORE, {
      ...sceneData,
      version: sceneData.metadata.version
    });
  }

  async getScene(id: string): Promise<SceneData | null> {
    return this.get(SCENES_STORE, id);
  }

  async getTemplate(id: string): Promise<SceneData | null> {
    return this.get(TEMPLATES_STORE, id);
  }

  async getAllScenes(): Promise<SceneData[]> {
    return this.getAll(SCENES_STORE);
  }

  async getAllTemplates(): Promise<SceneData[]> {
    return this.getAll(TEMPLATES_STORE);
  }

  async getSceneVersions(sceneId: string): Promise<SceneData[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(VERSIONS_STORE, 'readonly');
      const store = transaction.objectStore(VERSIONS_STORE);
      const index = store.index('sceneId');
      const request = index.getAll(sceneId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async save<T extends keyof DBStores>(
    storeName: T,
    data: DBStores[T]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async get<T extends keyof DBStores>(
    storeName: T,
    id: string
  ): Promise<DBStores[T] | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async getAll<T extends keyof DBStores>(storeName: T): Promise<DBStores[T][]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}
