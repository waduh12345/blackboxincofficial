"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  Filter,
  ImageIcon,
  GripVertical,
} from "lucide-react";
import useModal from "@/hooks/use-modal";

import {
  useGetContentListQuery,
  useCreateContentMutation,
  useUpdateContentMutation,
  useDeleteContentMutation,
} from "@/services/admin/content.service";
import type { ContentItem, ContentSection } from "@/types/admin/content";
import ContentForm from "@/components/form-modal/admin/content-form";
import type { ApiErrorResponse } from "@/lib/error-handle";

const SECTION_LABELS: Record<ContentSection, string> = {
  hero_slider: "Hero Slider",
  banner_promo: "Banner Promo",
  about: "Tentang Toko",
  testimonial: "Testimoni",
  footer_info: "Info Footer",
  popup: "Popup Promo",
  custom: "Custom",
};

const SECTION_COLORS: Record<ContentSection, string> = {
  hero_slider: "bg-blue-100 text-blue-800",
  banner_promo: "bg-orange-100 text-orange-800",
  about: "bg-green-100 text-green-800",
  testimonial: "bg-purple-100 text-purple-800",
  footer_info: "bg-gray-200 text-gray-800",
  popup: "bg-red-100 text-red-800",
  custom: "bg-yellow-100 text-yellow-800",
};

type FormState = Partial<ContentItem> & {
  imageFile?: File;
  imageMobileFile?: File;
};

export default function ContentPage() {
  const [form, setForm] = useState<FormState>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readonly, setReadonly] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();

  const [currentPage, setCurrentPage] = useState(1);
  const [filterSection, setFilterSection] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;

  const { data, isLoading, refetch } = useGetContentListQuery({
    page: currentPage,
    paginate: itemsPerPage,
    section: (filterSection as ContentSection) || undefined,
    search: searchQuery || undefined,
  });

  const list = useMemo(() => data?.data || [], [data]);
  const lastPage = useMemo(() => data?.last_page || 1, [data]);

  const [createContent, { isLoading: isCreating }] =
    useCreateContentMutation();
  const [updateContent, { isLoading: isUpdating }] =
    useUpdateContentMutation();
  const [deleteContent] = useDeleteContentMutation();

  const buildFormData = (formState: FormState): FormData => {
    const fd = new FormData();
    if (formState.section) fd.append("section", formState.section);
    if (formState.title) fd.append("title", formState.title);
    if (formState.subtitle) fd.append("subtitle", formState.subtitle);
    if (formState.description) fd.append("description", formState.description);
    if (formState.link_url) fd.append("link_url", formState.link_url);
    if (formState.link_text) fd.append("link_text", formState.link_text);
    fd.append("sort_order", String(formState.sort_order ?? 0));
    fd.append("is_active", formState.is_active === false ? "0" : "1");
    if (formState.start_date) fd.append("start_date", formState.start_date);
    if (formState.end_date) fd.append("end_date", formState.end_date);
    if (formState.imageFile instanceof File)
      fd.append("image", formState.imageFile);
    if (formState.imageMobileFile instanceof File)
      fd.append("image_mobile", formState.imageMobileFile);
    return fd;
  };

  const handleSubmit = async () => {
    // Validasi manual supaya user tahu apa yang salah
    if (!form.section) {
      Swal.fire("Validasi", "Section wajib dipilih", "warning");
      return;
    }
    if (!form.title || form.title.trim().length === 0) {
      Swal.fire("Validasi", "Judul wajib diisi", "warning");
      return;
    }
    // Saat create, image wajib untuk section berbasis gambar
    const imageBased: ContentSection[] = [
      "hero_slider",
      "banner_promo",
      "popup",
      "testimonial",
    ];
    if (
      !editingId &&
      imageBased.includes(form.section as ContentSection) &&
      !form.imageFile
    ) {
      Swal.fire(
        "Validasi",
        `Gambar wajib diupload untuk section "${form.section}"`,
        "warning"
      );
      return;
    }

    try {
      const payload = buildFormData(form);

      if (editingId) {
        await updateContent({ id: editingId, payload }).unwrap();
        Swal.fire("Sukses", "Konten berhasil diperbarui", "success");
      } else {
        await createContent(payload).unwrap();
        Swal.fire("Sukses", "Konten berhasil ditambahkan", "success");
      }

      resetForm();
      await refetch();
      closeModal();
    } catch (error) {
      console.error("Content submit error:", error);
      const err = error as ApiErrorResponse;
      const message =
        err?.data?.message ||
        err?.message ||
        "Gagal menyimpan data. Silakan coba lagi.";
      Swal.fire("Gagal", message, "error");
    }
  };

  const handleDelete = async (item: ContentItem) => {
    const result = await Swal.fire({
      title: "Hapus Konten?",
      text: `Hapus "${item.title}"? Tindakan ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await deleteContent(item.id).unwrap();
        Swal.fire("Terhapus", "Konten berhasil dihapus", "success");
        refetch();
      } catch (error) {
        console.error("Content delete error:", error);
        const err = error as ApiErrorResponse;
        const message =
          err?.data?.message || err?.message || "Gagal menghapus konten";
        Swal.fire("Gagal", message, "error");
      }
    }
  };

  const handleCreate = () => {
    setForm({
      section: "hero_slider",
      title: "",
      subtitle: "",
      description: "",
      link_url: "",
      link_text: "",
      sort_order: 0,
      is_active: true,
    });
    setEditingId(null);
    setReadonly(false);
    openModal();
  };

  const handleEdit = (item: ContentItem) => {
    setForm({ ...item });
    setEditingId(item.id);
    setReadonly(false);
    openModal();
  };

  const handleView = (item: ContentItem) => {
    setForm({ ...item });
    setEditingId(item.id);
    setReadonly(true);
    openModal();
  };

  const resetForm = () => {
    setForm({});
    setEditingId(null);
    setReadonly(false);
  };

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}/storage/${url}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Konten Website</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola slider, banner, dan konten halaman website
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari konten..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Filter Section */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterSection}
                onChange={(e) => {
                  setFilterSection(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-8 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-transparent appearance-none bg-white"
              >
                <option value="">Semua Section</option>
                {Object.entries(SECTION_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={handleCreate}
            className="bg-black text-white hover:bg-gray-800 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Konten
          </Button>
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-3" />
          Memuat data...
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Belum ada konten</p>
          <p className="text-sm mt-1">
            Klik &quot;Tambah Konten&quot; untuk mulai menambahkan konten
            website.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                {/* Drag Handle / Sort */}
                <div className="text-gray-300 flex-shrink-0">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Image Thumbnail */}
                <div className="relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {getImageUrl(item.image) ? (
                    <Image
                      src={getImageUrl(item.image)!}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.title}
                    </h3>
                    <Badge
                      className={`text-[10px] ${
                        SECTION_COLORS[item.section] || "bg-gray-100"
                      }`}
                    >
                      {SECTION_LABELS[item.section] || item.section}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {item.subtitle || item.description || "—"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>Urutan: {item.sort_order}</span>
                    <span
                      className={`font-medium ${
                        item.is_active ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleView(item)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    title="Lihat"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-gray-600 px-3">
            {currentPage} / {lastPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= lastPage}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {/* Form Modal */}
      <ContentForm
        isOpen={isOpen}
        onClose={() => {
          closeModal();
          resetForm();
        }}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm as ContentFormProps["setForm"]}
        isLoading={isCreating || isUpdating}
        isEditing={!!editingId}
        readonly={readonly}
      />
    </div>
  );
}

// Type helper for ContentForm setForm prop
type ContentFormProps = {
  setForm: (
    fn: (
      prev: Partial<ContentItem> & { imageFile?: File; imageMobileFile?: File }
    ) => Partial<ContentItem> & { imageFile?: File; imageMobileFile?: File }
  ) => void;
};
