// Permanently disable Next.js lockfile auto-patching crash
process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["heic-convert", "libheif-js"],
    optimizePackageImports: ["framer-motion"],
  },
  webpack: (config, { isServer, dev }) => {
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

    if (dev) {
      // src/lib/constants.ts statically imports these JSON files as build-time
      // data, so webpack's dev watcher treats them as source modules. The admin
      // API routes write directly to these same files on every save — without
      // this, every admin edit triggers a "content changed" HMR event that Fast
      // Refresh can't hot-swap (it's data, not a component) and falls back to a
      // full browser reload. Admin pages already reflect saves via local React
      // state, so they don't need the dev server to notice the file changed —
      // only a manual edit to these files outside the admin UI would now need a
      // dev server restart to be picked up.
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /[\\/]content[\\/]data[\\/]/,
      };
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

