import React from 'react';
import { Canvas as ThreeCanvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Box } from '@mui/material';

const Canvas: React.FC = () => {
  return (
    <Box sx={{ width: '100%', height: '100vh' }}>
      <ThreeCanvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        {/* 3D content will be added here */}
      </ThreeCanvas>
    </Box>
  );
};

export default Canvas;
