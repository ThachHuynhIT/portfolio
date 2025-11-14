"use client";

import { Environment, Html, OrbitControls } from "@react-three/drei";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";

import BackgroundStars from "./components/background-stars";
import ChristmasTree3D from "./components/ChristmasTree3D";
import Fireworks from "./components/fireworks";
import styles from "./responsive.module.css";
// import { decrypt } from "@/hooks/OpenSSLDecryptionService";
import { log } from "console";
import { RgbColor } from "@/types";
import { is } from "@react-three/fiber/dist/declarations/src/core/utils";
import { get } from "http";
import DoubleSpiralIndex from "./treev2";

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
    const startTarget = new Vector3(0, 1.6, 0);
    const endPosition = new Vector3(5, 2, 7);
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

const useScreenSize = () => {
    const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">("desktop");
    const [isLandscape, setIsLandscape] = useState(false);

    const updateScreenSize = useCallback(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isLandscapeMode = width > height;

        setIsLandscape(isLandscapeMode);

        if (width < 650 || height < 500) {
            setScreenSize("mobile");
        } else if (width < 1024) {
            setScreenSize("tablet");
        } else {
            setScreenSize("desktop");
        }
    }, []);

    useEffect(() => {
        updateScreenSize();

        // Use throttled resize handler for better performance
        let rafId: number;
        let lastResize = 0;

        const throttledResize = () => {
            const now = Date.now();
            if (now - lastResize > 150) {
                // Throttle to max 6.7 calls per second
                lastResize = now;
                updateScreenSize();
            } else {
                rafId = requestAnimationFrame(throttledResize);
            }
        };

        const handleResize = () => {
            cancelAnimationFrame(rafId);
            throttledResize();
        };

        window.addEventListener("resize", handleResize, { passive: true });

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(rafId);
        };
    }, [updateScreenSize]);

    return { screenSize, isLandscape };
};

const generateHeartClipPath = (points: number = 50): string => {
    const TWO_PI = Math.PI * 2;
    const pathPoints: string[] = [];

    // Use the same mathematical formula as in HeartRods
    const getSimpleHeartPoint = (t: number) => {
        const cosT = Math.cos(t);
        const sinT = Math.sin(t);
        const cos2T = Math.cos(2 * t);
        const x = 16 * sinT * sinT * sinT;
        const y = 13 * cosT - 4 * cos2T - 2 * Math.cos(3 * t);
        return { x, y };
    };

    // Find the bounds to normalize coordinates
    let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
    const calculatedPoints = [];

    // Calculate points starting from the bottom tip (t=0) going counter-clockwise
    for (let i = 0; i < points; i++) {
        const t = (i / points) * TWO_PI;
        const point = getSimpleHeartPoint(t);
        calculatedPoints.push(point);

        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    }

    // Convert to percentage coordinates (0-100%) - flip Y axis for correct orientation
    for (const point of calculatedPoints) {
        const xPercent = ((point.x - minX) / (maxX - minX)) * 100;
        // Flip Y coordinate: use (maxY - point.y) instead of (point.y - minY)
        const yPercent = ((maxY - point.y) / (maxY - minY)) * 100;
        pathPoints.push(`${xPercent.toFixed(1)}% ${yPercent.toFixed(1)}%`);
    }

    return `polygon(${pathPoints.join(", ")})`;
};

function ChristmasText({
    messages,
    visible,
    fadeMs = 300,
    title = "Merry Christmas",
    titleColor,
    imageUrl,
    messageDelayMs = 500, // 👈 delay để message dưới xuất hiện sau title
}: {
    messages: string[];
    visible: boolean;
    fadeMs?: number;
    title: string;
    imageUrl?: string;
    titleColor: any;
    messageDelayMs?: number;
}) {
    const textPositionWithDevice = () => {
        if (typeof window === "undefined") return [3, 2.8, 0];
        const width = window.innerWidth;
        if (width < 480) return [1.6, 2.1, 0];
        if (width < 768) return [2.1, 2.3, 0];
        if (width < 1024) return [3.1, 2.5, 0];
        return [3, 2.8, 0];
    };

    const [index, setIndex] = useState(0);
    const [fading, setFading] = useState(false);
    const { screenSize, isLandscape } = useScreenSize();
    const [messagesReady, setMessagesReady] = useState(false); // 👈 để điều khiển bắt đầu chuỗi message
    const [isShowImage, setIsShowImage] = useState(false);

    const timeoutsRef = useRef<number[]>([]);

    const imageWidth = 500;
    const imageHeight = 400;

    // Responsive config cho hình ảnh với memoization
    const imageConfig = useMemo(() => {
        const configs = {
            mobile: {
                width: 90,
                height: 80,
            },
            tablet: {
                width: 110,
                height: 100,
            },
            desktop: {
                width: 115,
                height: 110,
            },
        };
        return configs[screenSize];
    }, [screenSize, imageWidth, imageHeight]);

    const heartClipPath = useMemo(() => {
        return generateHeartClipPath(60);
    }, []);

    useEffect(() => {
        // clear tất cả timeout cũ
        timeoutsRef.current.forEach((id) => window.clearTimeout(id));
        timeoutsRef.current = [];

        // reset text
        setIndex(0);
        setFading(false);
        setMessagesReady(false);

        if (!visible || messages.length === 0) return;

        // sau 0.5s mới cho message bắt đầu chạy
        const startTimeout = window.setTimeout(() => {
            setMessagesReady(true);
        }, messageDelayMs);
        timeoutsRef.current.push(startTimeout);

        return () => {
            timeoutsRef.current.forEach((id) => window.clearTimeout(id));
            timeoutsRef.current = [];
        };
    }, [visible, messages, fadeMs, messageDelayMs]);

    useEffect(() => {
        // chỉ chạy sequence khi đã sẵn sàng
        if (!messagesReady) return;
        if (messages.length === 0) return;

        // clear cũ (phòng trường hợp rerun)
        timeoutsRef.current.forEach((id) => window.clearTimeout(id));
        timeoutsRef.current = [];

        // bắt đầu từ message 0
        runSequence(index);

        return () => {
            timeoutsRef.current.forEach((id) => window.clearTimeout(id));
            timeoutsRef.current = [];
        };
    }, [messagesReady, messages, fadeMs]);

    useEffect(() => {
        if (!isShowImage) return;

        setTimeout(() => {
            setFading(true);
            setTimeout(() => {
                setIndex(0);
                runSequence(0);
                setFading(false);
            }, fadeMs);
            setIsShowImage(false);
        }, getDurationForText(""));
    }, [isShowImage]);

    const getDurationForText = (text: string) => {
        const baseMs = 2000;
        const perCharMs = 30;
        const len = text?.length ?? 0;
        return baseMs + len * perCharMs;
    };

    const runSequence = (startIdx: number) => {
        const currentText = messages[startIdx] ?? "";
        const holdMs = getDurationForText(currentText);
        // console.log("⏱️ Hiện message:", currentText, `ở ${startIdx}`);

        const t1 = window.setTimeout(() => {
            const isLast = startIdx === messages.length - 1;
            setFading(true);
            if (isLast) {
                const t2 = window.setTimeout(() => {
                    console.log(imageUrl);
                    setIsShowImage(true);
                    setFading(false);
                    // setIndex(0);
                    // runSequence(0);
                }, fadeMs);
                timeoutsRef.current.push(t2);
                return;
            }
            const t2 = window.setTimeout(() => {
                setIndex(startIdx + 1);
                setFading(false);
                runSequence(startIdx + 1);
            }, fadeMs);
            timeoutsRef.current.push(t2);
        }, holdMs);

        timeoutsRef.current.push(t1);
    };

    return (
        <Html position={textPositionWithDevice() as [number, number, number]} transform style={{ background: "none", userSelect: "none", fontFamily: "Mali" }}>
            <div
                className={`pointer-events-none m-w-[400px] ${styles["christmas-text"]
                    } ${visible ? styles["christmas-text-visible"] : styles["christmas-text-hidden"]}`}
            >
                <h1 className={`${styles["title"]} text-lg font-bold text-cyan-300 drop-shadow-lg`} style={{ color: `rgb(${titleColor.r}, ${titleColor.g}, ${titleColor.b})`, textShadow: `0 0 2px rgb(${titleColor.r}, ${titleColor.g}, ${titleColor.b})`, fontFamily: "Mali" }}>
                    {title}
                </h1>

                <div
                    className={styles.messageWrap}
                    style={{
                        opacity: messagesReady ? (fading ? 0 : 1) : 0,
                        transition: `opacity ${fadeMs}ms ease`,
                        willChange: "opacity",
                    }}
                >
                    {isShowImage && imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Display image"
                            className={``}
                            style={{
                                width: `${imageConfig.width}px`,
                                height: `${imageConfig.height}px`,
                                clipPath: heartClipPath,
                            }}
                            onError={(e) => {
                                console.error("Failed to load image:", imageUrl);
                                (e.target as HTMLImageElement).style.display = "none";
                            }}
                        />
                    ) : (
                        <p
                            className={`${styles["subtitle"]} ${styles["text-glow-white"]} text-base text-white drop-shadow-md`}
                            style={{
                                minHeight: "1.5em",
                            }}
                        >
                            {messages[index] ?? ""}
                        </p>
                    )}
                </div>
            </div>
        </Html>
    );
}

interface EncryptProps {
    encryptedData: string;
}

interface TreeProp {
    id: string;
    messages: string[],
    title: string,
    textColor: RgbColor,
    treeColor: RgbColor,
    music: string,
    finalImage: string,
}

export default function Index({ encryptedData }: EncryptProps) {
    return <DoubleSpiralIndex />
    const controlsRef = useRef<OrbitControlsType>(null!);

    const [showText, setShowText] = useState(false);
    const [runTransition, setRunTransition] = useState(false);
    const [messages, setMessages] = useState<string[]>([]);
    const [title, setTitle] = useState<string>('');
    const [textColor, setTextColor] = useState<RgbColor>({ r: 0, g: 255, b: 255 });
    const [treeColor, setTreeColor] = useState<RgbColor>({ r: 30, g: 144, b: 255 });
    const [music, setMusic] = useState<string>('');
    const [imageUrl, setImageUrl] = useState<string>('');
    const audioRef = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => {
            setShowText(true);
            setRunTransition(true);
        }, 500);
        return () => clearTimeout(t);
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


    return (

        <div className={`relative bg-black ${styles["container-christmas-tree"]}`}>
            {music !== '' && (
                <audio ref={audioRef} loop controls hidden>
                    <source src={music} type="audio/mpeg" />
                </audio>
            )}
            <Canvas
                className={styles["canvas-christmas-tree"]}
                camera={{ position: [5, 2, 7], fov: 50 }}
                gl={{ antialias: true, alpha: true }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.3} />
                    <pointLight position={[0, 5, 0]} intensity={2} />
                    <pointLight position={[5, 3, 5]} intensity={1} color="#4a90e2" />
                    <Environment preset="night" />
                    <BackgroundStars />
                    <ChristmasTree3D treeColor={treeColor} />
                    <Fireworks propColor="#fff" />
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
