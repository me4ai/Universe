import { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, Box3, Vector3, Sphere } from 'three';
import { Shape } from '../store/sceneStore';
import { SceneConverter } from './sceneConverter';

export class ThumbnailGenerator {
  private static renderer: WebGLRenderer;
  private static camera: PerspectiveCamera;

  private static initRenderer() {
    if (!this.renderer) {
      this.renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true
      });
      this.renderer.setSize(256, 256); // Thumbnail size
      this.renderer.setClearColor(0xf0f0f0, 1);
    }
    
    if (!this.camera) {
      this.camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    }
  }

  static async generateThumbnail(shapes: { [key: string]: Shape }): Promise<string> {
    this.initRenderer();

    // Create scene
    const scene = new Scene();
    
    // Add lights
    const ambientLight = new AmbientLight(0xffffff, 0.5);
    const directionalLight = new DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(ambientLight, directionalLight);

    // Add shapes
    Object.values(shapes).forEach(shape => {
      const mesh = SceneConverter.shapeToThreeJS(shape);
      scene.add(mesh);
    });

    // Calculate scene bounds
    const bounds = new Box3().setFromObject(scene);
    const sphere = new Sphere();
    bounds.getBoundingSphere(sphere);

    // Position camera to frame the scene
    const distance = sphere.radius * 2.5;
    this.camera.position.set(distance, distance, distance);
    this.camera.lookAt(sphere.center);

    // Render scene
    this.renderer.render(scene, this.camera);

    // Convert to base64
    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    // Clean up
    scene.traverse((object) => {
      if ('geometry' in object) {
        (object as any).geometry?.dispose();
      }
      if ('material' in object) {
        const materials = Array.isArray((object as any).material) 
          ? (object as any).material 
          : [(object as any).material];
        
        materials.forEach(material => {
          if (material) {
            material.dispose();
          }
        });
      }
    });

    return dataUrl;
  }

  static async generateThumbnailBlob(shapes: { [key: string]: Shape }): Promise<Blob> {
    const dataUrl = await this.generateThumbnail(shapes);
    const response = await fetch(dataUrl);
    return response.blob();
  }

  static dispose() {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    if (this.camera) {
      this.camera = null;
    }
  }
}
