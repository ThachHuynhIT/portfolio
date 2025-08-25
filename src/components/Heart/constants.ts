// =============================
// CAMERA CONSTANTS
// =============================
export const CAMERA_FOV = 45;
export const CAMERA_NEAR = 1;
export const CAMERA_FAR = 8000;
export const CAMERA_Z = 900;

// =============================
// HEART SHAPE CONSTANTS
// =============================
export const HEART_BASE_WIDTH = 32; // base width used by the classic heart equation

// =============================
// SMALL HEART CONSTANTS
// =============================
export const SMALL_HEART_MIN_SIZE = 8; // px, clamp for outline hearts (reduced from 16)
export const SMALL_TIP_MIN_SIZE = 12; // px, clamp for rod tip hearts (reduced from 24)
export const SMALL_HEART_CANVAS_SCALE = 2; // offscreen canvas size multiplier
export const SMALL_HEART_GLOW_COLOR = "#ff3366"; // giảm opacity để bớt loá
export const SMALL_HEART_GLOW_BLUR = 25; // tăng blur để vùng sáng to hơn nhưng mềm hơn

// =============================
// HEART COLORS
// =============================
// Màu sắc cho trái tim nhỏ (3 màu: đỏ, hồng, trắng)
export const HEART_COLORS = [
  { tint: "#ff0040ff", glow: "rgba(255, 0, 0, 1)" },
  { tint: "#ff3366", glow: "rgba(255,60,120,0.6)" },
  { tint: "#ff99cc", glow: "rgba(255,153,204,0.6)" },
  { tint: "#ffffff", glow: "rgba(255,255,255,0.6)" },
];

// =============================
// MARKER CONSTANTS
// =============================
export const MARKER_CANVAS_SIZE = 300; // tăng canvas size để có không gian cho vùng sáng rộng hơn
export const MARKER_GRAD_INNER_R = 3; // giảm inner radius để vùng trung tâm nhỏ hơn (từ 6)
export const MARKER_GRAD_OUTER_R = 120; // giảm outer radius để vùng sáng nhỏ hơn (từ 140)
export const MARKER_CIRCLE_R = 125; // giảm circle radius tương ứng (từ 145)
export const MARKER_Z = -10; // local z for marker sprite

// =============================
// GROUP AND ROD CONSTANTS
// =============================
export const GROUP_EXTRA_Z_OFFSET = 0; // additional offset if needed
export const ROD_COLOR = 0xff99bb;
export const ROD_BACK_Z_OFFSET = -10; // push rods slightly behind the outline
export const NEAR_MARGIN_LOCAL = 100; // local-space margin from camera near plane

// =============================
// ROD OPACITY AND FADE CONSTANTS
// =============================
// Opacity ramp for rods
export const ROD_FADE_IN_PORTION = 0.2; // first 20% of travel
export const ROD_FADE_OUT_START = 0.85; // start fading at 85%
export const ROD_FADE_OUT_PORTION = 0.15; // last 15% of travel

// =============================
// SMALL HEART ANIMATION CONSTANTS
// =============================
export const SMALL_HEART_VISIBLE_THRESHOLD = 0.02; // hide when very faint
export const SMALL_HEART_CYCLE_JITTER_RAD = 0.3; // randomize spawn along outline
export const SMALL_HEART_EASE_EXP = 1.4; // opacity ease exponent (smoother)

// =============================
// SIDE HEARTS CONFIGURATION
// =============================
// Trái tim bên cạnh trên vệt sáng
export const SIDE_HEARTS_COUNT = 3; // số lượng trái tim bên cạnh mỗi bên
export const SIDE_HEARTS_SPREAD = 25; // khoảng cách spread của trái tim bên cạnh
export const SIDE_HEARTS_SIZE_VARIATION = 0.3; // biến thiên kích thước (±30%)
export const SIDE_HEARTS_OPACITY_VARIATION = 0.4; // biến thiên độ mờ

// =============================
// SPEED MULTIPLIERS
// =============================
// Speed boost for the flying streaks (rods). Increase >1 for faster motion
export const STREAK_SPEED_MULTIPLIER = 1.7; // faster streaks (2.5x)
export const MARKER_SPEED_MULTIPLIER = 1.1; // faster sweep dot // <-- make vệt bay nhanh hơn (2x)

// =============================
// BLOOM/GLOW EFFECT CONSTANTS
// =============================
// Bloom/Glow effect constants for rods - Tăng cường độ sáng để tránh tối đen
export const ROD_BLOOM_INTENSITY = 1.2; // tăng bloom intensity
export const ROD_EMISSIVE_INTENSITY = 0.6; // tăng emissive intensity

// =============================
// ROD EMISSIVE COLORS
// =============================
// Mảng màu hồng với gradation từ ít trắng đến nhiều trắng
export const ROD_EMISSIVE_COLORS = [
  0xff77aa, // hồng vừa
  0xff88bb, // hồng sáng hơn
  0xff99cc, // hồng nhiều trắng
  0xffaadd, // hồng rất sáng
  0xffbbee, // hồng gần trắng
  0xffccff, // hồng trắng
  0xff99bb, // hồng tím
  0xffcce6, // hồng pastel
  0xffb6c1, // light pink
  0xffd1dc, // pastel pink
  0xf8bbd0, // pink (material)
  0xfce4ec, // pink 50 (material)
];

// =============================
// UTILITY FUNCTIONS
// =============================
// Hàm để chọn màu ngẫu nhiên từ mảng
export const getRandomEmissiveColor = () => {
  return ROD_EMISSIVE_COLORS[Math.floor(Math.random() * ROD_EMISSIVE_COLORS.length)];
};

// =============================
// SPLIT ROD AND EFFECTS CONSTANTS
// =============================
export const SPLIT_ROD_EMISSIVE_BOOST = 1.2; // tăng boost cho split rods

// Lens flare effect constants for split rods - Adjustable based on performance
export const LENS_FLARE_INTENSITY = 0.6; // giảm cường độ lens flare
export const LENS_FLARE_SIZE = 60; // tăng kích thước lens flare để vùng sáng to hơn và phù hợp với marker
export const LENS_FLARE_COUNT = 3; // default, will be adjusted by performance tier

// Particle sparkle effect constants - Adjustable based on performance
export const SPARKLE_COUNT_PER_ROD = 12; // default, will be adjusted by performance tier
export const SPARKLE_LIFETIME = 1000; // tăng thời gian sống của sparkle để lan tỏa xa hơn
export const SPARKLE_SPEED = 90; // giảm tốc độ bay để sparkle tồn tại lâu hơn
export const SPARKLE_SIZE = 6; // tăng kích thước sparkle để vùng sáng to hơn

// =============================
// ANIMATION CONSTANTS
// =============================
// Intro animation constants
export const HEART_APPEAR_DURATION_MS = 800; // heart outline appears in first 800ms
export const ANIMATION_START_DELAY_MS = 500; // delay before rods/markers start moving
export const TWO_PI = Math.PI * 2;

// =============================
// DEVICE AND PERFORMANCE DETECTION
// =============================
// Device detection utility with performance level assessment
export const getDeviceTypeByWidth = () => {
  const width = window.innerWidth;
  if (width < 768) {
    return "mobile";
  }
  if (width >= 768 && width <= 1024) {
    return "tablet";
  }
  return "desktop";
};

// Performance tier detection for optimization - Cải tiến cho máy yếu
export const getPerformanceTier = () => {
  if (typeof window === "undefined") return "high";
  const cores = (navigator as any).hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;

  // Phát hiện GPU yếu qua WebGL context
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl") || (canvas.getContext("experimental-webgl") as WebGLRenderingContext);
  let gpuTier = "medium";

  if (gl && gl instanceof WebGLRenderingContext) {
    const renderer = gl.getParameter(gl.RENDERER) || "";
    const vendor = gl.getParameter(gl.VENDOR) || "";

    // Phát hiện GPU tích hợp hoặc cũ
    if (
      renderer.includes("Intel") ||
      renderer.includes("Mali") ||
      renderer.includes("Adreno 3") ||
      renderer.includes("PowerVR") ||
      vendor.includes("ARM") ||
      renderer.includes("Software")
    ) {
      gpuTier = "low";
    }
  }

  if (cores <= 2 || memory <= 1 || gpuTier === "low") {
    return "ultra-low";
  }
  if (cores <= 4 || memory <= 2) {
    return "low";
  }
  if (cores <= 6 || memory <= 4) {
    return "medium";
  }

  const userAgent = navigator.userAgent;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    if (cores >= 6) {
      return "high";
    }
    return "medium";
  }

  return "high";
};

// =============================
// PERFORMANCE OPTIMIZATION SETTINGS
// =============================
// Get optimized settings based on performance tier - Cải tiến cho máy yếu
export const getOptimizedSettings = () => {
  const performanceTier = getPerformanceTier();

  switch (performanceTier) {
    case "ultra-low":
      return {
        heartParticleCount: 20, // Giảm thêm cho máy rất yếu
        pixelRatio: 0.5, // Giảm mạnh resolution
        antialias: false,
        splitRodCount: 0, // Tắt hoàn toàn split rods
        sparkleCount: 0, // Tắt sparkles
        lensFlareCount: 0, // Tắt lens flares
        bloomEnabled: false, // Tắt bloom effect
        shadowEnabled: false, // Tắt shadows
        animationFrameSkip: 4, // Skip nhiều frame hơn (12fps)
        sideHeartsEnabled: false, // Tắt side hearts
        particleEffectsEnabled: false, // Tắt particle effects
        materialComplexity: "basic", // Dùng material đơn giản
        useSimpleBlending: true, // Dùng blending đơn giản
        disableMatrixUpdates: true, // Tắt auto matrix updates
      };

    case "low":
      return {
        heartParticleCount: 40, // Giảm thêm
        pixelRatio: 0.75, // Giảm pixel ratio
        antialias: false,
        splitRodCount: 0, // Tắt split rods cho máy yếu
        sparkleCount: 0, // Tắt sparkles
        lensFlareCount: 0, // Tắt lens flares
        bloomEnabled: false, // Tắt bloom effect
        shadowEnabled: false, // Tắt shadows
        animationFrameSkip: 3, // Skip nhiều frame (20fps)
        sideHeartsEnabled: false, // Tắt side hearts
        particleEffectsEnabled: false, // Tắt particle effects
        materialComplexity: "basic", // Material đơn giản
        useSimpleBlending: true, // Dùng blending đơn giản
        disableMatrixUpdates: true, // Tắt auto matrix updates
      };

    case "medium":
      return {
        heartParticleCount: 70, // Giảm thêm
        pixelRatio: 1, // Giữ 1x pixel ratio
        antialias: false, // Tắt antialias cho hiệu năng
        splitRodCount: 1, // Chỉ 1 split rod
        sparkleCount: 0, // Tắt sparkles
        lensFlareCount: 1, // Giảm lens flares
        bloomEnabled: false, // Tắt bloom để tăng hiệu năng
        shadowEnabled: false, // Tắt shadows
        animationFrameSkip: 1, // Skip ít frame hơn (30fps)
        sideHeartsEnabled: true, // Giữ side hearts
        particleEffectsEnabled: false, // Tắt một số particle effects
        materialComplexity: "simple",
        useSimpleBlending: false,
        disableMatrixUpdates: false,
      };

    default: // high
      return {
        heartParticleCount: 100, // Giảm một chút
        pixelRatio: Math.min(1.5, window.devicePixelRatio || 1), // Giới hạn pixel ratio
        antialias: true,
        splitRodCount: 2, // Giảm split rods
        sparkleCount: 6, // Giảm sparkles
        lensFlareCount: 2, // Giảm lens flares
        bloomEnabled: true, // Giữ bloom
        shadowEnabled: true,
        animationFrameSkip: 0, // Không skip frame
        sideHeartsEnabled: true,
        particleEffectsEnabled: true,
        materialComplexity: "standard",
        useSimpleBlending: false,
        disableMatrixUpdates: false,
      };
  }
};

// =============================
// DEVICE ORIENTATION AND CAMERA SETTINGS
// =============================
// Device orientation detection
export const getDeviceOrientation = () => {
  if (typeof window === "undefined") return "portrait";
  const width = window.innerWidth;
  const height = window.innerHeight;
  return width > height ? "landscape" : "portrait";
};

// Get responsive camera settings
export const getResponsiveCameraSettings = () => {
  if (typeof window === "undefined") {
    return { fov: CAMERA_FOV, z: CAMERA_Z, targetZ: -120 };
  }

  const deviceType = getDeviceTypeByWidth();
  const orientation = getDeviceOrientation();

  // Mobile landscape adjustments
  if (deviceType === "mobile" && orientation === "landscape") {
    return {
      fov: Math.min(60, CAMERA_FOV + 15), // Wider FOV for landscape
      z: Math.max(700, CAMERA_Z - 200), // Move camera closer
      targetZ: Math.max(-200, -120 - 80), // Adjust target depth
    };
  }

  // Mobile portrait adjustments
  if (deviceType === "mobile" && orientation === "portrait") {
    return {
      fov: CAMERA_FOV,
      z: Math.max(800, CAMERA_Z - 100), // Slightly closer
      targetZ: -120,
    };
  }

  // Tablet adjustments
  if (deviceType === "tablet") {
    return {
      fov: CAMERA_FOV,
      z: orientation === "landscape" ? CAMERA_Z - 100 : CAMERA_Z - 50,
      targetZ: orientation === "landscape" ? -150 : -120,
    };
  }

  // Desktop default
  return {
    fov: CAMERA_FOV,
    z: CAMERA_Z,
    targetZ: -120,
  };
};

// =============================
// SPEED CALCULATIONS
// =============================
export const getDotSpeed = () => {
  const deviceType = getDeviceTypeByWidth();
  switch (deviceType) {
    case "mobile":
      return 0.97;
    case "tablet":
      return 1.15;
    default:
      return 1.3;
  }
};

// =============================
// HEART SHAPE UTILITIES
// =============================
// Alternative heart shape - more like the simple outline in the image
export const getSimpleHeartPoint = (t: number) => {
  // Create a cleaner, more symmetric heart shape
  const cosT = Math.cos(t);
  const sinT = Math.sin(t);
  const cos2T = Math.cos(2 * t);

  // Simplified parametric equations for a more traditional heart shape
  const x = 16 * sinT * sinT * sinT;
  const y = 13 * cosT - 4 * cos2T - 2 * Math.cos(3 * t);

  return { x, y };
};

// =============================
// TYPE DEFINITIONS
// =============================
export type DeviceType = "mobile" | "tablet" | "desktop";
export type PerformanceTier = "ultra-low" | "low" | "medium" | "high";
export type DeviceOrientation = "portrait" | "landscape";
export type MaterialComplexity = "basic" | "simple" | "standard";

export interface OptimizedSettings {
  heartParticleCount: number;
  pixelRatio: number;
  antialias: boolean;
  splitRodCount: number;
  sparkleCount: number;
  lensFlareCount: number;
  bloomEnabled: boolean;
  shadowEnabled: boolean;
  animationFrameSkip: number;
  sideHeartsEnabled: boolean;
  particleEffectsEnabled: boolean;
  materialComplexity: MaterialComplexity;
  useSimpleBlending: boolean;
  disableMatrixUpdates: boolean;
}

export interface CameraSettings {
  fov: number;
  z: number;
  targetZ: number;
}

export interface HeartColor {
  tint: string;
  glow: string;
}

export interface HeartPoint {
  x: number;
  y: number;
}
