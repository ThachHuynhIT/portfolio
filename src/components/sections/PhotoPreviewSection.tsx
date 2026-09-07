"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection, GlassCard } from "@/components/ui";
import { photography } from "@/lib/constants";
import { useTranslation } from "@/context/LanguageContext";
import type { PhotoItem } from "@/lib/types";

export default function PhotoPreviewSection() {
  const { t, locale } = useTranslation();

  // Filter featured photos
  const featuredPhotos: PhotoItem[] = useMemo(() => {
    const featured = photography.filter((p) => p.featured && p.published !== false);
    return featured.length > 0 ? featured : photography.slice(0, 6);
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % featuredPhotos.length);
  }, [featuredPhotos.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + featuredPhotos.length) % featuredPhotos.length);
  }, [featuredPhotos.length]);

  // Autoplay timer
  useEffect(() => {
    if (!isAutoPlaying || featuredPhotos.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, featuredPhotos.length]);

  if (featuredPhotos.length === 0) return null;

  const currentPhoto = featuredPhotos[currentIndex];
  const photoTitle = locale === "vi" && currentPhoto.title_vi ? currentPhoto.title_vi : currentPhoto.title;
  const photoDesc = locale === "vi" && currentPhoto.description_vi ? currentPhoto.description_vi : currentPhoto.description;
  const photoLoc = locale === "vi" && currentPhoto.location_vi ? currentPhoto.location_vi : currentPhoto.location;

  return (
    <section
      id="photos"
      className="relative py-28 overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Header */}
        <AnimatedSection>
          <div className="text-center mb-14">
            <span className="text-xs text-cyan-400 font-semibold tracking-widest uppercase mb-3 block">
              {t("photoPreview.badge")}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              {t("photoPreview.titlePrefix")}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                {t("photoPreview.titleHighlight")}
              </span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {t("photoPreview.subtitle")}
            </p>
          </div>
        </AnimatedSection>

        {/* Featured Slider Component */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main Showcase Card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-slate-950 aspect-[16/10] sm:aspect-[21/10] group">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhoto.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <img
                  src={currentPhoto.image}
                  alt={currentPhoto.title}
                  className="w-full h-full object-cover object-center"
                />

                {/* Gradient Shadows for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 sm:opacity-50" />

                {/* Slide Content Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-20">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-black shadow-sm">
                        ⭐ {t("photography.featured")}
                      </span>
                      {currentPhoto.category && (
                        <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white backdrop-blur-md border border-white/15">
                          {currentPhoto.category}
                        </span>
                      )}
                      {currentPhoto.camera?.model && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/60 text-cyan-300 border border-cyan-500/20">
                          📷 {currentPhoto.camera.make} {currentPhoto.camera.model}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {photoTitle}
                    </h3>

                    {photoDesc && (
                      <p className="text-white/80 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                        {photoDesc}
                      </p>
                    )}

                    {photoLoc && (
                      <p className="text-cyan-400/90 text-xs flex items-center gap-1 font-medium">
                        <span>📍</span> {photoLoc}
                      </p>
                    )}
                  </div>

                  {/* Thumbnail counter */}
                  <div className="text-xs font-mono text-white/50 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 self-start sm:self-auto">
                    {currentIndex + 1} / {featuredPhotos.length}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/15 flex items-center justify-center backdrop-blur-md transition-all duration-200 z-30 shadow-lg active:scale-95"
            >
              ←
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/15 flex items-center justify-center backdrop-blur-md transition-all duration-200 z-30 shadow-lg active:scale-95"
            >
              →
            </button>
          </div>

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {featuredPhotos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? "w-8 bg-gradient-to-r from-cyan-400 to-purple-500 shadow-sm shadow-cyan-500/50"
                    : "w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* Quick Preview Thumbnail Strip */}
          <div className="hidden sm:grid grid-cols-6 gap-3 mt-6">
            {featuredPhotos.slice(0, 6).map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative aspect-[16/10] rounded-xl overflow-hidden border transition-all duration-200 ${
                  currentIndex === idx
                    ? "border-cyan-400 ring-2 ring-cyan-400/30 scale-105"
                    : "border-white/10 opacity-50 hover:opacity-100"
                }`}
              >
                <img
                  src={photo.image}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* View All Photography Gallery CTA Button */}
        <div className="mt-14 text-center">
          <Link
            href="/photography"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group"
          >
            <span>{t("photoPreview.viewAll")}</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
