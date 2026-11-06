// Permanently disable Next.js lockfile auto-patching crash
process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = "1";

// sha256 of the exact bytes of THEME_INIT_SCRIPT (src/lib/theme-init.ts),
// the only inline script we author. This file is CommonJS and cannot import
// TS, so the value is pinned here and src/lib/security-headers.test.ts
// recomputes it from buildThemeInitScript() and fails on any drift (the
// failure message prints the new value to paste here).
const THEME_INIT_SCRIPT_HASH = "'sha256-8SgP8QpJK+AT0brrgHYBc89v6XcPqUDW59EQm/wIrzE='";

const CLOUDINARY = "https://res.cloudinary.com";

// Full policy, REPORT-ONLY by decision (spec F4): Next 14 / RSC inject inline
// scripts the theme hash does not cover, so enforcing this would break the
// app without nonces (which would force dynamic rendering). Violations are
// logged in the browser console for review; never enforce it as-is.
const REPORT_ONLY_CSP = [
  "default-src 'self'",
  `script-src 'self' ${THEME_INIT_SCRIPT_HASH}${
    process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""
  }`,
  // Framer Motion, next/font and React style props set inline styles.
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${CLOUDINARY} https://images.unsplash.com`,
  `media-src 'self' blob: ${CLOUDINARY}`,
  "font-src 'self' data:",
  "connect-src 'self'",
  // CV preview iframe (resumeUrl is a Cloudinary or same-origin file).
  `frame-src 'self' ${CLOUDINARY}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

// No Strict-Transport-Security here: Vercel already sends
// `max-age=63072000; includeSubDomains; preload` for the production domain
// (verified with `curl.exe -sI https://portfolio-thach.vercel.app/`), and a
// second header from the app would duplicate/conflict with it.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  // Enforcing CSP limited to frame-ancestors (cannot break page rendering).
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Content-Security-Policy-Report-Only", value: REPORT_ONLY_CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  experimental: {
    serverComponentsExternalPackages: ["heic-convert", "libheif-js"],
    optimizePackageImports: ["framer-motion"],
  },
  webpack: (config, { isServer }) => {
    config.module = config.module || {};
    config.module.exprContextCritical = false;

    if (isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /libheif-js/,
        },
      ];
    }

    return config;
  },
  images: {
    // Cloudinary already does on-the-fly resizing/format-conversion at its
    // CDN edge. Using its own transformation URLs (via the custom loader
    // below) instead of Next.js's built-in optimizer means the browser
    // fetches resized images directly from Cloudinary, instead of every
    // request round-tripping through our own server first.
    loader: "custom",
    loaderFile: "./src/lib/cloudinary-image-loader.ts",
  },
};

module.exports = nextConfig;

