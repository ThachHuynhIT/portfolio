'use client';

import { Environment, Html, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Suspense, useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';

// Import các component của bạn
import BackgroundStars from './components/background-stars';
import ChristmasTree3D from './components/ChristmasTree3D';
import Fireworks from './components/fireworks';
import styles from './responsive.module.css';

// Component ChristmasText (giữ nguyên)
function ChristmasText() {
    const textPositionWithDevice = () => {
        if (typeof window === 'undefined') return [3, 3, 0];
        const width = window.innerWidth;
        if (width < 480) return [1.6, 1.3, 0];
        if (width < 768) return [2.1, 1.5, 0];
        if (width < 1024) return [3.1, 2, 0];
        return [3, 2, 0];
    }

    return (
        <Html position={textPositionWithDevice() as [number, number, number]} transform style={{ background: 'none', userSelect: 'none' }}>
            <div className={`pointer-events-none ${styles['christmas-text']}`} style={{ background: 'none' }}>
                <h1 className={`${styles['title']} text-lg font-bold text-cyan-300 drop-shadow-lg`}>Merry Christmas</h1>
                <p className={`${styles['subtitle']} text-base text-white drop-shadow-md`}>王雨琪 圣诞快乐</p>
                <p className={`${styles['message']} text-base text-white/80 drop-shadow-md`}>遇见你真的很开心</p>
            </div>
        </Html>
    );
}

// Component chỉ thực hiện một lần chuyển cảnh
interface CameraTransitionProps {
    controlsRef: React.RefObject<OrbitControlsType>;
}

function CameraTransition({ controlsRef }: CameraTransitionProps) {
    const { camera } = useThree();

    const animationState = useRef({
        isAnimating: false,
        startTime: 0,
    });

    const DURATION = 2.5; // Thời gian bay (giây)

    // Vị trí bắt đầu và kết thúc được định nghĩa sẵn
    const startPosition = new Vector3(0, 2, 12);
    const endPosition = new Vector3(5, 2, 7);
    const startTarget = new Vector3(0, 1, 0);
    const endTarget = new Vector3(1, 1, 0);

    // Kích hoạt animation sau 2 giây
    useEffect(() => {
        const timer = setTimeout(() => {
            animationState.current.isAnimating = true;
            animationState.current.startTime = performance.now();
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    useFrame(() => {
        if (!animationState.current.isAnimating) return;

        const controls = controlsRef.current;
        if (!controls) return;

        const elapsedTime = (performance.now() - animationState.current.startTime) / 1000;
        const progress = Math.min(elapsedTime / DURATION, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Hiệu ứng mượt

        // Nội suy vị trí và điểm nhìn
        const currentPosition = new Vector3().lerpVectors(startPosition, endPosition, easedProgress);
        const currentTarget = new Vector3().lerpVectors(startTarget, endTarget, easedProgress);

        camera.position.copy(currentPosition);
        controls.target.copy(currentTarget);
        controls.update();

        // Dừng lại khi hoàn thành
        if (progress >= 1) {
            animationState.current.isAnimating = false;
        }
    });

    return null;
}

// Component chính
export default function Index() {
    const controlsRef = useRef<OrbitControlsType>(null!);

    return (
        <div className={`relative bg-black ${styles['container-christmas-tree']}`}>
            <Canvas
                className={styles['canvas-christmas-tree']}
                // Camera bắt đầu ở vị trí (0, 2, 12)
                camera={{ position: [0, 2, 12], fov: 60 }}
                gl={{ antialias: true, alpha: true }}
            >
                <Suspense fallback={null}>
                    {/* Ánh sáng và Môi trường */}
                    <ambientLight intensity={0.3} />
                    <pointLight position={[0, 5, 0]} intensity={2} color="#00ffff" />
                    <pointLight position={[5, 3, 5]} intensity={1} color="#4a90e2" />
                    <Environment preset="night" />

                    {/* Các đối tượng 3D */}
                    <BackgroundStars />
                    <ChristmasTree3D />
                    <Fireworks />
                    <ChristmasText />

                    {/* Component chuyển cảnh */}
                    <CameraTransition controlsRef={controlsRef} />

                    <OrbitControls
                        ref={controlsRef}
                        enableZoom={true}
                        enablePan={false}
                        minDistance={6}
                        maxDistance={12}
                        maxPolarAngle={Math.PI / 2 + 0.3}
                        // Target ban đầu
                        target={[0, 1, 0]}
                    />

                    {/* Hiệu ứng */}
                    <EffectComposer>
                        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={2} />
                    </EffectComposer>
                </Suspense>
            </Canvas>
        </div>
    );
}
