"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import {
  Plus,
  Trash2,
  Save,
  RefreshCcw,
  Eye,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { UploadButton } from "@/utils/uploadthing";
import {
  useGetHowToOrderContentQuery,
  useUpdateHowToOrderContentMutation,
} from "@/services/admin/how-to-order-content.service";
import {
  HowToOrderContent,
  DEFAULT_HOW_TO_ORDER_CONTENT,
  Benefit,
  HowToOrderStep,
  PaymentMethod,
  ContactItem,
  FaqItem,
  IconKey,
  BgConfig,
} from "@/types/admin/how-to-order-content";
import type { ApiErrorResponse } from "@/lib/error-handle";

const ICON_KEYS: IconKey[] = [
  "Shield", "Truck", "HeadphonesIcon", "ShoppingCart",
  "CreditCard", "User", "Package", "CheckCircle",
  "Sparkles", "MessageCircle", "Mail", "Star",
  "Ruler", "Clock", "Play",
];

type Form = HowToOrderContent;

const inputCls =
  "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none";

function Section({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-3 p-6 hover:bg-gray-50 transition-colors text-left"
      >
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {open && <div className="px-6 pb-6 border-t border-gray-100">{children}</div>}
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

function BgConfigField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BgConfig;
  onChange: (v: BgConfig) => void;
}) {
  return (
    <Field label={label} hint='Background section. type "solid" cukup color1.'>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <select
          className={inputCls}
          value={value.type}
          onChange={(e) =>
            onChange({ ...value, type: e.target.value as BgConfig["type"] })
          }
        >
          <option value="solid">Solid</option>
          <option value="gradient">Gradient</option>
          <option value="image">Image</option>
        </select>
        <input
          type="color"
          className="h-9 w-full rounded-xl border border-gray-200"
          value={value.color1}
          onChange={(e) => onChange({ ...value, color1: e.target.value })}
          title="Color 1"
        />
        <input
          type="color"
          className="h-9 w-full rounded-xl border border-gray-200 disabled:opacity-50"
          value={value.color2 || "#000000"}
          onChange={(e) => onChange({ ...value, color2: e.target.value })}
          disabled={value.type !== "gradient"}
          title="Color 2"
        />
        <input
          className={inputCls}
          placeholder="URL gambar (jika type=image)"
          value={value.image_url || ""}
          onChange={(e) =>
            onChange({ ...value, image_url: e.target.value || null })
          }
          disabled={value.type !== "image"}
        />
      </div>
    </Field>
  );
}

function ImageUrlField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex flex-col md:flex-row gap-3 items-start">
        <input
          className={inputCls + " flex-1"}
          placeholder="https://..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
            <Image
              src={value.startsWith("http") || value.startsWith("/") ? value : `/${value}`}
              alt="preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="flex-shrink-0">
          <UploadButton
            endpoint="imageUploader"
            appearance={{
              button:
                "bg-gray-900 text-white text-xs px-3 py-2 rounded-xl hover:bg-gray-700",
              allowedContent: "hidden",
              container: "w-auto",
            }}
            content={{
              button: (
                <span className="inline-flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Upload
                </span>
              ),
            }}
            onClientUploadComplete={(res) => {
              const url = res?.[0]?.url;
              if (url) onChange(url);
            }}
            onUploadError={(err: Error) => {
              Swal.fire("Gagal Upload", err.message, "error");
            }}
          />
        </div>
      </div>
    </Field>
  );
}

export default function HowToOrderContentPage() {
  const { data, isLoading, refetch } = useGetHowToOrderContentQuery();
  const [updateContent, { isLoading: isUpdating }] =
    useUpdateHowToOrderContentMutation();

  const [form, setForm] = useState<Form>(DEFAULT_HOW_TO_ORDER_CONTENT);

  useEffect(() => {
    if (data) setForm({ ...DEFAULT_HOW_TO_ORDER_CONTENT, ...data });
  }, [data]);

  const setField = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  // ── Benefits ────────────────────────────────────────────────
  const updateBenefit = (i: number, field: keyof Benefit, val: string) => {
    const next = [...form.benefits];
    next[i] = { ...next[i], [field]: val } as Benefit;
    setField("benefits", next);
  };
  const addBenefit = () =>
    setField("benefits", [
      ...form.benefits,
      { icon: "Shield", title: "", description: "" },
    ]);
  const removeBenefit = (i: number) =>
    setField(
      "benefits",
      form.benefits.filter((_, idx) => idx !== i)
    );

  // ── Steps ────────────────────────────────────────────────
  const updateStep = <K extends keyof HowToOrderStep>(
    i: number,
    field: K,
    val: HowToOrderStep[K]
  ) => {
    const next = [...form.steps];
    next[i] = { ...next[i], [field]: val };
    setField("steps", next);
  };
  const updateStepArrayItem = (
    i: number,
    field: "details" | "tips",
    idx: number,
    val: string
  ) => {
    const next = [...form.steps];
    const arr = [...next[i][field]];
    arr[idx] = val;
    next[i] = { ...next[i], [field]: arr };
    setField("steps", next);
  };
  const addStepArrayItem = (i: number, field: "details" | "tips") => {
    const next = [...form.steps];
    next[i] = { ...next[i], [field]: [...next[i][field], ""] };
    setField("steps", next);
  };
  const removeStepArrayItem = (
    i: number,
    field: "details" | "tips",
    idx: number
  ) => {
    const next = [...form.steps];
    next[i] = {
      ...next[i],
      [field]: next[i][field].filter((_, x) => x !== idx),
    };
    setField("steps", next);
  };
  const addStep = () => {
    const newId =
      form.steps.length > 0
        ? Math.max(...form.steps.map((s) => s.id)) + 1
        : 1;
    setField("steps", [
      ...form.steps,
      {
        id: newId,
        icon: "Package",
        title: "Step Baru",
        description: "",
        image_url: "",
        details: [""],
        tips: [""],
      },
    ]);
  };
  const removeStep = (i: number) =>
    setField(
      "steps",
      form.steps.filter((_, idx) => idx !== i)
    );

  // ── Payment methods ────────────────────────────────────────
  const updatePayment = (
    i: number,
    field: keyof PaymentMethod,
    val: string
  ) => {
    const next = [...form.payment_methods];
    next[i] = { ...next[i], [field]: val } as PaymentMethod;
    setField("payment_methods", next);
  };
  const addPayment = () =>
    setField("payment_methods", [
      ...form.payment_methods,
      { emoji: "💳", title: "", description: "" },
    ]);
  const removePayment = (i: number) =>
    setField(
      "payment_methods",
      form.payment_methods.filter((_, idx) => idx !== i)
    );

  // ── Contact items ──────────────────────────────────────────
  const updateContact = (
    i: number,
    field: keyof ContactItem,
    val: string
  ) => {
    const next = [...form.contact_items];
    next[i] = { ...next[i], [field]: val } as ContactItem;
    setField("contact_items", next);
  };
  const addContact = () =>
    setField("contact_items", [
      ...form.contact_items,
      { icon: "Mail", title: "", value: "" },
    ]);
  const removeContact = (i: number) =>
    setField(
      "contact_items",
      form.contact_items.filter((_, idx) => idx !== i)
    );

  // ── FAQ ────────────────────────────────────────────────────
  const updateFaq = (i: number, field: keyof FaqItem, val: string) => {
    const next = [...form.faqs];
    next[i] = { ...next[i], [field]: val };
    setField("faqs", next);
  };
  const addFaq = () =>
    setField("faqs", [...form.faqs, { question: "", answer: "" }]);
  const removeFaq = (i: number) =>
    setField(
      "faqs",
      form.faqs.filter((_, idx) => idx !== i)
    );

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      await updateContent(form).unwrap();
      Swal.fire(
        "Tersimpan",
        "Konten halaman How to Order berhasil diperbarui",
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
    if (c.isConfirmed) setForm(DEFAULT_HOW_TO_ORDER_CONTENT);
  };

  const isBusy = useMemo(
    () => isLoading || isUpdating,
    [isLoading, isUpdating]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Konten Halaman How to Order
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Atur seluruh konten halaman publik{" "}
            <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
              /how-to-order
            </code>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/how-to-order"
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
          {/* === HERO === */}
          <Section
            title="Hero Section"
            description="Bagian paling atas halaman dan kartu benefit di bawah hero."
          >
            <BgConfigField
              label="Background"
              value={form.hero_bg}
              onChange={(v) => setField("hero_bg", v)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Badge">
                <input
                  className={inputCls}
                  value={form.hero_badge}
                  onChange={(e) => setField("hero_badge", e.target.value)}
                />
              </Field>
              <Field label="Judul Baris 1">
                <input
                  className={inputCls}
                  value={form.hero_title_1}
                  onChange={(e) => setField("hero_title_1", e.target.value)}
                />
              </Field>
              <Field label="Judul Baris 2">
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

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-800">
                  Kartu Benefit
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addBenefit}
                  className="rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah Benefit
                </Button>
              </div>
              <div className="space-y-3">
                {form.benefits.map((b, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gray-50 p-3 rounded-xl"
                  >
                    <select
                      className={inputCls + " md:col-span-2"}
                      value={b.icon}
                      onChange={(e) =>
                        updateBenefit(i, "icon", e.target.value as IconKey)
                      }
                    >
                      {ICON_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <input
                      className={inputCls + " md:col-span-3"}
                      placeholder="Title"
                      value={b.title}
                      onChange={(e) =>
                        updateBenefit(i, "title", e.target.value)
                      }
                    />
                    <input
                      className={inputCls + " md:col-span-6"}
                      placeholder="Description"
                      value={b.description}
                      onChange={(e) =>
                        updateBenefit(i, "description", e.target.value)
                      }
                    />
                    <button
                      onClick={() => removeBenefit(i)}
                      className="md:col-span-1 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* === STEPS === */}
          <Section title="Steps Section" description="Daftar langkah pemesanan.">
            <BgConfigField
              label="Background"
              value={form.steps_bg}
              onChange={(v) => setField("steps_bg", v)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Header Title">
                <input
                  className={inputCls}
                  value={form.steps_header_title}
                  onChange={(e) =>
                    setField("steps_header_title", e.target.value)
                  }
                />
              </Field>
              <Field label="Header Subtitle">
                <input
                  className={inputCls}
                  value={form.steps_header_subtitle}
                  onChange={(e) =>
                    setField("steps_header_subtitle", e.target.value)
                  }
                />
              </Field>
            </div>

            <div className="flex items-center justify-between mt-4 mb-3">
              <h3 className="font-semibold text-sm text-gray-800">
                Daftar Step
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={addStep}
                className="rounded-lg"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Step
              </Button>
            </div>

            <div className="space-y-4">
              {form.steps.map((s, i) => (
                <div
                  key={s.id}
                  className="border border-gray-200 rounded-2xl p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-gray-700">
                      Step {s.id}
                    </div>
                    <button
                      onClick={() => removeStep(i)}
                      className="text-red-600 hover:bg-red-50 rounded-lg p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="ID (Urutan)">
                      <input
                        type="number"
                        className={inputCls}
                        value={s.id}
                        onChange={(e) =>
                          updateStep(
                            i,
                            "id",
                            parseInt(e.target.value || "1", 10)
                          )
                        }
                      />
                    </Field>
                    <Field label="Icon">
                      <select
                        className={inputCls}
                        value={s.icon}
                        onChange={(e) =>
                          updateStep(i, "icon", e.target.value as IconKey)
                        }
                      >
                        {ICON_KEYS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Title">
                      <input
                        className={inputCls}
                        value={s.title}
                        onChange={(e) =>
                          updateStep(i, "title", e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Description">
                      <textarea
                        rows={2}
                        className={inputCls}
                        value={s.description}
                        onChange={(e) =>
                          updateStep(i, "description", e.target.value)
                        }
                      />
                    </Field>
                  </div>

                  <ImageUrlField
                    label="Image URL"
                    value={s.image_url}
                    onChange={(v) => updateStep(i, "image_url", v)}
                  />

                  {/* Details */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-700">
                        Key Details
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addStepArrayItem(i, "details")}
                        className="rounded-lg"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Tambah
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {s.details.map((d, di) => (
                        <div key={di} className="flex gap-2">
                          <input
                            className={inputCls}
                            value={d}
                            onChange={(e) =>
                              updateStepArrayItem(
                                i,
                                "details",
                                di,
                                e.target.value
                              )
                            }
                          />
                          <button
                            onClick={() =>
                              removeStepArrayItem(i, "details", di)
                            }
                            className="px-3 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-700">
                        Expert Tips
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addStepArrayItem(i, "tips")}
                        className="rounded-lg"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Tambah
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {s.tips.map((t, ti) => (
                        <div key={ti} className="flex gap-2">
                          <input
                            className={inputCls}
                            value={t}
                            onChange={(e) =>
                              updateStepArrayItem(
                                i,
                                "tips",
                                ti,
                                e.target.value
                              )
                            }
                          />
                          <button
                            onClick={() =>
                              removeStepArrayItem(i, "tips", ti)
                            }
                            className="px-3 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* === PAYMENT === */}
          <Section
            title="Payment Section"
            description="Metode pembayaran & jaminan keamanan."
          >
            <BgConfigField
              label="Background"
              value={form.payment_bg}
              onChange={(v) => setField("payment_bg", v)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Title">
                <input
                  className={inputCls}
                  value={form.payment_title}
                  onChange={(e) => setField("payment_title", e.target.value)}
                />
              </Field>
              <Field label="Subtitle">
                <input
                  className={inputCls}
                  value={form.payment_subtitle}
                  onChange={(e) =>
                    setField("payment_subtitle", e.target.value)
                  }
                />
              </Field>
              <Field label="Security Title">
                <input
                  className={inputCls}
                  value={form.security_title}
                  onChange={(e) => setField("security_title", e.target.value)}
                />
              </Field>
              <Field label="Security Description">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={form.security_description}
                  onChange={(e) =>
                    setField("security_description", e.target.value)
                  }
                />
              </Field>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-800">
                  Metode Pembayaran
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addPayment}
                  className="rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah Metode
                </Button>
              </div>
              <div className="space-y-3">
                {form.payment_methods.map((p, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gray-50 p-3 rounded-xl"
                  >
                    <input
                      className={inputCls + " md:col-span-1 text-center text-2xl"}
                      value={p.emoji}
                      onChange={(e) => updatePayment(i, "emoji", e.target.value)}
                    />
                    <input
                      className={inputCls + " md:col-span-4"}
                      placeholder="Title"
                      value={p.title}
                      onChange={(e) => updatePayment(i, "title", e.target.value)}
                    />
                    <input
                      className={inputCls + " md:col-span-6"}
                      placeholder="Description"
                      value={p.description}
                      onChange={(e) =>
                        updatePayment(i, "description", e.target.value)
                      }
                    />
                    <button
                      onClick={() => removePayment(i)}
                      className="md:col-span-1 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* === CONTACT === */}
          <Section
            title="Contact Section"
            description="Informasi kontak / customer support."
          >
            <BgConfigField
              label="Background"
              value={form.contact_bg}
              onChange={(v) => setField("contact_bg", v)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Title">
                <input
                  className={inputCls}
                  value={form.contact_title}
                  onChange={(e) => setField("contact_title", e.target.value)}
                />
              </Field>
              <Field label="Subtitle">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={form.contact_subtitle}
                  onChange={(e) =>
                    setField("contact_subtitle", e.target.value)
                  }
                />
              </Field>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-800">
                  Item Kontak
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addContact}
                  className="rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah
                </Button>
              </div>
              <div className="space-y-3">
                {form.contact_items.map((c, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gray-50 p-3 rounded-xl"
                  >
                    <select
                      className={inputCls + " md:col-span-2"}
                      value={c.icon}
                      onChange={(e) =>
                        updateContact(i, "icon", e.target.value as IconKey)
                      }
                    >
                      {ICON_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <input
                      className={inputCls + " md:col-span-4"}
                      placeholder="Title"
                      value={c.title}
                      onChange={(e) =>
                        updateContact(i, "title", e.target.value)
                      }
                    />
                    <input
                      className={inputCls + " md:col-span-5"}
                      placeholder="Value"
                      value={c.value}
                      onChange={(e) =>
                        updateContact(i, "value", e.target.value)
                      }
                    />
                    <button
                      onClick={() => removeContact(i)}
                      className="md:col-span-1 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* === CTA === */}
          <Section title="CTA Section" description="Call-to-action di bawah halaman.">
            <BgConfigField
              label="Background"
              value={form.cta_bg}
              onChange={(v) => setField("cta_bg", v)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Title">
                <input
                  className={inputCls}
                  value={form.cta_title}
                  onChange={(e) => setField("cta_title", e.target.value)}
                />
              </Field>
              <Field label="Subtitle">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={form.cta_subtitle}
                  onChange={(e) => setField("cta_subtitle", e.target.value)}
                />
              </Field>
              <Field label="Tombol Utama - Label">
                <input
                  className={inputCls}
                  value={form.cta_button_primary_label}
                  onChange={(e) =>
                    setField("cta_button_primary_label", e.target.value)
                  }
                />
              </Field>
              <Field label="Tombol Utama - URL">
                <input
                  className={inputCls}
                  value={form.cta_button_primary_url}
                  onChange={(e) =>
                    setField("cta_button_primary_url", e.target.value)
                  }
                />
              </Field>
              <Field label="Tombol Sekunder - Label">
                <input
                  className={inputCls}
                  value={form.cta_button_secondary_label}
                  onChange={(e) =>
                    setField("cta_button_secondary_label", e.target.value)
                  }
                />
              </Field>
              <Field label="Tombol Sekunder - URL">
                <input
                  className={inputCls}
                  value={form.cta_button_secondary_url}
                  onChange={(e) =>
                    setField("cta_button_secondary_url", e.target.value)
                  }
                />
              </Field>
            </div>
          </Section>

          {/* === FAQ === */}
          <Section title="FAQ Section" description="Daftar pertanyaan & jawaban.">
            <BgConfigField
              label="Background"
              value={form.faq_bg}
              onChange={(v) => setField("faq_bg", v)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Title">
                <input
                  className={inputCls}
                  value={form.faq_title}
                  onChange={(e) => setField("faq_title", e.target.value)}
                />
              </Field>
              <Field label="Subtitle">
                <input
                  className={inputCls}
                  value={form.faq_subtitle}
                  onChange={(e) => setField("faq_subtitle", e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-800">
                  Daftar FAQ
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addFaq}
                  className="rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah FAQ
                </Button>
              </div>
              <div className="space-y-3">
                {form.faqs.map((f, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 p-3 rounded-xl space-y-2 relative"
                  >
                    <div className="flex justify-end absolute top-2 right-2">
                      <button
                        onClick={() => removeFaq(i)}
                        className="text-red-600 hover:bg-red-50 rounded-lg p-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <Field label="Pertanyaan">
                      <input
                        className={inputCls}
                        value={f.question}
                        onChange={(e) =>
                          updateFaq(i, "question", e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Jawaban">
                      <textarea
                        rows={3}
                        className={inputCls}
                        value={f.answer}
                        onChange={(e) =>
                          updateFaq(i, "answer", e.target.value)
                        }
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* SAVE BAR */}
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
