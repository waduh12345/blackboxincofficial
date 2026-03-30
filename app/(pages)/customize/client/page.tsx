"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  LayoutGrid,
  Globe,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  useGetClientListQuery,
  useDeleteClientMutation,
  Client,
} from "@/services/customize/client.service";
import { fredoka, sniglet } from "@/lib/fonts";
import ClientForm from "@/components/form-modal/customize/client-form";

export default function ClientPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // State untuk Modal Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Hook Fetch Data (RTK Query)
  const {
    data: response,
    isLoading,
    error,
  } = useGetClientListQuery({
    page,
    paginate: 10,
    search,
  });

  // Hook Delete
  const [deleteClient] = useDeleteClientMutation();

  // Handlers
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: "Hapus Client?",
      text: `Apakah Anda yakin ingin menghapus "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      backdrop: `rgba(232, 74, 138, 0.1)`,
    });

    if (result.isConfirmed) {
      try {
        await deleteClient(id).unwrap();
        Swal.fire({
          title: "Terhapus!",
          text: "Data client berhasil dihapus.",
          icon: "success",
          confirmButtonColor: "#E84A8A",
          timer: 1500,
        });
      } catch {
        Swal.fire("Gagal!", "Gagal menghapus data.", "error");
      }
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#E0F2E9] relative p-6 md:p-10 ${sniglet.className}`}
    >
      {/* Background Blobs (Sama seperti login) */}
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-[#E84A8A]/20 rounded-full blur-[80px] animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#2D8A6E]/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1
              className={`text-4xl font-extrabold text-[#1A1A2E] ${fredoka.className}`}
            >
              Data <span className="text-[#E84A8A]">Client</span>
            </h1>
            <p className="text-[#2D8A6E] mt-1">
              Kelola data mitra dan pelanggan
            </p>
          </div>

          <button
            onClick={handleCreate}
            className="group flex items-center gap-2 bg-[#E84A8A] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-[#E84A8A]/30 hover:bg-[#D63D7A] hover:-translate-y-1 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Tambah Client
          </button>
        </div>

        {/* --- SEARCH & FILTER BAR --- */}
        <div className="bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari nama client, email, atau PIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-transparent focus:border-[#E84A8A] focus:ring-2 focus:ring-[#E84A8A]/20 outline-none transition-all text-[#1A1A2E]"
            />
          </div>
        </div>

        {/* --- MAIN CONTENT (TABLE) --- */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white overflow-hidden min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <div className="w-12 h-12 border-4 border-[#E84A8A]/30 border-t-[#E84A8A] rounded-full animate-spin"></div>
              <p className="text-gray-500 animate-pulse">
                Memuat data client...
              </p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96 text-red-500 font-bold">
              Gagal memuat data. Silakan coba lagi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#2D8A6E]/10 text-left">
                    <th className="px-8 py-5 text-[#2D8A6E] font-bold rounded-tl-[2rem]">
                      Perusahaan
                    </th>
                    <th className="px-6 py-5 text-[#2D8A6E] font-bold">
                      Kontak (PIC)
                    </th>
                    <th className="px-6 py-5 text-[#2D8A6E] font-bold">
                      Email / Telepon
                    </th>
                    <th className="px-6 py-5 text-[#2D8A6E] font-bold">
                      Status
                    </th>
                    <th className="px-6 py-5 text-[#2D8A6E] font-bold text-center rounded-tr-[2rem]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {response?.data?.items?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-20 text-gray-400"
                      >
                        <LayoutGrid className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        Belum ada data client.
                      </td>
                    </tr>
                  ) : (
                    response?.data?.items?.map((client) => (
                      <tr
                        key={client.id}
                        className="hover:bg-white/50 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <div className="font-bold text-[#1A1A2E] text-lg">
                            {client.name}
                          </div>
                          <a
                            href={
                              client.url_website.startsWith("http")
                                ? client.url_website
                                : `https://${client.url_website}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-[#E84A8A] hover:underline flex items-center gap-1"
                          >
                            <Globe className="w-3 h-3" /> {client.url_website}
                          </a>
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {client.address}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#E84A8A] to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {client.pic.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-700">
                              {client.pic}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-[#2D8A6E]" />{" "}
                              {client.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-[#2D8A6E]" />{" "}
                              {client.phone_number}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                              client.status === 1
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }`}
                          >
                            {client.status_desc ||
                              (client.status === 1 ? "AKTIF" : "NON-AKTIF")}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(client)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 hover:scale-110 transition-all shadow-sm"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(Number(client.id), client.name)
                              }
                              className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:scale-110 transition-all shadow-sm"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Simple (Bisa dikembangkan lagi) */}
          <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl bg-white border hover:bg-gray-50 disabled:opacity-50 text-sm font-bold text-gray-600"
            >
              Sebelumnya
            </button>
            <button
              disabled={page >= (response?.data?.pageTotal || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl bg-[#E84A8A] text-white hover:bg-[#D63D7A] disabled:opacity-50 text-sm font-bold shadow-md shadow-[#E84A8A]/20"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL FORM --- */}
      {isFormOpen && (
        <ClientForm
          initialData={editingClient}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}