import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TextureLoader, BackSide } from 'three';
import { Mesh } from 'three';

interface SkyboxProps {
  imageUrl: string;
}

function Skybox({ imageUrl }: SkyboxProps) {
  const meshRef = useRef<Mesh>(null);
  const [texture, setTexture] = useState<any>(null);
  const [error, setError] = useState(false);

  React.useEffect(() => {
    const loader = new TextureLoader();
    loader.load(
      imageUrl,
      (loadedTexture) => {
        setTexture(loadedTexture);
        setError(false);
      },
      undefined,
      (err) => {
        console.warn(`Failed to load skybox texture: ${imageUrl}`, err);
        setError(true);
      }
    );
  }, [imageUrl]);

  // If error loading texture, don't render the skybox
  if (error || !texture) {
    return null;
  }

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
          near: 0.1,
          far: 1000
        }}
      >
        <Suspense fallback={null}>
          <Skybox imageUrl={imageUrl} />
          <OrbitControls
            makeDefault
            enableZoom={false}
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.1}
            rotateSpeed={1}
            enableRotate={true}
            autoRotate={false}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}