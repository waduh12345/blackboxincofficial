"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Image from "next/image";
import { X, ChevronRight, ChevronLeft, Trash2, Edit } from "lucide-react";

// UI Components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combo-box";
import { formatNumber } from "@/lib/format";

// Types
import { Product } from "@/types/admin/product";
import { ProductVariant } from "@/types/admin/product-variant";
import { ProductVariantSize } from "@/services/admin/product-variant-size.service";

// Services
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetProductBySlugQuery,
} from "@/services/admin/product.service";
import {
  useGetProductVariantsQuery,
  useCreateProductVariantMutation,
  useUpdateProductVariantMutation,
  useDeleteProductVariantMutation,
} from "@/services/admin/product-variant.service";
import {
  useGetProductVariantSizesQuery,
  useCreateProductVariantSizeMutation,
  useUpdateProductVariantSizeMutation,
  useDeleteProductVariantSizeMutation,
} from "@/services/admin/product-variant-size.service";
import { useGetProductCategoryListQuery } from "@/services/master/product-category.service";
import { useGetProductMerkListQuery } from "@/services/master/product-merk.service";
import { ApiErrorResponse } from "@/lib/error-handle";

interface FormProductProps {
  editingSlug?: string | null;
  initialData: Partial<Product>;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function FormProduct({
  editingSlug,
  initialData,
  onCancel,
  onSuccess,
}: FormProductProps) {
  // === STATE UTAMA ===
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentSlug, setCurrentSlug] = useState<string | null>(
    editingSlug || null
  );
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  // Jika sedang mode edit dan slug tersedia, fetch detail produk
  const { data: productDetail } = useGetProductBySlugQuery(currentSlug!, {
    skip: !currentSlug,
  });

  // Efek sinkronisasi data produk saat fetch berhasil
  useEffect(() => {
    if (productDetail && step === 1) {
      setProductForm((prev) => ({ ...prev, ...productDetail }));
      // Set previews gambar
      const nextPreviews = { ...imagePreviews };
      (
        [
          "image",
          "image_2",
          "image_3",
          "image_4",
          "image_5",
          "image_6",
          "image_7",
        ] as const
      ).forEach((key) => {
        if (typeof productDetail[key] === "string") {
          nextPreviews[key] = productDetail[key] as string;
        }
      });
      setImagePreviews(nextPreviews);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productDetail]); // Hapus dependency 'step' agar tidak reset saat navigasi balik

  // === STEP 1: PRODUCT LOGIC ===
  const [productForm, setProductForm] = useState<Partial<Product>>({
    status: true,
    ...initialData,
  });
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>(
    {}
  );

  // Master Data Loaders
  const { data: categories } = useGetProductCategoryListQuery({
    page: 1,
    paginate: 100,
  });
  const { data: merks } = useGetProductMerkListQuery({
    page: 1,
    paginate: 100,
  });

  // Mutations
  const [createProduct, { isLoading: isCreatingProduct }] =
    useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdatingProduct }] =
    useUpdateProductMutation();

  const handleProductSubmit = async () => {
    try {
      const payload = new FormData();
      // Validasi sederhana
      if (!productForm.name) throw new Error("Nama produk wajib diisi");
      if (!productForm.product_category_id)
        throw new Error("Kategori wajib dipilih");
      if (!productForm.product_merk_id) throw new Error("Merk wajib dipilih");

      // Append fields
      payload.append("shop_id", "1");
      payload.append("name", productForm.name);
      if (productForm.description)
        payload.append("description", productForm.description);
      payload.append(
        "product_category_id",
        String(productForm.product_category_id)
      );
      payload.append("product_merk_id", String(productForm.product_merk_id));
      payload.append("status", productForm.status ? "1" : "0");
      payload.append("price", String(productForm.price ?? 0));
      payload.append("weight", String(productForm.weight ?? 0));
      payload.append("stock", String(productForm.stock ?? 0));
      // Dimensi
      payload.append("length", String(productForm.length ?? 0));
      payload.append("width", String(productForm.width ?? 0));
      payload.append("height", String(productForm.height ?? 0));
      payload.append("diameter", String(productForm.diameter ?? 0));

      // Append Images
      (
        [
          "image",
          "image_2",
          "image_3",
          "image_4",
          "image_5",
          "image_6",
          "image_7",
        ] as const
      ).forEach((key) => {
        const file = productForm[key];
        if (file instanceof File) {
          payload.append(key, file);
        }
      });

      let resultSlug = currentSlug;

      if (currentSlug) {
        // UPDATE
        payload.append("_method", "PUT");
        const res = await updateProduct({
          slug: currentSlug,
          payload,
        }).unwrap();
        resultSlug = res.slug;
        Swal.fire({
          icon: "success",
          title: "Produk Diperbarui",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // CREATE
        const res = await createProduct(payload).unwrap();
        resultSlug = res.slug;
        Swal.fire({
          icon: "success",
          title: "Produk Dibuat",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setCurrentSlug(resultSlug);
      onSuccess(); // Refresh table luar
      setStep(2); // Lanjut ke Variant
    } catch (error: unknown) {
      console.error(error);
      const err = error as ApiErrorResponse;
      Swal.fire(
        "Gagal",
        err?.data?.message || err?.message || "Terjadi kesalahan",
        "error"
      );
    }
  };

  // === STEP 2: VARIANT LOGIC ===
  const [variantForm, setVariantForm] = useState<Partial<ProductVariant>>({
    status: true,
  });
  const [isEditingVariant, setIsEditingVariant] = useState(false);

  // Query Variants
  const { data: variantsData, refetch: refetchVariants } =
    useGetProductVariantsQuery(
      { productSlug: currentSlug || "", page: 1, paginate: 100 },
      { skip: !currentSlug || step !== 2 }
    );

  const [createVariant, { isLoading: isCreatingVar }] =
    useCreateProductVariantMutation();
  const [updateVariant, { isLoading: isUpdatingVar }] =
    useUpdateProductVariantMutation();
  const [deleteVariant] = useDeleteProductVariantMutation();

  const handleVariantSubmit = async () => {
    if (!currentSlug) return;
    try {
      const payload = new FormData();
      payload.append("name", variantForm.name || "");
      payload.append("sku", variantForm.sku || "");
      payload.append("price", String(variantForm.price ?? 0));
      payload.append("stock", String(variantForm.stock ?? 0));
      payload.append("weight", String(variantForm.weight ?? 0));
      payload.append("status", variantForm.status ? "1" : "0");
      // Dimensi variant
      payload.append("length", String(variantForm.length ?? 0));
      payload.append("width", String(variantForm.width ?? 0));
      payload.append("height", String(variantForm.height ?? 0));
      payload.append("diameter", String(variantForm.diameter ?? 0));

      if (isEditingVariant && variantForm.id) {
        // Update
        await updateVariant({
          productSlug: currentSlug,
          id: variantForm.id,
          body: payload,
        }).unwrap();
        Swal.fire({
          icon: "success",
          title: "Variant Diupdate",
          timer: 1000,
          showConfirmButton: false,
        });
      } else {
        // Create
        await createVariant({
          productSlug: currentSlug,
          body: payload,
        }).unwrap();
        Swal.fire({
          icon: "success",
          title: "Variant Ditambahkan",
          timer: 1000,
          showConfirmButton: false,
        });
      }

      setVariantForm({ status: true });
      setIsEditingVariant(false);
      refetchVariants();
    } catch (error: unknown) {
      console.error(error);
      const err = error as ApiErrorResponse;
      Swal.fire(
        "Gagal",
        err?.data?.message || err?.message || "Gagal Simpan Variant",
        "error"
      );
    }
  };

  const handleDeleteVariant = async (id: number) => {
    if (!currentSlug) return;
    const conf = await Swal.fire({
      title: "Hapus Variant?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    });
    if (conf.isConfirmed) {
      await deleteVariant({ productSlug: currentSlug, id }).unwrap();
      refetchVariants();
    }
  };

  // === STEP 3: SIZE LOGIC ===
  const [sizeForm, setSizeForm] = useState<Partial<ProductVariantSize>>({
    status: true,
  });
  const [isEditingSize, setIsEditingSize] = useState(false);

  const { data: sizesData, refetch: refetchSizes } =
    useGetProductVariantSizesQuery(
      { variantId: selectedVariant?.id || 0, page: 1, paginate: 100 },
      { skip: !selectedVariant || step !== 3 }
    );

  const [createSize, { isLoading: isCreatingSize }] =
    useCreateProductVariantSizeMutation();
  const [updateSize, { isLoading: isUpdatingSize }] =
    useUpdateProductVariantSizeMutation();
  const [deleteSize] = useDeleteProductVariantSizeMutation();

  const handleSizeSubmit = async () => {
    if (!selectedVariant) return;
    try {
      const payload = new FormData();
      payload.append("name", sizeForm.name || "");
      payload.append("sku", sizeForm.sku || "");
      payload.append("price", String(sizeForm.price ?? 0));
      payload.append("stock", String(sizeForm.stock ?? 0));
      payload.append("weight", String(sizeForm.weight ?? 0));
      payload.append("status", sizeForm.status ? "1" : "0");
      payload.append("length", String(sizeForm.length ?? 0));
      payload.append("width", String(sizeForm.width ?? 0));
      payload.append("height", String(sizeForm.height ?? 0));
      payload.append("diameter", String(sizeForm.diameter ?? 0));

      if (isEditingSize && sizeForm.id) {
        await updateSize({
          variantId: selectedVariant.id,
          id: sizeForm.id,
          body: payload,
        }).unwrap();
        Swal.fire({
          icon: "success",
          title: "Size Diupdate",
          timer: 1000,
          showConfirmButton: false,
        });
      } else {
        await createSize({
          variantId: selectedVariant.id,
          body: payload,
        }).unwrap();
        Swal.fire({
          icon: "success",
          title: "Size Ditambahkan",
          timer: 1000,
          showConfirmButton: false,
        });
      }
      setSizeForm({ status: true });
      setIsEditingSize(false);
      refetchSizes();
    } catch (error: unknown) {
      console.error(error);
      const err = error as ApiErrorResponse;
      Swal.fire(
        "Gagal",
        err?.data?.message || err?.message || "Terjadi kesalahan",
        "error"
      );
    }
  };

  const handleDeleteSize = async (id: number) => {
    if (!selectedVariant) return;
    const conf = await Swal.fire({
      title: "Hapus Size?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    });
    if (conf.isConfirmed) {
      await deleteSize({ variantId: selectedVariant.id, id }).unwrap();
      refetchSizes();
    }
  };

  // === RENDER HELPERS ===
  const renderImageInput = (key: string, label: string) => (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {imagePreviews[key] && (
        <div className="relative w-24 h-24 border border-black">
          <Image
            src={imagePreviews[key]}
            alt="preview"
            fill
            className="object-cover"
          />
        </div>
      )}
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setProductForm({ ...productForm, [key]: file });
            setImagePreviews({
              ...imagePreviews,
              [key]: URL.createObjectURL(file),
            });
          }
        }}
      />
    </div>
  );

  // === RENDER STEPS ===

  // VIEW: STEP 1 (PRODUCT)
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* ... (Input lainnya tetap sama) ... */}
        <div className="col-span-2">
          <Label>Nama Produk</Label>
          <Input
            value={productForm.name || ""}
            onChange={(e) =>
              setProductForm({ ...productForm, name: e.target.value })
            }
            placeholder="Nama Produk"
          />
        </div>
        <div>
          <Label>Kategori</Label>
          <Combobox
            data={categories?.data || []}
            value={productForm.product_category_id || null}
            onChange={(val) =>
              setProductForm({ ...productForm, product_category_id: val })
            }
            getOptionLabel={(i) => i.name}
            placeholder="Pilih Kategori"
          />
        </div>
        <div>
          <Label>Merk</Label>
          <Combobox
            data={merks?.data || []}
            value={productForm.product_merk_id || null}
            onChange={(val) =>
              setProductForm({ ...productForm, product_merk_id: val })
            }
            getOptionLabel={(i) => i.name}
            placeholder="Pilih Merk"
          />
        </div>
        <div className="col-span-2">
          <Label>Deskripsi</Label>
          <Textarea
            value={productForm.description || ""}
            onChange={(e) =>
              setProductForm({ ...productForm, description: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Harga</Label>
          <Input
            type="number"
            value={productForm.price ?? ""}
            onChange={(e) =>
              setProductForm({ ...productForm, price: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <Label>Stok</Label>
          <Input
            type="number"
            value={productForm.stock ?? ""}
            onChange={(e) =>
              setProductForm({ ...productForm, stock: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <Label>Berat (Gram)</Label>
          <Input
            type="number"
            value={productForm.weight ?? ""}
            onChange={(e) =>
              setProductForm({ ...productForm, weight: Number(e.target.value) })
            }
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(productForm.status)}
              onChange={(e) =>
                setProductForm({ ...productForm, status: e.target.checked })
              }
              className="w-4 h-4"
            />
            <span>Aktif</span>
          </label>
        </div>
      </div>

      <div className="border-t border-black pt-4">
        <Label className="mb-2 block font-bold">Gambar Produk</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {renderImageInput("image", "Utama *")}
          {renderImageInput("image_2", "Gambar 2")}
          {renderImageInput("image_3", "Gambar 3")}
          {renderImageInput("image_4", "Gambar 4")}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-black">
        <Button variant="outline" onClick={onCancel} className="border-black">
          Batal
        </Button>
        {/* BUTTON BARU: Lanjut Tanpa Simpan jika sudah ada data */}
        {currentSlug && (
          <Button
            type="button"
            variant="secondary"
            className="bg-gray-200 hover:bg-gray-300 text-black"
            onClick={() => setStep(2)}
          >
            Lanjut (Tanpa Simpan)
          </Button>
        )}
        <Button
          onClick={handleProductSubmit}
          disabled={isCreatingProduct || isUpdatingProduct}
          className="bg-black text-white"
        >
          {isCreatingProduct || isUpdatingProduct
            ? "Menyimpan..."
            : currentSlug
            ? "Simpan & Lanjut"
            : "Buat & Lanjut"}
        </Button>
      </div>
    </div>
  );

  // VIEW: STEP 2 (VARIANT) - Tidak banyak berubah, hanya layout
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Daftar Variant Produk</h3>
        <div className="text-sm text-gray-500">Produk: {productForm.name}</div>
      </div>

      <div className="border border-black p-4 rounded bg-gray-50">
        <h4 className="font-semibold mb-3">
          {isEditingVariant ? "Edit Variant" : "Tambah Variant Baru"}
        </h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input
            placeholder="Nama Variant (mis: Merah)"
            value={variantForm.name || ""}
            onChange={(e) =>
              setVariantForm({ ...variantForm, name: e.target.value })
            }
          />
          <Input
            placeholder="SKU"
            value={variantForm.sku || ""}
            onChange={(e) =>
              setVariantForm({ ...variantForm, sku: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Harga"
            value={variantForm.price ?? ""}
            onChange={(e) =>
              setVariantForm({
                ...variantForm,
                price: Number(e.target.value),
              })
            }
          />
          <Input
            type="number"
            placeholder="Stok"
            value={variantForm.stock ?? ""}
            onChange={(e) =>
              setVariantForm({
                ...variantForm,
                stock: Number(e.target.value),
              })
            }
          />
          <Input
            type="number"
            placeholder="Berat (g)"
            value={variantForm.weight ?? ""}
            onChange={(e) =>
              setVariantForm({
                ...variantForm,
                weight: Number(e.target.value),
              })
            }
          />
        </div>
        <div className="flex justify-end gap-2">
          {isEditingVariant && (
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditingVariant(false);
                setVariantForm({ status: true });
              }}
            >
              Batal Edit
            </Button>
          )}
          <Button
            onClick={handleVariantSubmit}
            disabled={isCreatingVar || isUpdatingVar}
            className="bg-black text-white"
          >
            {isCreatingVar || isUpdatingVar
              ? "Memproses..."
              : isEditingVariant
              ? "Update Variant"
              : "Tambah Variant"}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border border-black rounded">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-200 text-black font-bold">
            <tr>
              <th className="p-2">Nama</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Harga</th>
              <th className="p-2">Stok</th>
              <th className="p-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {variantsData?.data?.map((v) => (
              <tr key={v.id} className="border-t border-gray-300">
                <td className="p-2">{v.name}</td>
                <td className="p-2">{v.sku}</td>
                <td className="p-2">{formatNumber(v.price)}</td>
                <td className="p-2">{v.stock}</td>
                <td className="p-2 flex justify-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => {
                      setVariantForm(v);
                      setIsEditingVariant(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-8 w-8 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleDeleteVariant(v.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-black text-white ml-2 text-xs"
                    onClick={() => {
                      setSelectedVariant(v);
                      setStep(3);
                    }}
                  >
                    Kelola Size <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </td>
              </tr>
            ))}
            {(!variantsData?.data || variantsData.data.length === 0) && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Belum ada variant
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between pt-4 border-t border-black">
        <Button
          variant="outline"
          onClick={() => setStep(1)}
          className="border-black"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Kembali ke Produk
        </Button>
        <Button
          variant="default"
          className="bg-green-600 hover:bg-green-700"
          onClick={onCancel}
        >
          Selesai & Tutup
        </Button>
      </div>
    </div>
  );

  // VIEW: STEP 3 (SIZE) - PERBAIKAN UTAMA PADA VALUE INPUT
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
        <div>
          <h3 className="font-bold text-lg">Kelola Size</h3>
          <div className="text-xs text-gray-500">
            Variant: <b>{selectedVariant?.name}</b> (SKU: {selectedVariant?.sku}
            )
          </div>
        </div>
        <Button variant="ghost" onClick={() => setStep(2)}>
          Kembali ke Variant
        </Button>
      </div>

      <div className="border border-black p-4 rounded bg-gray-50">
        <h4 className="font-semibold mb-3">
          {isEditingSize ? "Edit Size" : "Tambah Size Baru"}
        </h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input
            placeholder="Nama Size (mis: XL)"
            value={sizeForm.name || ""}
            onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })}
          />
          <Input
            placeholder="SKU Size"
            value={sizeForm.sku || ""}
            onChange={(e) => setSizeForm({ ...sizeForm, sku: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Harga Tambahan"
            // PENTING: Gunakan ?? "" agar angka 0 tidak dianggap kosong
            value={sizeForm.price ?? ""}
            onChange={(e) =>
              setSizeForm({ ...sizeForm, price: Number(e.target.value) })
            }
          />
          <Input
            type="number"
            placeholder="Stok"
            value={sizeForm.stock ?? ""}
            onChange={(e) =>
              setSizeForm({ ...sizeForm, stock: Number(e.target.value) })
            }
          />
          <Input
            type="number"
            placeholder="Berat (g)"
            value={sizeForm.weight ?? ""}
            onChange={(e) =>
              setSizeForm({ ...sizeForm, weight: Number(e.target.value) })
            }
          />
        </div>
        <div className="flex justify-end gap-2">
          {isEditingSize && (
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditingSize(false);
                setSizeForm({ status: true });
              }}
            >
              Batal Edit
            </Button>
          )}
          <Button
            onClick={handleSizeSubmit}
            disabled={isCreatingSize || isUpdatingSize}
            className="bg-black text-white"
          >
            {isCreatingSize || isUpdatingSize
              ? "Memproses..."
              : isEditingSize
              ? "Update Size"
              : "Tambah Size"}
          </Button>
        </div>
      </div>

      {/* Table List Size */}
      <div className="overflow-x-auto border border-black rounded">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-200 text-black font-bold">
            <tr>
              <th className="p-2">Size</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Harga</th>
              <th className="p-2">Stok</th>
              <th className="p-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sizesData?.data?.map((s) => (
              <tr key={s.id} className="border-t border-gray-300">
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.sku}</td>
                <td className="p-2">{formatNumber(s.price)}</td>
                <td className="p-2">{s.stock}</td>
                <td className="p-2 flex justify-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => {
                      setSizeForm(s);
                      setIsEditingSize(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-8 w-8 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleDeleteSize(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {(!sizesData?.data || sizesData.data.length === 0) && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Belum ada size untuk variant ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl border border-black">
      {/* Header Stepper - DIBUAT KLIKABLE JIKA DATA ADA */}
      <div className="flex justify-between items-center p-6 border-b border-black bg-gray-50">
        <div className="flex items-center space-x-4 select-none">
          {/* STEP 1 */}
          <div
            onClick={() => setStep(1)}
            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold cursor-pointer ${
              step === 1 ? "bg-black text-white" : "bg-gray-300 text-gray-600"
            }`}
          >
            1
          </div>
          <div className="h-1 w-8 bg-gray-300"></div>

          {/* STEP 2 - Klikable jika currentSlug ada */}
          <div
            onClick={() => currentSlug && setStep(2)}
            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
              currentSlug
                ? "cursor-pointer hover:bg-gray-400"
                : "cursor-not-allowed"
            } ${
              step === 2 ? "bg-black text-white" : "bg-gray-300 text-gray-600"
            }`}
          >
            2
          </div>
          <div className="h-1 w-8 bg-gray-300"></div>

          {/* STEP 3 - Klikable jika selectedVariant ada */}
          <div
            onClick={() => selectedVariant && setStep(3)}
            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
              selectedVariant
                ? "cursor-pointer hover:bg-gray-400"
                : "cursor-not-allowed"
            } ${
              step === 3 ? "bg-black text-white" : "bg-gray-300 text-gray-600"
            }`}
          >
            3
          </div>
          <span className="ml-4 font-semibold text-lg">
            {step === 1 && "Detail Produk"}
            {step === 2 && "Atur Variant"}
            {step === 3 && "Atur Size"}
          </span>
        </div>
        <Button
          variant="ghost"
          onClick={onCancel}
          className="hover:bg-gray-200 rounded-full h-10 w-10 p-0"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {/* Pastikan Step 3 hanya dirender jika variant sudah dipilih agar data tidak error */}
        {step === 3 && selectedVariant && renderStep3()}
      </div>
    </div>
  );
}