import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    // This is not recommended unless you already have ESLint configured to run
    // in a separate part of your workflow (for example, in CI or a pre-commit hook).
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
