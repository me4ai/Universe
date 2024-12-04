import {
  LOD,
  Mesh,
  BufferGeometry,
  Material,
  Vector3,
  Box3,
  Camera,
  Object3D,
  Scene
} from 'three';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

interface LODLevel {
  distance: number;
  reduction: number;
}

export class LODManager {
  private static instance: LODManager;
  private simplifyModifier: SimplifyModifier;
  private geometryCache: Map<string, BufferGeometry[]>;
  private defaultLevels: LODLevel[];

  private constructor() {
    this.simplifyModifier = new SimplifyModifier();
    this.geometryCache = new Map();
    this.defaultLevels = [
      { distance: 0, reduction: 0 },      // Full detail
      { distance: 50, reduction: 0.25 },  // 75% detail
      { distance: 100, reduction: 0.5 },  // 50% detail
      { distance: 200, reduction: 0.75 }  // 25% detail
    ];
  }

  static getInstance(): LODManager {
    if (!LODManager.instance) {
      LODManager.instance = new LODManager();
    }
    return LODManager.instance;
  }

  createLOD(mesh: Mesh, customLevels?: LODLevel[]): LOD {
    const levels = customLevels || this.defaultLevels;
    const lod = new LOD();
    const geometry = mesh.geometry;
    const material = mesh.material;
    const cacheKey = this.getGeometryCacheKey(geometry);

    // Check cache first
    let lodGeometries = this.geometryCache.get(cacheKey);
    if (!lodGeometries) {
      lodGeometries = this.generateLODGeometries(geometry, levels);
      this.geometryCache.set(cacheKey, lodGeometries);
    }

    // Create LOD meshes
    lodGeometries.forEach((geo, index) => {
      const lodMesh = new Mesh(geo, material);
      lod.addLevel(lodMesh, levels[index].distance);
    });

    return lod;
  }

  private generateLODGeometries(
    originalGeometry: BufferGeometry,
    levels: LODLevel[]
  ): BufferGeometry[] {
    const geometries: BufferGeometry[] = [];
    const vertexCount = originalGeometry.attributes.position.count;

    levels.forEach(({ reduction }) => {
      if (reduction === 0) {
        geometries.push(originalGeometry);
      } else {
        const targetVertices = Math.floor(vertexCount * (1 - reduction));
        const simplified = this.simplifyModifier.modify(
          originalGeometry.clone(),
          targetVertices
        );
        geometries.push(simplified);
      }
    });

    return geometries;
  }

  private getGeometryCacheKey(geometry: BufferGeometry): string {
    // Create a unique key based on geometry attributes
    return `${geometry.uuid}-${geometry.attributes.position.count}`;
  }

  updateLODLevels(scene: Scene, camera: Camera): void {
    scene.traverse((object) => {
      if (object instanceof LOD) {
        const distance = camera.position.distanceTo(object.position);
        object.update(camera);

        // Dynamically adjust LOD distances based on performance
        if (this.shouldAdjustLOD()) {
          this.adjustLODDistances(object, distance);
        }
      }
    });
  }

  private shouldAdjustLOD(): boolean {
    // Check if we need to adjust LOD based on performance metrics
    const fps = this.getCurrentFPS();
    return fps < 30; // Adjust threshold as needed
  }

  private getCurrentFPS(): number {
    // Implementation to get current FPS
    // This could be connected to the PerformanceMonitor
    return 60; // Placeholder
  }

  private adjustLODDistances(lod: LOD, currentDistance: number): void {
    // Adjust LOD distances based on performance and current distance
    const performanceFactor = this.getCurrentFPS() / 60;
    lod.levels.forEach((level) => {
      level.distance *= performanceFactor;
    });
  }

  optimizeSceneForLOD(scene: Scene): void {
    // Group similar geometries for batch processing
    const geometryGroups = new Map<string, Mesh[]>();

    scene.traverse((object) => {
      if (object instanceof Mesh) {
        const key = this.getGeometryGroupKey(object);
        if (!geometryGroups.has(key)) {
          geometryGroups.set(key, []);
        }
        geometryGroups.get(key)!.push(object);
      }
    });

    // Process each group
    geometryGroups.forEach((meshes, key) => {
      if (meshes.length > 1) {
        this.createMergedLODGroup(scene, meshes);
      } else {
        // Single mesh, just add LOD
        const lod = this.createLOD(meshes[0]);
        meshes[0].parent?.add(lod);
        meshes[0].parent?.remove(meshes[0]);
      }
    });
  }

  private getGeometryGroupKey(mesh: Mesh): string {
    // Group meshes with similar properties
    return `${mesh.geometry.type}-${(mesh.material as Material).uuid}`;
  }

  private createMergedLODGroup(scene: Scene, meshes: Mesh[]): void {
    // Merge geometries of similar meshes
    const geometries: BufferGeometry[] = [];
    const material = meshes[0].material;

    meshes.forEach((mesh) => {
      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);
      geometries.push(geometry);
    });

    const mergedGeometry = mergeBufferGeometries(geometries);
    const mergedMesh = new Mesh(mergedGeometry, material);
    const lod = this.createLOD(mergedMesh);

    // Replace original meshes with merged LOD
    const parent = meshes[0].parent;
    if (parent) {
      parent.add(lod);
      meshes.forEach((mesh) => {
        parent.remove(mesh);
        mesh.geometry.dispose();
      });
    }
  }

  clearCache(): void {
    this.geometryCache.forEach((geometries) => {
      geometries.forEach((geometry) => geometry.dispose());
    });
    this.geometryCache.clear();
  }

  dispose(): void {
    this.clearCache();
  }
}
