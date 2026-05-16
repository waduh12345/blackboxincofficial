"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { Save, ImageIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  useGetSettingQuery,
  useUpdateSettingMutation,
} from "@/services/admin/setting.service";
import type { GlobalSetting } from "@/types/admin/setting";
import type { ApiErrorResponse } from "@/lib/error-handle";

export default function SettingsPage() {
  const { data: setting, isLoading: isFetching, refetch } = useGetSettingQuery();
  const [updateSetting, { isLoading: isUpdating }] = useUpdateSettingMutation();

  const [form, setForm] = useState<Partial<GlobalSetting>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  useEffect(() => {
    if (setting) {
      setForm(setting);
    }
  }, [setting]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "favicon") => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "logo") {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else {
        setFaviconFile(file);
        setFaviconPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const fd = new FormData();
      // append string fields
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined && typeof value === 'string') {
          fd.append(key, value);
        }
      });

      if (logoFile) fd.append("logo", logoFile);
      if (faviconFile) fd.append("favicon", faviconFile);

      // add method spoofing if needed
      fd.append("_method", "PUT");

      await updateSetting(fd).unwrap();
      
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Pengaturan global berhasil disimpan",
      });
      refetch();
    } catch (error) {
      const err = error as ApiErrorResponse;
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err?.data?.message || err?.message || "Terjadi kesalahan",
      });
    }
  };

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}/storage/${url}`;
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Global</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola informasi situs, SEO, Footer, dan Kontak
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Website */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Identitas Website</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Situs</Label>
              <Input
                name="site_name"
                value={form.site_name || ""}
                onChange={handleChange}
                placeholder="Misal: Blackbox Inc"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 relative bg-gray-100 rounded border overflow-hidden">
                  {(logoPreview || form.logo) ? (
                    <Image
                      src={logoPreview || getImageUrl(form.logo)!}
                      alt="Logo"
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "logo")}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Favicon</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 relative bg-gray-100 rounded border overflow-hidden">
                  {(faviconPreview || form.favicon) ? (
                    <Image
                      src={faviconPreview || getImageUrl(form.favicon)!}
                      alt="Favicon"
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "favicon")}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">SEO Global</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Deskripsi Situs (Meta Description)</Label>
              <Textarea
                name="site_description"
                value={form.site_description || ""}
                onChange={handleChange}
                placeholder="Deskripsi singkat tentang website untuk mesin pencari"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kata Kunci (Meta Keywords)</Label>
                <Input
                  name="meta_keywords"
                  value={form.meta_keywords || ""}
                  onChange={handleChange}
                  placeholder="Misal: baju, pakaian, toko online"
                />
              </div>
              <div className="space-y-2">
                <Label>Penulis (Meta Author)</Label>
                <Input
                  name="meta_author"
                  value={form.meta_author || ""}
                  onChange={handleChange}
                  placeholder="Misal: Blackbox Inc Team"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Kontak */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Footer & Kontak</h2>
          
          <div className="space-y-2">
            <Label>Teks Profil Footer</Label>
            <Textarea
              name="footer_text"
              value={form.footer_text || ""}
              onChange={handleChange}
              placeholder="Deskripsi singkat perusahaan di footer"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Teks Copyright Footer</Label>
            <Input
              name="footer_copyright"
              value={form.footer_copyright || ""}
              onChange={handleChange}
              placeholder="Misal: © 2024 Blackbox Inc. All rights reserved."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Email Kontak</Label>
              <Input
                name="contact_email"
                type="email"
                value={form.contact_email || ""}
                onChange={handleChange}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Telepon / WhatsApp</Label>
              <Input
                name="contact_phone"
                value={form.contact_phone || ""}
                onChange={handleChange}
                placeholder="081234567890"
              />
            </div>
            <div className="space-y-2">
              <Label>Alamat Lengkap</Label>
              <Textarea
                name="contact_address"
                value={form.contact_address || ""}
                onChange={handleChange}
                placeholder="Jl. Contoh No. 123..."
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Sosial Media */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Sosial Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input
                name="social_facebook"
                value={form.social_facebook || ""}
                onChange={handleChange}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input
                name="social_instagram"
                value={form.social_instagram || ""}
                onChange={handleChange}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Twitter / X URL</Label>
              <Input
                name="social_twitter"
                value={form.social_twitter || ""}
                onChange={handleChange}
                placeholder="https://twitter.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input
                name="social_youtube"
                value={form.social_youtube || ""}
                onChange={handleChange}
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            type="submit" 
            disabled={isUpdating}
            className="bg-black hover:bg-gray-800 text-white rounded-xl min-w-[140px]"
          >
            {isUpdating ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
