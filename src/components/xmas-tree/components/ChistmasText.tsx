import { Html } from '@react-three/drei';
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import styles from '../responsive.module.css';

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

  return `polygon(${pathPoints.join(', ')})`;
};

const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isLandscape, setIsLandscape] = useState(false);

  const updateScreenSize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscapeMode = width > height;

    setIsLandscape(isLandscapeMode);

    if (width < 650 || height < 500) {
      setScreenSize('mobile');
    } else if (width < 1024) {
      setScreenSize('tablet');
    } else {
      setScreenSize('desktop');
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

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, [updateScreenSize]);

  return { screenSize, isLandscape };
};

export function ChristmasText({
  messages = ['Wishing you a very Merry Christmas.', 'Peace, joy, and happiness this Christmas.', 'Have a jolly holiday!'],
  visible = false,
  fadeMs = 300,
  title = 'Merry Christmas',
  imageUrl = '',
  titleColor = { r: 0, g: 255, b: 255 },
  messageDelayMs = 500, // 👈 delay để message dưới xuất hiện sau title
}: {
  messages?: string[];
  visible?: boolean;
  fadeMs?: number;
  title?: string;
  imageUrl?: string;
  titleColor?: any;
  messageDelayMs?: number;
}) {
  const textPositionWithDevice = (): [number, number, number] => {
    if (typeof window === 'undefined') return [3, 2.8, 0];
    const width = window.innerWidth;
    // chỉnh number thứ 2 để xa hơn
    if (width < 480) return [1.4, 3.3, 0];
    if (width < 768) return [2.1, 2.9, 0];
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
    }, getDurationForText(''));
  }, [isShowImage]);

  const getDurationForText = (text: string) => {
    const baseMs = 2000;
    const perCharMs = 30;
    const len = text?.length ?? 0;
    return baseMs + len * perCharMs;
  };

  const runSequence = (startIdx: number) => {
    const currentText = messages[startIdx] ?? '';
    const holdMs = getDurationForText(currentText);
    // console.log("⏱️ Hiện message:", currentText, `ở ${startIdx}`);

    const t1 = window.setTimeout(() => {
      const isLast = startIdx === messages.length - 1;
      setFading(true);
      if (isLast) {
        const t2 = window.setTimeout(() => {
          // console.log(imageUrl);
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
    <Html
      position={textPositionWithDevice() as any}
      transform
      style={{ background: 'none', userSelect: 'none', fontFamily: 'Mali', paddingLeft: '14px' }}
    >
      <div
        className={`m-w-[400px] pointer-events-none ${styles['christmas-text']
          } ${visible ? styles['christmas-text-visible'] : styles['christmas-text-hidden']}`}
      >
        <h1
          className={`${styles['title']} text-lg font-bold text-cyan-300 drop-shadow-lg`}
          style={{
            color: `rgb(${titleColor.r}, ${titleColor.g}, ${titleColor.b})`,
            textShadow: `0 0 2px rgb(${titleColor.r}, ${titleColor.g}, ${titleColor.b})`,
            fontFamily: 'Mali',
            fontSize: screenSize === 'mobile' ? '0.9rem' : '',
            width: screenSize === "mobile" ? 124 : "",
          }}
        >
          {title}
        </h1>

        <div
          className={styles.messageWrap}
          style={{
            width: screenSize === "mobile" ? 130 : "",
            opacity: messagesReady ? (fading ? 0 : 1) : 0,
            transition: `opacity ${fadeMs}ms ease`,
            willChange: 'opacity',
          }}
        >
          {isShowImage && imageUrl ? (
            <img
              src={imageUrl}
              alt="Display image"
              className={``}
              style={{
                margin: '0 auto',
                width: `${imageConfig.width}px`,
                height: `${imageConfig.height}px`,
                clipPath: heartClipPath,
              }}
              onError={(e) => {
                console.error('Failed to load image:', imageUrl);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <p
              className={`${styles['subtitle']} ${styles['text-glow-white']} text-base text-white drop-shadow-md`}
              style={{
                width: screenSize === "mobile" ? 155 : "",
                fontSize: screenSize === 'mobile' ? '12px' : '',
                minHeight: '1.5em',
              }}
            >
              {messages[index] ?? ''}
            </p>
          )}
        </div>
      </div>
    </Html>
  );
}
