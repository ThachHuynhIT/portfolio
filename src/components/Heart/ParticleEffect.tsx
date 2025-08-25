import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleEffectProps {
  count?: number;
  size?: number;
  color?: string;
  speed?: number;
}

const ParticleEffect = ({ count = 1500, size = 0.05, color = "white", speed = 1 }: ParticleEffectProps) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Tạo danh sách hạt bụi ngẫu nhiên
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 50; // X (-25 -> 25)
      positions[i3 + 1] = (Math.random() - 0.5) * 100; // Y (-50 -> 50)
      positions[i3 + 2] = (Math.random() - 0.5) * 50; // Z (-25 -> 25)

      speeds[i3] = (Math.random() - 0.5) * 0.1 * speed; // Tốc độ zigzag X
      speeds[i3 + 1] = (0.02 + Math.random() * 0.05) * speed; // Tốc độ bay lên Y
      speeds[i3 + 2] = (Math.random() - 0.5) * 0.1 * speed; // Tốc độ zigzag Z
    }

    return { positions, speeds };
  }, [count, speed]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const speeds = pointsRef.current.geometry.attributes.speed.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        // Kiểm tra xem speeds hoặc positions có NaN không trước khi cập nhật
        if (
          !isFinite(positions[i]) ||
          !isFinite(positions[i + 1]) ||
          !isFinite(positions[i + 2]) ||
          !isFinite(speeds[i]) ||
          !isFinite(speeds[i + 1]) ||
          !isFinite(speeds[i + 2])
        ) {
          positions[i] = (Math.random() - 0.5) * 50;
          positions[i + 1] = -25;
          positions[i + 2] = (Math.random() - 0.5) * 50;

          speeds[i] = (Math.random() - 0.5) * 2 * speed;
          speeds[i + 1] = Math.random() * 2 * speed;
          speeds[i + 2] = (Math.random() - 0.5) * 2 * speed;
        }

        // Cập nhật vị trí hạt bụi bay
        positions[i] += speeds[i] * delta * 80; // Zigzag theo X
        positions[i + 1] += speeds[i + 1] * delta * 20; // Bay lên theo Y
        positions[i + 2] += speeds[i + 2] * delta * 80; // Zigzag theo Z

        // Nếu hạt bay lên quá cao, reset lại vị trí
        if (positions[i + 1] > 25) {
          positions[i + 1] = -25;
          positions[i] = (Math.random() - 0.5) * 50;
          positions[i + 2] = (Math.random() - 0.5) * 50;
        }
      }

      // Đánh dấu cần update lại vị trí
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} position={[0, 0, -1]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
        <bufferAttribute attach="attributes-speed" args={[particles.speeds, 3]} />
      </bufferGeometry>
      <pointsMaterial size={size} color={color} />
    </points>
  );
};

export default ParticleEffect;
