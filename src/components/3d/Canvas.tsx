import React from 'react';
import { Canvas as ThreeCanvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Box } from '@mui/material';
import { Box as BoxShape, Sphere, Cylinder } from './shapes/BasicShapes';
import { useSceneStore } from '../../store/sceneStore';

const Scene: React.FC = () => {
  const shapes = useSceneStore((state) => state.shapes);
  const selectedShapeId = useSceneStore((state) => state.selectedShapeId);
  const selectShape = useSceneStore((state) => state.selectShape);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Grid infiniteGrid />
      {shapes.map((shape) => {
        const ShapeComponent = {
          box: BoxShape,
          sphere: Sphere,
          cylinder: Cylinder,
        }[shape.type];

        return (
          <ShapeComponent
            key={shape.id}
            position={shape.position}
            rotation={shape.rotation}
            scale={shape.scale}
            color={shape.color}
            onClick={() => selectShape(shape.id)}
          />
        );
      })}
    </>
  );
};

const Canvas: React.FC = () => {
  return (
    <Box sx={{ width: '100%', height: '100vh' }}>
      <ThreeCanvas>
        <Scene />
        <OrbitControls />
      </ThreeCanvas>
    </Box>
  );
};

export default Canvas;
