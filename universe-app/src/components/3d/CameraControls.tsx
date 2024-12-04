import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import create from 'zustand';

interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  zoom: number;
  orthographic: boolean;
  
  setPosition: (position: THREE.Vector3) => void;
  setTarget: (target: THREE.Vector3) => void;
  setZoom: (zoom: number) => void;
  toggleProjection: () => void;
  
  frameObject: (boundingBox: THREE.Box3) => void;
  resetView: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  position: new THREE.Vector3(5, 5, 5),
  target: new THREE.Vector3(0, 0, 0),
  zoom: 1,
  orthographic: false,

  setPosition: (position) => set({ position }),
  setTarget: (target) => set({ target }),
  setZoom: (zoom) => set({ zoom }),
  toggleProjection: () => set((state) => ({ orthographic: !state.orthographic })),

  frameObject: (boundingBox) => {
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = 45;
    const cameraDistance = maxDim / (2 * Math.tan((fov * Math.PI) / 360));
    
    const direction = new THREE.Vector3(1, 1, 1).normalize();
    const position = center.clone().add(direction.multiplyScalar(cameraDistance));
    
    set({
      position,
      target: center,
      zoom: 1,
    });
  },

  resetView: () => {
    set({
      position: new THREE.Vector3(5, 5, 5),
      target: new THREE.Vector3(0, 0, 0),
      zoom: 1,
    });
  },
}));

const CameraControls: React.FC = () => {
  const { camera, gl } = useThree();
  const controls = useRef<OrbitControls>();
  const {
    position,
    target,
    zoom,
    orthographic,
    setPosition,
    setTarget,
    setZoom,
  } = useCameraStore();

  useEffect(() => {
    controls.current = new OrbitControls(camera, gl.domElement);
    controls.current.enableDamping = true;
    controls.current.dampingFactor = 0.05;
    controls.current.screenSpacePanning = true;
    controls.current.minDistance = 0.1;
    controls.current.maxDistance = 1000;
    controls.current.maxPolarAngle = Math.PI / 1.5;
    
    return () => {
      controls.current?.dispose();
    };
  }, [camera, gl]);

  useEffect(() => {
    if (controls.current) {
      controls.current.object.position.copy(position);
      controls.current.target.copy(target);
      controls.current.update();
    }
  }, [position, target]);

  useEffect(() => {
    if (orthographic && !(camera instanceof THREE.OrthographicCamera)) {
      const aspect = gl.domElement.clientWidth / gl.domElement.clientHeight;
      const newCamera = new THREE.OrthographicCamera(
        -5 * aspect,
        5 * aspect,
        5,
        -5,
        0.1,
        1000
      );
      newCamera.position.copy(camera.position);
      newCamera.rotation.copy(camera.rotation);
      newCamera.zoom = zoom;
      camera = newCamera;
    } else if (!orthographic && !(camera instanceof THREE.PerspectiveCamera)) {
      const newCamera = new THREE.PerspectiveCamera(
        45,
        gl.domElement.clientWidth / gl.domElement.clientHeight,
        0.1,
        1000
      );
      newCamera.position.copy(camera.position);
      newCamera.rotation.copy(camera.rotation);
      camera = newCamera;
    }
  }, [orthographic, camera, gl.domElement.clientWidth, gl.domElement.clientHeight]);

  useFrame(() => {
    if (controls.current) {
      controls.current.update();
      
      // Update store with current camera state
      if (
        !position.equals(controls.current.object.position) ||
        !target.equals(controls.current.target)
      ) {
        setPosition(controls.current.object.position.clone());
        setTarget(controls.current.target.clone());
        setZoom(camera.zoom);
      }
    }
  });

  return null;
};

export default CameraControls;
