import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TextureLoader, BackSide, Euler, MathUtils } from 'three';
import { Mesh } from 'three';

interface SkyboxProps {
  imageUrl: string;
}

function GyroscopeControls({ enabled, onActiveChange }: { enabled: boolean; onActiveChange?: (active: boolean) => void }) {
  const { camera } = useThree();
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsActive(false);
      onActiveChange?.(false);
      return;
    }

    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          const granted = permission === 'granted';
          setPermissionGranted(granted);
          setIsActive(granted);
          onActiveChange?.(granted);
        } catch (error) {
          console.warn('Device orientation permission denied:', error);
          setPermissionGranted(false);
          setIsActive(false);
          onActiveChange?.(false);
        }
      } else {
        // Non-iOS devices or older browsers
        setPermissionGranted(true);
        setIsActive(true);
        onActiveChange?.(true);
      }
    };

    requestPermission();
  }, [enabled, onActiveChange]);

  useEffect(() => {
    if (!enabled || !permissionGranted) return;

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      // Only update if we have meaningful orientation data
      if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
        setOrientation({
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma
        });
      }
    };

    window.addEventListener('deviceorientation', handleDeviceOrientation);
    return () => window.removeEventListener('deviceorientation', handleDeviceOrientation);
  }, [enabled, permissionGranted]);

  useFrame(() => {
    if (!enabled || !permissionGranted || !isActive) return;

    // Convert device orientation to camera rotation
    const alpha = MathUtils.degToRad(orientation.alpha); // Z axis (compass)
    const beta = MathUtils.degToRad(orientation.beta);   // X axis (tilt front/back)
    const gamma = MathUtils.degToRad(orientation.gamma); // Y axis (tilt left/right)

    // Apply orientation to camera with proper coordinate system conversion
    camera.rotation.set(
      beta - Math.PI / 2,  // Adjust for landscape orientation
      alpha,
      -gamma
    );
  });

  return null;
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
  enableGyroscope?: boolean;
}

export function SkyboxViewer({ imageUrl, className = "", enableGyroscope = true }: SkyboxViewerProps) {
  const [webglError, setWebglError] = useState(false);
  const [gyroscopeEnabled, setGyroscopeEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [gyroscopeActive, setGyroscopeActive] = useState(false);

  useEffect(() => {
    // Detect if device is mobile and has gyroscope capability
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const hasGyroscope = 'DeviceOrientationEvent' in window;
      setIsMobile(isMobileDevice && hasGyroscope && enableGyroscope);
    };

    checkMobile();
  }, [enableGyroscope]);

  if (webglError) {
    return (
      <div 
        className={`w-full h-full bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
    );
  }

  return (
    <div className={`w-full h-full relative ${className}`}>
      {/* Gyroscope toggle button for mobile */}
      {isMobile && (
        <button
          onClick={() => setGyroscopeEnabled(!gyroscopeEnabled)}
          className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            gyroscopeEnabled 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-background/80 text-foreground border border-border'
          }`}
        >
          {gyroscopeEnabled ? '📱 Gyro ON' : '📱 Gyro OFF'}
        </button>
      )}
      
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
          <GyroscopeControls 
            enabled={gyroscopeEnabled} 
            onActiveChange={setGyroscopeActive}
          />
          <OrbitControls
            makeDefault
            enableZoom={false}
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.1}
            rotateSpeed={1}
            enableRotate={!gyroscopeActive} // Disable finger controls only when gyroscope is actively working
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