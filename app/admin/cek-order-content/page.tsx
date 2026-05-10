"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Trash2, Save, RefreshCcw, Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  useGetCekOrderContentQuery,
  useUpdateCekOrderContentMutation,
} from "@/services/admin/cek-order-content.service";
import {
  CekOrderContent,
  DEFAULT_CEK_ORDER_CONTENT,
  CekOrderInfoCard,
  CekOrderStatusLabel,
  CekOrderTimelineStep,
  OrderStatusKey,
} from "@/types/admin/cek-order-content";
import type { ApiErrorResponse } from "@/lib/error-handle";

const STATUS_KEYS: OrderStatusKey[] = [
  "PENDING",
  "PAID",
  "PROCESSED",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

type Form = CekOrderContent;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none";

export default function CekOrderContentPage() {
  const { data, isLoading, refetch } = useGetCekOrderContentQuery();
  const [updateContent, { isLoading: isUpdating }] =
    useUpdateCekOrderContentMutation();

  const [form, setForm] = useState<Form>(DEFAULT_CEK_ORDER_CONTENT);

  useEffect(() => {
    if (data) setForm({ ...DEFAULT_CEK_ORDER_CONTENT, ...data });
  }, [data]);

  const setField = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const updateInfoCard = (
    i: number,
    field: keyof CekOrderInfoCard,
    val: string
  ) => {
    const next = [...form.initial_info_cards];
    next[i] = { ...next[i], [field]: val };
    setField("initial_info_cards", next);
  };
  const addInfoCard = () =>
    setField("initial_info_cards", [
      ...form.initial_info_cards,
      { title: "", description: "" },
    ]);
  const removeInfoCard = (i: number) =>
    setField(
      "initial_info_cards",
      form.initial_info_cards.filter((_, idx) => idx !== i)
    );

  const updateTip = (i: number, val: string) => {
    const next = [...form.not_found_tips];
    next[i] = val;
    setField("not_found_tips", next);
  };
  const addTip = () => setField("not_found_tips", [...form.not_found_tips, ""]);
  const removeTip = (i: number) =>
    setField(
      "not_found_tips",
      form.not_found_tips.filter((_, idx) => idx !== i)
    );

  const updateStatus = (
    i: number,
    field: keyof CekOrderStatusLabel,
    val: string
  ) => {
    const next = [...form.status_labels];
    next[i] = { ...next[i], [field]: val } as CekOrderStatusLabel;
    setField("status_labels", next);
  };

  const updateTimeline = (
    i: number,
    field: keyof CekOrderTimelineStep,
    val: string
  ) => {
    const next = [...form.timeline_steps];
    next[i] = { ...next[i], [field]: val } as CekOrderTimelineStep;
    setField("timeline_steps", next);
  };
  const addTimeline = () =>
    setField("timeline_steps", [
      ...form.timeline_steps,
      { key: "PENDING", label: "" },
    ]);
  const removeTimeline = (i: number) =>
    setField(
      "timeline_steps",
      form.timeline_steps.filter((_, idx) => idx !== i)
    );

  const handleSave = async () => {
    try {
      await updateContent(form).unwrap();
      Swal.fire(
        "Tersimpan",
        "Konten halaman Cek Order berhasil diperbarui",
        "success"
      );
      refetch();
    } catch (error) {
      const err = error as ApiErrorResponse;
      Swal.fire(
        "Gagal",
        err?.data?.message || err?.message || "Gagal menyimpan",
        "error"
      );
    }
  };

  const handleReset = async () => {
    const c = await Swal.fire({
      title: "Reset ke default?",
      text: "Semua perubahan yang belum disimpan akan hilang.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Reset",
      confirmButtonColor: "#dc2626",
    });
    if (c.isConfirmed) setForm(DEFAULT_CEK_ORDER_CONTENT);
  };

  const isBusy = useMemo(
    () => isLoading || isUpdating,
    [isLoading, isUpdating]
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Konten Halaman Cek Order
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Atur seluruh teks yang tampil di halaman publik{" "}
            <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
              /cek-order
            </code>
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/cek-order"
            target="_blank"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" /> Lihat Halaman
          </Link>
          <Button
            variant="outline"
            onClick={handleReset}
            className="rounded-xl"
            disabled={isBusy}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Reset Default
          </Button>
          <Button
            onClick={handleSave}
            className="bg-black text-white hover:bg-gray-800 rounded-xl"
            disabled={isBusy}
          >
            <Save className="w-4 h-4 mr-2" />
            {isUpdating ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-3" />
          Memuat data...
        </div>
      ) : (
        <>
          {/* HERO */}
          <Section
            title="Hero / Header"
            description="Bagian paling atas halaman."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Badge">
                <input
                  className={inputCls}
                  value={form.hero_badge}
                  onChange={(e) => setField("hero_badge", e.target.value)}
                />
              </Field>
              <Field label="Judul (kiri)">
                <input
                  className={inputCls}
                  value={form.hero_title_1}
                  onChange={(e) => setField("hero_title_1", e.target.value)}
                />
              </Field>
              <Field label="Judul (highlight)">
                <input
                  className={inputCls}
                  value={form.hero_title_2}
                  onChange={(e) => setField("hero_title_2", e.target.value)}
                />
              </Field>
              <Field label="Subtitle">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={form.hero_subtitle}
                  onChange={(e) => setField("hero_subtitle", e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* SEARCH */}
          <Section title="Form Pencarian">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Placeholder Input">
                <input
                  className={inputCls}
                  value={form.search_placeholder}
                  onChange={(e) =>
                    setField("search_placeholder", e.target.value)
                  }
                />
              </Field>
              <Field label="Label Tombol Cari">
                <input
                  className={inputCls}
                  value={form.search_button_label}
                  onChange={(e) =>
                    setField("search_button_label", e.target.value)
                  }
                />
              </Field>
              <Field label="Label Tombol saat Loading">
                <input
                  className={inputCls}
                  value={form.search_button_loading_label}
                  onChange={(e) =>
                    setField("search_button_loading_label", e.target.value)
                  }
                />
              </Field>
              <Field label="Teks saat Memuat Data">
                <input
                  className={inputCls}
                  value={form.loading_text}
                  onChange={(e) => setField("loading_text", e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* INITIAL STATE */}
          <Section
            title="Initial State (Sebelum Pencarian)"
            description="Tampilan ketika user belum melakukan pencarian."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Judul">
                <input
                  className={inputCls}
                  value={form.initial_title}
                  onChange={(e) => setField("initial_title", e.target.value)}
                />
              </Field>
              <Field
                label="Deskripsi"
                hint="Boleh menggunakan tag HTML <strong> untuk teks tebal."
              >
                <textarea
                  rows={3}
                  className={inputCls}
                  value={form.initial_description}
                  onChange={(e) =>
                    setField("initial_description", e.target.value)
                  }
                />
              </Field>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-800">
                  Kartu Info (3 Langkah)
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addInfoCard}
                  className="rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah Kartu
                </Button>
              </div>
              <div className="space-y-3">
                {form.initial_info_cards.map((c, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gray-50 p-3 rounded-xl"
                  >
                    <input
                      className={inputCls + " md:col-span-4"}
                      placeholder="Judul"
                      value={c.title}
                      onChange={(e) =>
                        updateInfoCard(i, "title", e.target.value)
                      }
                    />
                    <input
                      className={inputCls + " md:col-span-7"}
                      placeholder="Deskripsi"
                      value={c.description}
                      onChange={(e) =>
                        updateInfoCard(i, "description", e.target.value)
                      }
                    />
                    <button
                      onClick={() => removeInfoCard(i)}
                      className="md:col-span-1 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* NOT FOUND */}
          <Section
            title="State: Tidak Ditemukan"
            description="Tampilan ketika data transaksi tidak ditemukan."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Judul">
                <input
                  className={inputCls}
                  value={form.not_found_title}
                  onChange={(e) =>
                    setField("not_found_title", e.target.value)
                  }
                />
              </Field>
              <Field
                label="Deskripsi"
                hint="Gunakan {code} sebagai placeholder kode pencarian."
              >
                <textarea
                  rows={3}
                  className={inputCls}
                  value={form.not_found_description}
                  onChange={(e) =>
                    setField("not_found_description", e.target.value)
                  }
                />
              </Field>
              <Field label="Judul Daftar Tips">
                <input
                  className={inputCls}
                  value={form.not_found_tips_title}
                  onChange={(e) =>
                    setField("not_found_tips_title", e.target.value)
                  }
                />
              </Field>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-800">
                  Daftar Tips
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addTip}
                  className="rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah Tip
                </Button>
              </div>
              <div className="space-y-2">
                {form.not_found_tips.map((t, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className={inputCls}
                      value={t}
                      onChange={(e) => updateTip(i, e.target.value)}
                    />
                    <button
                      onClick={() => removeTip(i)}
                      className="px-3 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* PENDING ALERT */}
          <Section
            title="Alert Menunggu Pembayaran"
            description="Banner yang tampil ketika status order = PENDING."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Judul">
                <input
                  className={inputCls}
                  value={form.pending_alert_title}
                  onChange={(e) =>
                    setField("pending_alert_title", e.target.value)
                  }
                />
              </Field>
              <Field label="Deskripsi">
                <input
                  className={inputCls}
                  value={form.pending_alert_description}
                  onChange={(e) =>
                    setField("pending_alert_description", e.target.value)
                  }
                />
              </Field>
              <Field label="Label Tombol Bayar">
                <input
                  className={inputCls}
                  value={form.pending_alert_button_label}
                  onChange={(e) =>
                    setField("pending_alert_button_label", e.target.value)
                  }
                />
              </Field>
              <Field label="Label Tombol saat Memuat">
                <input
                  className={inputCls}
                  value={form.pending_alert_button_loading_label}
                  onChange={(e) =>
                    setField(
                      "pending_alert_button_loading_label",
                      e.target.value
                    )
                  }
                />
              </Field>
            </div>
          </Section>

          {/* RESULT LABELS */}
          <Section
            title="Label Hasil Pencarian"
            description="Label-label yang tampil pada kartu hasil order."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Label Kode Transaksi">
                <input
                  className={inputCls}
                  value={form.reference_label}
                  onChange={(e) =>
                    setField("reference_label", e.target.value)
                  }
                />
              </Field>
              <Field label="Label Tanggal">
                <input
                  className={inputCls}
                  value={form.date_label}
                  onChange={(e) => setField("date_label", e.target.value)}
                />
              </Field>
              <Field label="Judul Section Pengiriman">
                <input
                  className={inputCls}
                  value={form.shipping_section_title}
                  onChange={(e) =>
                    setField("shipping_section_title", e.target.value)
                  }
                />
              </Field>
              <Field label="Label Penerima">
                <input
                  className={inputCls}
                  value={form.recipient_label}
                  onChange={(e) =>
                    setField("recipient_label", e.target.value)
                  }
                />
              </Field>
              <Field label="Label Ekspedisi">
                <input
                  className={inputCls}
                  value={form.courier_label}
                  onChange={(e) =>
                    setField("courier_label", e.target.value)
                  }
                />
              </Field>
              <Field label="Label No. Resi">
                <input
                  className={inputCls}
                  value={form.resi_label}
                  onChange={(e) => setField("resi_label", e.target.value)}
                />
              </Field>
              <Field label="Judul Section Produk">
                <input
                  className={inputCls}
                  value={form.items_section_title}
                  onChange={(e) =>
                    setField("items_section_title", e.target.value)
                  }
                />
              </Field>
              <Field label="Label Total Belanja">
                <input
                  className={inputCls}
                  value={form.total_label}
                  onChange={(e) => setField("total_label", e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* STATUS LABELS */}
          <Section
            title="Label Status Order"
            description="Label tampilan untuk masing-masing status. Key tidak bisa diubah karena terikat dengan logika sistem."
          >
            <div className="space-y-3">
              {form.status_labels.map((s, i) => (
                <div
                  key={s.key}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gray-50 p-3 rounded-xl items-center"
                >
                  <div className="md:col-span-2 text-xs font-mono font-bold text-gray-700 uppercase">
                    {s.key}
                  </div>
                  <input
                    className={inputCls + " md:col-span-3"}
                    placeholder="Label"
                    value={s.label}
                    onChange={(e) => updateStatus(i, "label", e.target.value)}
                  />
                  <input
                    className={inputCls + " md:col-span-7"}
                    placeholder="Deskripsi singkat"
                    value={s.description}
                    onChange={(e) =>
                      updateStatus(i, "description", e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* TIMELINE */}
          <Section
            title="Langkah Timeline"
            description="Urutan langkah pada timeline visual progress order."
          >
            <div className="flex justify-end mb-2">
              <Button
                size="sm"
                variant="outline"
                onClick={addTimeline}
                className="rounded-lg"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Langkah
              </Button>
            </div>
            <div className="space-y-3">
              {form.timeline_steps.map((s, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gray-50 p-3 rounded-xl"
                >
                  <select
                    className={inputCls + " md:col-span-3"}
                    value={s.key}
                    onChange={(e) =>
                      updateTimeline(i, "key", e.target.value as OrderStatusKey)
                    }
                  >
                    {STATUS_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <input
                    className={inputCls + " md:col-span-8"}
                    placeholder="Label tampilan"
                    value={s.label}
                    onChange={(e) =>
                      updateTimeline(i, "label", e.target.value)
                    }
                  />
                  <button
                    onClick={() => removeTimeline(i)}
                    className="md:col-span-1 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* SAVE BAR (sticky bottom) */}
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 flex justify-end gap-2 shadow-lg">
            <Button
              variant="outline"
              onClick={handleReset}
              className="rounded-xl"
              disabled={isBusy}
            >
              Reset Default
            </Button>
            <Button
              onClick={handleSave}
              className="bg-black text-white hover:bg-gray-800 rounded-xl"
              disabled={isBusy}
            >
              <Save className="w-4 h-4 mr-2" />
              {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
