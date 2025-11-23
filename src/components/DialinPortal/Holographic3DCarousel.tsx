import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

interface Album {
  id: string;
  name: string;
  thumbnail: string;
  mediaUrl?: string;
  isActive?: boolean;
}

interface Holographic3DCarouselProps {
  albums: Album[];
  currentIndex: number;
  onAlbumSelect: (index: number) => void;
  audioEnergy?: number; // 0-1 for audio reactivity
  bpm?: number;
}

function AlbumCover({ 
  position, 
  album, 
  isActive, 
  onClick,
  audioEnergy = 0 
}: { 
  position: [number, number, number];
  album: Album;
  isActive: boolean;
  onClick: () => void;
  audioEnergy?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(album.thumbnail);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Floating animation
    if (isActive) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.3;
    } else {
      meshRef.current.position.y = position[1];
    }

    // Audio reactive pulsing
    if (isActive && audioEnergy > 0) {
      const scale = 1 + audioEnergy * 0.3;
      meshRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group position={position}>
      {/* Album Cover */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial 
          map={texture} 
          emissive={isActive ? new THREE.Color(0x7633cc) : new THREE.Color(0x000000)}
          emissiveIntensity={isActive ? 0.3 + audioEnergy * 0.5 : 0}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Reflection on floor */}
      <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial 
          map={texture}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glow effect when active */}
      {isActive && (
        <pointLight 
          position={[0, 0, 1]} 
          intensity={1 + audioEnergy * 2} 
          distance={5}
          color="#7633cc"
        />
      )}

      {/* Label */}
      <Html position={[0, -1.5, 0]} center>
        <div className={`text-white text-sm font-medium transition-all ${
          isActive ? 'scale-110 text-primary' : 'opacity-70'
        }`}>
          {album.name}
        </div>
      </Html>
    </group>
  );
}

function CurvedCarousel({ 
  albums, 
  currentIndex, 
  onAlbumSelect,
  audioEnergy = 0 
}: { 
  albums: Album[];
  currentIndex: number;
  onAlbumSelect: (index: number) => void;
  audioEnergy?: number;
}) {
  const radius = 6;
  const angleStep = Math.PI / 4;

  return (
    <>
      {albums.map((album, index) => {
        const offset = index - currentIndex;
        const angle = offset * angleStep;
        const x = Math.sin(angle) * radius;
        const z = -Math.cos(angle) * radius;
        const y = Math.abs(offset) === 0 ? 2 : 0;

        return (
          <AlbumCover
            key={album.id}
            position={[x, y, z]}
            album={album}
            isActive={index === currentIndex}
            onClick={() => onAlbumSelect(index)}
            audioEnergy={index === currentIndex ? audioEnergy : 0}
          />
        );
      })}
    </>
  );
}

function Floor({ audioEnergy = 0 }: { audioEnergy?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Pulse with audio
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.1 + audioEnergy * 0.3;
    }
  });

  return (
    <mesh 
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -2, 0]} 
      receiveShadow
    >
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial 
        color="#0a0a0a"
        metalness={0.9}
        roughness={0.1}
        emissive="#7633cc"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

function AudioReactiveLights({ energy = 0, bpm = 120 }: { energy?: number; bpm?: number }) {
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const beat = Math.sin(state.clock.elapsedTime * (bpm / 60) * Math.PI * 2);
    const pulseIntensity = 1 + energy * 2 + Math.max(0, beat) * energy;

    if (light1Ref.current) {
      light1Ref.current.intensity = pulseIntensity;
    }
    if (light2Ref.current) {
      light2Ref.current.intensity = pulseIntensity * 0.5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight 
        ref={light1Ref}
        position={[5, 5, 5]} 
        color="#7633cc" 
        intensity={1}
        castShadow
      />
      <pointLight 
        ref={light2Ref}
        position={[-5, 3, -5]} 
        color="#ff6b6b" 
        intensity={0.5}
      />
      <directionalLight 
        position={[0, 10, 0]} 
        intensity={0.5} 
        castShadow
      />
    </>
  );
}

export function Holographic3DCarousel({ 
  albums, 
  currentIndex, 
  onAlbumSelect,
  audioEnergy = 0,
  bpm = 120
}: Holographic3DCarouselProps) {
  return (
    <div className="w-full h-[400px] relative">
      <Canvas shadows gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={50} />
        
        <AudioReactiveLights energy={audioEnergy} bpm={bpm} />
        <Floor audioEnergy={audioEnergy} />
        
        <CurvedCarousel 
          albums={albums}
          currentIndex={currentIndex}
          onAlbumSelect={onAlbumSelect}
          audioEnergy={audioEnergy}
        />
      </Canvas>

      {/* Navigation hints */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-card px-4 py-2 rounded-full border border-border/30">
        <p className="text-xs text-muted-foreground">
          Click albums to select • Scroll to navigate
        </p>
      </div>
    </div>
  );
}
