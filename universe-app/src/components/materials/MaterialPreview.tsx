import React, { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { ViewInAr, Sphere, Cube, Cylinder, AutoFixHigh } from '@mui/icons-material';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useAdvancedMaterialStore } from '../../store/advancedMaterialStore';

interface PreviewShape {
  name: string;
  icon: React.ReactElement;
  geometry: THREE.BufferGeometry;
}

const previewShapes: PreviewShape[] = [
  {
    name: 'Sphere',
    icon: <Sphere />,
    geometry: new THREE.SphereGeometry(1, 32, 32),
  },
  {
    name: 'Cube',
    icon: <Cube />,
    geometry: new THREE.BoxGeometry(1.5, 1.5, 1.5),
  },
  {
    name: 'Cylinder',
    icon: <Cylinder />,
    geometry: new THREE.CylinderGeometry(0.8, 0.8, 2, 32),
  },
];

const environmentMaps = [
  {
    name: 'Studio',
    path: '/environments/studio.hdr',
  },
  {
    name: 'Sunset',
    path: '/environments/sunset.hdr',
  },
  {
    name: 'Workshop',
    path: '/environments/workshop.hdr',
  },
];

interface MaterialPreviewProps {
  materialId: string;
  width?: number;
  height?: number;
}

const MaterialPreview: React.FC<MaterialPreviewProps> = ({
  materialId,
  width = 300,
  height = 300,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedShape, setSelectedShape] = useState<PreviewShape>(previewShapes[0]);
  const [selectedEnvMap, setSelectedEnvMap] = useState(environmentMaps[0]);
  const [shapeMenuAnchor, setShapeMenuAnchor] = useState<null | HTMLElement>(null);
  const [envMapMenuAnchor, setEnvMapMenuAnchor] = useState<null | HTMLElement>(null);

  const { createThreeMaterial } = useAdvancedMaterialStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    // Camera setup
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Environment map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new THREE.RGBELoader()
      .load(selectedEnvMap.path, (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        scene.background = new THREE.Color(0x202020);
        texture.dispose();
        pmremGenerator.dispose();
      });

    // Preview mesh
    const material = createThreeMaterial(materialId);
    const mesh = new THREE.Mesh(selectedShape.geometry, material);
    scene.add(mesh);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      scene.remove(mesh);
      material.dispose();
      selectedShape.geometry.dispose();
      renderer.dispose();
      pmremGenerator.dispose();
    };
  }, [materialId, selectedShape, selectedEnvMap, width, height, createThreeMaterial]);

  const handleShapeMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setShapeMenuAnchor(event.currentTarget);
  };

  const handleShapeMenuClose = () => {
    setShapeMenuAnchor(null);
  };

  const handleEnvMapMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setEnvMapMenuAnchor(event.currentTarget);
  };

  const handleEnvMapMenuClose = () => {
    setEnvMapMenuAnchor(null);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width, height }} />
      
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          display: 'flex',
          gap: 1,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: 1,
          p: 0.5,
        }}
      >
        <Tooltip title="Change Preview Shape">
          <IconButton size="small" onClick={handleShapeMenuOpen}>
            <ViewInAr />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Change Environment">
          <IconButton size="small" onClick={handleEnvMapMenuOpen}>
            <AutoFixHigh />
          </IconButton>
        </Tooltip>
      </Box>

      <Menu
        anchorEl={shapeMenuAnchor}
        open={Boolean(shapeMenuAnchor)}
        onClose={handleShapeMenuClose}
      >
        {previewShapes.map((shape) => (
          <MenuItem
            key={shape.name}
            onClick={() => {
              setSelectedShape(shape);
              handleShapeMenuClose();
            }}
          >
            {shape.icon} {shape.name}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={envMapMenuAnchor}
        open={Boolean(envMapMenuAnchor)}
        onClose={handleEnvMapMenuClose}
      >
        {environmentMaps.map((envMap) => (
          <MenuItem
            key={envMap.name}
            onClick={() => {
              setSelectedEnvMap(envMap);
              handleEnvMapMenuClose();
            }}
          >
            {envMap.name}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default MaterialPreview;
