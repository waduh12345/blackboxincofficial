"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ProductVariant } from "@/types/admin/product-variant";
// ganti path ini sesuai projectmu:
import { useGetProductVariantsQuery } from "@/services/admin/product-variant.service";

export type VariantPickerProps = {
  itemId: number;
  productSlug: string | null;
  selectedVariantId: number | null;
  onPick: (variant: ProductVariant) => void;
};

export default function VariantPickerModal({
  itemId,
  productSlug,
  selectedVariantId,
  onPick,
}: VariantPickerProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError } = useGetProductVariantsQuery(
    { productSlug: productSlug ?? "", page: 1, paginate: 50, search: "" },
    { skip: !productSlug }
  );

  const variants: ProductVariant[] = data?.data ?? [];

  // auto-pilih jika hanya 1 varian
  useEffect(() => {
    if (!selectedVariantId && variants.length === 1) {
      onPick(variants[0]);
    }
  }, [selectedVariantId, variants, onPick]);

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) || null,
    [variants, selectedVariantId]
  );

  const handlePick = (v: ProductVariant) => {
    onPick(v);
    setOpen(false);
  };

  const triggerLabel =
    selected?.name ??
    (isLoading ? "Memuat varian…" : isError ? "Gagal memuat" : "Pilih Varian");

  return (
    <div className="mt-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-xl border-gray-300 text-gray-700"
            disabled={!productSlug || isLoading}
          >
            <Layers className="w-4 h-4" />
            <span className="text-sm">{triggerLabel}</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pilih Varian</DialogTitle>
            <DialogDescription>
              Pilih salah satu varian yang tersedia untuk produk ini.
            </DialogDescription>
          </DialogHeader>

          {/* States */}
          {!productSlug && (
            <p className="text-sm text-gray-500">Slug produk tidak tersedia.</p>
          )}
          {isLoading && <p className="text-sm text-gray-500">Memuat varian…</p>}
          {isError && (
            <p className="text-sm text-red-500">
              Gagal memuat varian. Coba muat ulang.
            </p>
          )}
          {productSlug && !isLoading && !isError && variants.length === 0 && (
            <p className="text-sm text-gray-500">Tidak ada varian.</p>
          )}

          {/* Grid kartu varian */}
          {productSlug && !isLoading && !isError && variants.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {variants.map((v) => {
                const active = v.id === selectedVariantId;
                const out = v.stock <= 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => !out && handlePick(v)}
                    disabled={out}
                    className={[
                      "p-3 rounded-xl border text-left transition",
                      active
                        ? "border-[#6B6B6B] bg-[#DFF19D]/40"
                        : "border-gray-200 hover:border-gray-300",
                      out ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                    ].join(" ")}
                  >
                    <div className="font-medium leading-tight">{v.name}</div>
                    <div className="text-sm mt-0.5">
                      Rp {v.price.toLocaleString("id-ID")}
                    </div>
                    <div className="text-xs mt-1 text-gray-500">
                      {out ? "Stok habis" : `Stok ${v.stock}`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="gap-2">
                <X className="w-4 h-4" />
                Tutup
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}