import { SceneData } from '../types/scene';

interface StorageMetadata {
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
}

interface StorageOptions {
  compression?: boolean;
  encrypt?: boolean;
  chunkSize?: number;
}

class CloudStorageService {
  private static instance: CloudStorageService;
  private readonly API_URL: string;
  private readonly CHUNK_SIZE: number = 1024 * 1024; // 1MB
  private authToken: string | null = null;

  private constructor() {
    this.API_URL = process.env.REACT_APP_STORAGE_API_URL || 'https://api.universe3d.com/storage';
  }

  static getInstance(): CloudStorageService {
    if (!CloudStorageService.instance) {
      CloudStorageService.instance = new CloudStorageService();
    }
    return CloudStorageService.instance;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    if (!this.authToken) {
      throw new Error('Authentication required');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  async saveScene(sceneData: SceneData, metadata: Partial<StorageMetadata>, options: StorageOptions = {}): Promise<StorageMetadata> {
    try {
      // Compress scene data if requested
      const processedData = options.compression
        ? await this.compressData(sceneData)
        : sceneData;

      // Split into chunks if large
      const chunks = this.splitIntoChunks(
        JSON.stringify(processedData),
        options.chunkSize || this.CHUNK_SIZE
      );

      // Initialize upload
      const initResponse = await this.fetchWithAuth(`${this.API_URL}/scenes/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata,
          totalChunks: chunks.length,
          options,
        }),
      });

      const { uploadId, urls } = await initResponse.json();

      // Upload chunks in parallel
      const uploadPromises = chunks.map((chunk, index) =>
        this.uploadChunk(urls[index], chunk, index)
      );

      await Promise.all(uploadPromises);

      // Complete upload
      const completeResponse = await this.fetchWithAuth(
        `${this.API_URL}/scenes/complete/${uploadId}`,
        {
          method: 'POST',
        }
      );

      return completeResponse.json();
    } catch (error) {
      console.error('Error saving scene:', error);
      throw error;
    }
  }

  async loadScene(sceneId: string): Promise<{ data: SceneData; metadata: StorageMetadata }> {
    try {
      // Get scene metadata and download URLs
      const metadataResponse = await this.fetchWithAuth(
        `${this.API_URL}/scenes/${sceneId}`
      );
      const { metadata, urls } = await metadataResponse.json();

      // Download chunks in parallel
      const downloadPromises = urls.map((url: string) =>
        this.downloadChunk(url)
      );

      const chunks = await Promise.all(downloadPromises);

      // Combine chunks
      const combinedData = this.combineChunks(chunks);

      // Decompress if necessary
      const sceneData = metadata.compression
        ? await this.decompressData(combinedData)
        : JSON.parse(combinedData);

      return { data: sceneData, metadata };
    } catch (error) {
      console.error('Error loading scene:', error);
      throw error;
    }
  }

  async listScenes(options: {
    page?: number;
    limit?: number;
    sort?: 'name' | 'date' | 'size';
    order?: 'asc' | 'desc';
    filter?: {
      author?: string;
      tags?: string[];
      dateRange?: { start: number; end: number };
    };
  } = {}): Promise<{ scenes: StorageMetadata[]; total: number }> {
    try {
      const queryParams = new URLSearchParams({
        page: (options.page || 1).toString(),
        limit: (options.limit || 20).toString(),
        sort: options.sort || 'date',
        order: options.order || 'desc',
        ...options.filter,
      });

      const response = await this.fetchWithAuth(
        `${this.API_URL}/scenes?${queryParams}`
      );

      return response.json();
    } catch (error) {
      console.error('Error listing scenes:', error);
      throw error;
    }
  }

  async deleteScene(sceneId: string): Promise<void> {
    try {
      await this.fetchWithAuth(`${this.API_URL}/scenes/${sceneId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting scene:', error);
      throw error;
    }
  }

  async updateMetadata(
    sceneId: string,
    metadata: Partial<StorageMetadata>
  ): Promise<StorageMetadata> {
    try {
      const response = await this.fetchWithAuth(
        `${this.API_URL}/scenes/${sceneId}/metadata`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metadata),
        }
      );

      return response.json();
    } catch (error) {
      console.error('Error updating metadata:', error);
      throw error;
    }
  }

  async generateThumbnail(sceneId: string): Promise<string> {
    try {
      const response = await this.fetchWithAuth(
        `${this.API_URL}/scenes/${sceneId}/thumbnail`,
        {
          method: 'POST',
        }
      );

      const { thumbnailUrl } = await response.json();
      return thumbnailUrl;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }

  private async compressData(data: any): Promise<Uint8Array> {
    // Implement compression using a library like pako or lz-string
    return new TextEncoder().encode(JSON.stringify(data));
  }

  private async decompressData(data: Uint8Array): Promise<any> {
    // Implement decompression
    return JSON.parse(new TextDecoder().decode(data));
  }

  private splitIntoChunks(data: string, chunkSize: number): Uint8Array[] {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    const chunks: Uint8Array[] = [];

    for (let i = 0; i < encoded.length; i += chunkSize) {
      chunks.push(encoded.slice(i, i + chunkSize));
    }

    return chunks;
  }

  private combineChunks(chunks: Uint8Array[]): string {
    const decoder = new TextDecoder();
    const combined = new Uint8Array(
      chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );

    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return decoder.decode(combined);
  }

  private async uploadChunk(url: string, chunk: Uint8Array, index: number): Promise<void> {
    try {
      await fetch(url, {
        method: 'PUT',
        body: chunk,
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Chunk-Index': index.toString(),
        },
      });
    } catch (error) {
      console.error(`Error uploading chunk ${index}:`, error);
      throw error;
    }
  }

  private async downloadChunk(url: string): Promise<Uint8Array> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Uint8Array(await blob.arrayBuffer());
    } catch (error) {
      console.error('Error downloading chunk:', error);
      throw error;
    }
  }
}

export const cloudStorage = CloudStorageService.getInstance();
