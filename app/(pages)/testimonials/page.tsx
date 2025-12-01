"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// --- IMPORTS MODE EDIT ---
import { useEditMode } from "@/hooks/use-edit-mode";
import { EditableText, EditableLink } from "@/components/ui/editable";
import {
  EditableSection,
  BackgroundConfig,
} from "@/components/ui/editable-section";
import DotdLoader from "@/components/loader/3dot";

// =========================================
// DEFAULT EXPORT (WRAPPER)
// =========================================
export default function TestimonialsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center">
          <DotdLoader />
        </div>
      }
    >
      <TestimonialsContent />
    </Suspense>
  );
}

// =========================================
// CONTENT COMPONENT
// =========================================
function TestimonialsContent() {
  const isEditMode = useEditMode();

  // === 1. BACKGROUND STATES ===
  // Background untuk Section Stats (Default Putih)
  const [statsBg, setStatsBg] = useState<BackgroundConfig>({
    type: "solid",
    color1: "#ffffff",
  });

  // Background untuk CTA Card (Default Gradient Abu-abu #6B6B6B)
  const [ctaBg, setCtaBg] = useState<BackgroundConfig>({
    type: "gradient",
    color1: "#6B6B6B",
    color2: "#555555", // Sedikit lebih gelap
    direction: "to right",
  });

  // === 2. CONTENT STATES ===
  // Stats Data
  const [stats, setStats] = useState([
    { id: 1, value: "10K+", label: "Pelanggan Puas" },
    { id: 2, value: "95%", label: "Repeat Order" },
    { id: 3, value: "4.9/5", label: "Rating Rata-rata" },
  ]);

  // CTA Text Data
  const [ctaContent, setCtaContent] = useState({
    title: "Siap Membuktikan Sendiri?",
    description:
      "Gabung dengan ribuan pelanggan yang sudah merasakan manfaat Shop BLACKBOX.INC. Mulailah perjalanan kulit sehat dan glowing Anda hari ini.",
    btnText: "Belanja Sekarang",
    btnUrl: "/product",
  });

  // === 3. UPDATER FUNCTIONS ===
  const updateStat = (index: number, field: "value" | "label", val: string) => {
    const newStats = [...stats];
    newStats[index][field] = val;
    setStats(newStats);
  };

  const updateCta = (key: keyof typeof ctaContent, val: string) => {
    setCtaContent((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <>
      {/* ===================== CUSTOMER STATS SECTION ===================== */}
      <EditableSection
        isEditMode={isEditMode}
        config={statsBg}
        onSave={setStatsBg}
        className="px-6 lg:px-12 py-16"
      >
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100"
            >
              <h3 className="text-4xl font-bold text-[#6B6B6B] mb-2">
                <EditableText
                  isEditMode={isEditMode}
                  text={stat.value}
                  onSave={(v) => updateStat(index, "value", v)}
                />
              </h3>
              <p className="text-gray-600">
                <EditableText
                  isEditMode={isEditMode}
                  text={stat.label}
                  onSave={(v) => updateStat(index, "label", v)}
                />
              </p>
            </motion.div>
          ))}
        </div>
      </EditableSection>

      {/* ===================== CTA SECTION ===================== */}
      <section className="px-6 lg:px-12 py-20 bg-transparent">
        <div className="container mx-auto">
          {/* Kita menggunakan EditableSection di sini untuk membungkus "Card" CTA 
             agar user bisa mengubah warna gradient box-nya.
          */}
          <EditableSection
            isEditMode={isEditMode}
            config={ctaBg}
            onSave={setCtaBg}
            className="rounded-3xl p-12 text-center text-white shadow-2xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl lg:text-4xl font-bold mb-4">
                <EditableText
                  isEditMode={isEditMode}
                  text={ctaContent.title}
                  onSave={(v) => updateCta("title", v)}
                />
              </h3>

              <EditableText
                isEditMode={isEditMode}
                text={ctaContent.description}
                onSave={(v) => updateCta("description", v)}
                as="p"
                multiline
                className="text-lg text-white/90 mb-8 max-w-2xl mx-auto"
              />

              <div className="flex justify-center">
                <EditableLink
                  isEditMode={isEditMode}
                  label={ctaContent.btnText}
                  href={ctaContent.btnUrl}
                  onSave={(l, h) => {
                    updateCta("btnText", l);
                    updateCta("btnUrl", h);
                  }}
                  // Menambahkan styling motion secara manual via class atau wrapper
                  // Karena EditableLink merender <a> atau <div>, kita styling class-nya mirip button
                  className="bg-white text-[#6B6B6B] px-8 py-4 rounded-2xl font-semibold hover:bg-gray-100 transition-transform active:scale-95 inline-flex items-center justify-center shadow-md"
                />
              </div>
            </motion.div>
          </EditableSection>
        </div>
      </section>

      {/* Indikator Mode Edit */}
      {isEditMode && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm font-bold flex items-center gap-2 animate-bounce pointer-events-none">
          Mode Editor Aktif
        </div>
      )}
    </>
  );
}