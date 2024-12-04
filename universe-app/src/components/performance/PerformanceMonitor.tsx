import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  IconButton,
  Collapse,
  Badge,
  Tooltip,
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import { WebGLRenderer, Scene } from 'three';
import { PerformanceOptimizer } from '../../services/performanceOptimizer';

interface PerformanceStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  geometries: number;
  memoryUsage: number;
}

interface PerformanceMonitorProps {
  renderer: WebGLRenderer;
  scene: Scene;
  targetFPS?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  renderer,
  scene,
  targetFPS = 60
}) => {
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    textures: 0,
    geometries: 0,
    memoryUsage: 0
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [optimizationApplied, setOptimizationApplied] = useState(false);

  useEffect(() => {
    const optimizer = PerformanceOptimizer.getInstance();
    let frameCount = 0;
    let lastTime = performance.now();
    const interval = 1000; // Update every second

    const updateStats = () => {
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;

      if (elapsed >= interval) {
        const fps = (frameCount * 1000) / elapsed;
        const info = renderer.info;
        const memory = (performance as any).memory || {};

        const newStats: PerformanceStats = {
          fps,
          frameTime: elapsed / frameCount,
          drawCalls: info.render.calls,
          triangles: info.render.triangles,
          textures: info.memory.textures,
          geometries: info.memory.geometries,
          memoryUsage: memory.usedJSHeapSize / 1048576 // Convert to MB
        };

        setStats(newStats);
        checkWarnings(newStats);

        frameCount = 0;
        lastTime = currentTime;

        // Auto-optimize if performance is poor
        if (fps < targetFPS * 0.8 && !optimizationApplied) {
          applyOptimizations();
        }
      }

      frameCount++;
      requestAnimationFrame(updateStats);
    };

    const checkWarnings = (stats: PerformanceStats) => {
      const newWarnings: string[] = [];

      if (stats.fps < targetFPS * 0.8) {
        newWarnings.push('Low FPS detected');
      }
      if (stats.drawCalls > 1000) {
        newWarnings.push('High number of draw calls');
      }
      if (stats.triangles > 1000000) {
        newWarnings.push('High triangle count');
      }
      if (stats.memoryUsage > 1000) {
        newWarnings.push('High memory usage');
      }

      setWarnings(newWarnings);
    };

    const applyOptimizations = () => {
      const optimizer = PerformanceOptimizer.getInstance();
      
      // Apply LOD
      scene.traverse((object) => {
        if ('isMesh' in object && object.isMesh) {
          const lod = optimizer.createLOD(object);
          object.parent?.add(lod);
          object.parent?.remove(object);
        }
      });

      // Optimize scene graph
      optimizer.optimizeSceneGraph(scene);

      // Set up performance monitoring
      optimizer.setupPerformanceMonitoring(renderer, scene, targetFPS);

      setOptimizationApplied(true);
    };

    updateStats();

    return () => {
      // Cleanup
      optimizer.disposeUnusedResources(scene);
    };
  }, [renderer, scene, targetFPS]);

  return (
    <Card
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: expanded ? 300 : 'auto',
        transition: 'width 0.3s ease-in-out',
        zIndex: 1000,
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Badge badgeContent={warnings.length} color="error">
              <SpeedIcon color={stats.fps < targetFPS * 0.8 ? 'error' : 'success'} />
            </Badge>
            {!expanded && (
              <Typography variant="body2" sx={{ ml: 1 }}>
                {Math.round(stats.fps)} FPS
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box mt={2}>
            {/* FPS */}
            <Box mb={2}>
              <Typography variant="caption" color="text.secondary">
                FPS ({Math.round(stats.fps)})
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(stats.fps / targetFPS) * 100}
                color={stats.fps < targetFPS * 0.8 ? 'error' : 'success'}
              />
            </Box>

            {/* Draw Calls */}
            <Box mb={1}>
              <Typography variant="caption" display="flex" alignItems="center" gap={1}>
                <VisibilityIcon fontSize="small" />
                Draw Calls: {stats.drawCalls}
              </Typography>
            </Box>

            {/* Memory */}
            <Box mb={1}>
              <Typography variant="caption" display="flex" alignItems="center" gap={1}>
                <MemoryIcon fontSize="small" />
                Memory: {Math.round(stats.memoryUsage)} MB
              </Typography>
            </Box>

            {/* Warnings */}
            {warnings.length > 0 && (
              <Box mt={2}>
                <Typography variant="caption" color="error" display="flex" alignItems="center" gap={1}>
                  <WarningIcon fontSize="small" />
                  Performance Warnings:
                </Typography>
                {warnings.map((warning, index) => (
                  <Typography key={index} variant="caption" color="error" display="block" ml={2}>
                    • {warning}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Optimization Status */}
            {optimizationApplied && (
              <Box mt={1}>
                <Typography variant="caption" color="success.main">
                  ✓ Optimizations Applied
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};
