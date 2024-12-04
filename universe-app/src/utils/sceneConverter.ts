import { Scene, BoxGeometry, SphereGeometry, CylinderGeometry, Mesh, MeshStandardMaterial } from 'three';
import { Shape } from '../store/sceneStore';

export class SceneConverter {
  static shapeToThreeJS(shape: Shape): Mesh {
    // Create geometry based on shape type
    let geometry;
    switch (shape.type) {
      case 'box':
        geometry = new BoxGeometry(1, 1, 1);
        break;
      case 'sphere':
        geometry = new SphereGeometry(0.5, 32, 32);
        break;
      case 'cylinder':
        geometry = new CylinderGeometry(0.5, 0.5, 1, 32);
        break;
      default:
        throw new Error(`Unsupported shape type: ${shape.type}`);
    }

    // Create default material if none specified
    const material = new MeshStandardMaterial({ color: 0x808080 });

    // Create mesh and set transform
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...shape.position);
    mesh.rotation.set(...shape.rotation);
    mesh.scale.set(...shape.scale);
    mesh.name = shape.name;
    mesh.userData.id = shape.id;

    return mesh;
  }

  static threeJSToShape(mesh: Mesh): Shape {
    // Determine shape type based on geometry
    let type: Shape['type'];
    if (mesh.geometry instanceof BoxGeometry) {
      type = 'box';
    } else if (mesh.geometry instanceof SphereGeometry) {
      type = 'sphere';
    } else if (mesh.geometry instanceof CylinderGeometry) {
      type = 'cylinder';
    } else {
      throw new Error('Unsupported geometry type');
    }

    return {
      id: mesh.userData.id || crypto.randomUUID(),
      type,
      name: mesh.name || 'Untitled Shape',
      position: [mesh.position.x, mesh.position.y, mesh.position.z],
      rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
      scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
      materialId: null // Add material handling if needed
    };
  }

  static storeToScene(shapes: { [key: string]: Shape }): Scene {
    const scene = new Scene();
    
    Object.values(shapes).forEach(shape => {
      try {
        const mesh = this.shapeToThreeJS(shape);
        scene.add(mesh);
      } catch (error) {
        console.error(`Failed to convert shape ${shape.id}:`, error);
      }
    });

    return scene;
  }

  static sceneToStore(scene: Scene): { [key: string]: Shape } {
    const shapes: { [key: string]: Shape } = {};

    scene.traverse((object) => {
      if (object instanceof Mesh) {
        try {
          const shape = this.threeJSToShape(object);
          shapes[shape.id] = shape;
        } catch (error) {
          console.error(`Failed to convert mesh ${object.name}:`, error);
        }
      }
    });

    return shapes;
  }
}
