import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { motion } from 'framer-motion';
import { File, Image, Video, Music, FileText } from 'lucide-react';
import type { Item } from '@/hooks/useItems';

interface ImmersiveViewProps {
  items: Item[];
  backgroundUrl?: string;
}

function FloatingIcon({ item, position }: { item: Item; position: [number, number, number] }) {
  const getIcon = () => {
    if (!item.mime_type) return 'file';
    if (item.mime_type.startsWith('image/')) return 'image';
    if (item.mime_type.startsWith('video/')) return 'video';
    if (item.mime_type.startsWith('audio/')) return 'music';
    if (item.mime_type.includes('text') || item.mime_type.includes('pdf')) return 'text';
    return 'file';
  };

  const iconType = getIcon();
  const iconMap = {
    file: '📄',
    image: '🖼️',
    video: '🎬',
    music: '🎵',
    text: '📝'
  };

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial 
        color="#8b5cf6" 
        emissive="#8b5cf6" 
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

function Skybox({ url }: { url?: string }) {
  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial 
        color="#0f0520"
        side={2} // THREE.BackSide
        toneMapped={false}
      />
      {/* Gradient overlay for depth */}
      <mesh>
        <sphereGeometry args={[499, 60, 40]} />
        <meshBasicMaterial 
          color="#1a0b2e"
          side={2}
          transparent
          opacity={0.5}
          toneMapped={false}
        />
      </mesh>
    </mesh>
  );
}

export function ImmersiveView({ items, backgroundUrl }: ImmersiveViewProps) {
  // Arrange items in a circle around the viewer
  const positions: [number, number, number][] = items.map((_, index) => {
    const angle = (index / items.length) * Math.PI * 2;
    const radius = 5;
    return [
      Math.cos(angle) * radius,
      Math.sin(index * 0.5) * 2, // Vary height
      Math.sin(angle) * radius
    ];
  });

  return (
    <div className="fixed inset-0 w-screen h-screen z-0">
      {/* 3D Canvas */}
      <Canvas className="w-full h-full">
        <PerspectiveCamera makeDefault position={[0, 0, 0]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        
        {/* Skybox */}
        <Skybox url={backgroundUrl} />
        
        {/* Floating Items */}
        {items.map((item, index) => (
          <FloatingIcon 
            key={item.id} 
            item={item} 
            position={positions[index]} 
          />
        ))}
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={100}
        />
      </Canvas>

      {/* Bottom Dock - Mac OS Style */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 glass-card px-4 py-3 rounded-2xl border border-border/30 bg-background/60 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex gap-3 items-center">
          {items.slice(0, 10).map((item) => {
            const getIcon = () => {
              if (!item.mime_type) return <File className="w-5 h-5" />;
              if (item.mime_type.startsWith('image/')) return <Image className="w-5 h-5" />;
              if (item.mime_type.startsWith('video/')) return <Video className="w-5 h-5" />;
              if (item.mime_type.startsWith('audio/')) return <Music className="w-5 h-5" />;
              if (item.mime_type.includes('text') || item.mime_type.includes('pdf')) return <FileText className="w-5 h-5" />;
              return <File className="w-5 h-5" />;
            };

            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.2, y: -8 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="p-3 glass rounded-xl border border-primary/40 text-primary hover:border-primary/70 hover:bg-primary/10 transition-all shadow-lg hover:shadow-primary/20"
                title={item.original_name}
              >
                {getIcon()}
              </motion.button>
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
