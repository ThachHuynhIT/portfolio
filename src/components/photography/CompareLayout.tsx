"use client";

import { motion } from "framer-motion";
import type { PhotoItem } from "@/lib/types";
import BeforeAfterSlider from "./BeforeAfterSlider";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";

interface CompareLayoutProps {
  photos: PhotoItem[];
  onSelectPhoto: (photo: PhotoItem) => void;
}

export default function CompareLayout({ photos, onSelectPhoto }: CompareLayoutProps) {
  const { locale } = useTranslation();
  const comparablePhotos = photos.filter((p) => !!p.beforeImage);

  if (comparablePhotos.length === 0) {
    return (
      <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-2xl p-8">
        <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-4">
          <Icon name="compare" size={24} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          No comparison photos in this category
        </h3>
        <p className="text-sm text-white/50 max-w-md mx-auto">
          Only photos with both RAW/original and retouched versions are displayed here. Try selecting another category or &quot;All&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {comparablePhotos.map((photo, index) => {
        const title = locale === "vi" && photo.title_vi ? photo.title_vi : photo.title;
        const location = locale === "vi" && photo.location_vi ? photo.location_vi : photo.location;

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
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            className="rounded-3xl p-6 md:p-8 bg-slate-900/40 border border-white/10 shadow-xl"
          >
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {photo.category && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {photo.category}
                    </span>
                  )}
                  {photo.date && <span className="text-xs text-slate-400">{photo.date}</span>}
                  {location && location.trim() !== "" && (
                    <span className="text-xs text-slate-400">• {location}</span>
                  )}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white">{title}</h3>
              </div>

              <button
                type="button"
                onClick={() => onSelectPhoto(photo)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all self-start md:self-auto"
              >
                <Icon name="maximize" size={14} />
                <span>View Fullscreen</span>
              </button>
            </div>

            {/* Interactive Slider */}
            <div className="mb-6">
              <BeforeAfterSlider
                beforeImage={photo.beforeImage!}
                afterImage={photo.image}
                aspectRatio={photo.aspectRatio}
                alt={photo.title}
                beforeLabel="RAW / Original"
                afterLabel="Retouched"
              />
            </div>

            {/* Retouch Notes & EXIF Footer: only render if at least one exists */}
            {(hasEditingInfo || hasCameraInfo) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t border-white/10">
                {hasEditingInfo && (
                  <div className="rounded-xl bg-purple-500/[0.04] border border-purple-500/20 p-4">
                    <span className="font-semibold text-purple-300 uppercase tracking-wider block mb-1 text-[10px]">
                      Post-Processing Workflow
                    </span>
                    {photo.editing?.notes && (
                      <p className="text-slate-300 leading-relaxed">
                        {photo.editing.notes}
                      </p>
                    )}
                    {photo.editing?.software && (
                      <span className="inline-block mt-2 text-[11px] text-purple-400 font-medium">
                        Software: {photo.editing.software}
                      </span>
                    )}
                    {photo.editing?.colorGrade && (
                      <span className="inline-block mt-1 ml-2 text-[11px] text-cyan-400 font-medium">
                        Tone: {photo.editing.colorGrade}
                      </span>
                    )}
                  </div>
                )}

                {hasCameraInfo && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 flex flex-col justify-between">
                    <span className="font-semibold text-cyan-400 uppercase tracking-wider block mb-1 text-[10px]">
                      Technical Specs
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      {(photo.camera?.make || photo.camera?.model) && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">Gear</span>
                          <span>{[photo.camera?.make, photo.camera?.model].filter(Boolean).join(" ")}</span>
                        </div>
                      )}
                      {photo.camera?.lens && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">Lens</span>
                          <span>{photo.camera.lens}</span>
                        </div>
                      )}
                      {(photo.camera?.aperture || photo.camera?.shutterSpeed) && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">Aperture & Shutter</span>
                          <span>{[photo.camera?.aperture, photo.camera?.shutterSpeed].filter(Boolean).join(" • ")}</span>
                        </div>
                      )}
                      {photo.camera?.iso && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">ISO</span>
                          <span>ISO {photo.camera.iso}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
