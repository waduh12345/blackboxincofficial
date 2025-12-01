"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ProductVariant } from "@/types/admin/product-variant";

type VariantFormShape = Partial<
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
>;

export default function ProductVariantForm({
  form,
  setForm,
  onCancel,
  onSubmit,
  readonly = false,
  isLoading = false,
}: {
  form: VariantFormShape;
  setForm: (data: VariantFormShape) => void;
  onCancel: () => void;
  onSubmit: () => void; // parent akan handle create/update
  readonly?: boolean;
  isLoading?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const requiredErr = useMemo(() => {
    const errs: string[] = [];
    if (!form.name || !form.name.trim()) errs.push("Nama varian wajib diisi");
    if (!form.sku || !form.sku.trim()) errs.push("SKU wajib diisi");
    if (form.price === undefined || form.price === null)
      errs.push("Harga wajib diisi");
    if (form.stock === undefined || form.stock === null)
      errs.push("Stok wajib diisi");
    return errs;
  }, [form]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-zinc-700 flex-shrink-0">
        <h2 className="text-lg font-semibold">
          {readonly
            ? "Detail Varian"
            : form?.sku
            ? "Edit Varian"
            : "Tambah Varian"}
        </h2>
        <Button variant="ghost" onClick={onCancel}>
          ✕
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* error kecil kalau ada */}
        {!readonly && requiredErr.length > 0 && (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {requiredErr[0]}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <Label>name</Label>
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              readOnly={readonly}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>sku</Label>
            <Input
              value={form.sku ?? ""}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              readOnly={readonly}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>price</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={form.price ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  price:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              readOnly={readonly}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>stock</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={form.stock ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  stock:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              readOnly={readonly}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>weight</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={form.weight ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  weight:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              readOnly={readonly}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>length</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={form.length ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  length:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              readOnly={readonly}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>width</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={form.width ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  width:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              readOnly={readonly}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>height</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={form.height ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  height:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              readOnly={readonly}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>diameter</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={form.diameter ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  diameter:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              readOnly={readonly}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>status</Label>
            <select
              className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600"
              value={form.status === true || form.status === 1 ? "1" : "0"}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value === "1" ? 1 : 0 })
              }
              disabled={readonly}
            >
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Footer */}
      {!readonly && (
        <div className="p-6 border-t border-gray-200 dark:border-zinc-700 flex justify-end gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isLoading || requiredErr.length > 0}
          >
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      )}
    </div>
  );
}