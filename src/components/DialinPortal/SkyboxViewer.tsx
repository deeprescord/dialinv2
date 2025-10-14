import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TextureLoader, BackSide, DoubleSide, Euler, MathUtils, VideoTexture } from 'three';
import { Mesh } from 'three';


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

interface SkyboxProps {
  mediaUrl: string;
  xAxisOffset?: number;
  yAxisOffset?: number;
  volume?: number;
  isMuted?: boolean;
  rotationEnabled?: boolean;
  rotationSpeed?: number;
  horizontalFlip?: boolean;
  verticalFlip?: boolean;
}

function Skybox({ mediaUrl, xAxisOffset = 0, yAxisOffset = 0, volume = 50, isMuted = true, rotationEnabled = false, rotationSpeed = 1, horizontalFlip = false, verticalFlip = false }: SkyboxProps) {
  const meshRef = useRef<Mesh>(null);
  const [texture, setTexture] = useState<any>(null);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isVideoRef = useRef(false);

  React.useEffect(() => {
    // Reset states
    setTexture(null);
    setError(false);
    
    // Check if the URL is a video file (handle query/hash)
    const cleanUrl = mediaUrl.split('?')[0].split('#')[0];
    const isVideo = /(\.mp4|\.webm|\.ogg|\.mov)$/i.test(cleanUrl);
    isVideoRef.current = isVideo;
    
    if (isVideo) {
      // Handle video
      const video = document.createElement('video');
      video.src = mediaUrl;
      video.crossOrigin = 'anonymous'; // Enable CORS for WebGL texture usage
      video.loop = true;
      video.muted = isMuted;
      video.volume = isMuted ? 0 : volume / 100;
      video.playsInline = true;
      video.preload = 'metadata';
      
      let hasCreatedTexture = false;
      
      const handleCanPlay = () => {
        if (!hasCreatedTexture) {
          hasCreatedTexture = true;
          try {
            const videoTexture = new VideoTexture(video);
            videoTexture.flipY = false; // Keep false to prevent flipping
            setTexture(videoTexture);
            setError(false);
            // Notify parent that WebGL content loaded
            window.dispatchEvent(new CustomEvent('webgl-loaded'));
            
            // Start playing
            video.play().catch((playError) => {
              console.warn('Video play failed:', playError);
            });
          } catch (textureError) {
            console.warn('VideoTexture creation failed:', textureError);
            setError(true);
            // Also trigger webglError in parent component for fallback
            if (textureError.name === 'SecurityError') {
              // This will trigger the parent to use webglError fallback
              setTimeout(() => {
                const event = new CustomEvent('webgl-security-error');
                window.dispatchEvent(event);
              }, 100);
            }
          }
        }
      };
      
      const handleError = (err: any) => {
        console.warn(`Failed to load skybox video: ${mediaUrl}`, err);
        setError(true);
        // Trigger fallback in parent for any video load issues
        setTimeout(() => {
          const event = new CustomEvent('webgl-security-error');
          window.dispatchEvent(event);
        }, 100);
      };
      
      video.addEventListener('loadedmetadata', handleCanPlay);
      video.addEventListener('loadeddata', handleCanPlay);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('canplaythrough', handleCanPlay);
      video.addEventListener('error', handleError);
      
      videoRef.current = video;
      
      // Load the video
      video.load();
      
      return () => {
        video.removeEventListener('loadedmetadata', handleCanPlay);
        video.removeEventListener('loadeddata', handleCanPlay);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('canplaythrough', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.pause();
        video.remove();
        if (texture) {
          texture.dispose();
        }
      };
    } else {
      // Handle image
      const loader = new TextureLoader();
      loader.load(
        mediaUrl,
        (loadedTexture) => {
          loadedTexture.flipY = false;
          loadedTexture.needsUpdate = true;
          setTexture(loadedTexture);
          setError(false);
          // Notify parent that WebGL content loaded
          window.dispatchEvent(new CustomEvent('webgl-loaded'));
        },
        undefined,
        (err) => {
          console.warn(`Failed to load skybox texture: ${mediaUrl}`, err);
          setError(true);
          // Trigger fallback in parent so we show non-WebGL background
          setTimeout(() => {
            const event = new CustomEvent('webgl-security-error');
            window.dispatchEvent(event);
          }, 100);
        }
      );
    }
  }, [mediaUrl]);

  // Auto-rotation animation (always Y-axis for left-to-right rotation)
  useFrame((state, delta) => {
    if (rotationEnabled && meshRef.current) {
      meshRef.current.rotation.y += delta * rotationSpeed * 0.1;
    }
  });

  // Ensure stable rotation order to avoid flips at high pitch
  React.useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.order = 'YXZ';
    }
  }, []);

  // Set initial rotation when auto-rotation is enabled (includes axis offsets)
  React.useEffect(() => {
    if (!rotationEnabled || !meshRef.current) return;
    const isVideo = isVideoRef.current;
    let base: [number, number, number] = isVideo ? [0, Math.PI, 0] : [0, 0, 0];
    if (mediaUrl.includes('lobby2.mp4')) {
      base = [0, Math.PI * 1.5, 0];
    }
    base[0] += MathUtils.degToRad(Math.max(-85, Math.min(85, yAxisOffset || 0)));
    base[1] += MathUtils.degToRad(xAxisOffset || 0);
    meshRef.current.rotation.set(base[0], base[1], base[2]);
  }, [rotationEnabled, xAxisOffset, yAxisOffset, mediaUrl]);

  // Compute mesh scale for flip (avoid RepeatWrapping on NPOT textures like videos)
  const meshScale: [number, number, number] = [
    horizontalFlip ? -50 : 50,
    verticalFlip ? -50 : 50,
    50
  ];
  // Check if this is a video file to apply different rotation
  const isVideo = isVideoRef.current;
  
  // Apply specific rotation based on video to center them properly
  let rotation: [number, number, number] = isVideo ? [0, Math.PI, 0] : [0, 0, 0];
  if (mediaUrl.includes('lobby2.mp4')) {
    // Center the Grand Theater video by rotating it to the center
    rotation = [0, Math.PI * 1.5, 0];
  }
  
  // Apply user-defined axis offsets (only if rotation is not enabled)
  if (!rotationEnabled) {
    rotation[0] += MathUtils.degToRad(Math.max(-85, Math.min(85, yAxisOffset || 0))); // Clamp pitch to avoid inversion
    rotation[1] += MathUtils.degToRad(xAxisOffset || 0); // Yaw adjustment
  }
  
  return (
    <mesh ref={meshRef} scale={meshScale} rotation={rotationEnabled ? undefined : rotation}>
      <sphereGeometry args={[1, 60, 40]} />
      <meshBasicMaterial map={texture} side={DoubleSide} />
    </mesh>
  );
}

interface SkyboxViewerProps {
  mediaUrl: string;
  className?: string;
  enableGyroscope?: boolean;
  xAxisOffset?: number;
  yAxisOffset?: number;
  volume?: number;
  isMuted?: boolean;
  rotationEnabled?: boolean;
  rotationSpeed?: number;
  horizontalFlip?: boolean;
  verticalFlip?: boolean;
}

export function SkyboxViewer({ 
  mediaUrl, 
  className = "", 
  enableGyroscope = true,
  xAxisOffset = 0,
  yAxisOffset = 0,
  volume = 50,
  isMuted = true,
  rotationEnabled = false,
  rotationSpeed = 1,
  horizontalFlip = false,
  verticalFlip = false
}: SkyboxViewerProps) {
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

    // Reset and set a safety fallback timer if WebGL content doesn't load
    setWebglError(false);
    let loaded = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!loaded) setWebglError(true);
    }, 2500);

    // Listen for WebGL errors and successful loads from child components
    const handleWebGLError = () => {
      loaded = false;
      setWebglError(true);
      window.clearTimeout(fallbackTimer);
    };

    const handleWebGLLoaded = () => {
      loaded = true;
      setWebglError(false);
      window.clearTimeout(fallbackTimer);
    };

    window.addEventListener('webgl-security-error', handleWebGLError);
    window.addEventListener('webgl-loaded', handleWebGLLoaded);
    
    return () => {
      window.removeEventListener('webgl-security-error', handleWebGLError);
      window.removeEventListener('webgl-loaded', handleWebGLLoaded);
      window.clearTimeout(fallbackTimer);
    };
  }, [enableGyroscope, mediaUrl]);

  if (webglError) {
    const cleanUrl = mediaUrl.split('?')[0].split('#')[0];
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(cleanUrl);
    
    if (isVideo) {
      return (
        <div className={`w-full h-full relative ${className}`}>
          <video
            src={mediaUrl}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            autoPlay
            playsInline
            controls={true}
            ref={(video) => {
              if (video && !isMuted) {
                video.volume = volume / 100;
              }
            }}
          />
          {/* Enhanced fallback indicator for 360° external videos */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-medium pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              360° Video - Standard View
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div 
          className={`w-full h-full bg-cover bg-center ${className}`}
          style={{ backgroundImage: `url(${mediaUrl})` }}
        />
      );
    }
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
          <Skybox 
            mediaUrl={mediaUrl} 
            xAxisOffset={xAxisOffset}
            yAxisOffset={yAxisOffset}
            volume={volume}
            isMuted={isMuted}
            rotationEnabled={rotationEnabled}
            rotationSpeed={rotationSpeed}
            horizontalFlip={horizontalFlip}
            verticalFlip={verticalFlip}
          />
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