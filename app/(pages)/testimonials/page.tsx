"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";

// --- IMPORTS SERVICES & TYPES ---
import {
  useGetCTAListQuery,
  useCreateCTAMutation,
  useUpdateCTAMutation,
} from "@/services/customize/home/cta.service";
import type { CTA } from "@/types/customization/home/cta";

// --- IMPORTS MODE EDIT ---
import { useEditMode } from "@/hooks/use-edit-mode";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { lang } = useLanguage();

  // === 1. SETUP CLIENT CODE ===
  const [clientCode, setClientCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const code = localStorage.getItem("code_client");
      setClientCode(code || "");
      if (!code) {
        console.warn(
          "⚠️ Client Code not found in LocalStorage ('code_client')"
        );
      }
    }
  }, []);

  // === 2. API HOOKS ===
  const {
    data: apiResult,
    isLoading,
    isFetching,
    refetch,
  } = useGetCTAListQuery(
    { client_code: clientCode || "", bahasa: lang },
    { skip: !clientCode }
  );

  const [createCTA, { isLoading: isCreating }] = useCreateCTAMutation();
  const [updateCTA, { isLoading: isUpdating }] = useUpdateCTAMutation();

  // === 3. LOCAL STATE & CONFIG ===
  const [localData, setLocalData] = useState<Partial<CTA> | null>(null);
  const [existingId, setExistingId] = useState<number | null>(null);

  // Background Configs (Bisa dipisah save-nya atau disatukan tergantung kebutuhan API backend,
  // disini hanya state lokal UI karena Interface CTA tidak menyimpan config warna)
  const [statsBg, setStatsBg] = useState<BackgroundConfig>({
    type: "solid",
    color1: "#ffffff",
  });

  const [ctaBg, setCtaBg] = useState<BackgroundConfig>({
    type: "gradient",
    color1: "#6B6B6B",
    color2: "#555555",
    direction: "to right",
  });

  // === 4. SYNC DATA API -> LOCAL ===
  useEffect(() => {
    if (apiResult?.data?.items && apiResult.data.items.length > 0) {
      const item = apiResult.data.items[0];
      setExistingId(item.id);
      setLocalData(item);
    } else if (apiResult?.success) {
      // Default Data jika belum ada di Database
      setExistingId(null);
      setLocalData({
        client_id: 6,
        bahasa: lang,
        status: 1, // number sesuai interface
        judul: "Siap Membuktikan Sendiri?",
        sub_judul: "-", // Tidak tampil di UI tapi required
        deskripsi:
          "Gabung dengan ribuan pelanggan yang sudah merasakan manfaatnya.",
        button_1: "Belanja Sekarang",
        button_link_1: "/product",
        button_2: "-",
        button_link_2: "#",
        // Mapping Stats
        info_judul_1: "10K+",
        info_deskripsi_1: "Pelanggan Puas",
        info_judul_2: "95%",
        info_deskripsi_2: "Repeat Order",
        info_judul_3: "4.9/5",
        info_deskripsi_3: "Rating Rata-rata",
        info_judul_4: "-",
        info_deskripsi_4: "-",
      });
    }
  }, [apiResult, lang]);

  // === 5. HANDLE SAVE ===
  const handleSave = async (
    field: keyof CTA,
    value: string | number | boolean
  ) => {
    if (!clientCode || !localData) {
      Swal.fire("Error", "Client Code missing or Data not ready", "error");
      return;
    }

    // Optimistic Update
    setLocalData((prev) => (prev ? { ...prev, [field]: value } : null));

    try {
      const formData = new FormData();

      // Mandatory Fields
      formData.append("client_id", "6");
      formData.append("bahasa", lang);
      formData.append("status", "1");

      // Helper Get Value
      const getVal = (key: keyof CTA) => {
        if (key === field) return String(value);
        return String(localData[key] ?? "-");
      };

      // Append Fields sesuai Interface
      formData.append("judul", getVal("judul"));
      formData.append("sub_judul", getVal("sub_judul"));
      formData.append("deskripsi", getVal("deskripsi"));

      formData.append("button_1", getVal("button_1"));
      formData.append("button_link_1", getVal("button_link_1"));
      formData.append("button_2", getVal("button_2"));
      formData.append("button_link_2", getVal("button_link_2"));

      formData.append("info_judul_1", getVal("info_judul_1"));
      formData.append("info_deskripsi_1", getVal("info_deskripsi_1"));
      formData.append("info_judul_2", getVal("info_judul_2"));
      formData.append("info_deskripsi_2", getVal("info_deskripsi_2"));
      formData.append("info_judul_3", getVal("info_judul_3"));
      formData.append("info_deskripsi_3", getVal("info_deskripsi_3"));
      formData.append("info_judul_4", getVal("info_judul_4"));
      formData.append("info_deskripsi_4", getVal("info_deskripsi_4"));

      // Execute Mutation
      if (!existingId) {
        await createCTA(formData).unwrap();
        Swal.fire({
          icon: "success",
          title: "Created Successfully",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
        });
      } else {
        await updateCTA({ id: existingId, data: formData }).unwrap();
        Swal.fire({
          icon: "success",
          title: "Updated Successfully",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
        });
      }

      refetch();
    } catch (error) {
      console.error("Save error:", error);
      Swal.fire("Error", "Gagal menyimpan perubahan", "error");
    }
  };

  // --- RENDERING STATES ---

  // 1. Loading
  if (clientCode === null || isLoading || isFetching) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <DotdLoader />
        {clientCode === null && (
          <span className="text-gray-400 text-sm">Initializing...</span>
        )}
      </div>
    );
  }

  // 2. Missing Code
  if (!clientCode) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-red-500 gap-2">
        <AlertCircle size={32} />
        <p className="font-semibold">Client Code Not Found</p>
      </div>
    );
  }

  // 3. No Data
  if (!localData) return null;

  const isSaving = isCreating || isUpdating;

  // Helper untuk render stats agar code lebih rapi (Array mapping)
  const statsList = [
    {
      id: 1,
      valKey: "info_judul_1" as keyof CTA,
      labelKey: "info_deskripsi_1" as keyof CTA,
    },
    {
      id: 2,
      valKey: "info_judul_2" as keyof CTA,
      labelKey: "info_deskripsi_2" as keyof CTA,
    },
    {
      id: 3,
      valKey: "info_judul_3" as keyof CTA,
      labelKey: "info_deskripsi_3" as keyof CTA,
    },
  ];

  return (
    <>
      {/* ===================== CUSTOMER STATS SECTION ===================== */}
      <EditableSection
        isEditMode={isEditMode}
        config={statsBg}
        onSave={setStatsBg}
        className="px-6 lg:px-12 py-16"
      >
        {/* Loading / Saving Indicator */}
        {isEditMode && isSaving && (
          <div className="fixed top-24 right-4 z-50 flex items-center gap-2 bg-emerald-600/90 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm shadow-md animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Saving...</span>
          </div>
        )}

        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {statsList.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100"
            >
              {/* Value (e.g., 10K+) */}
              <div className="text-4xl font-bold text-[#6B6B6B] mb-2">
                <EditableText
                  isEditMode={isEditMode}
                  text={String(localData[stat.valKey] || "")}
                  onSave={(v) => handleSave(stat.valKey, v)}
                />
              </div>

              {/* Label (e.g., Pelanggan Puas) */}
              <div className="text-gray-600">
                <EditableText
                  isEditMode={isEditMode}
                  text={String(localData[stat.labelKey] || "")}
                  onSave={(v) => handleSave(stat.labelKey, v)}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </EditableSection>

      {/* ===================== CTA SECTION ===================== */}
      <section className="px-6 lg:px-12 py-20 bg-transparent">
        <div className="container mx-auto">
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
              {/* CTA Title */}
              <div className="text-3xl lg:text-4xl font-bold mb-4">
                <EditableText
                  isEditMode={isEditMode}
                  text={localData.judul || ""}
                  onSave={(v) => handleSave("judul", v)}
                />
              </div>

              {/* CTA Description */}
              <EditableText
                isEditMode={isEditMode}
                text={localData.deskripsi || ""}
                onSave={(v) => handleSave("deskripsi", v)}
                as="div"
                multiline
                className="text-lg text-white/90 mb-8 max-w-2xl mx-auto block"
              />

              {/* CTA Button 1 */}
              <div className="flex justify-center">
                <EditableLink
                  isEditMode={isEditMode}
                  label={localData.button_1 || "Button"}
                  href={localData.button_link_1 || "#"}
                  onSave={(label, href) => {
                    handleSave("button_1", label);
                    handleSave("button_link_1", href);
                  }}
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