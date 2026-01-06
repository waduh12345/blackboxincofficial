"use client";

import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useModal from "@/hooks/use-modal";
import {
  useGetProductListQuery,
  useDeleteProductMutation,
} from "@/services/admin/product.service";
import { Product } from "@/types/admin/product";
import FormProduct from "@/components/form-modal/admin/product-form";
import { Badge } from "@/components/ui/badge";

export default function ProductPage() {
  // State untuk menyimpan slug produk yang sedang diedit
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  // State dummy untuk form initial (hanya status)
  const [initialFormState, setInitialFormState] = useState<Partial<Product>>({
    status: true,
  });

  const { isOpen, openModal, closeModal } = useModal();
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Service: Get Product List
  const { data, isLoading, refetch } = useGetProductListQuery({
    page: currentPage,
    paginate: itemsPerPage,
  });

  // 2. Service: Delete Product
  const [deleteProduct] = useDeleteProductMutation();

  const productList = useMemo(() => data?.data || [], [data]);
  const lastPage = useMemo(() => data?.last_page || 1, [data]);

  // Handle Add Baru
  const handleAdd = () => {
    setEditingSlug(null);
    setInitialFormState({ status: true });
    openModal();
  };

  // Handle Edit Produk
  const handleEdit = (item: Product) => {
    setEditingSlug(item.slug);
    // Kita passing data produk awal agar form tidak kosong saat fetch detail belum selesai
    setInitialFormState({
      ...item,
      status: item.status === true || item.status === 1,
    });
    openModal();
  };

  // Handle Delete Produk
  const handleDelete = async (item: Product) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus Produk?",
      text: item.name,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      confirmButtonColor: "#d33", // Merah
      cancelButtonColor: "#000", // Hitam
    });

    if (confirm.isConfirmed) {
      try {
        await deleteProduct(item.slug).unwrap();
        await refetch();
        Swal.fire("Berhasil", "Produk dihapus", "success");
      } catch (error) {
        console.error(error);
        Swal.fire("Gagal", "Gagal menghapus Produk", "error");
      }
    }
  };

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen text-black">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Data Produk</h1>
        <Button
          onClick={handleAdd}
          className="bg-black text-white hover:bg-gray-800"
        >
          Tambah Produk
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-black">
              <tr>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Merk</th>
                <th className="px-4 py-3">Nama Produk</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center p-4">
                    Memuat data...
                  </td>
                </tr>
              ) : productList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-4">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                productList.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-black text-white hover:bg-gray-800"
                          onClick={() => handleEdit(item)}
                        >
                          Edit / Detail
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={() => handleDelete(item)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.category_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.merk_name}
                    </td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      Rp {item.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.stock}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        className={
                          item.status
                            ? "bg-black hover:bg-gray-800"
                            : "bg-gray-400 hover:bg-gray-500"
                        }
                      >
                        {item.status ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>

        {/* Pagination Sederhana */}
        <div className="p-4 flex items-center justify-between bg-gray-50 border-t border-black">
          <div className="text-sm">
            Halaman <strong>{currentPage}</strong> dari{" "}
            <strong>{lastPage}</strong>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-black text-black hover:bg-gray-100"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              className="border-black text-black hover:bg-gray-100"
              disabled={currentPage >= lastPage}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto py-10">
          <FormProduct
            // Jika ada editingSlug, form akan fetch data detail
            editingSlug={editingSlug}
            // Data awal (untuk create atau placeholder edit)
            initialData={initialFormState}
            onCancel={() => {
              setEditingSlug(null);
              closeModal();
            }}
            onSuccess={() => {
              refetch();
              // Jangan close modal otomatis agar user bisa lanjut flow jika mau,
              // atau bisa di close tergantung UX. Di sini kita close saja.
              // setEditingSlug(null);
              // closeModal();
            }}
          />
        </div>
      )}
    </div>
  );
}