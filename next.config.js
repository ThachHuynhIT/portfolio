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
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000, // 30 days — photo/album/project images rarely change
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;

