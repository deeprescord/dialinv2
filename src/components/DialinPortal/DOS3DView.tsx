import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

interface DOS3DViewProps {
  children: React.ReactNode;
  isCompact?: boolean;
}

function ContentPlane({ children }: { children: React.ReactNode }) {
  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[10, 6]} />
      <meshStandardMaterial 
        color="#1a1a2e" 
        transparent 
        opacity={0.1}
        side={THREE.DoubleSide}
      />
      <Html
        transform
        distanceFactor={5}
        position={[0, 0, 0.1]}
        style={{
          width: '800px',
          height: '480px',
          pointerEvents: 'auto',
        }}
      >
        <div className="w-full h-full">
          {children}
        </div>
      </Html>
    </mesh>
  );
}

function GridFloor() {
  return (
    <gridHelper args={[20, 20, '#444444', '#222222']} position={[0, -3, 0]} />
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#4f46e5" />
    </>
  );
}

export function DOS3DView({ children, isCompact }: DOS3DViewProps) {
  return (
    <div className={`w-full ${isCompact ? 'h-[50vh]' : 'h-[65vh]'} rounded-2xl overflow-hidden glass-card border border-border/30`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ 
          antialias: true,
          alpha: true,
        }}
      >
        <Suspense fallback={null}>
          <Lights />
          <GridFloor />
          <ContentPlane>
            {children}
          </ContentPlane>
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={15}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
          />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-4 left-4 glass-card px-3 py-1.5 rounded-lg border border-border/30">
        <p className="text-xs text-muted-foreground">
          Click and drag to rotate • Scroll to zoom
        </p>
      </div>
    </div>
  );
}
