"use client";

import { Suspense, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
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

// --- IMPORTS CMS CONTENT ---
import { useGetHomeContentsQuery } from "@/services/public-content.service";
import type { ContentItem } from "@/types/admin/content";

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
  const isEditMode = useEditMode();

  const [pageBg, setPageBg] = useState<BackgroundConfig>({
    type: "solid",
    color1: "#ffffff",
  });

  // Ambil semua konten aktif dari CMS
  const { data: allContents } = useGetHomeContentsQuery();

  // Filter konten per section
  const bannerPromos = useMemo(
    () =>
      (allContents || [])
        .filter((c) => c.section === "banner_promo" && c.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    [allContents]
  );

  const popupContent = useMemo(
    () =>
      (allContents || []).find(
        (c) => c.section === "popup" && c.is_active
      ) || null,
    [allContents]
  );

  return (
    <EditableSection
      isEditMode={isEditMode}
      config={pageBg}
      onSave={setPageBg}
      className="min-h-screen"
    >
      <div className="w-full p-2 md:mt-10">
        <RunningCarousel />
      </div>

      {/* Banner Promo dari CMS */}
      {bannerPromos.length > 0 && (
        <div className="px-3 md:px-10 py-4 space-y-4">
          {bannerPromos.map((banner) => (
            <CMSBanner key={banner.id} item={banner} />
          ))}
        </div>
      )}

      <div className="px-3 md:px-10">
        <NewArrival />
        <ProductCategories />
        <ProductSale />
      </div>

      <Campaign />
      <AboutStore />
      <Testimonials />

      {/* Popup Promo dari CMS */}
      {popupContent && <CMSPopup item={popupContent} />}

      {isEditMode && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm font-bold flex items-center gap-2 animate-bounce pointer-events-none">
          Mode Editor Aktif
        </div>
      )}
    </EditableSection>
  );
}

/** Banner promo dari CMS */
function CMSBanner({ item }: { item: ContentItem }) {
  const imgUrl = item.image?.startsWith("http")
    ? item.image
    : item.image
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}/storage/${item.image}`
      : null;

  const mobileImgUrl = item.image_mobile?.startsWith("http")
    ? item.image_mobile
    : item.image_mobile
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}/storage/${item.image_mobile}`
      : imgUrl;

  if (!imgUrl) return null;

  const cls =
    "block relative w-full h-[180px] md:h-[280px] rounded-2xl overflow-hidden shadow-lg group cursor-pointer";

  const inner = (
    <>
      <Image
        src={imgUrl}
        alt={item.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500 hidden md:block"
      />
      <Image
        src={mobileImgUrl || imgUrl}
        alt={item.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500 block md:hidden"
      />
      {(item.title || item.subtitle) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
          {item.title && (
            <h3 className="text-white text-xl md:text-2xl font-bold">
              {item.title}
            </h3>
          )}
          {item.subtitle && (
            <p className="text-white/80 text-sm mt-1">{item.subtitle}</p>
          )}
          {item.link_text && (
            <span className="inline-flex items-center gap-1 mt-3 text-white text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full w-fit">
              {item.link_text}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (item.link_url) {
    return (
      <Link href={item.link_url} className={cls}>
        {inner}
      </Link>
    );
  }

  return <div className={cls}>{inner}</div>;
}

/** Popup promo dari CMS */
function CMSPopup({ item }: { item: ContentItem }) {
  const [show, setShow] = useState(true);

  if (!show) return null;

  const imgUrl = item.image?.startsWith("http")
    ? item.image
    : item.image
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}/storage/${item.image}`
      : null;

  const mobileImgUrl = item.image_mobile?.startsWith("http")
    ? item.image_mobile
    : item.image_mobile
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}/storage/${item.image_mobile}`
      : imgUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
        <button
          onClick={() => setShow(false)}
          className="absolute top-3 right-3 z-10 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
        >
          &times;
        </button>
        {imgUrl && (
          <div className="relative w-full h-52">
            <Image src={imgUrl} alt={item.title} fill className="object-cover hidden md:block" />
            <Image src={mobileImgUrl || imgUrl} alt={item.title} fill className="object-cover block md:hidden" />
          </div>
        )}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
          {item.subtitle && (
            <p className="text-gray-500 text-sm mt-1">{item.subtitle}</p>
          )}
          {item.description && (
            <p className="text-gray-600 mt-3 text-sm">{item.description}</p>
          )}
          {item.link_url && (
            <Link
              href={item.link_url}
              className="inline-block mt-4 bg-black text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors"
              onClick={() => setShow(false)}
            >
              {item.link_text || "Lihat Selengkapnya"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
