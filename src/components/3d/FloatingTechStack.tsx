"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Float } from "@react-three/drei";
import * as THREE from "three";
import { skills } from "@/lib/constants";

interface FloatingSkillProps {
  name: string;
  icon: string;
  position: [number, number, number];
  color: string;
}

function FloatingSkill({ name, icon, position, color }: FloatingSkillProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.lookAt(state.camera.position);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} position={position}>
        <mesh>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshStandardMaterial
            color={color}
            metalness={0.8}
            roughness={0.2}
            transparent
            opacity={0.8}
          />
        </mesh>
        {/* Using Html instead of Text to avoid troika-three-text compatibility issues */}
        <Html
          position={[0, 0, 0.45]}
          center
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <span className="text-2xl select-none">{icon}</span>
        </Html>
        <Html
          position={[0, -0.6, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <span className="text-xs text-zinc-400 whitespace-nowrap select-none">
            {name}
          </span>
        </Html>
      </group>
    </Float>
  );
}

/**
 * Interactive 3D floating tech stack visualization
 */
export default function FloatingTechStack() {
  const skillPositions = useMemo(() => {
    const positions: { skill: typeof skills[0]; position: [number, number, number]; color: string }[] = [];
    const colors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

    skills.forEach((skill, index) => {
      const angle = (index / skills.length) * Math.PI * 2;
      const radius = 3 + Math.random() * 1.5;
      const y = (Math.random() - 0.5) * 3;

      positions.push({
        skill,
        position: [
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius,
        ],
        color: colors[index % colors.length],
      });
    });

    return positions;
  }, []);

  return (
    <group>
      {/* Central light source */}
      <pointLight position={[0, 0, 0]} intensity={1} color="#8b5cf6" distance={10} />

      {skillPositions.map(({ skill, position, color }) => (
        <FloatingSkill
          key={skill.name}
          name={skill.name}
          icon={skill.icon}
          position={position}
          color={color}
        />
      ))}
    </group>
  );
}
