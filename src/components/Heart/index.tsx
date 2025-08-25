import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import HeartRods from "./HeartRods";
import styles from "./responsive.module.css";
import TextOverlay from "./TextOverlay";
import { Canvas } from "@react-three/fiber";
import ParticleEffect from "./ParticleEffect";

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

// Hook để detect screen size và orientation với throttling
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [isLandscape, setIsLandscape] = useState(false);

  const updateScreenSize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscapeMode = width > height;

    setIsLandscape(isLandscapeMode);

    if (width < 400) {
      setScreenSize("mobile");
    } else if (width < 650) {
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
  const baseConfigs = {
    mobile: {
      // HeartRods props
      bigHeartWidth: 280,
      bigHeartAspect: 1.0,
      smallHeartSizePx: 32,
      smallHeartScale: 0.5,
      smallHeartMoveMin: 8,
      smallHeartMoveMax: 18,
      smallHeartLifeMs: 1200,
      rodLengthBase: 100,
      rodWidth: 3,
      rodHeight: 1.4,
      markerSize: 300, // tăng đáng kể để thấy sự thay đổi trên mobile
      markerRevsPerSec: 0.25,
      rodDepthMaxAdvance: 800,
      rodDepthSpeed: 150,
      rodOpacity: 0.7,

      // TextOverlay props
      fontSize: 80,
      maxLineWidth: 300,
      wordSpacing: 1.5,
      lineHeight: 1.1,
      moveDurationMs: 500,
      staggerMs: 120,
      holdDurationMs: 800,
    },
    tablet: {
      // HeartRods props
      bigHeartWidth: 400,
      bigHeartAspect: 1.05,
      smallHeartSizePx: 40,
      smallHeartScale: 0.55,
      smallHeartMoveMin: 9,
      smallHeartMoveMax: 20,
      smallHeartLifeMs: 1100,
      rodLengthBase: 125,
      rodWidth: 4,
      rodHeight: 1.5,
      markerSize: 600, // tăng đáng kể để thấy sự thay đổi trên tablet
      markerRevsPerSec: 0.22,
      rodDepthMaxAdvance: 1000,
      rodDepthSpeed: 175,
      rodOpacity: 0.78,

      // TextOverlay props
      fontSize: 120,
      maxLineWidth: 400,
      wordSpacing: 1.8,
      lineHeight: 1.15,
      moveDurationMs: 450,
      staggerMs: 130,
      holdDurationMs: 900,
    },
    desktop: {
      // HeartRods props
      bigHeartWidth: 520,
      bigHeartAspect: 1.1,
      smallHeartSizePx: 48,
      smallHeartScale: 0.6,
      smallHeartMoveMin: 10,
      smallHeartMoveMax: 24,
      smallHeartLifeMs: 1000,
      rodLengthBase: 150,
      rodWidth: 5,
      rodHeight: 1.6,
      markerSize: 1000, // tăng đáng kể để thấy sự thay đổi trên desktop
      markerRevsPerSec: 0.2,
      rodDepthMaxAdvance: 1200,
      rodDepthSpeed: 200,
      rodOpacity: 0.85,

      // TextOverlay props
      fontSize: 150,
      maxLineWidth: 500,
      wordSpacing: 2,
      lineHeight: 1.2,
      moveDurationMs: 400,
      staggerMs: 150,
      holdDurationMs: 1000,
    },
  };

  const config = { ...baseConfigs[screenSize] };

  // Apply landscape-specific adjustments
  if (screenSize === "mobile" && isLandscape) {
    config.bigHeartWidth = Math.min(350, config.bigHeartWidth * 1.2);
    config.bigHeartAspect = 0.9; // Slightly wider for landscape
    config.fontSize = Math.max(60, config.fontSize * 0.8); // Smaller font for landscape
    config.maxLineWidth = Math.min(400, config.maxLineWidth * 1.3);
  } else if (screenSize === "tablet" && isLandscape) {
    config.bigHeartWidth = Math.min(450, config.bigHeartWidth * 1.1);
    config.fontSize = Math.max(100, config.fontSize * 0.9);
  }

  return config;
};

export default function Hearth2({ texts, color, fontSize, imageUrl, imageWidth = 500, imageHeight = 400 }: Hearth2Props) {
  const [isShowText, setIsShowText] = React.useState(false);
  const [isShowImage, setIsShowImage] = React.useState(false);
  const { screenSize, isLandscape } = useScreenSize();

  // Memoize configuration to prevent unnecessary recalculations
  const config = useMemo(() => getResponsiveConfig(screenSize, isLandscape), [screenSize, isLandscape]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShowText(true);
    }, 3300);

    return () => clearTimeout(timer);
  }, []);

  // Callback khi tất cả texts đã hiển thị xong
  const handleAllTextsCompleted = useCallback(() => {
    if (imageUrl) {
      setTimeout(() => {
        setIsShowImage(true);
      }, 500); // Delay 500ms trước khi hiển thị hình
    }
  }, [imageUrl]);

  // Responsive config cho hình ảnh với memoization
  const imageConfig = useMemo(() => {
    const configs = {
      mobile: {
        width: 250,
        height: 200,
      },
      tablet: {
        width: 400,
        height: 300,
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

  return (
    <div className={styles.heartContainer}>
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
      />

      {isShowText && !isShowImage && (
        <TextOverlay
          texts={texts}
          color={color}
          fontSize={fontSize || config.fontSize}
          maxLineWidth={config.maxLineWidth}
          wordSpacing={config.wordSpacing}
          lineHeight={config.lineHeight}
          moveDurationMs={config.moveDurationMs}
          staggerMs={config.staggerMs}
          holdDurationMs={config.holdDurationMs}
          onAllTextsCompleted={handleAllTextsCompleted}
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
