"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { useGetGalleryListQuery } from "@/services/gallery.service";

// --- IMPORTS MODE EDIT ---
import { useEditMode } from "@/hooks/use-edit-mode";
import { EditableImage } from "@/components/ui/editable";

// --- INTERFACES ---
interface GaleriItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  published_at: string;
  image: string | File | null;
}

interface GalleryListShape {
  data: GaleriItem[];
  last_page: number;
  current_page: number;
  total: number;
  per_page: number;
}

type RunningCarouselProps = {
  heightClass?: string;
  intervalMs?: number;
  showArrows?: boolean;
  showDots?: boolean;
};

// =========================================
// DEFAULT EXPORT (WRAPPER SUSPENSE)
// =========================================
export default function RunningCarousel(props: RunningCarouselProps) {
  return (
    <Suspense
      fallback={
        <div
          className={clsx(
            "relative w-full overflow-hidden rounded-3xl bg-gray-100 shadow-xl",
            props.heightClass || "h-[60vh]"
          )}
        >
          <div className="absolute inset-0 grid place-items-center text-sm text-gray-500">
            Memuat...
          </div>
        </div>
      }
    >
      <RunningCarouselContent {...props} />
    </Suspense>
  );
}

// =========================================
// CONTENT COMPONENT
// =========================================
function RunningCarouselContent({
  heightClass = "h-[60vh]",
  intervalMs = 3000,
  showArrows = true,
  showDots = true,
}: RunningCarouselProps) {
  const isEditMode = useEditMode();

  // Fetch data dari API
  const { data, isLoading, isError } = useGetGalleryListQuery({
    page: 1,
    paginate: 10,
  });

  // State lokal untuk menyimpan daftar gambar agar bisa diedit
  const [localItems, setLocalItems] = useState<string[]>([]);

  // Sinkronisasi data API ke state lokal saat data tersedia
  useEffect(() => {
    const list = (data as GalleryListShape | undefined)?.data ?? [];
    const images = list
      .map((it) => (typeof it.image === "string" ? it.image : ""))
      .filter((u): u is string => u.length > 0);

    // Hanya set jika localItems masih kosong atau data berubah drastis
    // (Dalam kasus nyata, logic ini bisa disesuaikan agar tidak menimpa edit user saat re-fetch)
    if (images.length > 0) {
      setLocalItems(images);
    }
  }, [data]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Reset index jika jumlah item berubah
  useEffect(() => {
    setIndex(0);
  }, [localItems.length]);

  // Logic Autoplay
  useEffect(() => {
    // Pause autoplay jika sedang mode edit agar tidak mengganggu
    if (paused || isEditMode || localItems.length <= 1) return;

    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % localItems.length);
    }, intervalMs);

    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [localItems.length, intervalMs, paused, isEditMode]);

  const go = (dir: -1 | 1) =>
    setIndex((i) => (i + dir + localItems.length) % localItems.length);

  // Handler simpan gambar baru (hanya di state lokal)
  const handleImageSave = (imgIndex: number, newUrl: string) => {
    setLocalItems((prev) => {
      const updated = [...prev];
      updated[imgIndex] = newUrl;
      return updated;
    });
  };

  // --- RENDERING STATES ---

  if (isLoading && localItems.length === 0) {
    return (
      <div
        className={clsx(
          "relative w-full overflow-hidden rounded-3xl bg-gray-100 shadow-xl",
          heightClass
        )}
      >
        <div className="absolute inset-0 grid place-items-center text-sm text-gray-500">
          Memuat galeri…
        </div>
      </div>
    );
  }

  if ((isError && localItems.length === 0) || localItems.length === 0) {
    return (
      <div
        className={clsx(
          "relative w-full overflow-hidden rounded-3xl bg-gray-100 shadow-xl",
          heightClass
        )}
      >
        <div className="absolute inset-0 grid place-items-center text-sm text-gray-500">
          Belum ada gambar galeri.
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        `relative w-full overflow-hidden rounded-3xl ${heightClass} bg-gray-100`,
        "shadow-xl group/carousel"
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* Track Slides */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {localItems.map((src, i) => (
          <div key={`${i}-slide`} className="relative min-w-full h-full">
            {/* Menggunakan EditableImage */}
            <EditableImage
              isEditMode={isEditMode}
              src={src}
              onSave={(url) => handleImageSave(i, url)}
              alt={`Slide ${i + 1}`}
              containerClassName="w-full h-full"
              className="h-full w-full object-cover"
              // Gunakan width/height besar agar kualitas bagus, atau fill jika parent relative
              width={1200}
              height={800}
              priority={i === 0} // Prioritaskan slide pertama
            />

            {/* Gradient Overlay (untuk estetika) */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-[1]" />
          </div>
        ))}
      </div>

      {/* Arrows */}
      {showArrows && localItems.length > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="group absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-black z-20"
          >
            <ChevronLeft className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
          </button>
          <button
            aria-label="Next slide"
            onClick={() => go(1)}
            className="group absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-black z-20"
          >
            <ChevronRight className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && localItems.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 z-20">
          {localItems.map((_, i) => (
            <button
              key={`dot-${i}`}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={clsx(
                "h-2.5 w-2.5 rounded-full transition-all duration-300",
                i === index
                  ? "bg-white shadow-md ring-2 ring-gray-400"
                  : "bg-gray-400/60 hover:bg-gray-300"
              )}
            />
          ))}
        </div>
      )}

      {/* Indikator Mode Edit (Opsional, jika ingin penanda khusus di komponen ini) */}
      {isEditMode && (
        <div className="absolute top-4 left-4 z-30 bg-blue-600/80 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider pointer-events-none backdrop-blur-sm">
          Editable
        </div>
      )}
    </div>
  );
}