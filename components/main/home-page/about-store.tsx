"use client";

import { useState, useEffect, Suspense } from "react";
import {
  ShieldCheck,
  Truck,
  Diamond,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react"; // Added AlertCircle
import Swal from "sweetalert2";

// --- IMPORTS SERVICES & TYPES ---
import {
  useGetHomeAboutListQuery,
  useCreateHomeAboutMutation,
  useUpdateHomeAboutMutation,
} from "@/services/customize/home/about.service";

import type { About } from "@/types/customization/home/about";

// --- IMPORTS MODE EDIT & COMPONENTS ---
import { useEditMode } from "@/hooks/use-edit-mode";
import { useLanguage } from "@/contexts/LanguageContext";
import { EditableText, EditableImage } from "@/components/ui/editable";
import {
  EditableSection,
  BackgroundConfig,
} from "@/components/ui/editable-section";
import DotdLoader from "@/components/loader/3dot";

// --- CONFIG ---
const BASE_IMAGE_URL =
  process.env.NEXT_PUBLIC_API_SECOND_URL || "https://api-dev.blackbox.id";

const FALLBACK_IMAGE = "/placeholder.webp";

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
  const { lang } = useLanguage();
  const YEAR = new Date().getFullYear();

  // === 1. SETUP CLIENT CODE ===
  // Inisialisasi state, default null agar kita tahu belum di-check
  const [clientCode, setClientCode] = useState<string | null>(null);

  useEffect(() => {
    // Cek localStorage saat mount
    if (typeof window !== "undefined") {
      const code = localStorage.getItem("code_client");
      // Jika code tidak ada, set string kosong atau default agar loading state berhenti
      setClientCode(code || "");

      if (!code) {
        console.warn(
          "⚠️ Client Code not found in LocalStorage ('code_client')"
        );
      }
    }
  }, []);

  // === 2. API HOOKS (RTK Query) ===
  const {
    data: apiResult,
    isLoading,
    isFetching,
    refetch,
  } = useGetHomeAboutListQuery(
    { client_code: clientCode || "", bahasa: lang },
    // Skip hanya jika clientCode null (belum dicek) atau string kosong
    { skip: !clientCode }
  );

  const [createAboutUs, { isLoading: isCreating }] =
    useCreateHomeAboutMutation();
  const [updateAboutUs, { isLoading: isUpdating }] =
    useUpdateHomeAboutMutation();

  // === 3. LOCAL STATE ===
  const [localData, setLocalData] = useState<Partial<About> | null>(null);
  const [existingId, setExistingId] = useState<number | null>(null);

  // === 4. BACKGROUND STATE ===
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>({
    type: "solid",
    color1: "#ffffff",
  });

  // === 5. SYNC DATA API -> LOCAL ===
  useEffect(() => {
    // Pastikan checking path object aman (Optional Chaining)
    if (apiResult?.data?.items && apiResult.data.items.length > 0) {
      const item = apiResult.data.items[0];
      setExistingId(item.id);
      setLocalData(item);
    } else if (apiResult?.success) {
      // Jika request sukses tapi array items kosong (Belum ada data di DB)
      setExistingId(null);
      setLocalData({
        judul: "Judul Default",
        sub_judul: "Sub Judul Default",
        deskripsi: "Deskripsi Default",
        info_1: "Info 1 Default",
        info_2: "Info 2 Default",
        info_3: "Info 3 Default",
        info_4: "-",
        image: null,
        status: "1",
        client_id: "6",
        bahasa: lang,
      });
    }
  }, [apiResult, lang]);

  // === 6. HANDLE SAVE ===
  const handleSave = async (
    field: keyof About,
    value: string | File | Blob
  ) => {
    if (!clientCode || !localData) {
      Swal.fire("Error", "Client Code missing or Data not ready", "error");
      return;
    }

    // Optimistic Update
    setLocalData((prev) => (prev ? { ...prev, [field]: value } : null));

    try {
      const formData = new FormData();
      formData.append("client_id", "6");
      formData.append("bahasa", lang);
      formData.append("status", "1");

      const getVal = (key: keyof About) => {
        if (key === field) return value;
        return localData[key] ?? "-";
      };

      formData.append("judul", getVal("judul") as string);
      formData.append("sub_judul", getVal("sub_judul") as string);
      formData.append("deskripsi", getVal("deskripsi") as string);
      formData.append("info_1", getVal("info_1") as string);
      formData.append("info_2", getVal("info_2") as string);
      formData.append("info_3", getVal("info_3") as string);
      formData.append("info_4", getVal("info_4") as string);

      if (
        field === "image" &&
        (value instanceof File || value instanceof Blob)
      ) {
        formData.append("image", value as Blob);
      }

      if (!existingId) {
        await createAboutUs(formData).unwrap();
        Swal.fire({
          icon: "success",
          title: "Created Successfully",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
        });
      } else {
        await updateAboutUs({ id: existingId, data: formData }).unwrap();
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

  // Helper Image URL
  const getImageUrl = (source: string | File | Blob | null | undefined) => {
    if (!source) return FALLBACK_IMAGE;
    if (source instanceof File || source instanceof Blob) {
      return URL.createObjectURL(source);
    }
    if (typeof source === "string") {
      if (source.startsWith("http") || source.startsWith("data:"))
        return source;
      return `${BASE_IMAGE_URL}/media/${source}`;
    }
    return FALLBACK_IMAGE;
  };

  // --- RENDERING STATES ---

  // 1. Loading State (Menunggu Client Code atau API)
  if (clientCode === null || isLoading || isFetching) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <DotdLoader />
        {clientCode === null && (
          <span className="text-gray-400 text-sm">Initializing...</span>
        )}
      </div>
    );
  }

  // 2. Missing Client Code State (Supaya tidak blank screen)
  if (!clientCode) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-red-500 gap-2">
        <AlertCircle size={32} />
        <p className="font-semibold">Client Code Not Found</p>
        <p className="text-sm text-gray-500">
         {` Please set 'code_client' in localStorage`}
        </p>
      </div>
    );
  }

  // 3. Data Not Ready (Logic fallback terakhir)
  if (!localData) {
    return (
      <div className="py-24 flex justify-center text-gray-400">
        No data available to display.
      </div>
    );
  }

  const isSaving = isCreating || isUpdating;

  // --- MAIN RENDER ---
  return (
    <EditableSection
      isEditMode={isEditMode}
      config={bgConfig}
      onSave={setBgConfig}
      className="relative overflow-hidden"
    >
      {/* Saving Indicator */}
      {isEditMode && isSaving && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600/90 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm shadow-md animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Saving...</span>
        </div>
      )}

      {isEditMode && !isSaving && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/20 text-gray-600 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm border border-gray-200">
          <Save className="w-3 h-3" />
          <span>Ready to save</span>
        </div>
      )}

      <div className="container mx-auto py-12 md:px-4 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Text Content */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-700 ring-1 ring-gray-300">
              <Diamond className="h-3.5 w-3.5 text-black" />
              <span>Our Commitment</span>
            </span>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-black md:text-4xl lg:text-5xl">
              <EditableText
                isEditMode={isEditMode}
                text={localData.judul || ""}
                onSave={(v) => handleSave("judul", v)}
              />
            </h2>

            <div className="mt-5 text-base text-gray-700 md:text-lg">
              <EditableText
                isEditMode={isEditMode}
                text={localData.deskripsi || ""}
                onSave={(v) => handleSave("deskripsi", v)}
                as="p"
                multiline
              />
            </div>

            <ul className="mt-8 grid gap-4 text-base font-medium text-black sm:grid-cols-2">
              <li className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-black flex-shrink-0" />
                <EditableText
                  isEditMode={isEditMode}
                  text={localData.info_1 || ""}
                  onSave={(v) => handleSave("info_1", v)}
                  as="span"
                />
              </li>
              <li className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-black flex-shrink-0" />
                <EditableText
                  isEditMode={isEditMode}
                  text={localData.info_2 || ""}
                  onSave={(v) => handleSave("info_2", v)}
                  as="span"
                />
              </li>
              <li className="flex items-center gap-3">
                <Diamond className="h-5 w-5 text-black flex-shrink-0" />
                <EditableText
                  isEditMode={isEditMode}
                  text={localData.info_3 || ""}
                  onSave={(v) => handleSave("info_3", v)}
                  as="span"
                />
              </li>
            </ul>
          </div>

          {/* Image Content */}
          <div className="relative order-first md:order-last">
            <div className="overflow-hidden rounded-2xl border-4 border-black shadow-2xl relative h-[380px] md:h-[500px] w-full bg-gray-100">
              <EditableImage
                isEditMode={isEditMode}
                src={getImageUrl(localData.image)}
                onSave={(file) => handleSave("image", file)}
                alt="About Us Image"
                fill
                priority
                unoptimized
                containerClassName="w-full h-full"
                className="object-cover grayscale-[10%]"
              />
            </div>
            <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-4 py-2 text-sm font-semibold text-black shadow-md backdrop-blur-sm">
              <span>Est. {YEAR}</span>
            </div>
          </div>
        </div>
      </div>
    </EditableSection>
  );
}