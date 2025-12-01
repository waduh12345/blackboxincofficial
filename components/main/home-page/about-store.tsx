"use client";

import { useState, useEffect, Suspense } from "react";
import { ShieldCheck, Truck, Diamond } from "lucide-react";
import { useGetGalleryListQuery } from "@/services/gallery.service";
import { GaleriItem } from "@/types/gallery";

// --- IMPORTS MODE EDIT ---
import { useEditMode } from "@/hooks/use-edit-mode";
import { EditableText, EditableImage } from "@/components/ui/editable";
import {
  EditableSection,
  BackgroundConfig,
} from "@/components/ui/editable-section";
import DotdLoader from "@/components/loader/3dot";

const FALLBACK =
  "https://placehold.co/1600x1200/png?text=Blackboxinc%20Gallery&font=montserrat";

// =========================================
// DEFAULT EXPORT (WRAPPER SUSPENSE)
// =========================================
export default function AboutStore() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex justify-center">
          <DotdLoader />
        </div>
      }
    >
      <AboutStoreContent />
    </Suspense>
  );
}

// =========================================
// CONTENT COMPONENT
// =========================================
function AboutStoreContent() {
  const isEditMode = useEditMode();
  const YEAR = new Date().getFullYear();

  // === 1. BACKGROUND STATE ===
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>({
    type: "solid",
    color1: "#ffffff",
  });

  // === 2. TEXT STATE ===
  const [texts, setTexts] = useState({
    badge: "Our Commitment",
    title: "BLACKBOX.INC — Timeless Style, Uncompromised Quality.",
    description:
      "We meticulously curate fashion products with high quality standards and timeless design. Our mission is simple: empower you to feel confident every day, effortlessly.",
    list1: "Guaranteed quality & authenticity",
    list2: "Fast & secure worldwide shipping",
    list3: "Curated new arrivals weekly",
    est: `Est. ${YEAR}`,
  });

  const updateText = (key: keyof typeof texts, val: string) => {
    setTexts((prev) => ({ ...prev, [key]: val }));
  };

  // === 3. IMAGE LOGIC (API + EDITABLE) ===
  const [displayImage, setDisplayImage] = useState(FALLBACK);

  // Fetch data
  const { data, isLoading, isError } = useGetGalleryListQuery({
    page: 1,
    paginate: 10,
  });

  // Effect: Update gambar dari API saat data tersedia
  useEffect(() => {
    const list: GaleriItem[] = data?.data ?? [];
    if (list.length > 0) {
      const sorted = [...list].sort((a, b) => {
        const tB =
          new Date(b.created_at ?? b.published_at).getTime() ||
          new Date().getTime();
        const tA =
          new Date(a.created_at ?? a.published_at).getTime() ||
          new Date().getTime();
        return tB - tA;
      });

      const top = sorted[0];
      const url = typeof top.image === "string" ? top.image : "";
      if (url) {
        setDisplayImage(url);
      }
    }
  }, [data]);

  return (
    <EditableSection
      isEditMode={isEditMode}
      config={bgConfig}
      onSave={setBgConfig}
      className="relative overflow-hidden"
    >
      <div className="container mx-auto py-12 md:px-4 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Kiri: Teks & Value */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-700 ring-1 ring-gray-300">
              <Diamond className="h-3.5 w-3.5 text-black" />
              <EditableText
                isEditMode={isEditMode}
                text={texts.badge}
                onSave={(v) => updateText("badge", v)}
                as="span"
              />
            </span>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-black md:text-4xl lg:text-5xl">
              <EditableText
                isEditMode={isEditMode}
                text={texts.title}
                onSave={(v) => updateText("title", v)}
              />
            </h2>

            <EditableText
              isEditMode={isEditMode}
              text={texts.description}
              onSave={(v) => updateText("description", v)}
              as="p"
              multiline
              className="mt-5 text-base text-gray-700 md:text-lg"
            />

            <ul className="mt-8 grid gap-4 text-base font-medium text-black sm:grid-cols-2">
              <li className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-black flex-shrink-0" />
                <EditableText
                  isEditMode={isEditMode}
                  text={texts.list1}
                  onSave={(v) => updateText("list1", v)}
                  as="span"
                />
              </li>
              <li className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-black flex-shrink-0" />
                <EditableText
                  isEditMode={isEditMode}
                  text={texts.list2}
                  onSave={(v) => updateText("list2", v)}
                  as="span"
                />
              </li>
              <li className="flex items-center gap-3">
                <Diamond className="h-5 w-5 text-black flex-shrink-0" />
                <EditableText
                  isEditMode={isEditMode}
                  text={texts.list3}
                  onSave={(v) => updateText("list3", v)}
                  as="span"
                />
              </li>
            </ul>
          </div>

          {/* Kanan: Gambar Editable */}
          <div className="relative order-first md:order-last">
            <div className="overflow-hidden rounded-2xl border-4 border-black shadow-2xl relative h-[380px] md:h-[500px] w-full">
              {/* Gunakan containerClassName w-full h-full karena parent sudah punya height fixed */}
              <EditableImage
                isEditMode={isEditMode}
                src={displayImage}
                onSave={setDisplayImage} // User bisa ganti manual
                alt="Gallery highlight"
                fill
                priority
                unoptimized
                containerClassName="w-full h-full"
                className="object-cover grayscale-[10%]"
              />
            </div>

            {/* Overlay kecil */}
            <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-4 py-2 text-sm font-semibold text-black shadow-md backdrop-blur-sm">
              <EditableText
                isEditMode={isEditMode}
                text={texts.est}
                onSave={(v) => updateText("est", v)}
                as="span"
              />
            </div>
          </div>
        </div>

        {/* State info sederhana (Hanya muncul jika loading awal dan belum ada gambar) */}
        {isLoading && displayImage === FALLBACK && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Memuat foto terbaru dari galeri...
          </p>
        )}
        {isError && displayImage === FALLBACK && (
          <p className="mt-6 text-center text-sm text-red-600">
            Gagal memuat galeri. Menampilkan gambar default.
          </p>
        )}
      </div>
    </EditableSection>
  );
}