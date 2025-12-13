"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import clsx from "clsx";
import Swal from "sweetalert2";

// --- IMPORTS SERVICES & TYPES ---
import {
  useGetSliderListQuery,
  useCreateSliderMutation,
  useUpdateSliderMutation,
} from "@/services/customize/home/slider.service";
import type { Slider } from "@/types/customization/home/slider";

// --- IMPORTS MODE EDIT ---
import { useEditMode } from "@/hooks/use-edit-mode";
import { EditableImage } from "@/components/ui/editable";
import { useLanguage } from "@/contexts/LanguageContext";
import DotdLoader from "@/components/loader/3dot";
import { Button } from "@/components/ui/button";

// --- KONFIGURASI BASE URL IMAGE ---
// Sesuaikan dengan URL backend Anda tempat file disimpan
const BASE_IMAGE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api-dev.blackbox.id";

// --- INTERFACES PROPS ---
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

  // Client Code (Untuk GET list)
  const [clientCode, setClientCode] = useState<string>("");
  useEffect(() => {
    const code =
      typeof window !== "undefined" ? localStorage.getItem("code_client") : "";
    if (code) setClientCode(code);
  }, []);

  // 1. API HOOKS
  // Pastikan refetch dipanggil saat bahasa berubah
  const {
    data: sliderApiResult,
    isLoading,
    refetch,
  } = useGetSliderListQuery(
    { client_code: clientCode, bahasa: lang },
    { skip: !clientCode }
  );

  // Trigger refetch saat bahasa berubah
  useEffect(() => {
    if (clientCode) refetch();
  }, [lang, clientCode, refetch]);

  const [createSlider, { isLoading: isCreating }] = useCreateSliderMutation();
  const [updateSlider, { isLoading: isUpdating }] = useUpdateSliderMutation();

  // 2. STATE LOKAL
  const [localSlides, setLocalSlides] = useState<Slider[]>([]);

  // 3. SYNC DATA API -> LOCAL STATE
  useEffect(() => {
    if (sliderApiResult?.data?.items) {
      setLocalSlides(sliderApiResult.data.items);
    }
  }, [sliderApiResult]);

  // Carousel Logic State
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Reset index jika jumlah item berubah
  useEffect(() => {
    setIndex(0);
  }, [localSlides.length]);

  // Logic Autoplay
  useEffect(() => {
    if (paused || isEditMode || localSlides.length <= 1) return;

    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % localSlides.length);
    }, intervalMs);

    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [localSlides.length, intervalMs, paused, isEditMode]);

  const go = (dir: -1 | 1) =>
    setIndex((i) => (i + dir + localSlides.length) % localSlides.length);

  // --- HELPER: Handle Save (Create / Update) ---
  const handleSaveSlider = async (
    slideIndex: number,
    newImageFileOrUrl: string | File,
    isNew: boolean = false
  ) => {
    if (!clientCode) return;

    const currentSlide = isNew ? null : localSlides[slideIndex];

    // Optimistic Update Local State (Preview)
    if (!isNew) {
      setLocalSlides((prev) => {
        const updated = [...prev];
        updated[slideIndex] = {
          ...updated[slideIndex],
          image: newImageFileOrUrl, // File object akan di-preview oleh getPreviewSrc
        };
        return updated;
      });
    }

    try {
      const formData = new FormData();
      formData.append("client_id", "6"); // Hardcode 6
      formData.append("bahasa", lang); // Gunakan bahasa aktif
      formData.append("status", "1");

      formData.append("judul", currentSlide?.judul || "Slider Image");

      // Handle Image Upload
      if (newImageFileOrUrl instanceof File) {
        formData.append("image", newImageFileOrUrl);
      } else if (isNew) {
        Swal.fire("Error", "Please upload an image file", "warning");
        return;
      }

      if (isNew) {
        // --- CREATE ---
        await createSlider(formData).unwrap();
        Swal.fire({
          icon: "success",
          title: "Slider Created",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
        });
      } else if (currentSlide?.id) {
        // --- UPDATE ---
        if (newImageFileOrUrl instanceof File) {
          await updateSlider({ id: currentSlide.id, data: formData }).unwrap();
          Swal.fire({
            icon: "success",
            title: "Slider Updated",
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 1500,
          });
        }
      }

      refetch();
    } catch (error) {
      console.error("Slider save error:", error);
      Swal.fire("Error", "Failed to save slider", "error");
    }
  };

  // --- HELPER: Get Image URL ---
  // Menggabungkan base URL jika source hanya nama file, atau return ObjectURL jika File
  const getImageUrl = (source: string | File | null) => {
    if (!source) return "/placeholder.webp";

    if (source instanceof File) {
      return URL.createObjectURL(source);
    }

    // Jika source adalah string (nama file dari DB)
    if (typeof source === "string") {
      // Cek apakah string sudah URL lengkap (http...) atau base64 (data:image...)
      if (source.startsWith("http") || source.startsWith("data:")) {
        return source;
      }
      // Jika hanya nama file, gabungkan dengan base URL backend
      // Sesuaikan path prefix jika backend menyimpannya di folder tertentu (misal /storage/)
      return `${BASE_IMAGE_URL}/storage/${source}`;
    }

    return "/placeholder.webp";
  };

  // --- RENDERING ---

  // 1. Loading State
  if (isLoading && localSlides.length === 0) {
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
  if (!isLoading && localSlides.length === 0) {
    return (
      <div
        className={clsx(
          "relative w-full overflow-hidden rounded-3xl bg-gray-100 shadow-xl flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-300",
          heightClass
        )}
      >
        <p className="text-gray-500">Belum ada slider.</p>
        {isEditMode && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-blue-600">Upload gambar pertama:</p>
            <div className="w-32 h-32 relative bg-white rounded-xl shadow-sm overflow-hidden">
              <EditableImage
                isEditMode={true}
                src="/placeholder.webp"
                onSave={(file) => handleSaveSlider(-1, file, true)}
                alt="Add New Slider"
                fill
                containerClassName="w-full h-full"
                className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <PlusCircle className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          </div>
        )}
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
        {localSlides.map((slide, i) => (
          <div key={`${slide.id}-${i}`} className="relative min-w-full h-full">
            {/* Menggunakan EditableImage dengan URL yang sudah diproses */}
            <EditableImage
              isEditMode={isEditMode}
              src={getImageUrl(slide.image)}
              onSave={(urlOrFile) => handleSaveSlider(i, urlOrFile, false)}
              alt={slide.judul || `Slide ${i + 1}`}
              containerClassName="w-full h-full"
              className="h-full w-full object-cover"
              width={1200}
              height={800}
              priority={i === 0}
            />

            {/* Gradient Overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-[1]" />

            {/* Caption */}
            {slide.judul && (
              <div className="absolute bottom-12 left-10 z-20 hidden md:block">
                <h2 className="text-white text-3xl font-bold drop-shadow-md">
                  {slide.judul}
                </h2>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Arrows */}
      {showArrows && localSlides.length > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="group absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-black/60 z-20"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            aria-label="Next slide"
            onClick={() => go(1)}
            className="group absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-black/60 z-20"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && localSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 z-20">
          {localSlides.map((_, i) => (
            <button
              key={`dot-${i}`}
              aria-label={`Go to slide ${i + 1}`}
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

      {/* Indikator Mode Edit & Add Button */}
      {isEditMode && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
          <div className="bg-blue-600/90 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider backdrop-blur-sm shadow-md">
            Editable
          </div>
          <div className="relative group/add">
            <Button
              size="icon"
              className="h-7 w-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
            <div className="absolute inset-0 opacity-0 cursor-pointer">
              <EditableImage
                isEditMode={true}
                src=""
                alt="Add new slider"
                onSave={(file) => handleSaveSlider(-1, file, true)}
              />
            </div>
          </div>
        </div>
      )}

      {(isCreating || isUpdating) && (
        <div className="absolute inset-0 z-50 bg-black/20 flex items-center justify-center backdrop-blur-[1px]">
          <div className="bg-white p-3 rounded-full shadow-xl">
            <DotdLoader />
          </div>
        </div>
      )}
    </div>
  );
}