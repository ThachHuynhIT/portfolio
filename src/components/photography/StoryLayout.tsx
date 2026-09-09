"use client";

import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";
import { motion } from "framer-motion";
import type { PhotoItem } from "@/lib/types";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";

interface StoryLayoutProps {
  photos: PhotoItem[];
  onSelectPhoto: (photo: PhotoItem) => void;
}

export default function StoryLayout({ photos, onSelectPhoto }: StoryLayoutProps) {
  const { t, locale } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto space-y-16">
      {photos.map((photo, index) => {
        const title = locale === "vi" && photo.title_vi ? photo.title_vi : photo.title;
        const desc = locale === "vi" && photo.description_vi ? photo.description_vi : photo.description;
        const location = locale === "vi" && photo.location_vi ? photo.location_vi : photo.location;
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

        return (
          <motion.article
            key={photo.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.5 }}
            className="group rounded-3xl overflow-hidden bg-slate-900/50 border border-white/10 hover:border-white/20 transition-all duration-300 light:bg-white light:border-neutral-900/10 light:hover:border-neutral-900/15"
          >
            {/* Main Visual */}
            <div
              className="relative w-full aspect-[16/10] overflow-hidden bg-black cursor-pointer"
              onClick={() => onSelectPhoto(photo)}
            >
              <ImageWithSkeleton
                src={photo.image}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-cover transition-transform duration-700 group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />

              {/* Video Play badge */}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/30 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                    <Icon name="play" size={24} className="text-cyan-400 translate-x-0.5" />
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 right-4 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-black/80 transition-colors">
                  <Icon name={isVideo ? "play" : "maximize"} size={13} />
                  <span>{isVideo ? "Xem Video" : "Xem Ảnh Lớn"}</span>
                </span>
              </div>
            </div>

            {/* Editorial Content */}
            <div className="p-6 md:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 light:text-neutral-500">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-medium light:bg-neutral-900/10 light:text-neutral-900">
                    {photo.category}
                  </span>
                  {isVideo && (
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold uppercase text-[10px]">
                      Video
                    </span>
                  )}
                  {photo.date && <span>{photo.date}</span>}
                </div>
                {location && location.trim() !== "" && (
                  <span className="flex items-center gap-1 text-slate-300 light:text-neutral-600">
                    <Icon name="globe" size={12} className="text-cyan-400" />
                    {location}
                  </span>
                )}
              </div>

              <div>
                <h2
                  className="text-2xl md:text-3xl font-bold text-white mb-3 hover:text-cyan-300 transition-colors cursor-pointer light:text-neutral-900"
                  onClick={() => onSelectPhoto(photo)}
                >
                  {title}
                </h2>
                {desc && desc.trim() !== "" && (
                  <p className="text-base text-slate-300/90 leading-relaxed font-light light:text-neutral-600">
                    {desc}
                  </p>
                )}
              </div>

              {/* Editing and EXIF Badges: only show if at least one exists */}
              {(hasCameraInfo || hasEditingInfo) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {hasCameraInfo && (
                    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 text-xs light:bg-neutral-900/[0.03] light:border-neutral-900/10">
                      <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
                        <Icon name="camera" size={13} />
                        <span>Gear & Settings</span>
                      </div>
                      {(photo.camera?.make || photo.camera?.model) && (
                        <p className="text-slate-200 font-medium light:text-neutral-700">
                          {[photo.camera?.make, photo.camera?.model].filter(Boolean).join(" ")}
                        </p>
                      )}
                      {photo.camera?.lens && (
                        <p className="text-slate-400 mt-0.5 light:text-neutral-500">
                          {photo.camera.lens}
                        </p>
                      )}
                      <p className="text-slate-400 font-mono mt-1 text-[11px] light:text-neutral-500">
                        {[photo.camera?.focalLength, photo.camera?.aperture, photo.camera?.shutterSpeed, photo.camera?.iso ? `ISO ${photo.camera.iso}` : ""]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                  )}

                  {hasEditingInfo && (
                    <div className="rounded-xl bg-purple-500/[0.03] border border-purple-500/15 p-4 text-xs">
                      <div className="flex items-center gap-2 text-purple-400 font-semibold mb-2">
                        <Icon name="compare" size={13} />
                        <span>Color Concept</span>
                      </div>
                      {photo.editing?.colorGrade && (
                        <p className="text-slate-200 font-medium light:text-neutral-700">{photo.editing.colorGrade}</p>
                      )}
                      {photo.editing?.notes && (
                        <p className="text-slate-400 mt-1 text-xs leading-relaxed light:text-neutral-500">
                          {photo.editing.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
