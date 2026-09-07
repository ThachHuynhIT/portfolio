// Permanently disable Next.js lockfile auto-patching crash
process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["heic-convert", "libheif-js"],
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

