"use client";

import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { skipToken } from "@reduxjs/toolkit/query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import useModal from "@/hooks/use-modal";
import { Combobox } from "@/components/ui/combo-box";

import { useGetProductListQuery } from "@/services/admin/product.service";

import {
  useGetProductVariantsQuery,
  useCreateProductVariantMutation,
  useUpdateProductVariantMutation,
  useDeleteProductVariantMutation,
} from "@/services/admin/product-variant.service";

import type { Product } from "@/types/admin/product";
import type { ProductVariant } from "@/types/admin/product-variant";
import ProductVariantForm from "@/components/form-modal/admin/product-variant-form";

const ITEMS_PER_PAGE = 10;

export default function ProductVariantPage() {
  // pilih produk dulu → dapat slug
  const [productId, setProductId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");

  // ambil daftar produk untuk combobox (bisa perbesar paginate biar banyak pilihan)
  const { data: productResp, isLoading: productLoading } =
    useGetProductListQuery({
      page: 1,
      paginate: 200,
      // search: productSearch
    });

  const productList = useMemo(() => {
    const rows = productResp?.data ?? [];
    if (!productSearch.trim()) return rows;
    const q = productSearch.toLowerCase();
    return rows.filter((p: Product) => p.name?.toLowerCase().includes(q));
  }, [productResp, productSearch]);

  const selectedProduct: Product | undefined = useMemo(
    () => productList.find((p: Product) => p.id === productId),
    [productList, productId]
  );

  const productSlug = selectedProduct?.slug ?? null;

  // listing variants
  const [currentPage, setCurrentPage] = useState(1);
  const [variantSearch, setVariantSearch] = useState("");

  const {
    data: variantResp,
    isLoading: variantLoading,
    refetch,
  } = useGetProductVariantsQuery(
    productSlug
      ? {
          productSlug,
          page: currentPage,
          paginate: ITEMS_PER_PAGE,
          search: variantSearch,
        }
      : skipToken
  );

  const variants = variantResp?.data ?? [];
  const lastPage = variantResp?.last_page ?? 1;

  // modal state
  const { isOpen, openModal, closeModal } = useModal();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readonly, setReadonly] = useState(false);
  const [form, setForm] = useState<
    Partial<
      Pick<
        ProductVariant,
        | "name"
        | "sku"
        | "price"
        | "stock"
        | "weight"
        | "length"
        | "width"
        | "height"
        | "diameter"
        | "status"
      >
    >
  >({ status: 1 });

  const [createVariant, { isLoading: creating }] =
    useCreateProductVariantMutation();
  const [updateVariant, { isLoading: updating }] =
    useUpdateProductVariantMutation();
  const [deleteVariant] = useDeleteProductVariantMutation();

  const resetForm = () => {
    setForm({ status: 1 });
    setEditingId(null);
    setReadonly(false);
  };

  const handleSubmit = async () => {
    if (!productSlug) {
      Swal.fire("Perhatian", "Pilih produk terlebih dahulu.", "warning");
      return;
    }
    try {
      const payload = {
        name: form.name?.trim() ?? "",
        sku: form.sku?.trim() ?? "",
        price: Number(form.price ?? 0),
        stock: Number(form.stock ?? 0),
        weight: Number(form.weight ?? 0),
        length: Number(form.length ?? 0),
        width: Number(form.width ?? 0),
        height: Number(form.height ?? 0),
        diameter: Number(form.diameter ?? 0),
        status:
          typeof form.status === "boolean"
            ? form.status
              ? 1
              : 0
            : form.status ?? 1,
      };

      if (editingId) {
        await updateVariant({
          productSlug,
          id: editingId,
          body: payload,
        }).unwrap();
        Swal.fire("Sukses", "Varian diperbarui", "success");
      } else {
        await createVariant({
          productSlug,
          body: payload,
        }).unwrap();
        Swal.fire("Sukses", "Varian ditambahkan", "success");
      }
      resetForm();
      closeModal();
      await refetch();
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan", "error");
    }
  };

  const handleEdit = (item: ProductVariant) => {
    setForm({
      name: item.name,
      sku: item.sku,
      price: item.price,
      stock: item.stock,
      weight: item.weight,
      length: item.length,
      width: item.width,
      height: item.height,
      diameter: item.diameter,
      status: item.status,
    });
    setEditingId(item.id);
    setReadonly(false);
    openModal();
  };

  const handleDetail = (item: ProductVariant) => {
    setForm({
      name: item.name,
      sku: item.sku,
      price: item.price,
      stock: item.stock,
      weight: item.weight,
      length: item.length,
      width: item.width,
      height: item.height,
      diameter: item.diameter,
      status: item.status,
    });
    setEditingId(item.id);
    setReadonly(true);
    openModal();
  };

  const handleDelete = async (item: ProductVariant) => {
    if (!productSlug) return;
    const ask = await Swal.fire({
      title: "Hapus Varian?",
      text: `${item.name} (${item.sku})`,
      showCancelButton: true,
      confirmButtonText: "Hapus",
      icon: "warning",
    });
    if (!ask.isConfirmed) return;
    try {
      await deleteVariant({ productSlug, id: item.id }).unwrap();
      Swal.fire("Berhasil", "Varian dihapus", "success");
      await refetch();
    } catch (e) {
      Swal.fire("Gagal", "Tidak bisa menghapus varian", "error");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Product Variants</h1>

      <div className="flex-1" />
      {/* Pilih produk dulu */}
      <div className="w-full flex justify-between items-center">
        <div className="w-full flex flex-col gap-2">
          <div className="w-1/2">
            <Combobox<Product>
              value={productId}
              onChange={(val) => {
                setProductId(val);
                setCurrentPage(1);
              }}
              onSearchChange={(q) => setProductSearch(q)}
              data={productList}
              isLoading={productLoading}
              getOptionLabel={(item) => `${item.name} — ${item.slug}`}
              placeholder="Pilih Produk"
            />
          </div>

          {/* Header info produk terpilih */}
          {selectedProduct ? (
            <div className="text-sm text-muted-foreground">
              Produk terpilih:{" "}
              <span className="font-semibold text-foreground">
                {selectedProduct.name}
              </span>{" "}
              <span className="ml-2 rounded-md bg-muted px-2 py-0.5 text-xs">
                slug: {selectedProduct.slug}
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Pilih produk terlebih dahulu untuk melihat varian.
            </div>
          )}
          {/* Toolbar list varian */}
          <div className="flex w-1/2 items-center gap-2">
            <Input
              placeholder="Cari varian (nama / sku)…"
              value={variantSearch}
              onChange={(e) => {
                setVariantSearch(e.target.value);
                setCurrentPage(1);
              }}
              disabled={!productSlug}
            />
          </div>
        </div>

        <Button
          onClick={() => {
            if (!productSlug) {
              Swal.fire(
                "Perhatian",
                "Pilih produk terlebih dahulu.",
                "warning"
              );
              return;
            }
            resetForm();
            openModal();
          }}
        >
          Tambah Varian
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Nama Varian</th>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Harga</th>
                <th className="px-4 py-2">Stok</th>
                <th className="px-4 py-2">Berat</th>
                <th className="px-4 py-2">P x L x T (mm)</th>
                <th className="px-4 py-2">Diameter</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {!productSlug ? (
                <tr>
                  <td colSpan={9} className="text-center p-6">
                    Pilih produk terlebih dahulu.
                  </td>
                </tr>
              ) : variantLoading ? (
                <tr>
                  <td colSpan={9} className="text-center p-6">
                    Memuat data…
                  </td>
                </tr>
              ) : variants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-6">
                    Tidak ada varian
                  </td>
                </tr>
              ) : (
                variants.map((v: ProductVariant) => (
                  <tr key={v.id} className="border-t">
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleDetail(v)}>
                          Detail
                        </Button>
                        <Button size="sm" onClick={() => handleEdit(v)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(v)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{v.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{v.sku}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      Rp {Number(v.price).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{v.stock}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{v.weight}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {v.length} × {v.width} × {v.height}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {v.diameter}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Badge variant={v.status ? "success" : "destructive"}>
                        {v.status ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>

        {/* Pager */}
        {productSlug && (
          <div className="p-4 flex items-center justify-between bg-muted">
            <div className="text-sm">
              Halaman <strong>{currentPage}</strong> dari{" "}
              <strong>{lastPage}</strong>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                disabled={currentPage >= lastPage}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <ProductVariantForm
            form={form}
            setForm={setForm}
            onCancel={() => {
              resetForm();
              closeModal();
            }}
            onSubmit={handleSubmit}
            readonly={readonly}
            isLoading={creating || updating}
          />
        </div>
      )}
    </div>
  );
}