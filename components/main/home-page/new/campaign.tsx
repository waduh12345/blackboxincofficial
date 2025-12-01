"use client";

import { useMemo, useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import {
  Clock,
  Sparkles,
  Tag,
  Zap,
  Truck,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils"; // Menggunakan cn jika tersedia, atau clsx

// Service Hook
import { useGetVoucherListQuery } from "@/services/voucher.service";

// --- IMPORTS MODE EDIT ---
import { useEditMode } from "@/hooks/use-edit-mode";
import { EditableText, EditableLink } from "@/components/ui/editable";
import {
  EditableSection,
  BackgroundConfig,
} from "@/components/ui/editable-section";
import DotdLoader from "@/components/loader/3dot";

// === UI type
type UIVoucher = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  fixed_amount?: number | null;
  percentage_amount?: number | null;
  type?: string;
  start_date: string;
  end_date: string;
  usage_limit?: number | null;
  used_count?: number | null;
  status?: boolean;
};

// === countdown hook
function useCountdown(target: Date | null) {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!target)
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      finished: false,
    } as const;

  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, finished: diff === 0 } as const;
}

const parseYMD = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, day ?? 1);
};

// =========================================
// DEFAULT EXPORT (WRAPPER SUSPENSE)
// =========================================
export default function Campaign() {
  return (
    <Suspense
      fallback={
        <div className="h-96 w-full flex items-center justify-center bg-black text-white">
          <DotdLoader />
        </div>
      }
    >
      <CampaignContent />
    </Suspense>
  );
}

// =========================================
// CONTENT COMPONENT
// =========================================
function CampaignContent() {
  const isEditMode = useEditMode();

  // === 1. EDITABLE STATE: Background ===
  // Default hitam gradient sesuai desain asli
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>({
    type: "gradient",
    color1: "#000000",
    color2: "#111827", // gray-900
    direction: "to bottom right",
  });

  // === 2. EDITABLE STATE: Labels & Static Texts ===
  const [texts, setTexts] = useState({
    badge: "BLACKBOX.INC Exclusive",
    loading: "Loading vouchers...",
    error: "Failed to load vouchers.",
    labelDays: "Days",
    labelHours: "Hours",
    labelMins: "Minutes",
    labelSecs: "Seconds",
    ended: "Campaign Ended",
    labelCoupon: "Coupon Code",
    labelNote: "Apply at checkout. Terms & conditions apply.",
    labelStock: "Limited Stock",
    labelClaimed: "Claimed",
    perk1: "30-Day Guarantee",
    perk2: "Worldwide Shipping",
    perk3: "24/7 Support",
    ctaPrimary: "Shop Now",
    ctaSecondary: "Learn More",
  });

  const updateText = (key: keyof typeof texts, val: string) => {
    setTexts((prev) => ({ ...prev, [key]: val }));
  };

  // === VOUCHER LOGIC (Tetap Sama) ===
  const { data, isLoading, isError } = useGetVoucherListQuery({
    page: 1,
    paginate: 10,
  });

  const vouchers: UIVoucher[] = (data?.data as UIVoucher[]) ?? [];

  const selected: UIVoucher | undefined = useMemo(() => {
    if (!vouchers.length) return undefined;
    const now = new Date();
    const withDates = vouchers.map((v) => ({
      v,
      start: parseYMD(v.start_date),
      end: new Date(parseYMD(v.end_date).setHours(23, 59, 59, 999)),
    }));

    const active = withDates
      .filter(({ start, end }) => start <= now && now <= end)
      .sort((a, b) => a.end.getTime() - b.end.getTime());
    if (active.length) return active[0].v;

    const upcoming = withDates
      .filter(({ start }) => start > now)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    if (upcoming.length) return upcoming[0].v;

    return withDates.sort((a, b) => b.end.getTime() - a.end.getTime())[0].v;
  }, [vouchers]);

  const { target, phaseLabel, ended } = useMemo(() => {
    if (!selected)
      return { target: null, phaseLabel: "Campaign", ended: true as boolean };
    const now = new Date();
    const start = parseYMD(selected.start_date);
    const end = new Date(parseYMD(selected.end_date).setHours(23, 59, 59, 999));

    if (now < start)
      return { target: start, phaseLabel: "Starts In", ended: false };
    if (now <= end) return { target: end, phaseLabel: "Ends In", ended: false };
    return { target: end, phaseLabel: "Campaign Ended", ended: true };
  }, [selected]);

  const { days, hours, minutes, seconds } = useCountdown(target);

  const code = selected?.code ?? "—";
  const name = selected?.name ?? "Seasonal Sale";
  const description =
    selected?.description ?? "Use the code below at checkout.";
  const isPercentage = (selected?.type ?? "").toLowerCase() === "percentage";
  const discountText = isPercentage
    ? `${selected?.percentage_amount ?? 0}% Off`
    : selected?.fixed_amount
    ? `Rp ${Number(selected.fixed_amount).toLocaleString("id-ID")} Off`
    : "Special Offer";

  const usageLimit = selected?.usage_limit ?? 0;
  const usedCount = selected?.used_count ?? 0;
  const percentClaimed =
    usageLimit > 0
      ? Math.min(100, Math.round((usedCount / usageLimit) * 100))
      : 0;
  const safePercent = Math.max(0, Math.min(100, percentClaimed));

  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <EditableSection
      isEditMode={isEditMode}
      config={bgConfig}
      onSave={setBgConfig}
      className="relative isolate overflow-hidden text-white"
    >
      {/* Decorative Overlays (Tetap ada untuk estetika "Glow") */}
      <div className="absolute inset-x-0 -top-24 -z-10 h-48 bg-[radial-gradient(60%_60%_at_50%_100%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />

      <div className="mx-auto container px-4 py-10 sm:py-12 md:py-16 lg:py-20 relative z-10">
        {/* Badge */}
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-gray-400" />
          <EditableText
            isEditMode={isEditMode}
            text={texts.badge}
            onSave={(v) => updateText("badge", v)}
            as="p"
            className="rounded-full border border-gray-700 bg-gray-800/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-300"
          />
          <Sparkles className="h-5 w-5 text-gray-400" />
        </div>

        {/* Title (Dynamic Data from API, read-only mostly, style adjustable) */}
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
          {name} —{" "}
          <span className="underline decoration-gray-400/50">
            {discountText}
          </span>
        </h2>

        {/* Description / Loading State */}
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-gray-400 sm:text-lg">
          {isLoading ? texts.loading : isError ? texts.error : description}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8 max-w-5xl mx-auto">
          {/* COUNTDOWN */}
          <div className="rounded-xl border border-gray-700 bg-gray-900/70 p-5 backdrop-blur-sm shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-gray-300">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium tracking-wide uppercase">
                {phaseLabel}
              </span>
            </div>

            {!ended ? (
              <div className="flex items-center justify-between text-white">
                {[
                  { key: "labelDays", value: days },
                  { key: "labelHours", value: hours },
                  { key: "labelMins", value: minutes },
                  { key: "labelSecs", value: seconds },
                ].map((seg) => (
                  <div key={seg.key} className="flex flex-col items-center">
                    <div className="min-w-[60px] md:min-w-[68px] rounded-lg bg-gray-800 px-3 py-2 text-center text-2xl md:text-3xl font-bold leading-none shadow-inner">
                      {String(seg.value).padStart(2, "0")}
                    </div>
                    {/* Editable Label (Days, Hours...) */}
                    <EditableText
                      isEditMode={isEditMode}
                      text={texts[seg.key as keyof typeof texts]}
                      onSave={(v) =>
                        updateText(seg.key as keyof typeof texts, v)
                      }
                      as="span"
                      className="mt-1 text-[10px] uppercase tracking-wider text-gray-500"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EditableText
                isEditMode={isEditMode}
                text={texts.ended}
                onSave={(v) => updateText("ended", v)}
                className="text-sm text-gray-400"
              />
            )}

            {selected && (
              <p className="mt-4 text-center text-xs text-gray-500">
                {parseYMD(selected.start_date).toLocaleDateString("id-ID")} —{" "}
                {parseYMD(selected.end_date).toLocaleDateString("id-ID")}
              </p>
            )}
          </div>

          {/* COUPON */}
          <div className="rounded-xl border border-gray-700 bg-gray-900/70 p-5 backdrop-blur-sm shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-gray-300">
              <Tag className="h-5 w-5" />
              <EditableText
                isEditMode={isEditMode}
                text={texts.labelCoupon}
                onSave={(v) => updateText("labelCoupon", v)}
                as="span"
                className="text-sm font-medium tracking-wide uppercase"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-lg bg-gray-800 px-4 py-2 font-mono text-lg font-bold tracking-wider text-white select-all">
                {code}
              </span>
              <button
                onClick={onCopy}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border",
                  "border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-white",
                  "transition-colors hover:bg-gray-600 hover:border-gray-500",
                  { "bg-black border-black": copied }
                )}
                disabled={!selected}
              >
                <Zap className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <EditableText
              isEditMode={isEditMode}
              text={texts.labelNote}
              onSave={(v) => updateText("labelNote", v)}
              as="p"
              className="mt-3 text-sm text-gray-500"
            />
          </div>

          {/* PROGRESS */}
          <div className="rounded-xl border border-gray-700 bg-gray-900/70 p-5 backdrop-blur-sm shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-gray-300">
              <Sparkles className="h-5 w-5 text-gray-400" />
              <EditableText
                isEditMode={isEditMode}
                text={texts.labelStock}
                onSave={(v) => updateText("labelStock", v)}
                as="span"
                className="text-sm font-medium tracking-wide uppercase"
              />
            </div>
            <div className="relative h-10 overflow-hidden rounded-lg border border-gray-600 bg-gray-800">
              <div
                className="h-full bg-gradient-to-r from-gray-500 to-gray-400"
                style={{ width: `${safePercent}%` }}
                aria-hidden
              />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                {safePercent}% {texts.labelClaimed}
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              {usageLimit
                ? `Used ${usedCount} of ${usageLimit} vouchers`
                : `Hurry! Offers are selling out fast.`}
            </p>
          </div>
        </div>

        {/* PERKS (Editable) */}
        <div className="mt-12 grid grid-cols-1 gap-4 text-gray-300 sm:grid-cols-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900/70 px-4 py-3">
            <ShieldCheck className="h-5 w-5 text-gray-400" />
            <EditableText
              isEditMode={isEditMode}
              text={texts.perk1}
              onSave={(v) => updateText("perk1", v)}
              as="span"
              className="text-sm font-medium uppercase tracking-wide"
            />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900/70 px-4 py-3">
            <Truck className="h-5 w-5 text-gray-400" />
            <EditableText
              isEditMode={isEditMode}
              text={texts.perk2}
              onSave={(v) => updateText("perk2", v)}
              as="span"
              className="text-sm font-medium uppercase tracking-wide"
            />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900/70 px-4 py-3">
            <Headphones className="h-5 w-5 text-gray-400" />
            <EditableText
              isEditMode={isEditMode}
              text={texts.perk3}
              onSave={(v) => updateText("perk3", v)}
              as="span"
              className="text-sm font-medium uppercase tracking-wide"
            />
          </div>
        </div>

        {/* CTA (Editable) */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <EditableLink
            isEditMode={isEditMode}
            label={texts.ctaPrimary}
            href="/product?campaign=voucher"
            onSave={(l) => updateText("ctaPrimary", l)}
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-bold text-black transition hover:bg-gray-200 uppercase tracking-wide shadow-lg"
          />
          <EditableLink
            isEditMode={isEditMode}
            label={texts.ctaSecondary}
            href="/how-to-order"
            onSave={(l) => updateText("ctaSecondary", l)}
            className="inline-flex items-center justify-center rounded-lg border border-gray-600 bg-transparent px-8 py-3 text-base font-semibold text-gray-300 transition hover:bg-gray-800 hover:text-white uppercase tracking-wide"
          />
        </div>
      </div>

      {/* Indikator Mode Edit */}
      {isEditMode && (
        <div className="absolute top-4 left-4 z-50 bg-blue-600/80 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider pointer-events-none backdrop-blur-sm">
          Editable
        </div>
      )}
    </EditableSection>
  );
}