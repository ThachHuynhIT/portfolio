"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection, GlassCard, ImageWithSkeleton, Icon } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";
import cloudinaryImageLoader from "@/lib/cloudinary-image-loader";
import type { PhotoItem } from "@/lib/types";

export interface PhotoPreviewSectionProps {
  photography: PhotoItem[];
}

export default function PhotoPreviewSection({ photography }: PhotoPreviewSectionProps) {
  const { t, locale } = useTranslation();

  // Filter featured photos
  const featuredPhotos: PhotoItem[] = useMemo(() => {
    const featured = photography.filter((p) => p.featured);
    return featured.length > 0 ? featured : photography.slice(0, 6);
  }, [photography]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(() => new Set([0]));

  useEffect(() => {
    setVisitedIndices((prev) => (prev.has(currentIndex) ? prev : new Set(prev).add(currentIndex)));
  }, [currentIndex]);

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
            <span className="text-xs text-cyan-400 light:text-cyan-700 font-semibold tracking-widest uppercase mb-3 block">
              {t("photoPreview.badge")}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white light:text-neutral-900 mb-4 tracking-tight">
              {t("photoPreview.titlePrefix")}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                {t("photoPreview.titleHighlight")}
              </span>
            </h2>
            <p className="text-white/60 light:text-neutral-500 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {t("photoPreview.subtitle")}
            </p>
          </div>
        </AnimatedSection>

        {/* Featured Slider Component */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main Showcase Card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 light:border-neutral-900/10 shadow-2xl light:shadow-neutral-400/20 bg-slate-950 aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/10] group">
            {/* Image layer: every visited slide stays mounted and crossfades via opacity,
                so revisits are instant and first visits keep the previous photo visible
                (instead of flashing the dark container) while the new one loads. */}
            <div className="absolute inset-0">
              {featuredPhotos.map((photo, idx) => {
                const isActive = idx === currentIndex;
                if (!isActive && !visitedIndices.has(idx)) return null;
                return (
                  <div
                    key={photo.id}
                    className={`absolute inset-0 transition-opacity duration-500 ease-out ${
                      isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    <ImageWithSkeleton
                      src={photo.image}
                      alt={photo.title}
                      fill
                      priority={isActive}
                      placeholderSrc={cloudinaryImageLoader({ src: photo.image, width: 32, quality: 30 })}
                      sizes="(max-width: 1024px) 100vw, 1200px"
                      className="object-cover object-center"
                    />
                  </div>
                );
              })}
            </div>

            {/* Hover-reveal detail overlay: darkening scrim + caption only appear on
                hover so the photo shows clean by default (falls back to always-visible
                on touch devices, where CSS hover isn't reliable). */}
            <div className="absolute inset-0 z-20 transition-opacity duration-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
              {/* Gradient Shadows for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />

              {/* Slide Content (text has no load latency, so a hard crossfade is fine here) */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhoto.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute bottom-0 inset-x-0 p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
                >
                  <div className="space-y-2 max-w-xl bg-black/35 backdrop-blur-md rounded-2xl px-4 py-3 sm:px-5 sm:py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-black shadow-sm">
                        <Icon name="star" size={11} /> {t("photography.featured")}
                      </span>
                      {currentPhoto.category && (
                        <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white backdrop-blur-md border border-white/15">
                          {currentPhoto.category}
                        </span>
                      )}
                      {currentPhoto.camera?.model && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/60 text-cyan-300 border border-cyan-500/20">
                          <Icon name="camera" size={11} /> {currentPhoto.camera.make} {currentPhoto.camera.model}
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
                        <Icon name="mapPin" size={12} /> {photoLoc}
                      </p>
                    )}
                  </div>

                  {/* Thumbnail counter */}
                  <div className="text-xs font-mono text-white/50 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 self-start sm:self-auto">
                    {currentIndex + 1} / {featuredPhotos.length}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/15 flex items-center justify-center backdrop-blur-md transition-all duration-200 z-30 shadow-lg active:scale-95"
            >
              <Icon name="arrowLeft" size={18} />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/15 flex items-center justify-center backdrop-blur-md transition-all duration-200 z-30 shadow-lg active:scale-95"
            >
              <Icon name="arrowRight" size={18} />
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
                    : "w-2 bg-white/20 light:bg-neutral-900/15 hover:bg-white/40 light:hover:bg-neutral-900/25"
                }`}
              />
            ))}
          </div>

          {/* Quick Preview Thumbnail Strip — single row, never wraps; scrolls
              horizontally instead of stacking into extra rows on narrow screens. */}
          <div className="hidden sm:flex gap-2.5 lg:gap-3 mt-6 overflow-x-auto scrollbar-none">
            {featuredPhotos.slice(0, 6).map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative flex-1 shrink-0 basis-28 sm:basis-32 lg:basis-0 aspect-[16/10] rounded-xl overflow-hidden border transition-all duration-200 ${
                  currentIndex === idx
                    ? "border-cyan-400 ring-2 ring-cyan-400/30 scale-105"
                    : "border-white/10 light:border-neutral-900/10 opacity-50 hover:opacity-100"
                }`}
              >
                <ImageWithSkeleton
                  src={photo.image}
                  alt={photo.title}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* View All Photography Gallery CTA Button */}
        <div className="mt-14 text-center">
          <Link
            href="/photography"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white light:text-neutral-900 bg-white/[0.06] light:bg-neutral-900/[0.05] hover:bg-white/[0.12] light:hover:bg-neutral-900/[0.08] border border-white/15 light:border-neutral-900/10 hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group"
          >
            <span>{t("photoPreview.viewAll")}</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              <Icon name="arrowRight" size={16} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
