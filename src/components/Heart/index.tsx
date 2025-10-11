import React, { useEffect, useState, useCallback, useMemo, Suspense, useRef } from "react";
import HeartRods from "./HeartRods";
import styles from "./responsive.module.css";
import TextOverlay from "./TextOverlay";
import { Canvas } from "@react-three/fiber";
import ParticleEffect from "./ParticleEffect";
import { baseConfigs } from "./constants";

export type Hearth2Props = {
  texts?: string[];
  color?: string;
  fontSize?: number;
  imageUrl?: string; // URL của hình ảnh sẽ hiển thị
  imageWidth?: number; // Chiều rộng của hình ảnh (px)
  imageHeight?: number; // Chiều cao của hình ảnh (px)
  enableParticles?: boolean; // Bật/tắt hiệu ứng hạt bụi
  particleConfig?: {
    count?: number;
    size?: number;
    color?: string;
    speed?: number;
  };
};

interface FireworkProp {
  encryptedData: string;
}

interface HeartProp {
  id: string;
  messages: string[];
  finalImage: string;
  music: string;
}

// Hook để detect screen size và orientation với throttling
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

// Function to generate clip-path based on getSimpleHeartPoint mathematical formula
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

// Responsive configurations với memoization
const getResponsiveConfig = (screenSize: "mobile" | "tablet" | "desktop", isLandscape: boolean) => {
  const config = { ...baseConfigs[screenSize] };
  return config;
};

export default function Hearth2({ texts, imageUrl }: Hearth2Props) {
  const [isHeartAnimating, setIsHeartAnimating] = React.useState(true); // Track heart animation state
  const [isShowImage, setIsShowImage] = React.useState(false);
  const { screenSize, isLandscape } = useScreenSize();
  const [messages, setMessages] = useState<string[]>([]);
  // const [imageUrl, setImageUrl] = useState<string>("");
  const [music, setMusic] = useState<string>("");
  const audioRef = useRef(null);

  const imageWidth = 500;
  const imageHeight = 400;

  // Memoize configuration to prevent unnecessary recalculations
  const config = useMemo(() => getResponsiveConfig(screenSize, isLandscape), [screenSize, isLandscape]);

  // Prevent body scrolling when component mounts and enable when unmounts
  useEffect(() => {
    // Save original body styles
    const originalBodyStyle = {
      height: document.body.style.height,
      maxHeight: document.body.style.maxHeight,
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      width: document.body.style.width,
      top: document.body.style.top,
      left: document.body.style.left,
    };

    // Apply no-scroll styles to body
    document.body.style.height = "100dvh";
    document.body.style.height = "100vh"; // Fallback
    document.body.style.maxHeight = "100dvh";
    document.body.style.maxHeight = "100vh"; // Fallback
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = "0";
    document.body.style.left = "0";

    // Also apply to html element for better mobile support
    const originalHtmlStyle = {
      height: document.documentElement.style.height,
      maxHeight: document.documentElement.style.maxHeight,
      overflow: document.documentElement.style.overflow,
    };

    document.documentElement.style.height = "100dvh";
    document.documentElement.style.height = "100vh"; // Fallback
    document.documentElement.style.maxHeight = "100dvh";
    document.documentElement.style.maxHeight = "100vh"; // Fallback
    document.documentElement.style.overflow = "hidden";

    // Cleanup function to restore original styles
    return () => {
      document.body.style.height = originalBodyStyle.height;
      document.body.style.maxHeight = originalBodyStyle.maxHeight;
      document.body.style.overflow = originalBodyStyle.overflow;
      document.body.style.position = originalBodyStyle.position;
      document.body.style.width = originalBodyStyle.width;
      document.body.style.top = originalBodyStyle.top;
      document.body.style.left = originalBodyStyle.left;

      document.documentElement.style.height = originalHtmlStyle.height;
      document.documentElement.style.maxHeight = originalHtmlStyle.maxHeight;
      document.documentElement.style.overflow = originalHtmlStyle.overflow;
    };
  }, []);

  useEffect(() => {
    // Heart animation typically lasts around 8-10 seconds, reduce overlap
    const heartAnimationTimer = setTimeout(() => {
      setIsHeartAnimating(false);
    }, 8000);

    return () => {
      clearTimeout(heartAnimationTimer);
    };
  }, []);

  // Callback khi tất cả texts đã hiển thị xong
  const handleAllTextsCompleted = useCallback(() => {
    if (imageUrl) {
      // setTimeout(() => {
      setIsShowImage(true);
      // }, 500); // Delay 500ms trước khi hiển thị hình
    }
  }, [imageUrl]);

  // Responsive config cho hình ảnh với memoization
  const imageConfig = useMemo(() => {
    const configs = {
      mobile: {
        width: 210,
        height: 180,
      },
      tablet: {
        width: 190,
        height: 150,
      },
      desktop: {
        width: 500,
        height: 420,
      },
    };
    return configs[screenSize];
  }, [screenSize, imageWidth, imageHeight]);

  // Generate mathematical heart clip-path
  const heartClipPath = useMemo(() => {
    return generateHeartClipPath(60);
  }, []);

  if (!isLandscape) {
    // return <RotateNotice />;
  }

  return (
    <div className={`${styles.heartContainer} ${screenSize === "mobile" ? styles.heartMobile : ""}`}>
      {music !== "" && (
        <audio ref={audioRef} loop controls hidden>
          <source src={music} type="audio/mpeg" />
        </audio>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
          }}
          gl={{
            antialias: true,
            alpha: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
          }}
        >
          <Suspense fallback={null}>
            <ParticleEffect />
          </Suspense>
        </Canvas>
      </div>
      <HeartRods
        bigHeartWidth={config.bigHeartWidth}
        bigHeartAspect={config.bigHeartAspect}
        smallHeartSizePx={config.smallHeartSizePx}
        smallHeartScale={config.smallHeartScale}
        smallHeartMoveMin={config.smallHeartMoveMin}
        smallHeartMoveMax={config.smallHeartMoveMax}
        smallHeartLifeMs={config.smallHeartLifeMs}
        rodLengthBase={config.rodLengthBase}
        rodWidth={config.rodWidth}
        rodHeight={config.rodHeight}
        markerSize={config.markerSize}
        markerRevsPerSec={config.markerRevsPerSec}
        rodDepthMaxAdvance={config.rodDepthMaxAdvance}
        rodDepthSpeed={config.rodDepthSpeed}
        rodOpacity={config.rodOpacity}
        isTextAnimating={!isShowImage}
      />

      {!isShowImage && (
        <TextOverlay
          texts={texts}
          fontSize={config.fontSize}
          maxLineWidth={config.maxLineWidth}
          wordSpacing={config.wordSpacing}
          lineHeight={config.lineHeight}
          moveDurationMs={config.moveDurationMs}
          staggerMs={config.staggerMs}
          holdDurationMs={config.holdDurationMs}
          onAllTextsCompleted={handleAllTextsCompleted}
          isHeartAnimating={isHeartAnimating}
          style={{ zIndex: 5 }}
        />
      )}
      {isShowImage && imageUrl && (
        <div className={styles.imageContainer}>
          <img
            src={imageUrl}
            alt="Display image"
            className={`${styles.displayImage}`}
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
        </div>
      )}
    </div>
  );
}
