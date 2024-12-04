import React from 'react';
import { useThree } from '@react-three/fiber';
import { useMaterialStore } from '../../../store/materialStore';

interface ShapeProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  materialId: string;
  onClick?: () => void;
}

export const Box: React.FC<ShapeProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  materialId,
  onClick,
}) => {
  const materials = useMaterialStore((state) => state.materials);
  const material = materials.find((m) => m.id === materialId);

  return (
    <mesh position={position} rotation={rotation} scale={scale} onClick={onClick}>
      <boxGeometry />
      <meshStandardMaterial
        color={material?.color || '#ffffff'}
        metalness={material?.metalness || 0}
        roughness={material?.roughness || 0.5}
        transparent={material?.transparent || false}
        opacity={material?.opacity || 1}
      />
    </mesh>
  );
};

export const Sphere: React.FC<ShapeProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  materialId,
  onClick,
}) => {
  const materials = useMaterialStore((state) => state.materials);
  const material = materials.find((m) => m.id === materialId);

  return (
    <mesh position={position} rotation={rotation} scale={scale} onClick={onClick}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color={material?.color || '#ffffff'}
        metalness={material?.metalness || 0}
        roughness={material?.roughness || 0.5}
        transparent={material?.transparent || false}
        opacity={material?.opacity || 1}
      />
    </mesh>
  );
};

export const Cylinder: React.FC<ShapeProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  materialId,
  onClick,
}) => {
  const materials = useMaterialStore((state) => state.materials);
  const material = materials.find((m) => m.id === materialId);

  return (
    <mesh position={position} rotation={rotation} scale={scale} onClick={onClick}>
      <cylinderGeometry args={[1, 1, 2, 32]} />
      <meshStandardMaterial
        color={material?.color || '#ffffff'}
        metalness={material?.metalness || 0}
        roughness={material?.roughness || 0.5}
        transparent={material?.transparent || false}
        opacity={material?.opacity || 1}
      />
    </mesh>
  );
};
