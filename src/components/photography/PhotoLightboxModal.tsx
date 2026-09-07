"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { PhotoItem } from "@/lib/types";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";

interface PhotoLightboxModalProps {
  photo: PhotoItem | null;
  photos: PhotoItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photo: PhotoItem) => void;
}

export default function PhotoLightboxModal({
  photo,
  photos,
  isOpen,
  onClose,
  onSelectPhoto,
}: PhotoLightboxModalProps) {
  const { locale } = useTranslation();
  const [showBefore, setShowBefore] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  const currentIndex = photo ? photos.findIndex((p) => p.id === photo.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < photos.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      setShowBefore(false);
      setIsZoomed(false);
      onSelectPhoto(photos[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, photos, onSelectPhoto]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      setShowBefore(false);
      setIsZoomed(false);
      onSelectPhoto(photos[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, photos, onSelectPhoto]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "i" || e.key === "I") setShowInfo((v) => !v);
      if (e.key === "b" || e.key === "B") {
        if (photo?.beforeImage) setShowBefore((v) => !v);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, handlePrev, handleNext, photo]);

  if (!photo) return null;

  const isVideo = photo.mediaType === "video" || Boolean(photo.videoUrl);

  const hasCameraInfo = Boolean(
    photo.camera &&
      (photo.camera.make ||
        photo.camera.model ||
        photo.camera.lens ||
        photo.camera.focalLength ||
        photo.camera.aperture ||
        photo.camera.shutterSpeed ||
        photo.camera.iso)
  );

  const hasEditingInfo = Boolean(
    photo.editing &&
      (photo.editing.software || photo.editing.colorGrade || photo.editing.notes)
  );

  const hasTags = Boolean(
    photo.tags && photo.tags.length > 0 && photo.tags.some((t) => Boolean(t && t.trim()))
  );

  const currentDisplayImage =
    showBefore && photo.beforeImage ? photo.beforeImage : photo.image;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
          />

          {/* Top Control Bar */}
          <header className="absolute top-0 inset-x-0 h-16 px-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/80 to-transparent">
            {/* Title & Counter */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-full">
                {currentIndex + 1} / {photos.length}
              </span>
              <h3 className="text-sm md:text-base font-semibold text-white truncate max-w-xs md:max-w-md flex items-center gap-2">
                {isVideo && <Icon name="video" size={15} className="text-cyan-400" />}
                <span>{photo.title}</span>
              </h3>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Before/After Toggle Button (if beforeImage exists and not video) */}
              {!isVideo && photo.beforeImage && (
                <button
                  type="button"
                  onClick={() => setShowBefore(!showBefore)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 border ${
                    showBefore
                      ? "bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/30"
                      : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20"
                  }`}
                  title="Press B to toggle"
                >
                  <Icon name="compare" size={13} />
                  <span>{showBefore ? "RAW (Before)" : "Retouched (After)"}</span>
                </button>
              )}

              {/* Zoom toggle (only for images) */}
              {!isVideo && (
                <button
                  type="button"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className={`p-2 rounded-full border transition-all text-white ${
                    isZoomed
                      ? "bg-cyan-500 text-black border-cyan-400"
                      : "bg-white/10 border-white/15 hover:bg-white/20"
                  }`}
                  title="Zoom in / out"
                >
                  <Icon name="maximize" size={16} />
                </button>
              )}

              {/* Info drawer toggle */}
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className={`p-2 rounded-full border transition-all ${
                  showInfo
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                    : "bg-white/10 text-white/70 border-white/15 hover:bg-white/20"
                }`}
                title="Toggle info panel (Key: I)"
              >
                <Icon name="aperture" size={16} />
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/25 border border-white/20 transition-all ml-2"
                title="Close (Esc)"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          </header>

          {/* Navigation Arrows */}
          {hasPrev && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/15 hover:border-cyan-400/50 backdrop-blur-md transition-all shadow-xl active:scale-95"
              aria-label="Previous photo"
            >
              <Icon name="chevronLeft" size={20} />
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/15 hover:border-cyan-400/50 backdrop-blur-md transition-all shadow-xl active:scale-95"
              aria-label="Next photo"
            >
              <Icon name="chevronRight" size={20} />
            </button>
          )}

          {/* Main Media Canvas (Image or Video) */}
          <div
            className={`relative z-30 w-full h-full p-4 md:p-14 flex items-center justify-center transition-all ${
              showInfo ? "md:pr-96" : ""
            }`}
          >
            {isVideo ? (
              <div className="relative max-w-full max-h-[82vh] flex items-center justify-center">
                <video
                  src={photo.videoUrl || photo.image}
                  poster={photo.image}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl border border-white/10 bg-black"
                />
              </div>
            ) : (
              <motion.div
                key={photo.id + (showBefore ? "-before" : "-after")}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`relative max-w-full max-h-full flex items-center justify-center transition-transform duration-300 ${
                  isZoomed ? "cursor-zoom-out scale-125" : "cursor-zoom-in"
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
              >
                <Image
                  src={currentDisplayImage}
                  alt={photo.title}
                  width={1920}
                  height={1280}
                  className="max-h-[82vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                  priority
                />

                {showBefore && (
                  <div className="absolute top-4 left-4 bg-purple-600/90 text-white text-xs font-bold px-3 py-1 rounded-md backdrop-blur-md uppercase tracking-wider shadow-lg">
                    Original RAW Preview
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Info Sidebar */}
          <AnimatePresence>
            {showInfo && (
              <motion.aside
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute right-0 top-16 bottom-0 w-full sm:w-88 md:w-96 z-40 bg-slate-950/90 border-l border-white/10 backdrop-blur-2xl p-6 overflow-y-auto flex flex-col gap-6 shadow-2xl"
              >
                {/* Category & Date */}
                <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    {photo.category && (
                      <span className="px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-medium">
                        {photo.category}
                      </span>
                    )}
                    {isVideo && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider">
                        Video
                      </span>
                    )}
                  </div>
                  {photo.date && <span>{photo.date}</span>}
                </div>

                {/* Title & Description */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    {locale === "vi" && photo.title_vi ? photo.title_vi : photo.title}
                  </h2>
                  {(locale === "vi" && photo.description_vi ? photo.description_vi : photo.description) && (
                    <p className="text-sm text-slate-300/80 leading-relaxed">
                      {locale === "vi" && photo.description_vi ? photo.description_vi : photo.description}
                    </p>
                  )}
                  {(locale === "vi" && photo.location_vi ? photo.location_vi : photo.location) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2.5">
                      <Icon name="globe" size={13} className="text-cyan-400" />
                      <span>{locale === "vi" && photo.location_vi ? photo.location_vi : photo.location}</span>
                    </div>
                  )}
                </div>

                {/* Camera EXIF Details: ONLY render if at least one property exists */}
                {hasCameraInfo && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                      <Icon name="camera" size={14} />
                      <span>Camera Settings (EXIF)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      {(photo.camera?.make || photo.camera?.model) && (
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[10px] uppercase">Body</span>
                          <span className="text-slate-200 font-medium">
                            {[photo.camera?.make, photo.camera?.model].filter(Boolean).join(" ")}
                          </span>
                        </div>
                      )}
                      {photo.camera?.lens && (
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[10px] uppercase">Lens</span>
                          <span className="text-slate-200 font-medium">{photo.camera.lens}</span>
                        </div>
                      )}
                      {photo.camera?.focalLength && (
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Focal Length</span>
                          <span className="text-slate-200 font-medium">{photo.camera.focalLength}</span>
                        </div>
                      )}
                      {photo.camera?.aperture && (
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Aperture</span>
                          <span className="text-slate-200 font-medium">{photo.camera.aperture}</span>
                        </div>
                      )}
                      {photo.camera?.shutterSpeed && (
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Shutter</span>
                          <span className="text-slate-200 font-medium">{photo.camera.shutterSpeed}</span>
                        </div>
                      )}
                      {photo.camera?.iso && (
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">ISO</span>
                          <span className="text-slate-200 font-medium">{photo.camera.iso}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Retouching & Editing notes: ONLY render if at least one property exists */}
                {hasEditingInfo && (
                  <div className="rounded-xl bg-purple-500/[0.04] border border-purple-500/20 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                      <Icon name="compare" size={14} />
                      <span>Post-Processing & Grading</span>
                    </div>

                    {photo.editing?.software && (
                      <div className="text-xs">
                        <span className="text-slate-500 block text-[10px] uppercase">Software</span>
                        <span className="text-slate-200 font-medium">{photo.editing.software}</span>
                      </div>
                    )}
                    {photo.editing?.colorGrade && (
                      <div className="text-xs">
                        <span className="text-slate-500 block text-[10px] uppercase">Color Grade</span>
                        <span className="text-slate-200 font-medium">{photo.editing.colorGrade}</span>
                      </div>
                    )}
                    {photo.editing?.notes && (
                      <div className="text-xs">
                        <span className="text-slate-500 block text-[10px] uppercase">Retouch Notes</span>
                        <p className="text-slate-300 text-xs leading-relaxed mt-1">
                          {photo.editing.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags: ONLY render if tags exist */}
                {hasTags && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-2 font-medium">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {photo.tags.filter(Boolean).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-md text-[11px] bg-white/5 border border-white/10 text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Open Full resolution link */}
                <div className="pt-2 mt-auto">
                  <a
                    href={photo.videoUrl || photo.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/15 transition-all"
                  >
                    <Icon name="maximize" size={13} />
                    <span>{isVideo ? "Open Original Video" : "View Full-Resolution Image"}</span>
                  </a>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
