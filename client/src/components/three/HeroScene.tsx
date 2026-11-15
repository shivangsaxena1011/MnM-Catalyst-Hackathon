import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Individual Pill Capsule component built purely from procedural geometries
function FloatingCapsule({ position, rotation, speed, color }: {
  position: [number, number, number];
  rotation: [number, number, number];
  speed: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += 0.005 * speed;
    meshRef.current.rotation.y += 0.008 * speed;
  });

  return (
    <Float speed={speed * 1.5} rotationIntensity={0.8} floatIntensity={1.2}>
      <group ref={meshRef} position={position} rotation={rotation} scale={0.48}>
        {/* Top Half of Capsule */}
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.5, 32]} />
          <meshStandardMaterial
            color={color}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.32, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial
            color={color}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>

        {/* Bottom Half of Capsule (Crisp White / Ivory) */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.5, 32]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.15}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0, -0.3, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.32, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.15}
            metalness={0.05}
          />
        </mesh>

        {/* Center Pill Seam Line */}
        <mesh position={[0, 0.2, 0]}>
          <torusGeometry args={[0.323, 0.015, 16, 32]} />
          <meshBasicMaterial color="#E2E8F0" />
        </mesh>
      </group>
    </Float>
  );
}

// Glowing pulsing Heart Orb
function HeartOrb() {
  const orbRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!orbRef.current) return;
    const t = state.clock.getElapsedTime();
    // 60 bpm rhythmic heartbeat pulse: sin curve with double beat
    const beat = 1 + 0.07 * Math.sin(t * 3.5) * Math.sin(t * 3.5 + 0.6);
    orbRef.current.scale.set(beat, beat, beat);
  });

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh ref={orbRef} scale={1.15}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color="#FB7185"
          emissive="#F43F5E"
          emissiveIntensity={0.35}
          roughness={0.2}
          metalness={0.25}
          distort={0.28}
          speed={2.2}
        />
      </mesh>
    </Float>
  );
}

// Parallax Controller that smoothly responds to pointer
function SceneRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    // Gentle tilt on mouse move
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      (state.pointer.x * Math.PI) / 12,
      0.05
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      (-state.pointer.y * Math.PI) / 14,
      0.05
    );
  });

  return <group ref={group}>{children}</group>;
}

export const HeroScene: React.FC = () => {
  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  if (prefersReducedMotion) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="w-72 h-72 rounded-full signature-gradient opacity-90 blur-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full h-[420px] sm:h-[480px] lg:h-[540px] relative pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 46 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 8, 5]} intensity={1.4} color="#FFF8F1" />
        <directionalLight position={[-6, -4, -2]} intensity={0.6} color="#CCFBF1" />
        <pointLight position={[0, 0, 2]} intensity={1.8} color="#FDA4AF" distance={5} />

        <SceneRig>
          {/* Central Heart Orb */}
          <HeartOrb />

          {/* Orbiting Two-Tone Medication Capsules */}
          <FloatingCapsule position={[-1.8, 1.3, 0.4]} rotation={[0.4, 0.6, 0.8]} speed={1.1} color="#0D9488" />
          <FloatingCapsule position={[1.9, 1.1, -0.2]} rotation={[-0.5, 0.8, -0.4]} speed={1.3} color="#FB7185" />
          <FloatingCapsule position={[-1.7, -1.2, 0.6]} rotation={[0.9, -0.3, 0.5]} speed={0.9} color="#FDBA74" />
          <FloatingCapsule position={[1.8, -1.3, 0.3]} rotation={[-0.8, -0.6, 0.2]} speed={1.2} color="#14B8A6" />
          <FloatingCapsule position={[0, 2.1, -0.5]} rotation={[0.2, 1.2, 0.4]} speed={1.0} color="#F43F5E" />
          <FloatingCapsule position={[0, -2.1, 0.2]} rotation={[-0.4, -0.9, 0.7]} speed={1.1} color="#0F766E" />

          {/* Gentle depth particles */}
          <Sparkles count={38} scale={6} size={2.4} speed={0.4} opacity={0.6} color="#FDBA74" />
          <Sparkles count={25} scale={5} size={2} speed={0.3} opacity={0.5} color="#14B8A6" />
        </SceneRig>
      </Canvas>
    </div>
  );
};

export default HeroScene;
