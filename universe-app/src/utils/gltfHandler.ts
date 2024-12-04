import { Scene, Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { SceneConverter } from './sceneConverter';
import { Shape } from '../store/sceneStore';

export class GLTFHandler {
  private static loader: GLTFLoader;
  private static dracoLoader: DRACOLoader;

  private static initializeLoaders() {
    if (!this.loader) {
      this.loader = new GLTFLoader();
      this.dracoLoader = new DRACOLoader();
      this.dracoLoader.setDecoderPath('/draco/');
      this.loader.setDRACOLoader(this.dracoLoader);
    }
  }

  static async importGLTF(file: File): Promise<Scene> {
    this.initializeLoaders();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const gltf = await this.loader.parseAsync(event.target?.result as string, '');
          const scene = gltf.scene;
          
          // Process materials and textures
          scene.traverse((object: Object3D) => {
            if ('material' in object) {
              // Handle materials
              const obj = object as any;
              if (Array.isArray(obj.material)) {
                obj.material.forEach(this.processMaterial);
              } else {
                this.processMaterial(obj.material);
              }
            }
          });

          resolve(scene);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private static processMaterial(material: any) {
    // Handle material processing if needed
    if (material) {
      material.needsUpdate = true;
    }
  }

  static compareScenes(sceneA: { [key: string]: Shape }, sceneB: { [key: string]: Shape }): SceneComparison {
    const comparison: SceneComparison = {
      added: [],
      removed: [],
      modified: [],
      unchanged: []
    };

    // Find added and modified shapes
    Object.entries(sceneB).forEach(([id, shapeB]) => {
      const shapeA = sceneA[id];
      if (!shapeA) {
        comparison.added.push(shapeB);
      } else if (!this.areShapesEqual(shapeA, shapeB)) {
        comparison.modified.push({
          before: shapeA,
          after: shapeB,
          changes: this.getShapeChanges(shapeA, shapeB)
        });
      } else {
        comparison.unchanged.push(shapeB);
      }
    });

    // Find removed shapes
    Object.entries(sceneA).forEach(([id, shapeA]) => {
      if (!sceneB[id]) {
        comparison.removed.push(shapeA);
      }
    });

    return comparison;
  }

  private static areShapesEqual(shapeA: Shape, shapeB: Shape): boolean {
    return (
      shapeA.type === shapeB.type &&
      shapeA.name === shapeB.name &&
      this.arraysEqual(shapeA.position, shapeB.position) &&
      this.arraysEqual(shapeA.rotation, shapeB.rotation) &&
      this.arraysEqual(shapeA.scale, shapeB.scale) &&
      shapeA.materialId === shapeB.materialId
    );
  }

  private static arraysEqual(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((value, index) => Math.abs(value - b[index]) < 0.0001);
  }

  private static getShapeChanges(before: Shape, after: Shape): ShapeChanges {
    const changes: ShapeChanges = {};

    if (before.name !== after.name) changes.name = { before: before.name, after: after.name };
    if (before.type !== after.type) changes.type = { before: before.type, after: after.type };
    if (!this.arraysEqual(before.position, after.position)) {
      changes.position = { before: before.position, after: after.position };
    }
    if (!this.arraysEqual(before.rotation, after.rotation)) {
      changes.rotation = { before: before.rotation, after: after.rotation };
    }
    if (!this.arraysEqual(before.scale, after.scale)) {
      changes.scale = { before: before.scale, after: after.scale };
    }
    if (before.materialId !== after.materialId) {
      changes.materialId = { before: before.materialId, after: after.materialId };
    }

    return changes;
  }
}

export interface SceneComparison {
  added: Shape[];
  removed: Shape[];
  modified: Array<{
    before: Shape;
    after: Shape;
    changes: ShapeChanges;
  }>;
  unchanged: Shape[];
}

export interface ShapeChanges {
  [key: string]: {
    before: any;
    after: any;
  };
}
