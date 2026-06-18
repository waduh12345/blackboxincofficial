"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Save,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import Swal from "sweetalert2";

// --- IMPORTS SERVICES & TYPES ---
import {
  useGetPublicContentBySectionQuery,
} from "@/services/public-content.service";
import {
  useCreateContentMutation,
  useUpdateContentMutation,
} from "@/services/admin/content.service";
import type { ContentItem } from "@/types/admin/content";

// --- IMPORTS MODE EDIT ---
import { useEditMode } from "@/hooks/use-edit-mode";
import { EditableImage, EditableText } from "@/components/ui/editable";
import { useLanguage } from "@/contexts/LanguageContext";
import DotdLoader from "@/components/loader/3dot";
import { Button } from "@/components/ui/button";

// --- KONFIGURASI BASE URL IMAGE ---
const STORAGE_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || ""
).replace("/api/v1", "");

// --- KAMUS BAHASA SEDERHANA ---
const TRANSLATIONS = {
  id: {
    upload: "Upload gambar",
    addNew: "Tambah Slider Baru",
    saving: "Menyimpan...",
    save: "Simpan",
    titlePlaceholder: "Judul Slider",
    successCreate: "Slider berhasil dibuat",
    successUpdate: "Slider berhasil diperbarui",
    errorFile: "Harap upload file gambar",
    empty: "Belum ada slider",
  },
  en: {
    upload: "Upload image",
    addNew: "Add New Slider",
    saving: "Saving...",
    save: "Save",
    titlePlaceholder: "Slider Title",
    successCreate: "Slider created successfully",
    successUpdate: "Slider updated successfully",
    errorFile: "Please upload an image file",
    empty: "No sliders yet",
  },
};

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
            <DotdLoader />
          </div>
        </div>
      }
    >
      <RunningCarouselContent {...props} />
    </Suspense>
  );
}

// Bangun URL gambar absolut dari berbagai bentuk path yang mungkin
// dikembalikan API (full URL, /storage/..., atau path relatif dari Laravel).
function buildImageUrl(source: string | File | Blob | null): string {
  if (!source) return "/placeholder.webp";
  if (source instanceof File || source instanceof Blob) {
    return URL.createObjectURL(source);
  }
  const s = source.trim();
  if (!s) return "/placeholder.webp";
  if (s.startsWith("http") || s.startsWith("data:") || s.startsWith("blob:")) {
    return s;
  }
  if (s.startsWith("/")) {
    // Pastikan tidak double slash & tetap mengarah ke storage backend
    return `${STORAGE_BASE_URL}${s}`;
  }
  return `${STORAGE_BASE_URL}/storage/${s}`;
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
  const { lang } = useLanguage();

  // Ref untuk input file create baru
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ambil teks label berdasarkan bahasa aktif
  const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS] || TRANSLATIONS.id;

  // 1. API HOOKS — baca slider hero dari CMS (sumber yang sama dengan admin)
  const {
    data: contentItems,
    isLoading,
    refetch,
  } = useGetPublicContentBySectionQuery("hero_slider");

  const [createContent, { isLoading: isCreating }] =
    useCreateContentMutation();
  const [updateContent, { isLoading: isUpdating }] =
    useUpdateContentMutation();

  // 2. STATE LOKAL — disusun urut sort_order, hanya yang aktif
  const slides = useMemo<ContentItem[]>(() => {
    const list = (contentItems || []).filter((c) => c.is_active);
    return [...list].sort((a, b) => a.sort_order - b.sort_order);
  }, [contentItems]);

  // Carousel Logic
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Tampilan desktop: tinggi slider mengikuti rasio asli gambar agar tampil
  // penuh (tidak terpotong). Di mobile tetap pakai tinggi tetap (heightClass).
  const [isDesktop, setIsDesktop] = useState(false);
  // Rasio (lebar/tinggi) per slide, diukur saat gambar desktop selesai dimuat.
  const [ratios, setRatios] = useState<Record<number, number>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (paused || isEditMode || slides.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [slides.length, intervalMs, paused, isEditMode]);

  const go = (dir: -1 | 1) =>
    setIndex((i) => (i + dir + slides.length) % slides.length);

  // --- HELPER: Bangun FormData untuk endpoint /web/contents ---
  const buildContentFormData = (params: {
    section?: string;
    title?: string;
    file?: File | Blob;
    mobileFile?: File | Blob;
    sortOrder?: number;
  }) => {
    const fd = new FormData();
    if (params.section) fd.append("section", params.section);
    if (params.title !== undefined) fd.append("title", params.title);
    fd.append("is_active", "1");
    fd.append("sort_order", String(params.sortOrder ?? 0));
    if (params.file) fd.append("image", params.file);
    if (params.mobileFile) fd.append("image_mobile", params.mobileFile);
    return fd;
  };

  // --- HELPER: Unified Save Handler ---
  const handleUpdateItem = async (
    slideIndex: number,
    field: "image" | "image_mobile" | "title",
    value: string | File | Blob,
    isNew: boolean = false
  ) => {
    const currentSlide = isNew ? null : slides[slideIndex];
    const isFileOrBlob = value instanceof File || value instanceof Blob;

    try {
      if (isNew) {
        // --- LOGIC CREATE ---
        if (field !== "image" || !isFileOrBlob) {
          Swal.fire("Error", t.errorFile, "warning");
          return;
        }

        const fd = buildContentFormData({
          section: "hero_slider",
          title: "New Slider",
          file: value as Blob,
          sortOrder: slides.length,
        });

        await createContent(fd).unwrap();
        Swal.fire({
          icon: "success",
          title: t.successCreate,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
        });
      } else if (currentSlide) {
        // --- LOGIC UPDATE ---
        const titleToSend =
          field === "title" ? (value as string) : currentSlide.title;
        const fd = buildContentFormData({
          section: "hero_slider",
          title: titleToSend ?? "",
          file: field === "image" && isFileOrBlob ? (value as Blob) : undefined,
          mobileFile: field === "image_mobile" && isFileOrBlob ? (value as Blob) : undefined,
          sortOrder: currentSlide.sort_order,
        });

        await updateContent({ id: currentSlide.id, payload: fd }).unwrap();
        Swal.fire({
          icon: "success",
          title: t.successUpdate,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
        });
      }

      refetch();
    } catch (error) {
      console.error("Slider save error:", error);
      const message =
        (error as { data?: { message?: string }; message?: string })?.data
          ?.message ||
        (error as { message?: string })?.message ||
        "Failed to save slider";
      Swal.fire("Error", message, "error");
    }
  };

  // --- RENDERING ---

  // 1. Loading State
  if (isLoading && slides.length === 0) {
    return (
      <div
        className={clsx(
          "relative w-full overflow-hidden rounded-3xl bg-gray-100 shadow-xl",
          heightClass
        )}
      >
        <div className="absolute inset-0 grid place-items-center">
          <DotdLoader />
        </div>
      </div>
    );
  }

  // 2. Empty State (Create First Slider)
  if (!isLoading && slides.length === 0) {
    return (
      <div
        className={clsx(
          "relative w-full overflow-hidden rounded-3xl bg-gray-100 shadow-xl flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-300",
          heightClass
        )}
      >
        <p className="text-gray-500">{t.empty}</p>
        {isEditMode && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-blue-600">{t.upload}:</p>
            <div
              className="w-32 h-32 relative bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-full h-full flex items-center justify-center">
                <PlusCircle className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  e.target.value = "";
                  handleUpdateItem(-1, "image", file, true);
                }
              }}
            />
          </div>
        )}
      </div>
    );
  }

  const activeSlide = slides[index];
  const activeRatio = activeSlide ? ratios[activeSlide.id] : undefined;
  // Pakai tinggi sesuai rasio gambar hanya di desktop & mode tampil (bukan edit).
  const useNaturalHeight = isDesktop && !isEditMode && !!activeRatio;

  return (
    <div
      className={clsx(
        "relative w-full overflow-hidden rounded-3xl bg-gray-100 shadow-xl group/carousel",
        !useNaturalHeight && heightClass
      )}
      style={
        useNaturalHeight
          ? {
              aspectRatio: String(activeRatio),
              maxHeight: "85vh",
              minHeight: "300px",
            }
          : undefined
      }
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* Track Slides */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={`${slide.id}-${i}`} className="relative min-w-full h-full">
            {isEditMode ? (
              /* MODE EDIT: tampilkan dua slot (desktop + mobile) sekaligus
                 supaya admin bisa upload kedua versi dari satu layar. */
              <div className="flex h-full w-full">
                <div className="relative h-full w-2/3 border-r border-white/40">
                  <span className="absolute top-2 left-2 z-20 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Desktop
                  </span>
                  <EditableImage
                    isEditMode={isEditMode}
                    src={buildImageUrl(slide.image)}
                    onSave={(file) => handleUpdateItem(i, "image", file, false)}
                    alt={slide.title || `Slide ${i + 1}`}
                    containerClassName="w-full h-full"
                    className="h-full w-full object-cover"
                    width={1200}
                    height={800}
                    priority={i === 0}
                  />
                </div>
                <div className="relative h-full w-1/3">
                  <span className="absolute top-2 left-2 z-20 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Mobile
                  </span>
                  <EditableImage
                    isEditMode={isEditMode}
                    src={buildImageUrl(slide.image_mobile || slide.image)}
                    onSave={(file) =>
                      handleUpdateItem(i, "image_mobile", file, false)
                    }
                    alt={slide.title || `Slide ${i + 1} (Mobile)`}
                    containerClassName="w-full h-full"
                    className="h-full w-full object-cover"
                    width={600}
                    height={800}
                    priority={i === 0}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* GAMBAR SLIDER DESKTOP — tampil penuh (tidak terpotong) */}
                <div className="absolute inset-0 hidden md:block">
                  {/* Backdrop blur untuk mengisi area kosong bila rasio berbeda */}
                  <Image
                    src={buildImageUrl(slide.image)}
                    alt=""
                    aria-hidden
                    fill
                    sizes="100vw"
                    className="object-cover blur-2xl scale-110 opacity-50"
                  />
                  {/* Gambar utama tampil utuh sesuai yang diupload */}
                  <Image
                    src={buildImageUrl(slide.image)}
                    alt={slide.title || `Slide ${i + 1}`}
                    fill
                    sizes="100vw"
                    priority={i === 0}
                    className="z-[1] object-contain"
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      if (img.naturalWidth && img.naturalHeight) {
                        setRatios((prev) =>
                          prev[slide.id]
                            ? prev
                            : {
                                ...prev,
                                [slide.id]:
                                  img.naturalWidth / img.naturalHeight,
                              }
                        );
                      }
                    }}
                  />
                </div>

                {/* GAMBAR SLIDER MOBILE */}
                <div className="absolute inset-0 block md:hidden">
                  <Image
                    src={buildImageUrl(slide.image_mobile || slide.image)}
                    alt={slide.title || `Slide ${i + 1} (Mobile)`}
                    fill
                    sizes="100vw"
                    priority={i === 0}
                    className="object-cover"
                  />
                </div>
              </>
            )}

            {/* Gradient Overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-[1]" />

            {/* JUDUL SLIDER (EDITABLE) */}
            <div className="absolute bottom-12 left-6 md:left-10 z-20 w-full max-w-2xl pr-4">
              <div className="text-white text-3xl md:text-4xl font-bold drop-shadow-md">
                <EditableText
                  isEditMode={isEditMode}
                  text={slide.title || ""}
                  onSave={(val) => handleUpdateItem(i, "title", val, false)}
                  className="bg-transparent border-none text-white focus:ring-0 placeholder:text-white/50 w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="group absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-black/60 z-20"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={() => go(1)}
            className="group absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-black/60 z-20"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={`dot-${i}`}
              onClick={() => setIndex(i)}
              className={clsx(
                "h-2.5 w-2.5 rounded-full transition-all duration-300",
                i === index
                  ? "bg-white shadow-md ring-2 ring-gray-400 w-8"
                  : "bg-gray-400/60 hover:bg-gray-300"
              )}
            />
          ))}
        </div>
      )}

      {/* INDIKATOR MODE EDIT & BUTTON SAVE/LOADING */}
      {isEditMode && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
          <div className="bg-blue-600/90 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider backdrop-blur-sm shadow-md">
            Editable
          </div>

          {isCreating || isUpdating ? (
            <div className="flex items-center gap-2 bg-emerald-600/90 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm shadow-md animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{t.saving}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white/20 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm border border-white/20">
              <Save className="w-3 h-3" />
              <span>{t.save} ready</span>
            </div>
          )}

          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  e.target.value = "";
                  handleUpdateItem(-1, "image", file, true);
                }
              }}
            />

            <Button
              size="icon"
              className="h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border-2 border-white/20"
              title={t.addNew}
              onClick={() => fileInputRef.current?.click()}
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
