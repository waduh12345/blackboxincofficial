"use client";

import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import Image from "next/image";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit,
  UploadCloud,
  Copy,
  Check,
  Loader2,
  ImageIcon,
  Images,
} from "lucide-react";

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

  // State untuk Gambar Variant
  const [variantImageFile, setVariantImageFile] = useState<File | null>(null);
  const [variantImagePreview, setVariantImagePreview] = useState<string | null>(
    null
  );
  const [variantImageUrl, setVariantImageUrl] = useState<string | null>(null); // URL dari gambar produk yang dipilih
  const [showImagePicker, setShowImagePicker] = useState(false);
  const variantFileInputRef = useRef<HTMLInputElement>(null);

  // Get available product images for picker
  const getProductImages = () => {
    const images: { key: string; url: string; label: string }[] = [];
    const imageKeys = ["image", "image_2", "image_3", "image_4", "image_5", "image_6", "image_7"] as const;
    
    imageKeys.forEach((key, index) => {
      const url = imagePreviews[key];
      if (url) {
        images.push({
          key,
          url,
          label: index === 0 ? "Utama" : `Gambar ${index + 1}`,
        });
      }
    });
    
    return images;
  };

  // Handle select image from product
  const handleSelectProductImage = (url: string) => {
    setVariantImagePreview(url);
    setVariantImageUrl(url);
    setVariantImageFile(null); // Clear any uploaded file
    setShowImagePicker(false);
  };

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

  // Helper untuk reset form variant
  const resetVariantForm = () => {
    setVariantForm({ status: true });
    setIsEditingVariant(false);
    setVariantImageFile(null);
    setVariantImagePreview(null);
    setVariantImageUrl(null);
    setShowImagePicker(false);
    if (variantFileInputRef.current) {
      variantFileInputRef.current.value = "";
    }
  };

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

      // Append Gambar Variant - bisa file upload atau URL dari gambar produk
      if (variantImageFile) {
        payload.append("image", variantImageFile);
      } else if (variantImageUrl) {
        // Jika menggunakan URL dari gambar produk yang sudah ada
        payload.append("image_url", variantImageUrl);
      }

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

      resetVariantForm();
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

  // === BULK EDIT STATES ===
  const [bulkVariantPrice, setBulkVariantPrice] = useState<number | "">("");
  const [bulkVariantWeight, setBulkVariantWeight] = useState<number | "">("");
  const [bulkVariantStock, setBulkVariantStock] = useState<number | "">("");
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<number>>(new Set());
  const [isApplyingBulkVariant, setIsApplyingBulkVariant] = useState(false);

  const [bulkSizePrice, setBulkSizePrice] = useState<number | "">("");
  const [bulkSizeWeight, setBulkSizeWeight] = useState<number | "">("");
  const [bulkSizeStock, setBulkSizeStock] = useState<number | "">("");
  const [selectedSizeIds, setSelectedSizeIds] = useState<Set<number>>(new Set());
  const [isApplyingBulkSize, setIsApplyingBulkSize] = useState(false);

  // Toggle select variant for bulk edit
  const toggleSelectVariant = (id: number) => {
    setSelectedVariantIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Toggle select all variants
  const toggleSelectAllVariants = () => {
    if (!variantsData?.data) return;
    if (selectedVariantIds.size === variantsData.data.length) {
      setSelectedVariantIds(new Set());
    } else {
      setSelectedVariantIds(new Set(variantsData.data.map((v) => v.id)));
    }
  };

  // Apply bulk edit to selected variants
  const applyBulkVariantEdit = async () => {
    if (!currentSlug || selectedVariantIds.size === 0) {
      Swal.fire("Info", "Pilih minimal 1 variant", "info");
      return;
    }

    const hasChanges = bulkVariantPrice !== "" || bulkVariantWeight !== "" || bulkVariantStock !== "";
    if (!hasChanges) {
      Swal.fire("Info", "Masukkan nilai yang ingin diubah", "info");
      return;
    }

    setIsApplyingBulkVariant(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const variantId of selectedVariantIds) {
        const variant = variantsData?.data?.find((v) => v.id === variantId);
        if (!variant) continue;

        const payload = new FormData();
        payload.append("name", variant.name);
        payload.append("sku", variant.sku);
        payload.append("price", String(bulkVariantPrice !== "" ? bulkVariantPrice : variant.price));
        payload.append("stock", String(bulkVariantStock !== "" ? bulkVariantStock : variant.stock));
        payload.append("weight", String(bulkVariantWeight !== "" ? bulkVariantWeight : variant.weight));
        payload.append("status", String(variant.status ? 1 : 0));
        payload.append("length", String(variant.length ?? 0));
        payload.append("width", String(variant.width ?? 0));
        payload.append("height", String(variant.height ?? 0));
        payload.append("diameter", String(variant.diameter ?? 0));

        try {
          await updateVariant({
            productSlug: currentSlug,
            id: variantId,
            body: payload,
          }).unwrap();
          successCount++;
        } catch {
          errorCount++;
        }
      }

      await refetchVariants();

      if (errorCount === 0) {
        Swal.fire({
          icon: "success",
          title: `${successCount} variant berhasil diupdate`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Sebagian Berhasil", `${successCount} berhasil, ${errorCount} gagal`, "warning");
      }

      // Reset bulk edit values
      setBulkVariantPrice("");
      setBulkVariantWeight("");
      setBulkVariantStock("");
      setSelectedVariantIds(new Set());
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Terjadi kesalahan saat update massal", "error");
    } finally {
      setIsApplyingBulkVariant(false);
    }
  };

  // Toggle select size for bulk edit
  const toggleSelectSize = (id: number) => {
    setSelectedSizeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Toggle select all sizes
  const toggleSelectAllSizes = () => {
    if (!sizesData?.data) return;
    if (selectedSizeIds.size === sizesData.data.length) {
      setSelectedSizeIds(new Set());
    } else {
      setSelectedSizeIds(new Set(sizesData.data.map((s) => s.id)));
    }
  };

  // Apply bulk edit to selected sizes
  const applyBulkSizeEdit = async () => {
    if (!selectedVariant || selectedSizeIds.size === 0) {
      Swal.fire("Info", "Pilih minimal 1 size", "info");
      return;
    }

    const hasChanges = bulkSizePrice !== "" || bulkSizeWeight !== "" || bulkSizeStock !== "";
    if (!hasChanges) {
      Swal.fire("Info", "Masukkan nilai yang ingin diubah", "info");
      return;
    }

    setIsApplyingBulkSize(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const sizeId of selectedSizeIds) {
        const size = sizesData?.data?.find((s) => s.id === sizeId);
        if (!size) continue;

        const payload = new FormData();
        payload.append("name", size.name);
        payload.append("sku", size.sku);
        payload.append("price", String(bulkSizePrice !== "" ? bulkSizePrice : size.price));
        payload.append("stock", String(bulkSizeStock !== "" ? bulkSizeStock : size.stock));
        payload.append("weight", String(bulkSizeWeight !== "" ? bulkSizeWeight : size.weight));
        payload.append("status", String(size.status ? 1 : 0));
        payload.append("length", String(size.length ?? 0));
        payload.append("width", String(size.width ?? 0));
        payload.append("height", String(size.height ?? 0));
        payload.append("diameter", String(size.diameter ?? 0));

        try {
          await updateSize({
            variantId: selectedVariant.id,
            id: sizeId,
            body: payload,
          }).unwrap();
          successCount++;
        } catch {
          errorCount++;
        }
      }

      await refetchSizes();

      if (errorCount === 0) {
        Swal.fire({
          icon: "success",
          title: `${successCount} size berhasil diupdate`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Sebagian Berhasil", `${successCount} berhasil, ${errorCount} gagal`, "warning");
      }

      // Reset bulk edit values
      setBulkSizePrice("");
      setBulkSizeWeight("");
      setBulkSizeStock("");
      setSelectedSizeIds(new Set());
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Terjadi kesalahan saat update massal", "error");
    } finally {
      setIsApplyingBulkSize(false);
    }
  };

  // Copy price/weight from product to all variants
  const copyProductToAllVariants = async (field: "price" | "weight" | "stock") => {
    if (!currentSlug || !variantsData?.data?.length) {
      Swal.fire("Info", "Tidak ada variant untuk diupdate", "info");
      return;
    }

    const value = productForm[field];
    if (value === undefined || value === null) {
      Swal.fire("Info", `${field} produk belum diisi`, "info");
      return;
    }

    const confirm = await Swal.fire({
      title: `Copy ${field} produk ke semua variant?`,
      text: `Nilai ${field}: ${formatNumber(Number(value))}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Copy Semua",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setIsApplyingBulkVariant(true);
    let successCount = 0;

    try {
      for (const variant of variantsData.data) {
        const payload = new FormData();
        payload.append("name", variant.name);
        payload.append("sku", variant.sku);
        payload.append("price", String(field === "price" ? value : variant.price));
        payload.append("stock", String(field === "stock" ? value : variant.stock));
        payload.append("weight", String(field === "weight" ? value : variant.weight));
        payload.append("status", String(variant.status ? 1 : 0));
        payload.append("length", String(variant.length ?? 0));
        payload.append("width", String(variant.width ?? 0));
        payload.append("height", String(variant.height ?? 0));
        payload.append("diameter", String(variant.diameter ?? 0));

        try {
          await updateVariant({
            productSlug: currentSlug,
            id: variant.id,
            body: payload,
          }).unwrap();
          successCount++;
        } catch {
          // continue
        }
      }

      await refetchVariants();
      Swal.fire({
        icon: "success",
        title: `${successCount} variant diupdate`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsApplyingBulkVariant(false);
    }
  };

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

  // VIEW: STEP 2 (VARIANT) - UPDATED DENGAN BULK EDIT
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Daftar Variant Produk</h3>
        <div className="text-sm text-gray-500">Produk: {productForm.name}</div>
      </div>

      {/* BULK EDIT SECTION FOR VARIANTS */}
      {variantsData?.data && variantsData.data.length > 0 && (
        <div className="border-2 border-blue-300 bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Edit Massal Variant (Update Harga/Berat/Stok Sekaligus)
          </h4>
          
          {/* Quick Copy from Product */}
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-blue-200">
            <span className="text-sm text-blue-700 mr-2">Copy dari Produk:</span>
            <Button
              size="sm"
              variant="outline"
              className="border-blue-400 text-blue-700 hover:bg-blue-100"
              onClick={() => copyProductToAllVariants("price")}
              disabled={isApplyingBulkVariant}
            >
              <Copy className="w-3 h-3 mr-1" /> Harga ({formatNumber(productForm.price ?? 0)})
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-blue-400 text-blue-700 hover:bg-blue-100"
              onClick={() => copyProductToAllVariants("weight")}
              disabled={isApplyingBulkVariant}
            >
              <Copy className="w-3 h-3 mr-1" /> Berat ({productForm.weight ?? 0}g)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-blue-400 text-blue-700 hover:bg-blue-100"
              onClick={() => copyProductToAllVariants("stock")}
              disabled={isApplyingBulkVariant}
            >
              <Copy className="w-3 h-3 mr-1" /> Stok ({productForm.stock ?? 0})
            </Button>
          </div>

          {/* Manual Bulk Edit */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <Label className="text-xs mb-1 block text-blue-700">Harga Baru (Rp)</Label>
              <Input
                type="number"
                placeholder="Kosongkan jika tidak diubah"
                value={bulkVariantPrice}
                onChange={(e) => setBulkVariantPrice(e.target.value ? Number(e.target.value) : "")}
                className="bg-white"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-blue-700">Berat Baru (g)</Label>
              <Input
                type="number"
                placeholder="Kosongkan jika tidak diubah"
                value={bulkVariantWeight}
                onChange={(e) => setBulkVariantWeight(e.target.value ? Number(e.target.value) : "")}
                className="bg-white"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-blue-700">Stok Baru</Label>
              <Input
                type="number"
                placeholder="Kosongkan jika tidak diubah"
                value={bulkVariantStock}
                onChange={(e) => setBulkVariantStock(e.target.value ? Number(e.target.value) : "")}
                className="bg-white"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={applyBulkVariantEdit}
                disabled={isApplyingBulkVariant || selectedVariantIds.size === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isApplyingBulkVariant ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                Terapkan ke {selectedVariantIds.size} terpilih
              </Button>
            </div>
          </div>
          <p className="text-xs text-blue-600">
            Centang variant yang ingin diupdate, lalu isi nilai baru dan klik Terapkan
          </p>
        </div>
      )}

      <div className="border border-black p-4 rounded bg-gray-50">
        <h4 className="font-semibold mb-3">
          {isEditingVariant ? "Edit Variant" : "Tambah Variant Baru"}
        </h4>

        {/* Layout Grid Form (Gambar di Kiri, Input di Kanan) */}
        <div className="flex flex-col md:flex-row gap-4 mb-3">
          {/* --- Bagian Upload Gambar Variant --- */}
          <div className="w-full md:w-44 flex-shrink-0 space-y-2">
            {/* Preview Gambar */}
            <div
              className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 overflow-hidden bg-white"
              onClick={() => variantFileInputRef.current?.click()}
            >
              {variantImagePreview ? (
                <Image
                  src={variantImagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="text-center p-2">
                  <UploadCloud className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Upload Foto</span>
                </div>
              )}
            </div>
            
            {/* Button Options */}
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-8"
                onClick={() => variantFileInputRef.current?.click()}
              >
                <UploadCloud className="w-3 h-3 mr-1" />
                Upload
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-8"
                onClick={() => setShowImagePicker(true)}
                disabled={getProductImages().length === 0}
              >
                <Images className="w-3 h-3 mr-1" />
                Pilih
              </Button>
            </div>
            
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              ref={variantFileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setVariantImageFile(file);
                  setVariantImagePreview(URL.createObjectURL(file));
                  setVariantImageUrl(null); // Clear URL jika upload file baru
                }
              }}
            />
            
            {variantImagePreview && (
              <div className="text-center">
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => {
                    setVariantImageFile(null);
                    setVariantImagePreview(null);
                    setVariantImageUrl(null);
                    if (variantFileInputRef.current)
                      variantFileInputRef.current.value = "";
                  }}
                >
                  Hapus Gambar
                </button>
              </div>
            )}
            
            {/* Image Picker Modal */}
            {showImagePicker && (
              <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-md w-full p-4 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-lg">Pilih dari Gambar Produk</h4>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setShowImagePicker(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {getProductImages().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Belum ada gambar produk</p>
                      <p className="text-xs">Upload gambar di Step 1 terlebih dahulu</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {getProductImages().map((img) => (
                        <button
                          key={img.key}
                          type="button"
                          onClick={() => handleSelectProductImage(img.url)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-black ${
                            variantImagePreview === img.url
                              ? "border-black ring-2 ring-black"
                              : "border-gray-200"
                          }`}
                        >
                          <Image
                            src={img.url}
                            alt={img.label}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                            {img.label}
                          </div>
                          {variantImagePreview === img.url && (
                            <div className="absolute top-1 right-1 bg-black text-white rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImagePicker(false)}
                    >
                      Tutup
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- Bagian Input Text --- */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="col-span-2 md:col-span-1">
              <Label className="text-xs mb-1 block">Nama Variant</Label>
              <Input
                placeholder="Nama Variant (mis: Merah)"
                value={variantForm.name || ""}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, name: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <Label className="text-xs mb-1 block">SKU</Label>
              <Input
                placeholder="SKU"
                value={variantForm.sku || ""}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, sku: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Harga (IDR)</Label>
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
            </div>
            <div>
              <Label className="text-xs mb-1 block">Stok</Label>
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
            </div>
            <div>
              <Label className="text-xs mb-1 block">Berat (gram)</Label>
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
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(variantForm.status)}
                  onChange={(e) =>
                    setVariantForm({ ...variantForm, status: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">Aktif</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {isEditingVariant && (
            <Button variant="ghost" onClick={resetVariantForm}>
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
              <th className="p-2 w-10">
                <input
                  type="checkbox"
                  checked={variantsData?.data?.length ? selectedVariantIds.size === variantsData.data.length : false}
                  onChange={toggleSelectAllVariants}
                  className="w-4 h-4"
                />
              </th>
              <th className="p-2 w-16">Image</th>
              <th className="p-2">Nama</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Harga</th>
              <th className="p-2">Stok</th>
              <th className="p-2">Berat</th>
              <th className="p-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {variantsData?.data?.map((v) => (
              <tr
                key={v.id}
                className={`border-t border-gray-300 hover:bg-gray-50 ${selectedVariantIds.has(v.id) ? "bg-blue-50" : ""}`}
              >
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedVariantIds.has(v.id)}
                    onChange={() => toggleSelectVariant(v.id)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="p-2">
                  <div className="relative w-10 h-10 border rounded bg-gray-100 overflow-hidden">
                    {v.image ? (
                      <Image
                        src={v.image}
                        alt={v.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-gray-400">
                        No Img
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-2 font-medium">{v.name}</td>
                <td className="p-2">{v.sku}</td>
                <td className="p-2">{formatNumber(v.price)}</td>
                <td className="p-2">{v.stock}</td>
                <td className="p-2">{v.weight}g</td>
                <td className="p-2 flex justify-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => {
                      setVariantForm(v);
                      setVariantImagePreview(v.image || null);
                      setVariantImageFile(null);
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
                      setSelectedSizeIds(new Set());
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
                <td colSpan={8} className="p-4 text-center text-gray-500">
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

  // VIEW: STEP 3 (SIZE) - DENGAN BULK EDIT
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
        <div>
          <h3 className="font-bold text-lg">Kelola Size</h3>
          <div className="text-xs text-gray-500">
            Variant: <b>{selectedVariant?.name}</b> (SKU: {selectedVariant?.sku})
          </div>
        </div>
        <Button variant="ghost" onClick={() => setStep(2)}>
          Kembali ke Variant
        </Button>
      </div>

      {/* BULK EDIT SECTION FOR SIZES */}
      {sizesData?.data && sizesData.data.length > 0 && (
        <div className="border-2 border-green-300 bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3 text-green-800 flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Edit Massal Size (Update Harga/Berat/Stok Sekaligus)
          </h4>
          
          {/* Copy from Variant */}
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-green-200">
            <span className="text-sm text-green-700 mr-2">Copy dari Variant:</span>
            <Button
              size="sm"
              variant="outline"
              className="border-green-400 text-green-700 hover:bg-green-100"
              onClick={async () => {
                if (!selectedVariant || !sizesData?.data?.length) return;
                const confirm = await Swal.fire({
                  title: "Copy harga variant ke semua size?",
                  text: `Harga: ${formatNumber(selectedVariant.price)}`,
                  icon: "question",
                  showCancelButton: true,
                });
                if (!confirm.isConfirmed) return;
                setBulkSizePrice(selectedVariant.price);
                setSelectedSizeIds(new Set(sizesData.data.map(s => s.id)));
              }}
              disabled={isApplyingBulkSize}
            >
              <Copy className="w-3 h-3 mr-1" /> Harga ({formatNumber(selectedVariant?.price ?? 0)})
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-green-400 text-green-700 hover:bg-green-100"
              onClick={async () => {
                if (!selectedVariant || !sizesData?.data?.length) return;
                const confirm = await Swal.fire({
                  title: "Copy berat variant ke semua size?",
                  text: `Berat: ${selectedVariant.weight}g`,
                  icon: "question",
                  showCancelButton: true,
                });
                if (!confirm.isConfirmed) return;
                setBulkSizeWeight(selectedVariant.weight);
                setSelectedSizeIds(new Set(sizesData.data.map(s => s.id)));
              }}
              disabled={isApplyingBulkSize}
            >
              <Copy className="w-3 h-3 mr-1" /> Berat ({selectedVariant?.weight ?? 0}g)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-green-400 text-green-700 hover:bg-green-100"
              onClick={async () => {
                if (!selectedVariant || !sizesData?.data?.length) return;
                const confirm = await Swal.fire({
                  title: "Copy stok variant ke semua size?",
                  text: `Stok: ${selectedVariant.stock}`,
                  icon: "question",
                  showCancelButton: true,
                });
                if (!confirm.isConfirmed) return;
                setBulkSizeStock(selectedVariant.stock);
                setSelectedSizeIds(new Set(sizesData.data.map(s => s.id)));
              }}
              disabled={isApplyingBulkSize}
            >
              <Copy className="w-3 h-3 mr-1" /> Stok ({selectedVariant?.stock ?? 0})
            </Button>
          </div>

          {/* Manual Bulk Edit */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <Label className="text-xs mb-1 block text-green-700">Harga Baru (Rp)</Label>
              <Input
                type="number"
                placeholder="Kosongkan jika tidak diubah"
                value={bulkSizePrice}
                onChange={(e) => setBulkSizePrice(e.target.value ? Number(e.target.value) : "")}
                className="bg-white"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-green-700">Berat Baru (g)</Label>
              <Input
                type="number"
                placeholder="Kosongkan jika tidak diubah"
                value={bulkSizeWeight}
                onChange={(e) => setBulkSizeWeight(e.target.value ? Number(e.target.value) : "")}
                className="bg-white"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-green-700">Stok Baru</Label>
              <Input
                type="number"
                placeholder="Kosongkan jika tidak diubah"
                value={bulkSizeStock}
                onChange={(e) => setBulkSizeStock(e.target.value ? Number(e.target.value) : "")}
                className="bg-white"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={applyBulkSizeEdit}
                disabled={isApplyingBulkSize || selectedSizeIds.size === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isApplyingBulkSize ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                Terapkan ke {selectedSizeIds.size} terpilih
              </Button>
            </div>
          </div>
          <p className="text-xs text-green-600">
            Centang size yang ingin diupdate, lalu isi nilai baru dan klik Terapkan
          </p>
        </div>
      )}

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
            placeholder="Harga"
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
              <th className="p-2 w-10">
                <input
                  type="checkbox"
                  checked={sizesData?.data?.length ? selectedSizeIds.size === sizesData.data.length : false}
                  onChange={toggleSelectAllSizes}
                  className="w-4 h-4"
                />
              </th>
              <th className="p-2">Size</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Harga</th>
              <th className="p-2">Stok</th>
              <th className="p-2">Berat</th>
              <th className="p-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sizesData?.data?.map((s) => (
              <tr 
                key={s.id} 
                className={`border-t border-gray-300 hover:bg-gray-50 ${selectedSizeIds.has(s.id) ? "bg-green-50" : ""}`}
              >
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedSizeIds.has(s.id)}
                    onChange={() => toggleSelectSize(s.id)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="p-2 font-medium">{s.name}</td>
                <td className="p-2">{s.sku}</td>
                <td className="p-2">{formatNumber(s.price)}</td>
                <td className="p-2">{s.stock}</td>
                <td className="p-2">{s.weight}g</td>
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
                <td colSpan={7} className="p-4 text-center text-gray-500">
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