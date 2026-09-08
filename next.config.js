// Permanently disable Next.js lockfile auto-patching crash
process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
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

