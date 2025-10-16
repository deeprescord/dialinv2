import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TextureLoader, BackSide, Euler, MathUtils, VideoTexture } from 'three';
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
  isPlaying?: boolean;
  seekTo?: number;
  rotationEnabled?: boolean;
  rotationSpeed?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  onStateChange?: (state: {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    volume: number;
    isMuted: boolean;
  }) => void;
}

function Skybox({ mediaUrl, xAxisOffset = 0, yAxisOffset = 0, volume = 50, isMuted = true, isPlaying = false, seekTo, rotationEnabled = false, rotationSpeed = 1, flipHorizontal = false, flipVertical = false, onStateChange }: SkyboxProps) {
  const meshRef = useRef<Mesh>(null);
  const [texture, setTexture] = useState<any>(null);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    // Reset states
    setTexture(null);
    setError(false);
    
    // Check if the URL is a video file
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl);
    
    if (isVideo) {
      // Handle video
      const video = document.createElement('video');
      video.src = mediaUrl;
      // Enable CORS and mobile autoplay compatibility
      video.crossOrigin = 'anonymous';
      video.setAttribute('crossorigin', 'anonymous');
      video.loop = true;
      const norm = volume > 1 ? volume / 100 : volume;
      video.muted = isMuted || norm === 0;
      if (video.muted) {
        video.setAttribute('muted', '');
      }
      video.volume = video.muted ? 0 : norm;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.preload = 'auto';
      
      let hasCreatedTexture = false;
      
      const createTexture = () => {
        if (hasCreatedTexture) return;
        hasCreatedTexture = true;
        try {
          const videoTexture = new VideoTexture(video);
          videoTexture.flipY = true;
          setTexture(videoTexture);
          setError(false);
          // Start playing
          video.play().catch((playError) => {
            console.warn('Video play failed:', playError);
          });
        } catch (textureError: any) {
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
      };
      
      const handleCanPlay = () => createTexture();
      const handleLoadedData = () => createTexture();
      const handlePlaying = () => createTexture();
      const handleCanPlayThrough = () => createTexture();

      const emitState = () => {
        try {
          onStateChange?.({
            currentTime: video.currentTime || 0,
            duration: video.duration || 0,
            isPlaying: !video.paused && !video.ended,
            volume: video.muted ? 0 : video.volume,
            isMuted: video.muted,
          });
        } catch {}
      };
      
      const handleError = (err: any) => {
        console.warn(`Failed to load skybox video: ${mediaUrl}`, err);
        setError(true);
        // Notify parent to show standard fallback rendering
        setTimeout(() => {
          const event = new CustomEvent('webgl-security-error');
          window.dispatchEvent(event);
        }, 0);
      };
      
      video.addEventListener('loadedmetadata', () => { handleCanPlay(); emitState(); });
      video.addEventListener('loadeddata', () => { handleLoadedData(); emitState(); });
      video.addEventListener('canplay', () => { handleCanPlay(); emitState(); });
      video.addEventListener('canplaythrough', () => { handleCanPlayThrough(); emitState(); });
      video.addEventListener('playing', () => { handlePlaying(); emitState(); });
      video.addEventListener('timeupdate', emitState);
      video.addEventListener('play', emitState);
      video.addEventListener('pause', emitState);
      video.addEventListener('volumechange', emitState);
      video.addEventListener('error', handleError);
      
      videoRef.current = video;
      
      // Fallback: if readyState is already sufficient, create the texture shortly
      const readyCheck = setTimeout(() => {
        if (video.readyState >= 2 && !hasCreatedTexture) {
          createTexture();
          emitState();
        }
      }, 500);
      
      // Load the video
      video.load();
      
      return () => {
        clearTimeout(readyCheck);
        video.removeEventListener('loadedmetadata', handleCanPlay);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('timeupdate', emitState);
        video.removeEventListener('play', emitState);
        video.removeEventListener('pause', emitState);
        video.removeEventListener('volumechange', emitState);
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
          setTexture(loadedTexture);
          setError(false);
        },
        undefined,
        (err) => {
          console.warn(`Failed to load skybox texture: ${mediaUrl}`, err);
          setError(true);
        }
      );
    }
  }, [mediaUrl]);

  // Playback control effects
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (isPlaying) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    } catch {}
  }, [isPlaying]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (seekTo == null) return;
    try {
      v.currentTime = seekTo;
    } catch {}
  }, [seekTo]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const norm = volume > 1 ? volume / 100 : volume;
    try {
      v.muted = !!isMuted;
      v.volume = isMuted ? 0 : norm;
    } catch {}
  }, [isMuted, volume]);

  // Auto-rotation animation (always Y-axis for left-to-right rotation)
  useFrame((state, delta) => {
    if (rotationEnabled && meshRef.current) {
      meshRef.current.rotation.y += delta * rotationSpeed * 0.1;
    }
  });

  // Set initial rotation when auto-rotation is enabled (includes axis offsets)
  React.useEffect(() => {
    if (!rotationEnabled || !meshRef.current) return;
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl);
    let base: [number, number, number] = isVideo ? [Math.PI, 0, 0] : [0, 0, 0];
    if (mediaUrl.includes('lobby2.mp4')) {
      base = [Math.PI, Math.PI / 2, 0];
    }
    base[0] += MathUtils.degToRad(yAxisOffset || 0);
    base[1] += MathUtils.degToRad(xAxisOffset || 0);
    meshRef.current.rotation.set(base[0], base[1], base[2]);
  }, [rotationEnabled, xAxisOffset, yAxisOffset, mediaUrl]);

  // If error loading texture, don't render the skybox
  if (error || !texture) {
    return null;
  }

  // Check if this is a video file to apply different rotation
  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl);
  
  // Apply specific rotation based on video to center them properly
  let rotation: [number, number, number] = isVideo ? [Math.PI, 0, 0] : [0, 0, 0];
  if (mediaUrl.includes('lobby2.mp4')) {
    // Center the Grand Theater video by rotating it to the center
    rotation = [Math.PI, Math.PI / 2, 0];
  }
  
  // Apply user-defined axis offsets (only if rotation is not enabled)
  if (!rotationEnabled) {
    rotation[0] += MathUtils.degToRad(yAxisOffset || 0); // Y axis affects X rotation
    rotation[1] += MathUtils.degToRad(xAxisOffset || 0); // X axis affects Y rotation
  }
  
  // Calculate scale with flip transforms
  const baseScale = isVideo ? [50, 50, 50] : [-50, 50, 50];
  const scale: [number, number, number] = [
    baseScale[0] * (flipHorizontal ? -1 : 1),
    baseScale[1] * (flipVertical ? -1 : 1),
    baseScale[2]
  ];
  
  return (
    <mesh ref={meshRef} scale={scale} rotation={rotationEnabled ? undefined : rotation}>
      <sphereGeometry args={[1, 60, 40]} />
      <meshBasicMaterial map={texture} side={BackSide} />
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
  isPlaying?: boolean;
  seekTo?: number;
  rotationEnabled?: boolean;
  rotationSpeed?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  onStateChange?: (state: {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    volume: number;
    isMuted: boolean;
  }) => void;
}

export function SkyboxViewer({ 
  mediaUrl, 
  className = "", 
  enableGyroscope = true,
  xAxisOffset = 0,
  yAxisOffset = 0,
  volume = 50,
  isMuted = true,
  isPlaying = false,
  seekTo,
  rotationEnabled = false,
  rotationSpeed = 1,
  flipHorizontal = false,
  flipVertical = false,
  onStateChange
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

    // Listen for WebGL security errors from child components
    const handleWebGLError = () => {
      setWebglError(true);
    };

    window.addEventListener('webgl-security-error', handleWebGLError);
    
    return () => {
      window.removeEventListener('webgl-security-error', handleWebGLError);
    };
  }, [enableGyroscope, mediaUrl]);

  if (webglError) {
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl);
    
    if (isVideo) {
      return (
        <div className={`w-full h-full relative ${className}`}>
          <video
            src={mediaUrl}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            autoPlay={isPlaying}
            playsInline
            controls={true}
            ref={(video) => {
              if (video) {
                try {
                  video.muted = !!isMuted;
                  const norm = volume > 1 ? volume / 100 : volume;
                  video.volume = isMuted ? 0 : norm;
                  if (isPlaying) video.play().catch(() => {}); else video.pause();
                } catch {}
              }
            }}
            onTimeUpdate={(e) => onStateChange?.({
              currentTime: (e.currentTarget as HTMLVideoElement).currentTime,
              duration: (e.currentTarget as HTMLVideoElement).duration,
              isPlaying: !(e.currentTarget as HTMLVideoElement).paused,
              volume: (e.currentTarget as HTMLVideoElement).muted ? 0 : (e.currentTarget as HTMLVideoElement).volume,
              isMuted: (e.currentTarget as HTMLVideoElement).muted,
            })}
            onPlay={(e) => onStateChange?.({
              currentTime: (e.currentTarget as HTMLVideoElement).currentTime,
              duration: (e.currentTarget as HTMLVideoElement).duration,
              isPlaying: true,
              volume: (e.currentTarget as HTMLVideoElement).muted ? 0 : (e.currentTarget as HTMLVideoElement).volume,
              isMuted: (e.currentTarget as HTMLVideoElement).muted,
            })}
            onPause={(e) => onStateChange?.({
              currentTime: (e.currentTarget as HTMLVideoElement).currentTime,
              duration: (e.currentTarget as HTMLVideoElement).duration,
              isPlaying: false,
              volume: (e.currentTarget as HTMLVideoElement).muted ? 0 : (e.currentTarget as HTMLVideoElement).volume,
              isMuted: (e.currentTarget as HTMLVideoElement).muted,
            })}
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
            isPlaying={isPlaying}
            seekTo={seekTo}
            rotationEnabled={rotationEnabled}
            rotationSpeed={rotationSpeed}
            flipHorizontal={flipHorizontal}
            flipVertical={flipVertical}
            onStateChange={onStateChange}
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