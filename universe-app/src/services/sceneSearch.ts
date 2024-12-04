import { SceneMetadata } from './sceneManagement';
import Fuse from 'fuse.js';

export interface SearchFilters {
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  creator?: string;
  isTemplate?: boolean;
  sharedWith?: string[];
}

export interface SortOptions {
  field: 'name' | 'updatedAt' | 'createdAt';
  direction: 'asc' | 'desc';
}

export class SceneSearchService {
  private static instance: SceneSearchService;
  private fuseInstance: Fuse<SceneMetadata>;

  private constructor() {
    // Configure Fuse.js for fuzzy searching
    this.fuseInstance = new Fuse([], {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'description', weight: 1.5 },
        { name: 'tags', weight: 1 }
      ],
      threshold: 0.3,
      distance: 100
    });
  }

  static getInstance(): SceneSearchService {
    if (!SceneSearchService.instance) {
      SceneSearchService.instance = new SceneSearchService();
    }
    return SceneSearchService.instance;
  }

  updateSearchIndex(scenes: SceneMetadata[]): void {
    this.fuseInstance.setCollection(scenes);
  }

  search(query: string, scenes: SceneMetadata[], filters?: SearchFilters, sort?: SortOptions): SceneMetadata[] {
    // First, apply fuzzy search if query exists
    let results = query 
      ? this.fuseInstance.search(query).map(result => result.item)
      : [...scenes];

    // Apply filters
    if (filters) {
      results = this.applyFilters(results, filters);
    }

    // Apply sorting
    if (sort) {
      results = this.sortResults(results, sort);
    }

    return results;
  }

  private applyFilters(scenes: SceneMetadata[], filters: SearchFilters): SceneMetadata[] {
    return scenes.filter(scene => {
      // Filter by tags
      if (filters.tags?.length) {
        if (!filters.tags.some(tag => scene.tags.includes(tag))) {
          return false;
        }
      }

      // Filter by date range
      if (filters.dateRange) {
        const sceneDate = new Date(scene.updatedAt);
        if (sceneDate < filters.dateRange.start || sceneDate > filters.dateRange.end) {
          return false;
        }
      }

      // Filter by creator
      if (filters.creator && scene.createdBy !== filters.creator) {
        return false;
      }

      // Filter by template status
      if (filters.isTemplate !== undefined && scene.isTemplate !== filters.isTemplate) {
        return false;
      }

      // Filter by shared users
      if (filters.sharedWith?.length) {
        if (!filters.sharedWith.some(userId => scene.sharedWith.includes(userId))) {
          return false;
        }
      }

      return true;
    });
  }

  private sortResults(scenes: SceneMetadata[], sort: SortOptions): SceneMetadata[] {
    return [...scenes].sort((a, b) => {
      let comparison = 0;
      
      switch (sort.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }

  // Helper method to get unique tags from a collection of scenes
  getUniqueTags(scenes: SceneMetadata[]): string[] {
    const tagSet = new Set<string>();
    scenes.forEach(scene => {
      scene.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  // Helper method to get unique creators from a collection of scenes
  getUniqueCreators(scenes: SceneMetadata[]): string[] {
    return Array.from(new Set(scenes.map(scene => scene.createdBy))).sort();
  }

  // Helper method to suggest tags based on partial input
  suggestTags(partial: string, scenes: SceneMetadata[], limit: number = 5): string[] {
    const allTags = this.getUniqueTags(scenes);
    return allTags
      .filter(tag => tag.toLowerCase().includes(partial.toLowerCase()))
      .slice(0, limit);
  }

  // Helper method to get recently used tags
  getRecentTags(scenes: SceneMetadata[], limit: number = 5): string[] {
    const tagCounts = new Map<string, number>();
    
    scenes.forEach(scene => {
      scene.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  }
}
