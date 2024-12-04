import React, { useEffect, useRef, useState } from 'react';
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  Vector3,
  Box3,
  Mesh,
  Material,
  Raycaster,
  Vector2,
  Object3D,
  LOD
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PerformanceOptimizer } from '../../services/performanceOptimizer';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';
import { Shape } from '../../store/sceneStore';
import { useAdvancedSceneStore } from '../../store/advancedSceneStore';

interface OptimizedSceneRendererProps {
  shapes: { [key: string]: Shape };
  onSelect?: (shapeId: string | null) => void;
  enablePerformanceMonitor?: boolean;
  enableOptimizations?: boolean;
}

export const OptimizedSceneRenderer: React.FC<OptimizedSceneRendererProps> = ({
  shapes,
  onSelect,
  enablePerformanceMonitor = true,
  enableOptimizations = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene>(new Scene());
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const optimizerRef = useRef<PerformanceOptimizer>(PerformanceOptimizer.getInstance());
  const animationFrameRef = useRef<number>();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create renderer
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create camera
    const camera = new PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Add lights
    const ambientLight = new AmbientLight(0xffffff, 0.5);
    const directionalLight = new DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    sceneRef.current.add(ambientLight, directionalLight);

    // Set up raycaster for selection
    const raycaster = new Raycaster();
    const mouse = new Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

      if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        document.body.style.cursor = 'pointer';
        if (onSelect) {
          renderer.domElement.onclick = () => {
            onSelect(selectedObject.userData.id || null);
          };
        }
      } else {
        document.body.style.cursor = 'default';
        renderer.domElement.onclick = null;
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    setIsInitialized(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      controls.dispose();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update scene with shapes
  useEffect(() => {
    if (!isInitialized) return;

    // Clear existing objects
    while (sceneRef.current.children.length > 0) {
      const object = sceneRef.current.children[0];
      if (object instanceof Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
      sceneRef.current.remove(object);
    }

    // Add new shapes with optimizations
    if (enableOptimizations) {
      // Group similar objects for instancing
      const instanceGroups = new Map<string, { mesh: Mesh; positions: Vector3[]; rotations: Vector3[]; scales: Vector3[] }>();

      Object.values(shapes).forEach(shape => {
        const key = `${shape.type}-${shape.materialId}`;
        if (!instanceGroups.has(key)) {
          instanceGroups.set(key, {
            mesh: optimizerRef.current.createMeshFromShape(shape),
            positions: [],
            rotations: [],
            scales: []
          });
        }
        const group = instanceGroups.get(key)!;
        group.positions.push(new Vector3(...shape.position));
        group.rotations.push(new Vector3(...shape.rotation));
        group.scales.push(new Vector3(...shape.scale));
      });

      // Create instanced meshes
      instanceGroups.forEach(({ mesh, positions, rotations, scales }) => {
        if (positions.length > 1) {
          const instancedMesh = optimizerRef.current.createInstancedMesh(
            mesh,
            positions,
            rotations,
            scales
          );
          sceneRef.current.add(instancedMesh);
        } else {
          sceneRef.current.add(mesh);
        }
      });

      // Apply LOD and optimize scene graph
      optimizerRef.current.optimizeSceneGraph(sceneRef.current);
    } else {
      // Add shapes without optimizations
      Object.values(shapes).forEach(shape => {
        const mesh = optimizerRef.current.createMeshFromShape(shape);
        sceneRef.current.add(mesh);
      });
    }

    // Update camera to frame the scene
    const bounds = new Box3().setFromObject(sceneRef.current);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current!.fov * (Math.PI / 180);
    const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2));
    cameraRef.current!.position.copy(center).add(new Vector3(cameraDistance, cameraDistance, cameraDistance));
    cameraRef.current!.lookAt(center);
  }, [shapes, enableOptimizations]);

  // Animation loop
  useEffect(() => {
    if (!isInitialized) return;

    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isInitialized]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {enablePerformanceMonitor && rendererRef.current && (
        <PerformanceMonitor
          renderer={rendererRef.current}
          scene={sceneRef.current}
        />
      )}
    </div>
  );
};
