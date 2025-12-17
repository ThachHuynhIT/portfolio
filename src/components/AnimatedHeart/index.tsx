'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { useRef, useState, useCallback } from 'react';
import AnimatedHeart from './AnimatedHeart';
import GroundRings from './ground-rings';
import FloatingHearts from './floating-hearts';

type Props = {
  position?: [number, number, number];
  scale?: number;
  riseDuration?: number;
  morphDuration?: number;
  colorChangeDuration?: number;
  heartbeatSpeed?: number;
  enableControls?: boolean;
  backgroundColor?: string;
  showGround?: boolean;
};

// Component wrapper để quản lý state đồng bộ màu
function SceneContent({
  position,
  scale,
  heartbeatSpeed,
  showGround,

}: {
  position: [number, number, number];
  scale: number;
  heartbeatSpeed: number;
  showGround: boolean;
}) {
  const [colorProgress, setColorProgress] = useState(0);
  const [flashMultiplier, setFlashMultiplier] = useState(1);

  const handleColorChangeProgress = useCallback((progress: number) => {
    setColorProgress(progress);
  }, []);

  const handleFlashProgress = useCallback((multiplier: number) => {
    setFlashMultiplier(multiplier);
  }, []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <AnimatedHeart
        position={position}
        scale={scale}
        heartbeatSpeed={heartbeatSpeed}
        onColorChangeProgress={handleColorChangeProgress}
        onFlashProgress={handleFlashProgress}
      />

      {/* Ground với particles gồ ghề - đồng bộ màu với trái tim */}
      {showGround && (
        <GroundRings
          appearDuration={2.0}
          appearDelay={0.5}
          bumpiness={0.2}
          groundSize={25}
          groundY={-0.8}
          colorProgress={colorProgress}
          flashMultiplier={flashMultiplier}
          initialColor="#ffb333"
          targetColor="#ff1a1a"
        />
      )}

      {/* Trái tim 2D bay lên - nhiều hơn, mờ hơn, phát sáng hơn */}
      <FloatingHearts
        count={80}
        spawnRadius={8}
        riseSpeed={0.4}
        maxHeight={4}
        startHeight={-0.8}
        appearDelay={1}
        opacity={0.7}
        glowMultiplier={3.5}
        colorProgress={colorProgress}
        flashMultiplier={flashMultiplier}
      />

    </>
  );
}

export default function AnimatedHeartScene({
  position = [0, 0, 0],
  scale = 0.44,
  riseDuration = 2.5,
  morphDuration = 2.0,
  colorChangeDuration = 1.0,
  heartbeatSpeed = 1.5,
  enableControls = true,
  backgroundColor = '#000000',
  showGround = true,
}: Props) {
  return (
    <Canvas
      camera={{
        position: [0, 0, 4],
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      style={{
        width: '100%',
        height: '100vh',
        background: backgroundColor,
      }}
    >
      <color attach="background" args={[backgroundColor]} />

      {enableControls && (
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={0.5}
          maxDistance={10}
        />
      )}

      <SceneContent
        position={position}
        scale={scale}
        heartbeatSpeed={heartbeatSpeed}
        showGround={showGround}
      />

      <EffectComposer>
        <Bloom
          intensity={4.0}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          mipmapBlur={true}
          radius={0.8}
        />
      </EffectComposer>

      <Environment preset="night" />
    </Canvas>
  );
}
