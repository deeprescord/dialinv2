import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TextureLoader, BackSide } from 'three';
import { Mesh } from 'three';

interface SkyboxProps {
  imageUrl: string;
}

function Skybox({ imageUrl }: SkyboxProps) {
  const texture = useLoader(TextureLoader, imageUrl);
  const meshRef = useRef<Mesh>(null);

  // No automatic rotation - only mouse controlled

  return (
    <mesh ref={meshRef} scale={[-50, 50, 50]}>
      <sphereGeometry args={[1, 60, 40]} />
      <meshBasicMaterial map={texture} side={BackSide} />
    </mesh>
  );
}

interface SkyboxViewerProps {
  imageUrl: string;
  className?: string;
}

export function SkyboxViewer({ imageUrl, className = "" }: SkyboxViewerProps) {
  return (
    <div className={`w-full h-full ${className} cursor-grab active:cursor-grabbing`}>
      <Canvas
        camera={{ 
          position: [0, 0, 0.1], 
          fov: 75,
          near: 0.01,
          far: 1000
        }}
        gl={{ antialias: true }}
        style={{ pointerEvents: 'auto' }}
      >
        <Suspense fallback={null}>
          <Skybox imageUrl={imageUrl} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={0.8}
            enableRotate={true}
            autoRotate={false}
            // Allow full vertical rotation for 360° experience
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}