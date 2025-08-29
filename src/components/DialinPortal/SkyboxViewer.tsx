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
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ 
          position: [0, 0, 0], 
          fov: 90,
          near: 0.1,
          far: 100
        }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Skybox imageUrl={imageUrl} />
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.1}
            rotateSpeed={-0.5}
            minDistance={0.1}
            maxDistance={0.1}
            target={[0, 0, 0]}
            enableRotate={true}
            autoRotate={false}
            reverseOrbit={false}
            // Limit vertical rotation
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={3 * Math.PI / 4}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}