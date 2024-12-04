import { saveAs } from 'file-saver';
import * as THREE from 'three';
import { Shape } from '../store/sceneStore';
import { Material } from '../store/materialStore';

interface SceneData {
  shapes: Shape[];
  materials: Material[];
  version: string;
}

export const exportScene = (shapes: Shape[], materials: Material[]) => {
  const sceneData: SceneData = {
    shapes,
    materials,
    version: '1.0.0',
  };

  const blob = new Blob([JSON.stringify(sceneData, null, 2)], {
    type: 'application/json',
  });
  saveAs(blob, 'universe-scene.json');
};

export const importScene = async (file: File): Promise<SceneData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const sceneData = JSON.parse(event.target?.result as string);
        resolve(sceneData);
      } catch (error) {
        reject(new Error('Invalid scene file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Function to export to common 3D formats
export const exportToFormat = async (
  shapes: Shape[],
  materials: Material[],
  format: 'obj' | 'stl' | 'gltf'
) => {
  // This is a placeholder for the actual export logic
  // You would need to use Three.js exporters here
  const scene = new THREE.Scene();
  
  // Convert shapes to Three.js objects
  shapes.forEach((shape) => {
    let geometry;
    switch (shape.type) {
      case 'box':
        geometry = new THREE.BoxGeometry();
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(1, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
        break;
    }

    const material = materials.find((m) => m.id === shape.materialId);
    const threeMaterial = new THREE.MeshStandardMaterial({
      color: material?.color || '#ffffff',
      metalness: material?.metalness || 0,
      roughness: material?.roughness || 0.5,
      transparent: material?.transparent || false,
      opacity: material?.opacity || 1,
    });

    const mesh = new THREE.Mesh(geometry, threeMaterial);
    mesh.position.set(...shape.position);
    mesh.rotation.set(...shape.rotation);
    mesh.scale.set(...shape.scale);
    
    scene.add(mesh);
  });

  // Export based on format
  let result;
  switch (format) {
    case 'obj':
      const OBJExporter = (await import('three/examples/jsm/exporters/OBJExporter')).OBJExporter;
      const objExporter = new OBJExporter();
      result = objExporter.parse(scene);
      saveAs(new Blob([result], { type: 'text/plain' }), 'scene.obj');
      break;
      
    case 'stl':
      const STLExporter = (await import('three/examples/jsm/exporters/STLExporter')).STLExporter;
      const stlExporter = new STLExporter();
      result = stlExporter.parse(scene);
      saveAs(new Blob([result], { type: 'application/octet-stream' }), 'scene.stl');
      break;
      
    case 'gltf':
      const GLTFExporter = (await import('three/examples/jsm/exporters/GLTFExporter')).GLTFExporter;
      const gltfExporter = new GLTFExporter();
      gltfExporter.parse(
        scene,
        (gltf) => {
          saveAs(new Blob([JSON.stringify(gltf)], { type: 'application/json' }), 'scene.gltf');
        },
        { binary: false }
      );
      break;
  }
};
