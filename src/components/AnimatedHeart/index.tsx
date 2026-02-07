'use client';

import { Canvas, } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { useState, useCallback } from 'react';
import AnimatedHeart from './AnimatedHeart';
import GroundRings from './ground-rings';
import FloatingHearts from './floating-hearts';

const floatingTexts = [
  "I Love You ❤️",
  "Forever",
  "Always",
  "My Heart",
  "Yêu Em",
  "Mãi Mãi",

];


type Props = {
  scale?: number;
  texts?: string[];
  heartColor?: string
  textColor?: string
  miniHeartColor?: string
};

// Component wrapper để quản lý state đồng bộ màu
function SceneContent({
  position,
  heartbeatSpeed,
  texts,
  heartColor,
  textColor,
  miniHeartColor
}: {
  position: [number, number, number];
  heartbeatSpeed: number;
  texts: string[];
  heartColor: string
  textColor: string
  miniHeartColor: string
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
        heartbeatSpeed={heartbeatSpeed}
        onColorChangeProgress={handleColorChangeProgress}
        onFlashProgress={handleFlashProgress}
        texts={texts}
        heartColor={heartColor}
        textColor={textColor}
      />
      {/* Ground với particles gồ ghề - đồng bộ màu với trái tim */}
      <GroundRings
        appearDuration={2.0}
        appearDelay={0.5}
        bumpiness={0.2}
        groundSize={25}
        groundY={-0.8}
        colorProgress={colorProgress}
        flashMultiplier={flashMultiplier}
      />
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
        miniHeartColor={miniHeartColor}
      />
    </>
  );
}

export default function AnimatedHeartScene({
  texts = floatingTexts,
  heartColor = "rgb(255, 5 , 5)",
  textColor = "rgba(255, 107, 156, 0.58)",
  miniHeartColor = "rgb(255, 112, 146)"
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
      }}
    >
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minDistance={0.5}
        maxDistance={10}
      />
      <SceneContent
        position={[0, 0, 0]}
        heartbeatSpeed={1.5}
        texts={texts.flatMap(text => Array(5).fill(text))}
        heartColor={heartColor}
        textColor={textColor}
        miniHeartColor={miniHeartColor}
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
