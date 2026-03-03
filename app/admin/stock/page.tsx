"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  History,
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
} from "lucide-react";
import { useGetProductListQuery } from "@/services/admin/product.service";
import { useGetProductVariantsQuery } from "@/services/admin/product-variant.service";
import { useGetProductVariantSizesQuery } from "@/services/admin/product-variant-size.service";
import {
  useAddStockToVariantSizeMutation,
  useAddStockToVariantMutation,
  useGetStockHistoryQuery,
} from "@/services/admin/stock.service";
import type { Product } from "@/types/admin/product";
import type { ProductVariant } from "@/types/admin/product-variant";
import type { ProductVariantSize } from "@/services/admin/product-variant-size.service";

// ── Variant Sizes Sub-component ──
function VariantSizesSection({
  variantId,
  onAddStock,
  onViewHistory,
}: {
  variantId: number;
  onAddStock: (size: ProductVariantSize) => void;
  onViewHistory: (size: ProductVariantSize) => void;
}) {
  const { data, isLoading } = useGetProductVariantSizesQuery({
    variantId,
    page: 1,
    paginate: 100,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 pl-12 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat ukuran...
      </div>
    );
  }

  const sizes = data?.data || [];
  if (sizes.length === 0) {
    return (
      <div className="py-2 pl-12 text-sm text-gray-400">
        Tidak ada ukuran untuk varian ini.
      </div>
    );
  }

  return (
    <div className="pl-12">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-1 pr-4">Ukuran</th>
            <th className="py-1 pr-4">SKU</th>
            <th className="py-1 pr-4 text-right">Harga</th>
            <th className="py-1 pr-4 text-right">Stok</th>
            <th className="py-1 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((size) => (
            <tr key={size.id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium">{size.name}</td>
              <td className="py-2 pr-4 text-gray-500">{size.sku}</td>
              <td className="py-2 pr-4 text-right">
                Rp {Number(size.price).toLocaleString("id-ID")}
              </td>
              <td className="py-2 pr-4 text-right">
                <Badge variant={size.stock > 0 ? "default" : "destructive"}>
                  {size.stock}
                </Badge>
              </td>
              <td className="py-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddStock(size)}
                    title="Tambah Stok"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Stok
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewHistory(size)}
                    title="Riwayat Stok"
                  >
                    <History className="h-3 w-3 mr-1" />
                    Kartu
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Variant Row Sub-component ──
function VariantRow({
  variant,
  productSlug,
  onAddStockToVariant,
  onAddStockToSize,
  onViewHistory,
}: {
  variant: ProductVariant;
  productSlug: string;
  onAddStockToVariant: (variant: ProductVariant) => void;
  onAddStockToSize: (size: ProductVariantSize) => void;
  onViewHistory: (size: ProductVariantSize) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b last:border-0">
      <div className="flex items-center justify-between py-3 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <div>
            <p className="font-medium">{variant.name}</p>
            <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-3">
            <p className="text-sm text-gray-500">Stok Varian</p>
            <Badge variant={variant.stock > 0 ? "default" : "destructive"}>
              {variant.stock}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddStockToVariant(variant)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Tambah Stok
          </Button>
        </div>
      </div>
      {expanded && (
        <VariantSizesSection
          variantId={variant.id}
          onAddStock={onAddStockToSize}
          onViewHistory={onViewHistory}
        />
      )}
    </div>
  );
}

// ── Product Variants Section ──
function ProductVariantsSection({
  product,
  onAddStockToVariant,
  onAddStockToSize,
  onViewHistory,
}: {
  product: Product;
  onAddStockToVariant: (variant: ProductVariant) => void;
  onAddStockToSize: (size: ProductVariantSize) => void;
  onViewHistory: (size: ProductVariantSize) => void;
}) {
  const { data, isLoading } = useGetProductVariantsQuery({
    productSlug: product.slug,
    page: 1,
    paginate: 100,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat varian...
      </div>
    );
  }

  const variants = data?.data || [];
  if (variants.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-400">
        Tidak ada varian untuk produk ini.
      </div>
    );
  }

  return (
    <div>
      {variants.map((variant) => (
        <VariantRow
          key={variant.id}
          variant={variant}
          productSlug={product.slug}
          onAddStockToVariant={onAddStockToVariant}
          onAddStockToSize={onAddStockToSize}
          onViewHistory={onViewHistory}
        />
      ))}
    </div>
  );
}

// ── Stock History Dialog Content ──
function StockHistoryContent({ variantSizeId }: { variantSizeId: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetStockHistoryQuery({
    variantSizeId,
    page,
    paginate: 10,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const items = data?.data || [];
  const lastPage = data?.last_page || 1;

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        Belum ada riwayat stok.
      </p>
    );
  }

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-3">Tanggal</th>
            <th className="py-2 pr-3">Tipe</th>
            <th className="py-2 pr-3 text-right">Jumlah</th>
            <th className="py-2">Deskripsi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="py-2 pr-3 whitespace-nowrap">
                {new Date(item.created_at).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="py-2 pr-3">
                <Badge
                  variant={item.type === "in" ? "default" : "destructive"}
                >
                  {item.type === "in" ? "Masuk" : "Keluar"}
                </Badge>
              </td>
              <td className="py-2 pr-3 text-right font-medium">
                {item.type === "in" ? "+" : "-"}
                {item.quantity}
              </td>
              <td className="py-2 text-gray-600">
                {item.description || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <p className="text-xs text-gray-500">
            Halaman {page} dari {lastPage}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──
export default function StockPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  // Dialogs
  const [addSizeStockOpen, setAddSizeStockOpen] = useState(false);
  const [addVariantStockOpen, setAddVariantStockOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Selected items for dialogs
  const [selectedSize, setSelectedSize] = useState<ProductVariantSize | null>(
    null
  );
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [historyVariantSizeId, setHistoryVariantSizeId] = useState<
    number | null
  >(null);

  // Form state
  const [stockQty, setStockQty] = useState("");
  const [stockDesc, setStockDesc] = useState("");
  const [variantStockQty, setVariantStockQty] = useState("");
  const [variantStockDesc, setVariantStockDesc] = useState("");
  const [targetSizeId, setTargetSizeId] = useState("");

  // Queries
  const { data: productData, isLoading: isLoadingProducts } =
    useGetProductListQuery({
      page: currentPage,
      paginate: 10,
    });

  // Variant sizes for the "add stock to variant" dialog
  const { data: variantSizesData } = useGetProductVariantSizesQuery(
    {
      variantId: selectedVariant?.id ?? 0,
      page: 1,
      paginate: 100,
    },
    { skip: !selectedVariant }
  );

  // Mutations
  const [addStockToVariantSize, { isLoading: isAddingSizeStock }] =
    useAddStockToVariantSizeMutation();
  const [addStockToVariant, { isLoading: isAddingVariantStock }] =
    useAddStockToVariantMutation();

  const products = productData?.data || [];
  const lastPage = productData?.last_page || 1;

  // ── Handlers ──
  const handleAddStockToSize = (size: ProductVariantSize) => {
    setSelectedSize(size);
    setStockQty("");
    setStockDesc("");
    setAddSizeStockOpen(true);
  };

  const handleAddStockToVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setVariantStockQty("");
    setVariantStockDesc("");
    setTargetSizeId("");
    setAddVariantStockOpen(true);
  };

  const handleViewHistory = (size: ProductVariantSize) => {
    setHistoryVariantSizeId(size.id);
    setHistoryOpen(true);
  };

  const submitAddSizeStock = async () => {
    if (!selectedSize || !stockQty) return;
    try {
      await addStockToVariantSize({
        id: selectedSize.id,
        quantity: Number(stockQty),
        description: stockDesc || undefined,
      }).unwrap();
      Swal.fire("Berhasil", "Stok berhasil ditambahkan.", "success");
      setAddSizeStockOpen(false);
    } catch {
      Swal.fire("Gagal", "Gagal menambahkan stok.", "error");
    }
  };

  const submitAddVariantStock = async () => {
    if (!selectedVariant || !variantStockQty || !targetSizeId) return;
    try {
      await addStockToVariant({
        id: selectedVariant.id,
        quantity: Number(variantStockQty),
        description: variantStockDesc || undefined,
        product_variant_size_id: Number(targetSizeId),
      }).unwrap();
      Swal.fire("Berhasil", "Stok berhasil ditambahkan.", "success");
      setAddVariantStockOpen(false);
    } catch {
      Swal.fire("Gagal", "Gagal menambahkan stok.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Stok</h1>
          <p className="text-sm text-gray-500">
            Kelola stok produk berdasarkan varian dan ukuran.
          </p>
        </div>
      </div>

      {/* Product List */}
      <Card>
        <CardContent className="p-0">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              Tidak ada produk.
            </div>
          ) : (
            <div>
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border-b last:border-0"
                >
                  {/* Product Header */}
                  <button
                    className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() =>
                      setExpandedProduct(
                        expandedProduct === product.id ? null : product.id
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          Stok Produk: {product.stock} &middot; Harga: Rp{" "}
                          {Number(product.price).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                    {expandedProduct === product.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {/* Variants (expanded) */}
                  {expandedProduct === product.id && (
                    <div className="bg-gray-50 border-t">
                      <ProductVariantsSection
                        product={product}
                        onAddStockToVariant={handleAddStockToVariant}
                        onAddStockToSize={handleAddStockToSize}
                        onViewHistory={handleViewHistory}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Halaman {currentPage} dari {lastPage}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= lastPage}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* ── Dialog: Add Stock to Variant Size ── */}
      <Dialog open={addSizeStockOpen} onOpenChange={setAddSizeStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Tambah Stok — {selectedSize?.name || ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Jumlah</label>
              <Input
                type="number"
                min={1}
                placeholder="Masukkan jumlah stok"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Deskripsi (opsional)
              </label>
              <Input
                placeholder="Keterangan penambahan stok"
                value={stockDesc}
                onChange={(e) => setStockDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddSizeStockOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={submitAddSizeStock}
              disabled={!stockQty || isAddingSizeStock}
            >
              {isAddingSizeStock && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Add Stock to Variant (targeting size) ── */}
      <Dialog open={addVariantStockOpen} onOpenChange={setAddVariantStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Tambah Stok Varian — {selectedVariant?.name || ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Pilih Ukuran</label>
              <Select value={targetSizeId} onValueChange={setTargetSizeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih ukuran tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {(variantSizesData?.data || []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} (Stok: {s.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Jumlah</label>
              <Input
                type="number"
                min={1}
                placeholder="Masukkan jumlah stok"
                value={variantStockQty}
                onChange={(e) => setVariantStockQty(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Deskripsi (opsional)
              </label>
              <Input
                placeholder="Keterangan penambahan stok"
                value={variantStockDesc}
                onChange={(e) => setVariantStockDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddVariantStockOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={submitAddVariantStock}
              disabled={
                !variantStockQty || !targetSizeId || isAddingVariantStock
              }
            >
              {isAddingVariantStock && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Stock History ── */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kartu Stok</DialogTitle>
          </DialogHeader>
          {historyVariantSizeId && (
            <StockHistoryContent variantSizeId={historyVariantSizeId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
