"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { PhotoItem } from "@/lib/types";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";

interface GridLayoutProps {
  photos: PhotoItem[];
  onSelectPhoto: (photo: PhotoItem) => void;
}

export default function GridLayout({ photos, onSelectPhoto }: GridLayoutProps) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {photos.map((photo, index) => {
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

        return (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35 }}
            className="group rounded-2xl overflow-hidden bg-slate-900/50 border border-white/10 hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer flex flex-col"
            onClick={() => onSelectPhoto(photo)}
          >
            {/* Card Image */}
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-black/40">
              <Image
                src={photo.image}
                alt={photo.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Category badge */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                {photo.featured && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-black shadow-md flex items-center gap-1">
                    <span>⭐ {t("photography.featured", "Featured")}</span>
                  </span>
                )}
                {photo.category && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 text-white/90 backdrop-blur-md border border-white/15">
                    {photo.category}
                  </span>
                )}
                {isVideo && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/90 text-black shadow flex items-center gap-1">
                    <Icon name="play" size={10} />
                    <span>Video</span>
                  </span>
                )}
              </div>

              {/* Before/After tag */}
              {!isVideo && photo.beforeImage && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-500/90 text-white backdrop-blur-md shadow flex items-center gap-1">
                    <Icon name="compare" size={11} />
                    <span>Retouch</span>
                  </span>
                </div>
              )}

              {/* Video Play Overlay */}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/30 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                    <Icon name="play" size={18} className="text-cyan-400 translate-x-0.5" />
                  </div>
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>{photo.date}</span>
                  {photo.location && photo.location.trim() !== "" && (
                    <span className="truncate max-w-[140px]">{photo.location}</span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 mb-2">
                  {photo.title}
                </h3>
                {photo.description && photo.description.trim() !== "" && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {photo.description}
                  </p>
                )}
              </div>

              {/* Camera Exif bottom pill - only render if info exists */}
              {hasCameraInfo && (
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono text-cyan-400/90">
                    {photo.camera?.model || photo.camera?.make}
                  </span>
                  <span>
                    {[
                      photo.camera?.aperture,
                      photo.camera?.shutterSpeed,
                      photo.camera?.iso ? `ISO ${photo.camera.iso}` : "",
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
