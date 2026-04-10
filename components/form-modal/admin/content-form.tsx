"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContentItem, ContentSection } from "@/types/admin/content";

const SECTION_OPTIONS: { value: ContentSection; label: string }[] = [
  { value: "hero_slider", label: "Hero Slider" },
  { value: "banner_promo", label: "Banner Promo" },
  { value: "about", label: "Tentang Toko" },
  { value: "testimonial", label: "Testimoni" },
  { value: "footer_info", label: "Info Footer" },
  { value: "popup", label: "Popup Promo" },
  { value: "custom", label: "Custom" },
];

interface ContentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: Partial<ContentItem> & { imageFile?: File; imageMobileFile?: File };
  setForm: (
    fn: (
      prev: Partial<ContentItem> & { imageFile?: File; imageMobileFile?: File }
    ) => Partial<ContentItem> & { imageFile?: File; imageMobileFile?: File }
  ) => void;
  isLoading: boolean;
  isEditing: boolean;
  readonly?: boolean;
}

export default function ContentForm({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  isLoading,
  isEditing,
  readonly = false,
}: ContentFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const fileMobileRef = useRef<HTMLInputElement>(null);
  const [previewDesktop, setPreviewDesktop] = useState<string | null>(null);
  const [previewMobile, setPreviewMobile] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewDesktop) URL.revokeObjectURL(previewDesktop);
      if (previewMobile) URL.revokeObjectURL(previewMobile);
    };
  }, [previewDesktop, previewMobile]);

  if (!isOpen) return null;

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "imageFile" | "imageMobileFile",
    setPreview: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, [field]: file }));
    setPreview(URL.createObjectURL(file));
  };

  const imgSrc = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("/"))
      return url;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}/storage/${url}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {readonly
              ? "Detail Konten"
              : isEditing
              ? "Edit Konten"
              : "Tambah Konten"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Section *
            </label>
            <select
              value={form.section || ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  section: e.target.value as ContentSection,
                }))
              }
              disabled={readonly}
              className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">-- Pilih Section --</option>
              {SECTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Judul *
            </label>
            <input
              type="text"
              value={form.title || ""}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              disabled={readonly}
              className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Judul konten"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={form.subtitle || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, subtitle: e.target.value }))
              }
              disabled={readonly}
              className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Subtitle (opsional)"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              disabled={readonly}
              rows={4}
              className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Deskripsi konten"
            />
          </div>

          {/* Image Desktop */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Gambar Desktop
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-gray-400 transition-colors relative"
              onClick={() => !readonly && fileRef.current?.click()}
            >
              {previewDesktop || imgSrc(form.image) ? (
                <div className="relative w-full h-48">
                  <Image
                    src={previewDesktop || imgSrc(form.image)!}
                    alt="Preview"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6">
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Klik untuk upload gambar (maks 2MB)
                  </p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileChange(e, "imageFile", setPreviewDesktop)
                }
              />
            </div>
          </div>

          {/* Image Mobile */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Gambar Mobile (Opsional)
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-gray-400 transition-colors relative"
              onClick={() => !readonly && fileMobileRef.current?.click()}
            >
              {previewMobile || imgSrc(form.image_mobile) ? (
                <div className="relative w-full h-36">
                  <Image
                    src={previewMobile || imgSrc(form.image_mobile)!}
                    alt="Preview Mobile"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-500">Gambar mobile</p>
                </div>
              )}
              <input
                ref={fileMobileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileChange(e, "imageMobileFile", setPreviewMobile)
                }
              />
            </div>
          </div>

          {/* Link URL & Text */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Link URL
              </label>
              <input
                type="text"
                value={form.link_url || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, link_url: e.target.value }))
                }
                disabled={readonly}
                className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Teks Link/Tombol
              </label>
              <input
                type="text"
                value={form.link_text || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, link_text: e.target.value }))
                }
                disabled={readonly}
                className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Lihat Selengkapnya"
              />
            </div>
          </div>

          {/* Sort Order & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Urutan
              </label>
              <input
                type="number"
                value={form.sort_order ?? 0}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    sort_order: parseInt(e.target.value) || 0,
                  }))
                }
                disabled={readonly}
                className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.is_active === false ? "0" : "1"}
                onChange={(e) =>
                  setForm((p) => ({ ...p, is_active: e.target.value === "1" }))
                }
                disabled={readonly}
                className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Tanggal Mulai & Selesai */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="datetime-local"
                value={form.start_date?.slice(0, 16) || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, start_date: e.target.value }))
                }
                disabled={readonly}
                className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tanggal Selesai
              </label>
              <input
                type="datetime-local"
                value={form.end_date?.slice(0, 16) || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, end_date: e.target.value }))
                }
                disabled={readonly}
                className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        {!readonly && (
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isLoading || !form.section || !form.title}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </span>
              ) : isEditing ? (
                "Simpan Perubahan"
              ) : (
                "Tambah Konten"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
