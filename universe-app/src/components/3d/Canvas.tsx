import React, { Suspense } from 'react';
import { Canvas as ThreeCanvas } from '@react-three/fiber';
import { Box, Grid } from '@mui/material';
import { Stats } from '@react-three/drei';
import CameraControls from './CameraControls';
import { useViewportStore, ViewportType } from './ViewportControls';
import * as THREE from 'three';

interface ViewportProps {
  type: ViewportType;
  showGrid: boolean;
  showAxes: boolean;
  showStats: boolean;
  isActive: boolean;
}

const Viewport: React.FC<ViewportProps> = ({
  type,
  showGrid,
  showAxes,
  showStats,
  isActive,
}) => {
  const cameraPosition = React.useMemo(() => {
    switch (type) {
      case 'front':
        return new THREE.Vector3(0, 0, 5);
      case 'top':
        return new THREE.Vector3(0, 5, 0);
      case 'right':
        return new THREE.Vector3(5, 0, 0);
      default:
        return new THREE.Vector3(5, 5, 5);
    }
  }, [type]);

  return (
    <ThreeCanvas
      camera={{
        position: cameraPosition,
        fov: 45,
        near: 0.1,
        far: 1000,
      }}
      style={{
        width: '100%',
        height: '100%',
        outline: isActive ? '2px solid #1976d2' : 'none',
      }}
    >
      <Suspense fallback={null}>
        <CameraControls />
        {showGrid && <gridHelper args={[10, 10]} />}
        {showAxes && <axesHelper args={[5]} />}
        {showStats && <Stats />}
        {/* Scene content will be added here */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Grid infiniteGrid />
        {/* Add shapes here */}
      </Suspense>
    </ThreeCanvas>
  );
};

const Canvas: React.FC = () => {
  const { layout, viewports, activeViewport, setActiveViewport } = useViewportStore();
  const shapes = useSceneStore((state) => state.shapes);
  const selectedShapeId = useSceneStore((state) => state.selectedShapeId);
  const selectShape = useSceneStore((state) => state.selectShape);

  const handleViewportClick = (id: string) => {
    setActiveViewport(id);
  };

  const renderViewports = () => {
    switch (layout) {
      case 'single':
        return (
          <Box
            sx={{ width: '100%', height: '100%' }}
            onClick={() => handleViewportClick('main')}
          >
            <Viewport
              {...viewports.main}
              isActive={activeViewport === 'main'}
            >
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
            </Viewport>
          </Box>
        );

      case 'double':
        return (
          <Grid container sx={{ width: '100%', height: '100%' }}>
            <Grid
              item
              xs={6}
              sx={{ height: '100%' }}
              onClick={() => handleViewportClick('left')}
            >
              <Viewport
                {...viewports.left}
                isActive={activeViewport === 'left'}
              >
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
              </Viewport>
            </Grid>
            <Grid
              item
              xs={6}
              sx={{ height: '100%' }}
              onClick={() => handleViewportClick('right')}
            >
              <Viewport
                {...viewports.right}
                isActive={activeViewport === 'right'}
              >
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
              </Viewport>
            </Grid>
          </Grid>
        );

      case 'triple':
        return (
          <Grid container sx={{ width: '100%', height: '100%' }}>
            <Grid
              item
              xs={6}
              sx={{ height: '100%' }}
              onClick={() => handleViewportClick('main')}
            >
              <Viewport
                {...viewports.main}
                isActive={activeViewport === 'main'}
              >
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
              </Viewport>
            </Grid>
            <Grid item xs={6} container direction="column">
              <Grid
                item
                xs={6}
                onClick={() => handleViewportClick('top')}
              >
                <Viewport
                  {...viewports.top}
                  isActive={activeViewport === 'top'}
                >
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
                </Viewport>
              </Grid>
              <Grid
                item
                xs={6}
                onClick={() => handleViewportClick('right')}
              >
                <Viewport
                  {...viewports.right}
                  isActive={activeViewport === 'right'}
                >
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
                </Viewport>
              </Grid>
            </Grid>
          </Grid>
        );

      case 'quad':
        return (
          <Grid container sx={{ width: '100%', height: '100%' }}>
            <Grid container item xs={6} sx={{ height: '50%' }}>
              <Grid
                item
                xs={12}
                onClick={() => handleViewportClick('topLeft')}
              >
                <Viewport
                  {...viewports.topLeft}
                  isActive={activeViewport === 'topLeft'}
                >
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
                </Viewport>
              </Grid>
            </Grid>
            <Grid container item xs={6} sx={{ height: '50%' }}>
              <Grid
                item
                xs={12}
                onClick={() => handleViewportClick('topRight')}
              >
                <Viewport
                  {...viewports.topRight}
                  isActive={activeViewport === 'topRight'}
                >
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
                </Viewport>
              </Grid>
            </Grid>
            <Grid container item xs={6} sx={{ height: '50%' }}>
              <Grid
                item
                xs={12}
                onClick={() => handleViewportClick('bottomLeft')}
              >
                <Viewport
                  {...viewports.bottomLeft}
                  isActive={activeViewport === 'bottomLeft'}
                >
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
                </Viewport>
              </Grid>
            </Grid>
            <Grid container item xs={6} sx={{ height: '50%' }}>
              <Grid
                item
                xs={12}
                onClick={() => handleViewportClick('bottomRight')}
              >
                <Viewport
                  {...viewports.bottomRight}
                  isActive={activeViewport === 'bottomRight'}
                >
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
                </Viewport>
              </Grid>
            </Grid>
          </Grid>
        );
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 64,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'background.default',
      }}
    >
      {renderViewports()}
    </Box>
  );
};

export default Canvas;
