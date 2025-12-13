"use client";

import { useState, useEffect } from "react";
import {
  X,
  Save,
  User,
  Globe,
  MapPin,
  Mail,
  Phone,
  CheckCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  useCreateClientMutation,
  useUpdateClientMutation,
  Client,
  ClientRequest,
} from "@/services/customize/client.service";
import { fredoka } from "@/lib/fonts";

// 1. Definisikan Interface Error
interface ApiError {
  data?: {
    message?: string;
  };
}

interface ClientFormProps {
  initialData?: Client | null;
  onClose: () => void;
}

export default function ClientForm({ initialData, onClose }: ClientFormProps) {
  // State Form default
  const [formData, setFormData] = useState<ClientRequest>({
    name: "",
    url_website: "",
    pic: "",
    email: "",
    phone_number: "",
    address: "",
    status: 1,
  });

  // Load data jika mode Edit
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        url_website: initialData.url_website,
        pic: initialData.pic,
        email: initialData.email,
        phone_number: initialData.phone_number,
        address: initialData.address,
        status: initialData.status,
      });
    }
  }, [initialData]);

  // Hooks Mutation
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();

  const isLoading = isCreating || isUpdating;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "status" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (initialData) {
        // --- MODE UPDATE ---
        await updateClient({ id: initialData.id, data: formData }).unwrap();
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Data client berhasil diperbarui.",
          confirmButtonColor: "#E84A8A",
          timer: 1500,
        });
      } else {
        // --- MODE CREATE ---
        await createClient(formData).unwrap();
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Client baru berhasil ditambahkan.",
          confirmButtonColor: "#E84A8A",
          timer: 1500,
        });
      }
      onClose(); // Tutup modal
    } catch (err: unknown) {
      // ✅ FIX: Gunakan 'unknown' lalu casting ke 'ApiError'
      console.error("Form Error:", err);

      const apiErr = err as ApiError;

      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: apiErr?.data?.message || "Terjadi kesalahan saat menyimpan data.",
        confirmButtonColor: "#E84A8A",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D8A6E]/30 backdrop-blur-sm">
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-2xl rounded-[2rem] shadow-2xl border border-white p-6 relative animate-float-fast">
        {/* Header Modal */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
          <h2
            className={`text-2xl font-bold text-[#1A1A2E] ${fredoka.className}`}
          >
            {initialData ? "Edit Data Client" : "Tambah Client Baru"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Perusahaan */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-[#2D8A6E] ml-1">
                Nama Perusahaan
              </label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#E84A8A] transition-colors" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#E84A8A] rounded-xl outline-none transition-all font-medium text-[#1A1A2E]"
                  placeholder="PT. Teknologi Maju Banget"
                  required
                />
              </div>
            </div>

            {/* URL Website */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-[#2D8A6E] ml-1">
                Website
              </label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#E84A8A] transition-colors" />
                <input
                  type="text"
                  name="url_website"
                  value={formData.url_website}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#E84A8A] rounded-xl outline-none transition-all font-medium text-[#1A1A2E]"
                  placeholder="teknologimajubanget.com"
                />
              </div>
            </div>

            {/* PIC */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-[#2D8A6E] ml-1">
                PIC (Person In Charge)
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#E84A8A] transition-colors" />
                <input
                  type="text"
                  name="pic"
                  value={formData.pic}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#E84A8A] rounded-xl outline-none transition-all font-medium text-[#1A1A2E]"
                  placeholder="Nama PIC"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-[#2D8A6E] ml-1">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#E84A8A] transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#E84A8A] rounded-xl outline-none transition-all font-medium text-[#1A1A2E]"
                  placeholder="email@perusahaan.com"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-[#2D8A6E] ml-1">
                No. Telepon
              </label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#E84A8A] transition-colors" />
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#E84A8A] rounded-xl outline-none transition-all font-medium text-[#1A1A2E]"
                  placeholder="0812xxxx"
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-[#2D8A6E] ml-1">
                Status
              </label>
              <div className="relative group">
                <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#E84A8A] transition-colors" />
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#E84A8A] rounded-xl outline-none transition-all font-medium text-[#1A1A2E] appearance-none"
                >
                  <option value={1}>Aktif</option>
                  <option value={0}>Tidak Aktif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Alamat (Full Width) */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-[#2D8A6E] ml-1">
              Alamat Lengkap
            </label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-4 text-gray-400 w-5 h-5 group-focus-within:text-[#E84A8A] transition-colors" />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#E84A8A] rounded-xl outline-none transition-all font-medium text-[#1A1A2E]"
                placeholder="Alamat lengkap perusahaan..."
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-gradient-to-r from-[#E84A8A] to-[#D63D7A] text-white rounded-xl font-bold hover:shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}