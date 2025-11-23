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
  audioEnergy = 0,
  rotationY = 0,
  scale = 1
}: { 
  position: [number, number, number];
  album: Album;
  isActive: boolean;
  onClick: () => void;
  audioEnergy?: number;
  rotationY?: number;
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const texture = useTexture(album.thumbnail);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return;
    
    // Levitating animation for active album
    if (isActive) {
      const floatY = Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
      groupRef.current.position.y = position[1] + floatY;
    } else {
      groupRef.current.position.y = position[1];
    }

    // Audio reactive pulsing
    if (isActive && audioEnergy > 0) {
      const pulseScale = 1 + audioEnergy * 0.2;
      meshRef.current.scale.set(pulseScale, pulseScale, 1);
    } else {
      meshRef.current.scale.set(1, 1, 1);
    }

    // Hover glow animation
    if (hovered && !isActive) {
      const glowIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glowIntensity;
    }
  });

  // Calculate glow color based on hover/active state
  const glowColor = isActive 
    ? new THREE.Color(0x7633cc) // purple for active
    : hovered 
      ? new THREE.Color(0x00bcd4) // cyan for hover
      : new THREE.Color(0x000000);

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* Album Cover */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <planeGeometry args={[2.5, 2.5]} />
        <meshStandardMaterial 
          map={texture} 
          emissive={glowColor}
          emissiveIntensity={isActive ? 0.5 + audioEnergy * 0.5 : hovered ? 0.3 : 0}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Reflection on floor - CSS-style reflection effect */}
      <mesh position={[0, -3, 0]} rotation={[0, 0, Math.PI]} scale={[1, -1, 1]}>
        <planeGeometry args={[2.5, 2.5]} />
        <meshStandardMaterial 
          map={texture}
          transparent
          opacity={0.2}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Glow rim light when active or hovered */}
      {(isActive || hovered) && (
        <>
          <pointLight 
            position={[0, 0, 1.5]} 
            intensity={isActive ? 2 + audioEnergy * 3 : 1} 
            distance={6}
            color={isActive ? "#7633cc" : "#00bcd4"}
          />
          <pointLight 
            position={[0, 0, -1]} 
            intensity={isActive ? 1 + audioEnergy : 0.5} 
            distance={4}
            color={isActive ? "#ffd700" : "#00bcd4"}
          />
        </>
      )}

      {/* Label */}
      <Html position={[0, -1.8, 0]} center>
        <div 
          className={`text-white text-sm font-medium transition-all duration-300 ${
            isActive ? 'scale-125 text-primary drop-shadow-[0_0_8px_rgba(118,51,204,0.8)]' : 'opacity-70'
          } ${hovered && !isActive ? 'scale-110 text-cyan-400' : ''}`}
          style={{
            textShadow: isActive ? '0 0 10px rgba(118,51,204,0.8)' : hovered ? '0 0 8px rgba(0,188,212,0.6)' : 'none'
          }}
        >
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
  const radius = 7;
  const angleStep = Math.PI / 5; // Tighter spacing for coverflow

  return (
    <>
      {albums.map((album, index) => {
        const offset = index - currentIndex;
        const angle = offset * angleStep;
        
        // Coverflow geometry: center is flat, sides rotate and scale
        const x = Math.sin(angle) * radius;
        const z = -Math.cos(angle) * radius + radius; // Push forward
        const y = Math.abs(offset) === 0 ? 1.5 : 0;
        
        // Rotation: center is 0deg, sides rotate Y-axis
        const rotationY = offset === 0 ? 0 : angle * 0.8; // 45deg effect
        
        // Scale: center is 1, sides are 0.8
        const scale = offset === 0 ? 1 : 0.75;

        return (
          <AlbumCover
            key={album.id}
            position={[x, y, z]}
            album={album}
            isActive={index === currentIndex}
            onClick={() => onAlbumSelect(index)}
            audioEnergy={index === currentIndex ? audioEnergy : 0}
            rotationY={rotationY}
            scale={scale}
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
    <div className="w-full h-[500px] relative">
      <Canvas 
        shadows 
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 2, 8], fov: 60 }}
      >
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
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 backdrop-blur-md bg-background/10 px-6 py-2 rounded-full border border-white/10">
        <p className="text-xs text-muted-foreground">
          Click albums to select • Hover for glow
        </p>
      </div>
    </div>
  );
}
