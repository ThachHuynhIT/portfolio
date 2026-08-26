"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui";
import { siteConfig } from "@/lib/constants";

// Dynamic imports for 3D components to avoid SSR issues with Three.js
const SceneContainer = dynamic(
  () => import("@/components/3d/SceneContainer"),
  { ssr: false }
);

const Hero3DScene = dynamic(
  () => import("@/components/3d/Hero3DScene"),
  { ssr: false }
);

export default function HeroSection() {
  // Mutable ref instead of React state: Hero3DScene reads x/y inside an
  // r3f useFrame loop every animation frame, so mutating this object in
  // place avoids re-rendering the whole Hero tree on every mousemove.
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      mousePositionRef.current.x = (clientX / innerWidth - 0.5) * 2;
      mousePositionRef.current.y = (clientY / innerHeight - 0.5) * 2;
    },
    []
  );

  const handleViewWork = useCallback(() => {
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleDownloadCV = useCallback(() => {
    const link = document.createElement("a");
    link.href = "/resume.pdf";
    link.download = "";
    link.click();
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* 3D Background */}
      {isMounted && (
        <SceneContainer>
          <Hero3DScene mousePosition={mousePositionRef.current} />
        </SceneContainer>
      )}

      {/* Content Overlay */}
      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-white/70">Available for projects</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
          >
            <span className="text-white">Hi, I&apos;m </span>
            <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent">
              {siteConfig.author.name.split(" ")[0]}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto"
          >
            {siteConfig.author.bio}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" variant="primary" onClick={handleViewWork}>
              View My Work
            </Button>
            <Button size="lg" variant="outline" onClick={handleDownloadCV}>
              Download CV
            </Button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
          >
            <motion.span className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </motion.div>
        </motion.div>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-radial from-purple-500/10 via-transparent to-transparent pointer-events-none" />
    </section>
  );
}
