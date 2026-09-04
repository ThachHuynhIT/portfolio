"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { PhotoItem } from "@/lib/types";
import Icon from "@/components/ui/Icon";

interface MasonryLayoutProps {
  photos: PhotoItem[];
  onSelectPhoto: (photo: PhotoItem) => void;
}

export default function MasonryLayout({ photos, onSelectPhoto }: MasonryLayoutProps) {
  const columns = useMemo(() => {
    const cols: PhotoItem[][] = [[], [], []];
    photos.forEach((photo, index) => {
      cols[index % 3].push(photo);
    });
    return cols;
  }, [photos]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {columns.map((colPhotos, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-6">
          {colPhotos.map((photo, pIdx) => {
            const isVideo = photo.mediaType === "video" || Boolean(photo.videoUrl);
            const isPortrait = photo.aspectRatio === "portrait";
            const aspectClass = isPortrait
              ? "aspect-[3/4]"
              : photo.aspectRatio === "square"
              ? "aspect-square"
              : "aspect-[16/10]";

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
              <motion.article
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (colIndex * 3 + pIdx) * 0.05, duration: 0.4 }}
                className="group relative rounded-2xl overflow-hidden bg-slate-900/60 border border-white/10 shadow-lg hover:shadow-2xl hover:shadow-purple-500/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                onClick={() => onSelectPhoto(photo)}
              >
                {/* Image Container */}
                <div className={`relative w-full overflow-hidden ${aspectClass}`}>
                  <Image
                    src={photo.image}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Video Play Overlay */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/30 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                        <Icon name="play" size={18} className="text-cyan-400 translate-x-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Badges on Top */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5">
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

                    {!isVideo && photo.beforeImage && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-md flex items-center gap-1">
                        <Icon name="compare" size={11} />
                        <span>Before / After</span>
                      </span>
                    )}
                  </div>

                  {/* Info Overlay on Bottom */}
                  <div className="absolute bottom-0 inset-x-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100 z-10">
                    <h3 className="text-base font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                      {photo.title}
                    </h3>

                    {photo.description && photo.description.trim() !== "" && (
                      <p className="text-xs text-white/70 line-clamp-2 mb-3">
                        {photo.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-white/60 pt-2 border-t border-white/10">
                      <span>{photo.date}</span>
                      {hasCameraInfo && (
                        <span className="font-mono text-cyan-400/90">
                          {photo.camera?.model || photo.camera?.make} {photo.camera?.focalLength && `• ${photo.camera.focalLength}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      ))}
    </div>
  );
}
