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
// import { decrypt } from '@/hooks/OpenSSLDecryptionService';
import ChristmasText from './components/ChistmasText';

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

interface EncryptProps {
    encryptedData: string;
}

interface TreeProp {
    id: string;
    messages: string[],
    title: string,
    textColor: any,
    treeColor: any,
    music: string,
    finalImage: string,
}

// Helper function to get safe area insets
const getSafeAreaInset = (side: 'top' | 'bottom' | 'left' | 'right'): number => {
    if (typeof window === 'undefined') return 0;

    const style = getComputedStyle(document.documentElement);
    const inset = style.getPropertyValue(`env(safe-area-inset-${side})`);

    if (!inset) return 0;

    // Parse the value (e.g., "44px" -> 44)
    const value = parseFloat(inset);
    return isNaN(value) ? 0 : value;
};

export default function Index({ encryptedData }: EncryptProps) {
    const controlsRef = useRef<OrbitControlsType>(null!);
    const containerRef = useRef<HTMLDivElement>(null!);
    const safeAreaInsetsRef = useRef({ top: 0, bottom: 0, left: 0, right: 0 });

    const [showText, setShowText] = useState(false);
    const [runTransition, setRunTransition] = useState(false);
    const [messages, setMessages] = useState<string[]>(["Merry Christmas!", "Wishing you joy and happiness.", "May your holidays be bright!"]);
    const [title, setTitle] = useState<string>('Chuc Mung Giang Sinh');
    const [textColor, setTextColor] = useState<any>({ r: 0, g: 255, b: 255 });
    const [treeColor, setTreeColor] = useState<any>({ r: 30, g: 144, b: 255 });
    const [music, setMusic] = useState<string>('');
    const [imageUrl, setImageUrl] = useState<string>('');
    const audioRef = useRef(null);

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

    useEffect(() => {
        // Update safe area insets
        const updateSafeArea = () => {
            const safeTop = getSafeAreaInset('top');
            const safeBottom = getSafeAreaInset('bottom');
            const safeLeft = getSafeAreaInset('left');
            const safeRight = getSafeAreaInset('right');

            safeAreaInsetsRef.current = {
                top: safeTop,
                bottom: safeBottom,
                left: safeLeft,
                right: safeRight
            };

            // Update container style directly
            if (containerRef.current) {
                const container = containerRef.current;
                container.style.top = `${-safeTop}px`;
                container.style.left = `${-safeLeft}px`;
                container.style.right = `${-safeRight}px`;
                container.style.bottom = `${-safeBottom}px`;
                container.style.width = `calc(100vw + ${safeLeft + safeRight}px)`;
                container.style.height = `calc(100vh + ${safeTop + safeBottom}px)`;
            }
        };

        updateSafeArea();
        window.addEventListener('resize', updateSafeArea);

        return () => window.removeEventListener('resize', updateSafeArea);
    }, []);

    // useEffect(() => {
    //     if (music) {
    //         const audio = audioRef.current;

    //         if (audio) {
    //             const playAudio = () => {
    //                 if (audio.paused) {
    //                     audio.play().then(() => {
    //                         audio.muted = false;
    //                     }).catch((err) => {
    //                         // console.log("❌ Autoplay bị chặn:", err);
    //                     });
    //                 }
    //             };

    //             playAudio();

    //             const onUserInteraction = () => {
    //                 playAudio();
    //                 document.removeEventListener("click", onUserInteraction);
    //             };
    //             document.addEventListener("click", onUserInteraction);

    //             const handleZoom = () => playAudio();
    //             window.addEventListener("wheel", handleZoom);

    //             const handleDrag = () => playAudio();
    //             window.addEventListener("mousedown", handleDrag);
    //             window.addEventListener("mousemove", handleDrag);
    //             window.addEventListener("touchstart", handleDrag);

    //             return () => {
    //                 document.removeEventListener("click", onUserInteraction);
    //                 window.removeEventListener("wheel", handleZoom);
    //                 window.removeEventListener("mousedown", handleDrag);
    //                 window.removeEventListener("mousemove", handleDrag);
    //                 window.removeEventListener("touchstart", handleDrag);
    //             };
    //         }
    //     }
    // }, [music]);

    // useEffect(() => {
    //     if (!encryptedData) {
    //         return;
    //     }

    //     const decryptedData: TreeProp = decrypt(encryptedData);
    //     if (decryptedData) {

    //         if (decryptedData.messages && Array.isArray(decryptedData.messages)) {
    //             setMessages(decryptedData.messages);
    //         }

    //         if (decryptedData.title) {
    //             setTitle(decryptedData.title);
    //         }

    //         if (decryptedData.textColor) {
    //             setTextColor(decryptedData.textColor);
    //         }

    //         if (decryptedData.treeColor) {
    //             setTreeColor(decryptedData.treeColor);
    //         }

    //         if (decryptedData.music) {
    //             setMusic(`/proxy-drive/${decryptedData.music}`);
    //         }

    //         if (decryptedData.finalImage) {
    //             setImageUrl(`/proxy-drive/${decryptedData.finalImage}`);
    //         }

    //         // setImageUrl(`/proxy-drive/1fiQo2trzmiJ4QcQU8VlE9OsKMTLOu6Rt`);
    //     }
    // }, [encryptedData]);

    return (
        <div
            ref={containerRef}
            className={`relative bg-black ${styles['container-christmas-tree']}`}
            style={{
                backgroundColor: '#000',
                position: 'fixed',
                margin: 0,
                padding: 0
            }}
        >
            {music !== '' && (
                <audio ref={audioRef} loop controls hidden>
                    <source src={music} type="audio/mpeg" />
                </audio>
            )}
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

                    <DoubleSpiralTree3D colorAll={treeColor} appearDuration={TREE_APPEAR_DURATION_MS / 1000} showStreaks={false} />

                    <ChristmasText
                        titleColor={textColor}
                        title={title}
                        messages={messages}
                        visible={showText}
                        imageUrl={imageUrl}
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
