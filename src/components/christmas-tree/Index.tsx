"use client";

import { Environment, Html, OrbitControls } from "@react-three/drei";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";

import BackgroundStars from "./components/background-stars";
import ChristmasTree3D from "./components/ChristmasTree3D";
import Fireworks from "./components/fireworks";
import styles from "./responsive.module.css";

interface CameraTransitionProps {
    controlsRef: React.RefObject<OrbitControlsType>;
    run: boolean;
}

function CameraTransition({ controlsRef, run }: CameraTransitionProps) {
    const { camera } = useThree();
    const animationState = useRef({
        isAnimating: false,
        startTime: 0,
    });

    const DURATION = 2.5;

    const startPosition = new Vector3(0, 2.8, 7);
    const endPosition = new Vector3(5, 2, 7);
    const startTarget = new Vector3(0, 1.6, 0);
    const endTarget = new Vector3(1, 1, 0);

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
        const eased = 1 - Math.pow(1 - progress, 3);

        const currentPos = new Vector3().lerpVectors(startPosition, endPosition, eased);
        const currentTarget = new Vector3().lerpVectors(startTarget, endTarget, eased);

        camera.position.copy(currentPos);
        controls.target.copy(currentTarget);
        controls.update();

        if (progress >= 1) animationState.current.isAnimating = false;
    });

    return null;
}

function ChristmasText({
    messages,
    visible,
    // mấy cái này vẫn cho phép truyền để tinh chỉnh
    fadeMs = 300,
}: {
    messages: string[];
    visible: boolean;
    fadeMs?: number;
}) {
    const textPositionWithDevice = () => {
        if (typeof window === "undefined") return [3, 3, 0];
        const width = window.innerWidth;
        if (width < 480) return [1.6, 1.3, 0];
        if (width < 768) return [2.1, 1.5, 0];
        if (width < 1024) return [3.1, 2, 0];
        return [3, 2, 0];
    };

    const [index, setIndex] = useState(0);
    const [fading, setFading] = useState(false);

    // giữ ref để clear timeout
    const timeoutsRef = useRef<number[]>([]);

    useEffect(() => {
        // clear tất cả timeout cũ
        timeoutsRef.current.forEach((id) => window.clearTimeout(id));
        timeoutsRef.current = [];

        // reset lại
        setIndex(0);
        setFading(false);
        if (!visible || messages.length === 0) return;
        // hàm tính thời gian hiển thị theo độ dài
        // chỉnh 2 số này để nhanh/chậm:
        // baseMs: tối thiểu ở lại bao lâu
        // perCharMs: mỗi ký tự cộng thêm bao nhiêu ms
        const getDurationForText = (text: string) => {
            const baseMs = 1100; // tối thiểu 1.1s
            const perCharMs = 30; // mỗi ký tự +45ms → text dài sẽ lâu hơn
            const len = text?.length ?? 0;
            return baseMs + len * perCharMs;
        };

        const runSequence = (startIdx: number) => {
            const currentText = messages[startIdx] ?? "";
            const holdMs = getDurationForText(currentText);

            const t1 = window.setTimeout(() => {
                // nếu là message cuối thì dừng luôn, không fade out
                const isLast = startIdx === messages.length - 1;
                if (isLast) {
                    setFading(false);
                    return;
                }
                // fade out
                setFading(true);
                const t2 = window.setTimeout(() => {
                    // chuyển sang message kế tiếp
                    setIndex(startIdx + 1);
                    setFading(false);
                    runSequence(startIdx + 1);
                }, fadeMs);
                timeoutsRef.current.push(t2);
            }, holdMs);
            timeoutsRef.current.push(t1);
        };
        // bắt đầu từ message 0
        runSequence(0);
        return () => {
            timeoutsRef.current.forEach((id) => window.clearTimeout(id));
            timeoutsRef.current = [];
        };
    }, [visible, messages, fadeMs]);

    return (
        <Html position={textPositionWithDevice() as [number, number, number]} transform style={{ background: "none", userSelect: "none" }}>
            <div
                className={`pointer-events-none m-w-[400px] ${styles["christmas-text"]
                    } ${visible ? styles["christmas-text-visible"] : styles["christmas-text-hidden"]}`}
            >
                <h1 className={`${styles["title"]} ${styles["text-glow"]} text-lg font-bold text-cyan-300 drop-shadow-lg`}>
                    Merry Christmas
                </h1>
                <div className={styles.messageWrap}>
                    <p
                        className={`${styles["subtitle"]} text-base text-white drop-shadow-md`}
                        style={{
                            opacity: fading ? 0 : 1,
                            transition: `opacity ${fadeMs}ms ease`,
                            willChange: "opacity",
                            minHeight: "1.5em",
                        }}
                    >
                        {messages[index] ?? ""}
                    </p>
                </div>
            </div>
        </Html>
    );
}

export default function Index() {
    const controlsRef = useRef<OrbitControlsType>(null!);

    const [showText, setShowText] = useState(false);
    const [runTransition, setRunTransition] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            setShowText(true);
            setRunTransition(true);
        }, 500);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className={`relative bg-black ${styles["container-christmas-tree"]}`}>
            <Canvas
                className={styles["canvas-christmas-tree"]}
                camera={{ position: [5, 2, 7], fov: 50 }}
                gl={{ antialias: true, alpha: true }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.3} />
                    <pointLight position={[0, 5, 0]} intensity={2} color="#00ffff" />
                    <pointLight position={[5, 3, 5]} intensity={1} color="#4a90e2" />
                    <Environment preset="night" />
                    <BackgroundStars />
                    <ChristmasTree3D treeColor="#1E90FF" />
                    <Fireworks propColor="#fff" />
                    <ChristmasText
                        messages={[
                            "Wishing you a very Merry Christmas.",
                            "Peace, joy, and happiness this Christmas.",
                            "Have a jolly holiday!",
                        ]}
                        visible={showText}
                    />
                    <OrbitControls
                        ref={controlsRef}
                        enableZoom={true}
                        enablePan={false}
                        minDistance={6}
                        maxDistance={12}
                        maxPolarAngle={Math.PI / 2 + 0.3}
                        target={[1, 1, 0]}
                    />
                    <EffectComposer>
                        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={1} />
                    </EffectComposer>
                    {/* <CameraTransition controlsRef={controlsRef} run={runTransition} /> */}
                </Suspense>
            </Canvas>
        </div>
    );
}
