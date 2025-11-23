import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import type { Item } from '@/hooks/useItems';


interface Floating3DItem {
  id: string;
  item: Item;
  position: [number, number, number];
}

function Skybox({ url }: { url?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);

  useEffect(() => {
    const video = document.createElement('video');
    video.src = url || '/media/skybox-360.mp4';
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    
    video.play().catch(err => console.log('Video autoplay failed:', err));
    
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;
    
    setVideoTexture(texture);
    videoRef.current = video;

    return () => {
      video.pause();
      video.src = '';
      texture.dispose();
    };
  }, [url]);

  if (!videoTexture) {
    return (
      <mesh>
        <sphereGeometry args={[500, 60, 40]} />
        <meshBasicMaterial color="#0a0118" side={THREE.BackSide} />
      </mesh>
    );
  }
  
  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial 
        map={videoTexture}
        side={THREE.BackSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function OrbitingThumbnail({ 
  item, 
  index, 
  total, 
  isCenter, 
  onClick 
}: { 
  item: Item; 
  index: number; 
  total: number; 
  isCenter: boolean; 
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const storagePath = (item as any).storage_path || item.file_url;
  const imageUrl = item.mime_type?.startsWith('image/') 
    ? `https://qdytxfauwfdjotnlcbuh.supabase.co/storage/v1/object/public/user_files/${storagePath}`
    : null;

  // Calculate position in semi-circle ring
  const radius = 4;
  const angle = (index / total) * Math.PI; // Semi-circle (0 to PI)
  const ringX = Math.cos(angle) * radius;
  const ringZ = -Math.sin(angle) * radius;
  const ringY = -0.5;

  // Animation with lerp
  useFrame(() => {
    if (meshRef.current) {
      if (isCenter) {
        // Attach to camera - always centered in view
        const cameraWorldPosition = new THREE.Vector3();
        camera.getWorldPosition(cameraWorldPosition);
        
        const cameraForward = new THREE.Vector3(0, 0, -1);
        cameraForward.applyQuaternion(camera.quaternion);
        
        const targetPosition = cameraWorldPosition.clone().add(
          cameraForward.multiplyScalar(1.5)
        );
        
        meshRef.current.position.lerp(targetPosition, 0.1);
        
        // Always face the camera perfectly
        meshRef.current.lookAt(camera.position);
        
        // Scale
        const targetScale = 2.5;
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      } else {
        // Ring position
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, ringX, 0.1);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, ringY, 0.1);
        meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, ringZ, 0.1);
        
        // Ring items face inward
        meshRef.current.lookAt(0, ringY, 0);
        
        // Scale
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={[ringX, ringY, ringZ]}
      onClick={onClick}
    >
      <planeGeometry args={[0.8, 0.6]} />
      <meshStandardMaterial 
        color="#8b5cf6" 
        transparent 
        opacity={0.9}
        side={THREE.FrontSide}
      />
      <Html
        transform
        distanceFactor={1}
        position={[0, 0, 0.01]}
        style={{
          width: isCenter ? '400px' : '120px',
          height: isCenter ? '300px' : '90px',
          background: imageUrl ? 'transparent' : 'rgba(139, 92, 246, 0.2)',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '10px',
          textAlign: 'center',
          padding: '4px',
          cursor: 'pointer',
          pointerEvents: 'auto',
          backfaceVisibility: 'hidden',
        }}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={item.original_name} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              borderRadius: '8px' 
            }} 
          />
        ) : (
          <span>{item.original_name}</span>
        )}
      </Html>
    </mesh>
  );
}

interface ImmersiveViewProps {
  items: Item[];
  backgroundUrl?: string;
  onExitTo360?: () => void;
}

function CameraController({ shouldLockOn }: { shouldLockOn: boolean }) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsType>(null);

  useFrame(() => {
    if (shouldLockOn && controlsRef.current) {
      // Smoothly rotate camera to look straight ahead (center of view)
      const lookAtTarget = new THREE.Vector3(0, 0, 0);
      const cameraWorldPosition = new THREE.Vector3();
      camera.getWorldPosition(cameraWorldPosition);
      
      const cameraForward = new THREE.Vector3(0, 0, -1);
      cameraForward.applyQuaternion(camera.quaternion);
      lookAtTarget.copy(cameraWorldPosition).add(cameraForward.multiplyScalar(10));
      
      controlsRef.current.target.lerp(lookAtTarget, 0.05);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls 
      ref={controlsRef}
      enableZoom={true}
      enablePan={true}
      enableRotate={true}
      minDistance={1}
      maxDistance={100}
      target={[0, 0, 0]}
      minPolarAngle={Math.PI / 2 - 0.5}
      maxPolarAngle={Math.PI / 2 + 0.5}
    />
  );
}

export function ImmersiveView({ items, backgroundUrl, onExitTo360 }: ImmersiveViewProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  const selectedItem = items.find(item => item.id === selectedItemId) || null;

  return (
    <div className="fixed inset-0 w-screen h-screen z-0">
      {/* 3D Canvas */}
      <Canvas className="w-full h-full">
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        
        {/* Skybox */}
        <Skybox url={backgroundUrl} />

        {/* Orbital Ring of Items */}
        {items.map((item, index) => (
          <OrbitingThumbnail
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            isCenter={selectedItemId === item.id}
            onClick={() => handleItemClick(item.id)}
          />
        ))}
        
        {/* Camera Controls with Lock-On */}
        <CameraController shouldLockOn={!!selectedItemId} />
      </Canvas>

      {/* Exit Button */}
      {onExitTo360 && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="fixed top-6 left-6 z-20"
        >
          <button
            onClick={onExitTo360}
            className="px-6 py-3 rounded-xl border border-white/20 backdrop-blur-xl hover:bg-white/10 transition-all text-sm font-semibold text-white shadow-lg"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
            }}
          >
            ← Exit to Grid
          </button>
        </motion.div>
      )}

      {/* Holographic Card - Large centered display when item selected */}
      {selectedItem && (
        <>
          {/* Background overlay - click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItemId(null)}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 cursor-pointer"
          />
          
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              y: [0, -10, 0],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              scale: { duration: 0.3 },
              opacity: { duration: 0.3 },
              y: { 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40"
          >
            <div 
              className="relative rounded-2xl p-6 w-[400px] border border-white/20 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
              style={{
                backdropFilter: 'blur(20px)',
                background: 'rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedItemId(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
              >
                ✕
              </button>

              {selectedItem.mime_type?.startsWith('image/') ? (
                <img
                  src={`https://qdytxfauwfdjotnlcbuh.supabase.co/storage/v1/object/public/user_files/${(selectedItem as any).storage_path || selectedItem.file_url}`}
                  alt={selectedItem.original_name}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-4xl text-primary">{selectedItem.file_type}</span>
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{selectedItem.original_name}</h3>
              <p className="text-sm text-white/60 mb-4">{selectedItem.file_type}</p>
              
              {/* Initialize Smart Contract button with gold glow */}
              <button 
                className="w-full px-6 py-3 rounded-lg font-semibold text-black transition-all"
                style={{
                  background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 165, 0, 0.3)',
                }}
              >
                Initialize Smart Contract
              </button>
            </div>
          </motion.div>
        </>
      )}

      {/* Instructions */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-6 left-1/2 transform -translate-x-1/2 z-20 px-6 py-3 rounded-xl border border-white/20 backdrop-blur-xl shadow-lg"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
        }}
      >
        <p className="text-sm text-white/80">
          Click any floating item to bring it to center • Drag to rotate view
        </p>
      </motion.div>
    </div>
  );
}
