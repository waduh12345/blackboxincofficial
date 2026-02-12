"use client";

import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useModal from "@/hooks/use-modal";
import {
  useGetProductListQuery,
  useDeleteProductMutation,
  useUpdateProductMutation,
} from "@/services/admin/product.service";
import {
  useUpdateProductVariantMutation,
  useCreateProductVariantMutation,
} from "@/services/admin/product-variant.service";
import { Product } from "@/types/admin/product";
import FormProduct from "@/components/form-modal/admin/product-form";
import { Badge } from "@/components/ui/badge";
import {
  Edit3,
  Trash2,
  X,
  Plus,
  Image as ImageIcon,
  Upload,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
} from "lucide-react";
import Image from "next/image";

// Type for bulk edit data
interface BulkEditRow {
  slug: string;
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  weight: number;
  image: File | string | null;
  imagePreview: string | null;
  variants: VariantEditRow[];
  isExpanded: boolean;
  isDirty: boolean;
}

interface VariantEditRow {
  id: number | null; // null = new variant
  name: string; // color name
  sku: string;
  price: number;
  stock: number;
  weight: number;
  image: File | string | null;
  imagePreview: string | null;
  isDirty: boolean;
  isNew: boolean;
}

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

  // Bulk Edit States
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkEditData, setBulkEditData] = useState<BulkEditRow[]>([]);
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // 1. Service: Get Product List
  const { data, isLoading, refetch } = useGetProductListQuery({
    page: currentPage,
    paginate: itemsPerPage,
  });

  // 2. Service: Delete Product
  const [deleteProduct] = useDeleteProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [updateVariant] = useUpdateProductVariantMutation();
  const [createVariant] = useCreateProductVariantMutation();

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
      confirmButtonColor: "#d33",
      cancelButtonColor: "#000",
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

  // Toggle product selection for bulk edit
  const toggleProductSelection = (slug: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  // Select all products
  const toggleSelectAll = () => {
    if (selectedProducts.size === productList.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(productList.map((p) => p.slug)));
    }
  };

  // Enter bulk edit mode
  const enterBulkEditMode = () => {
    if (selectedProducts.size === 0) {
      Swal.fire("Pilih Produk", "Pilih minimal 1 produk untuk edit massal", "warning");
      return;
    }

    const selectedItems = productList.filter((p) => selectedProducts.has(p.slug));
    const editData: BulkEditRow[] = selectedItems.map((item) => ({
      slug: item.slug,
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: item.price,
      stock: item.stock,
      weight: item.weight || 0,
      image: item.image,
      imagePreview: typeof item.image === "string" ? item.image : null,
      variants: [],
      isExpanded: false,
      isDirty: false,
    }));

    setBulkEditData(editData);
    setIsBulkEditMode(true);
  };

  // Exit bulk edit mode
  const exitBulkEditMode = () => {
    const hasDirty = bulkEditData.some((row) => row.isDirty || row.variants.some((v) => v.isDirty));
    if (hasDirty) {
      Swal.fire({
        title: "Perubahan belum disimpan",
        text: "Yakin ingin keluar? Perubahan akan hilang.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, Keluar",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          setIsBulkEditMode(false);
          setBulkEditData([]);
          setSelectedProducts(new Set());
        }
      });
    } else {
      setIsBulkEditMode(false);
      setBulkEditData([]);
      setSelectedProducts(new Set());
    }
  };

  // Update bulk edit row
  const updateBulkEditRow = (
    slug: string,
    field: keyof BulkEditRow,
    value: BulkEditRow[keyof BulkEditRow]
  ) => {
    setBulkEditData((prev) =>
      prev.map((row) =>
        row.slug === slug ? { ...row, [field]: value, isDirty: true } : row
      )
    );
  };

  // Handle image change for product
  const handleProductImageChange = (slug: string, file: File | null) => {
    if (file) {
      const preview = URL.createObjectURL(file);
      setBulkEditData((prev) =>
        prev.map((row) =>
          row.slug === slug
            ? { ...row, image: file, imagePreview: preview, isDirty: true }
            : row
        )
      );
    }
  };

  // Toggle expand variants
  const toggleExpandVariants = (slug: string) => {
    setBulkEditData((prev) =>
      prev.map((row) =>
        row.slug === slug ? { ...row, isExpanded: !row.isExpanded } : row
      )
    );
  };

  // Add new variant to product
  const addVariantToProduct = (slug: string) => {
    const newVariant: VariantEditRow = {
      id: null,
      name: "",
      sku: "",
      price: 0,
      stock: 0,
      weight: 0,
      image: null,
      imagePreview: null,
      isDirty: true,
      isNew: true,
    };

    setBulkEditData((prev) =>
      prev.map((row) =>
        row.slug === slug
          ? { ...row, variants: [...row.variants, newVariant], isDirty: true }
          : row
      )
    );
  };

  // Update variant in product
  const updateVariantInProduct = (
    productSlug: string,
    variantIndex: number,
    field: keyof VariantEditRow,
    value: VariantEditRow[keyof VariantEditRow]
  ) => {
    setBulkEditData((prev) =>
      prev.map((row) => {
        if (row.slug === productSlug) {
          const updatedVariants = [...row.variants];
          updatedVariants[variantIndex] = {
            ...updatedVariants[variantIndex],
            [field]: value,
            isDirty: true,
          };
          return { ...row, variants: updatedVariants };
        }
        return row;
      })
    );
  };

  // Handle variant image change
  const handleVariantImageChange = (
    productSlug: string,
    variantIndex: number,
    file: File | null
  ) => {
    if (file) {
      const preview = URL.createObjectURL(file);
      setBulkEditData((prev) =>
        prev.map((row) => {
          if (row.slug === productSlug) {
            const updatedVariants = [...row.variants];
            updatedVariants[variantIndex] = {
              ...updatedVariants[variantIndex],
              image: file,
              imagePreview: preview,
              isDirty: true,
            };
            return { ...row, variants: updatedVariants };
          }
          return row;
        })
      );
    }
  };

  // Remove variant from product
  const removeVariantFromProduct = (productSlug: string, variantIndex: number) => {
    setBulkEditData((prev) =>
      prev.map((row) => {
        if (row.slug === productSlug) {
          const updatedVariants = row.variants.filter((_, i) => i !== variantIndex);
          return { ...row, variants: updatedVariants, isDirty: true };
        }
        return row;
      })
    );
  };

  // Save all bulk edits
  const saveBulkEdits = async () => {
    const dirtyRows = bulkEditData.filter(
      (row) => row.isDirty || row.variants.some((v) => v.isDirty)
    );

    if (dirtyRows.length === 0) {
      Swal.fire("Info", "Tidak ada perubahan untuk disimpan", "info");
      return;
    }

    setIsSavingBulk(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const row of dirtyRows) {
        try {
          // Update product
          const formData = new FormData();
          formData.append("name", row.name);
          formData.append("description", row.description);
          formData.append("price", String(row.price));
          formData.append("stock", String(row.stock));
          formData.append("weight", String(row.weight));

          if (row.image instanceof File) {
            formData.append("image", row.image);
          }

          await updateProduct({ slug: row.slug, payload: formData }).unwrap();

          // Update/create variants
          for (const variant of row.variants) {
            if (variant.isDirty && variant.name.trim()) {
              const variantFormData = new FormData();
              variantFormData.append("name", variant.name);
              variantFormData.append("sku", variant.sku || `${row.slug}-${variant.name}`);
              variantFormData.append("price", String(variant.price));
              variantFormData.append("stock", String(variant.stock));
              variantFormData.append("weight", String(variant.weight));
              variantFormData.append("length", "0");
              variantFormData.append("width", "0");
              variantFormData.append("height", "0");
              variantFormData.append("diameter", "0");
              variantFormData.append("status", "1");

              if (variant.image instanceof File) {
                variantFormData.append("image", variant.image);
              }

              if (variant.isNew || variant.id === null) {
                await createVariant({
                  productSlug: row.slug,
                  body: variantFormData,
                }).unwrap();
              } else {
                await updateVariant({
                  productSlug: row.slug,
                  id: variant.id,
                  body: variantFormData,
                }).unwrap();
              }
            }
          }

          successCount++;
        } catch (err) {
          console.error(`Error updating product ${row.slug}:`, err);
          errorCount++;
        }
      }

      await refetch();

      if (errorCount === 0) {
        Swal.fire("Berhasil", `${successCount} produk berhasil diperbarui`, "success");
        setIsBulkEditMode(false);
        setBulkEditData([]);
        setSelectedProducts(new Set());
      } else {
        Swal.fire(
          "Sebagian Berhasil",
          `${successCount} berhasil, ${errorCount} gagal`,
          "warning"
        );
      }
    } catch (error) {
      console.error("Bulk save error:", error);
      Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan", "error");
    } finally {
      setIsSavingBulk(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen text-black">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold">Data Produk</h1>
        <div className="flex gap-2 flex-wrap">
          {!isBulkEditMode ? (
            <>
              <Button
                onClick={enterBulkEditMode}
                variant="outline"
                className="border-black text-black hover:bg-gray-100"
                disabled={selectedProducts.size === 0}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Massal ({selectedProducts.size})
              </Button>
              <Button
                onClick={handleAdd}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Produk
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={exitBulkEditMode}
                variant="outline"
                className="border-gray-400 text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4 mr-2" />
                Batal
              </Button>
              <Button
                onClick={saveBulkEdits}
                className="bg-green-600 text-white hover:bg-green-700"
                disabled={isSavingBulk}
              >
                {isSavingBulk ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Simpan Semua
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Bulk Edit Mode */}
      {isBulkEditMode ? (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 bg-blue-50 border-b border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Mode Edit Massal</strong> - Edit harga, stok, berat, dan variasi
                langsung di tabel. Klik tombol expand untuk menambah/edit variasi warna.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-black sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-left w-20">Foto</th>
                    <th className="px-3 py-3 text-left min-w-[200px]">Nama Produk</th>
                    <th className="px-3 py-3 text-left min-w-[150px]">Harga (Rp)</th>
                    <th className="px-3 py-3 text-left w-24">Stok</th>
                    <th className="px-3 py-3 text-left w-24">Berat (g)</th>
                    <th className="px-3 py-3 text-left w-32">Variasi</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkEditData.map((row) => (
                    <>
                      {/* Main Product Row */}
                      <tr
                        key={row.slug}
                        className={`border-b border-gray-200 ${
                          row.isDirty ? "bg-yellow-50" : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Image */}
                        <td className="px-3 py-3">
                          <label className="cursor-pointer relative group">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                              {row.imagePreview ? (
                                <Image
                                  src={row.imagePreview}
                                  alt={row.name}
                                  width={64}
                                  height={64}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <Upload className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleProductImageChange(row.slug, e.target.files?.[0] || null)
                              }
                            />
                          </label>
                        </td>

                        {/* Name */}
                        <td className="px-3 py-3">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) =>
                              updateBulkEditRow(row.slug, "name", e.target.value)
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                          <textarea
                            value={row.description}
                            onChange={(e) =>
                              updateBulkEditRow(row.slug, "description", e.target.value)
                            }
                            placeholder="Deskripsi..."
                            className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                            rows={2}
                          />
                        </td>

                        {/* Price */}
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={row.price}
                            onChange={(e) =>
                              updateBulkEditRow(row.slug, "price", Number(e.target.value))
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                            min={0}
                          />
                        </td>

                        {/* Stock */}
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={row.stock}
                            onChange={(e) =>
                              updateBulkEditRow(row.slug, "stock", Number(e.target.value))
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                            min={0}
                          />
                        </td>

                        {/* Weight */}
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={row.weight}
                            onChange={(e) =>
                              updateBulkEditRow(row.slug, "weight", Number(e.target.value))
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                            min={0}
                          />
                        </td>

                        {/* Variants Toggle */}
                        <td className="px-3 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleExpandVariants(row.slug)}
                            className="w-full border-black text-black"
                          >
                            {row.isExpanded ? (
                              <ChevronUp className="w-4 h-4 mr-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 mr-1" />
                            )}
                            Variasi ({row.variants.length})
                          </Button>
                        </td>
                      </tr>

                      {/* Variants Section */}
                      {row.isExpanded && (
                        <tr key={`${row.slug}-variants`}>
                          <td colSpan={6} className="bg-gray-50 px-6 py-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-700">
                                  Variasi Warna / Ukuran
                                </h4>
                                <Button
                                  size="sm"
                                  onClick={() => addVariantToProduct(row.slug)}
                                  className="bg-black text-white hover:bg-gray-800"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Tambah Variasi
                                </Button>
                              </div>

                              {row.variants.length === 0 ? (
                                <p className="text-gray-500 text-sm italic">
                                  Belum ada variasi. Klik tombol di atas untuk menambah.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-3 py-2 text-left w-16">Foto</th>
                                        <th className="px-3 py-2 text-left">Nama Variasi</th>
                                        <th className="px-3 py-2 text-left w-32">Harga</th>
                                        <th className="px-3 py-2 text-left w-20">Stok</th>
                                        <th className="px-3 py-2 text-left w-20">Berat</th>
                                        <th className="px-3 py-2 text-left w-16">Aksi</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {row.variants.map((variant, vIndex) => (
                                        <tr
                                          key={vIndex}
                                          className={`border-t ${
                                            variant.isDirty ? "bg-yellow-50" : ""
                                          }`}
                                        >
                                          {/* Variant Image */}
                                          <td className="px-3 py-2">
                                            <label className="cursor-pointer relative group">
                                              <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                                                {variant.imagePreview ? (
                                                  <Image
                                                    src={variant.imagePreview}
                                                    alt={variant.name}
                                                    width={40}
                                                    height={40}
                                                    className="object-cover w-full h-full"
                                                  />
                                                ) : (
                                                  <ImageIcon className="w-4 h-4 text-gray-400" />
                                                )}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                                  <Upload className="w-3 h-3 text-white" />
                                                </div>
                                              </div>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) =>
                                                  handleVariantImageChange(
                                                    row.slug,
                                                    vIndex,
                                                    e.target.files?.[0] || null
                                                  )
                                                }
                                              />
                                            </label>
                                          </td>

                                          {/* Variant Name */}
                                          <td className="px-3 py-2">
                                            <input
                                              type="text"
                                              value={variant.name}
                                              onChange={(e) =>
                                                updateVariantInProduct(
                                                  row.slug,
                                                  vIndex,
                                                  "name",
                                                  e.target.value
                                                )
                                              }
                                              placeholder="cth: Merah, Biru, XL..."
                                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                                            />
                                          </td>

                                          {/* Variant Price */}
                                          <td className="px-3 py-2">
                                            <input
                                              type="number"
                                              value={variant.price}
                                              onChange={(e) =>
                                                updateVariantInProduct(
                                                  row.slug,
                                                  vIndex,
                                                  "price",
                                                  Number(e.target.value)
                                                )
                                              }
                                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                                              min={0}
                                            />
                                          </td>

                                          {/* Variant Stock */}
                                          <td className="px-3 py-2">
                                            <input
                                              type="number"
                                              value={variant.stock}
                                              onChange={(e) =>
                                                updateVariantInProduct(
                                                  row.slug,
                                                  vIndex,
                                                  "stock",
                                                  Number(e.target.value)
                                                )
                                              }
                                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                                              min={0}
                                            />
                                          </td>

                                          {/* Variant Weight */}
                                          <td className="px-3 py-2">
                                            <input
                                              type="number"
                                              value={variant.weight}
                                              onChange={(e) =>
                                                updateVariantInProduct(
                                                  row.slug,
                                                  vIndex,
                                                  "weight",
                                                  Number(e.target.value)
                                                )
                                              }
                                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                                              min={0}
                                            />
                                          </td>

                                          {/* Actions */}
                                          <td className="px-3 py-2">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                                              onClick={() =>
                                                removeVariantFromProduct(row.slug, vIndex)
                                              }
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Normal Table View */
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-black">
                <tr>
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={
                        productList.length > 0 &&
                        selectedProducts.size === productList.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
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
                    <td colSpan={8} className="text-center p-4">
                      Memuat data...
                    </td>
                  </tr>
                ) : productList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-4">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  productList.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        selectedProducts.has(item.slug) ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(item.slug)}
                          onChange={() => toggleProductSelection(item.slug)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
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
                      <td className="px-4 py-3 whitespace-nowrap">{item.stock}</td>
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
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto py-10">
          <FormProduct
            editingSlug={editingSlug}
            initialData={initialFormState}
            onCancel={() => {
              setEditingSlug(null);
              closeModal();
            }}
            onSuccess={() => {
              refetch();
            }}
          />
        </div>
      )}
    </div>
  );
}