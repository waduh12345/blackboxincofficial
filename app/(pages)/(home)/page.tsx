"use client";

import { Suspense, useState } from "react";
import AboutStore from "@/components/main/home-page/about-store";
import NewArrival from "@/components/main/home-page/arrival-product-grid";
import ProductCategories from "@/components/main/home-page/category-grid";
import Campaign from "@/components/main/home-page/new/campaign";
import ProductSale from "@/components/main/home-page/product-sale";
import RunningCarousel from "@/components/main/home-page/running-carousel";
import Testimonials from "../testimonials/page";

// --- IMPORTS MODE EDIT ---
import { useEditMode } from "@/hooks/use-edit-mode";
import {
  EditableSection,
  BackgroundConfig,
} from "@/components/ui/editable-section";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="absolute inset-0 grid place-items-center text-sm text-gray-500">
          Memuat...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  // 1. Hook Edit Mode
  const isEditMode = useEditMode();

  // 2. State untuk Background Halaman
  const [pageBg, setPageBg] = useState<BackgroundConfig>({
    type: "solid",
    color1: "#ffffff", // Default Putih
  });

  return (
    // 3. Wrapper EditableSection menggantikan <div> biasa
    <EditableSection
      isEditMode={isEditMode}
      config={pageBg}
      onSave={setPageBg}
      className="min-h-screen" // className asli Anda dipindahkan ke sini
    >
      <div className="w-full p-2 md:mt-10">
        <RunningCarousel />
      </div>

      <div className="px-3 md:px-10">
        <NewArrival />
        <ProductCategories />
        <ProductSale />
      </div>

      <Campaign />
      <AboutStore />

      {/* <CTA /> */}
      <Testimonials />

      {/* Indikator Mode Edit (Opsional, untuk UX yang konsisten) */}
      {isEditMode && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm font-bold flex items-center gap-2 animate-bounce pointer-events-none">
          Mode Editor Aktif
        </div>
      )}
    </EditableSection>
  );
}
