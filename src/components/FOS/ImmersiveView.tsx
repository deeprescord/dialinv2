import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
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

function Floating3DCard({ item, position }: { item: Item; position: [number, number, number] }) {
  const storagePath = (item as any).storage_path || item.file_url;
  const imageUrl = item.mime_type?.startsWith('image/') 
    ? `https://qdytxfauwfdjotnlcbuh.supabase.co/storage/v1/object/public/user_files/${storagePath}`
    : null;

  return (
    <mesh position={position}>
      <boxGeometry args={[2, 1.5, 0.1]} />
      <meshStandardMaterial color="#8b5cf6" transparent opacity={0.9} />
      <Html
        transform
        distanceFactor={1.5}
        position={[0, 0, 0.06]}
        style={{
          width: '200px',
          height: '150px',
          background: imageUrl ? 'transparent' : 'rgba(139, 92, 246, 0.2)',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          textAlign: 'center',
          padding: '8px'
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={item.original_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
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

export function ImmersiveView({ items, backgroundUrl, onExitTo360 }: ImmersiveViewProps) {
  const [floating3DItems, setFloating3DItems] = useState<Floating3DItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleDragStart = (item: Item) => {
    setDraggedItem(item);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem) {
      // Spawn a new 3D card at a random position
      const randomPosition: [number, number, number] = [
        (Math.random() - 0.5) * 8,
        Math.random() * 4 - 1,
        (Math.random() - 0.5) * 8
      ];
      
      setFloating3DItems(prev => [...prev, {
        id: `${draggedItem.id}-${Date.now()}`,
        item: draggedItem,
        position: randomPosition
      }]);
      
      setDraggedItem(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDockClick = (item: Item) => {
    setSelectedItem(item);
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen z-0"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* 3D Canvas */}
      <Canvas className="w-full h-full">
        <PerspectiveCamera makeDefault position={[0, 0, 5]} rotation={[0, 0, 0]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        
        {/* Skybox */}
        <Skybox url={backgroundUrl} />

        {/* Floating 3D Cards */}
        {floating3DItems.map((floatingItem) => (
          <Floating3DCard
            key={floatingItem.id}
            item={floatingItem.item}
            position={floatingItem.position}
          />
        ))}
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={100}
          target={[0, 0, 0]}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />
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
            className="glass-card px-4 py-2 rounded-lg border border-border/30 bg-background/60 backdrop-blur-xl hover:bg-background/80 transition-all text-sm font-medium text-foreground hover:border-primary/50"
          >
            ← Back to Grid
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
            onClick={() => setSelectedItem(null)}
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
                onClick={() => setSelectedItem(null)}
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

      {/* Bottom Dock - Mac OS Style */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 glass-card px-4 py-3 rounded-2xl border border-border/30 bg-background/60 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex gap-3 items-center">
          {items.slice(0, 10).map((item) => {
            const storagePath = (item as any).storage_path || item.file_url;
            const imageUrl = item.mime_type?.startsWith('image/') 
              ? `https://qdytxfauwfdjotnlcbuh.supabase.co/storage/v1/object/public/user_files/${storagePath}`
              : null;
            console.log('🎯 Dock image URL:', imageUrl);

            return (
              <motion.div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item)}
                onClick={() => handleDockClick(item)}
                whileHover={{ scale: 1.2, y: -8 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="w-14 h-14 glass rounded-xl border border-primary/40 hover:border-primary/70 hover:bg-primary/10 transition-all shadow-lg hover:shadow-primary/20 overflow-hidden cursor-pointer"
                title={item.original_name}
              >
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={item.original_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary text-xs">
                    {item.file_type}
                  </div>
                )}
              </motion.div>
            );
          })}
          {items.length > 10 && (
            <div className="text-xs text-muted-foreground pl-2">
              +{items.length - 10}
            </div>
          )}
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-6 left-1/2 transform -translate-x-1/2 z-20 glass-card px-4 py-2 rounded-lg border border-border/20 bg-background/60 backdrop-blur-xl"
      >
        <p className="text-xs text-muted-foreground">
          Click and drag to look around • Scroll to zoom
        </p>
      </motion.div>
    </div>
  );
}
