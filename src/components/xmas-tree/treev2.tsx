'use client';

// import { RgbColor } from '@/components/color-picker';
import { Environment, Html, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import BackgroundStars from './components/background-stars';
import DoubleSpiralTree3D from './components/DoubleSpiralTree';
import styles from './responsive.module.css';
import { ChristmasText } from './components/ChistmasText';

interface CameraTransitionProps {
    controlsRef: React.RefObject<OrbitControlsType>;
    run: boolean;
}
const startPosition = new Vector3(8, 1, 10);

function CameraTransition({ controlsRef, run }: CameraTransitionProps) {
    const { camera } = useThree();
    const animationState = useRef({
        isAnimating: false,
        startTime: 0,
    });

    const DURATION = 2.8;

    const startTarget = new Vector3(0, 1.8, 0);
    // chỉnh end để vị trí
    let endPosition = new Vector3(5, 3, 7);
    let endTarget = new Vector3(0.2, 1.6, 0);

    const width = window?.innerWidth ?? 0;
    if (width < 480) {
        endPosition = new Vector3(6, 2.5, 11);
        endTarget = new Vector3(1.2, 1.8, -0.1);
    }

    useEffect(() => {
        if (run) {
            animationState.current.isAnimating = true;
            animationState.current.startTime = performance.now();
        }
    }, [run]);

    useFrame(() => {
        if (!animationState.current.isAnimating) return;
        const controls = controlsRef.current;
        if (!controls) return;

        const elapsedTime = (performance.now() - animationState.current.startTime) / 1000;
        const progress = Math.min(elapsedTime / DURATION, 1);
        const eased = progress;

        const currentPos = new Vector3().lerpVectors(startPosition, endPosition, eased);
        const currentTarget = new Vector3().lerpVectors(startTarget, endTarget, eased);

        camera.position.copy(currentPos);
        controls.target.copy(currentTarget);
        controls.update();

        if (progress >= 1) animationState.current.isAnimating = false;
    });

    return null;
}


export default function DoubleSpiralIndex() {
    const controlsRef = useRef<OrbitControlsType>(null!);

    const [showText, setShowText] = useState(false);
    const [runTransition, setRunTransition] = useState(false);
    const [messages, setMessages] = useState<string[]>([]);
    const [title, setTitle] = useState<string>('');
    const [textColor, setTextColor] = useState<any>({ r: 0, g: 255, b: 255 });
    const [treeColor, setTreeColor] = useState<any>({ r: 30, g: 144, b: 255 });
    const [music, setMusic] = useState<string>('');
    const [imageUrl, setImageUrl] = useState<string>('');

    // Thời gian xuất hiện mặc định của DoubleSpiralTree3D là 2.2 giây (2200ms)
    const TREE_APPEAR_DURATION_MS = 2200;
    // Độ trễ nhỏ để đảm bảo cây đã hoàn tất (ví dụ: 300ms)
    // const BUFFER_MS = 300;

    // useEffect(() => {
    //     // BẮT ĐẦU CHUYỂN ĐỘNG CAMERA CÙNG LÚC VỚI ANIMATION CỦA CÂY
    //     setRunTransition(true);

    //     // Hiển thị chữ sau khi cây hoàn thành animation xuất hiện + thời gian đệm
    //     const t = setTimeout(() => {
    //         setShowText(true);
    //     }, TREE_APPEAR_DURATION_MS + BUFFER_MS);

    //     return () => clearTimeout(t);
    // }, []);
    // CameraTransition duration (phù hợp với DURATION trong CameraTransition component)
    const CAMERA_TRANSITION_MS = 3000;

    useEffect(() => {
        // BẮT ĐẦU CHUYỂN ĐỘNG CAMERA CÙNG LÚC VỚI ANIMATION CỦA CÂY
        const totalMs = TREE_APPEAR_DURATION_MS + CAMERA_TRANSITION_MS + 450;
        const t = window.setTimeout(() => {
            setShowText(true);
        }, totalMs);

        setTimeout(() => {
            setRunTransition(true);
        }, CAMERA_TRANSITION_MS);

        return () => window.clearTimeout(t);
    }, []);

    return (
        <div className={`relative bg-black ${styles['container-christmas-tree']}`}>
            <Canvas
                className={styles['canvas-christmas-tree']}
                camera={{ position: startPosition, fov: 50 }}
                gl={{ antialias: true, alpha: true }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.3} />
                    <pointLight position={[0, 5, 0]} intensity={2} color="#00ffff" />
                    <pointLight position={[5, 3, 5]} intensity={1} color="#4a90e2" />
                    <Environment preset="night" />
                    <BackgroundStars />

                    <DoubleSpiralTree3D colorHex="#fff" appearDuration={TREE_APPEAR_DURATION_MS / 1000} showStreaks={false} />

                    <ChristmasText
                        titleColor={textColor}
                        title={'Merry Christmas'}
                        messages={['Wishing you a very Merry Christmas.', 'Peace, joy, and happiness this Christmas.', 'Have a jolly holiday!']}
                        visible={showText}
                        imageUrl={'https://i.pinimg.com/1200x/c1/64/ff/c164ffa6a218309936c1872a44c14fc0.jpg'}
                        messageDelayMs={1700}
                        fadeMs={300}
                    />
                    <OrbitControls
                        ref={controlsRef}
                        enableZoom={true}
                        enablePan={false}
                        minDistance={6}
                        maxDistance={12}
                        maxPolarAngle={Math.PI / 2 + 0.3}
                        // Target ban đầu được đặt tại startTarget của CameraTransition (0, 1.6, 0)
                        target={[0, 1.8, 0]}
                    />
                    <EffectComposer>
                        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={1} />
                    </EffectComposer>

                    {/* KÍCH HOẠT HIỆU ỨNG ZOOM-IN CỦA CAMERA */}
                    <CameraTransition controlsRef={controlsRef} run={runTransition} />
                </Suspense>
            </Canvas>
        </div>
    );
}
