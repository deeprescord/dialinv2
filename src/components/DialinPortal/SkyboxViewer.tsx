import React, { Suspense, useRef, useState } from 'react';
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
  const [webglError, setWebglError] = useState(false);

  if (webglError) {
    return (
      <div 
        className={`w-full h-full bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ 
          position: [0, 0, 0.1], 
          fov: 75,
          near: 0.01,
          far: 100
        }}
        gl={{ 
          antialias: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false
        }}
        style={{ 
          cursor: 'grab',
          touchAction: 'none'
        }}
        onCreated={(state) => {
          // Ensure WebGL context is working
          if (!state.gl.getContext()) {
            setWebglError(true);
          }
        }}
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).style.cursor = 'grabbing';
        }}
        onPointerUp={(e) => {
          (e.target as HTMLCanvasElement).style.cursor = 'grab';
        }}
      >
        <Suspense fallback={null}>
          <Skybox imageUrl={imageUrl} />
          <OrbitControls
            makeDefault
            enableZoom={false}
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={0.5}
            enableRotate={true}
            autoRotate={false}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}