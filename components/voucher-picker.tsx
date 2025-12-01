"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tag, Loader2, Search, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useGetVoucherListQuery } from "@/services/voucher.service";
import type { Voucher } from "@/types/voucher";

type Props = {
  selected: Voucher | null;
  onChange: (v: Voucher | null) => void;
};

const MIN_CHARS = 3;
const DEBOUNCE_MS = 350;

export default function VoucherPicker({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  // Debounce input agar tidak spam request
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const shouldFetch = debouncedQuery.length >= MIN_CHARS;
  const { data, isLoading, isError, refetch } = useGetVoucherListQuery(
    { page: 1, paginate: 200, _q: debouncedQuery } as {
      page: number;
      paginate: number;
      _q?: string; // hanya untuk cache key RTK Query
    },
    { skip: !shouldFetch, refetchOnMountOrArgChange: true }
  );

  // Voucher aktif (status true & dalam rentang tanggal)
  const activeVouchers: Voucher[] = useMemo(() => {
    const list: Voucher[] = ((data?.data ?? []) as Voucher[]) || [];
    const now = new Date();
    return list.filter((v) => {
      if (!v.status) return false;
      const s = new Date(v.start_date);
      const e = new Date(v.end_date);
      return now >= s && now <= e;
    });
  }, [data]);

  // Saat modal buka, langsung fokus ke input
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Sinkronkan query ketika ada voucher terpilih
  useEffect(() => {
    if (selected) setQuery(selected.code ?? "");
    else setQuery("");
  }, [selected]);

  // Filter lokal di frontend (bukan lewat params)
  const filtered: Voucher[] = useMemo(() => {
    // Belum cukup karakter → kosong (tidak tampilkan list)
    if (debouncedQuery.length < MIN_CHARS) return [];
    const q = debouncedQuery.toLowerCase();
    return activeVouchers.filter((v) => {
      const code = (v.code ?? "").toLowerCase();
      const name = (v.name ?? "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [activeVouchers, debouncedQuery]);

  const formatVoucherLabel = (v: Voucher) =>
    v.type === "fixed"
      ? `${v.code} — ${v.name} • Rp ${v.fixed_amount.toLocaleString("id-ID")}`
      : `${v.code} — ${v.name} • ${v.percentage_amount}%`;

  const basePlaceholder =
    debouncedQuery.length < MIN_CHARS
      ? `Ketik minimal ${MIN_CHARS} karakter…`
      : "Ketik untuk cari voucher…";

  const placeholder = isLoading
    ? "Memuat voucher…"
    : isError
    ? "Gagal memuat voucher"
    : basePlaceholder;

  const disabledTrigger = false; // tetap bisa dibuka, tapi list baru tampil setelah 3 char

  const pick = (v: Voucher | null) => {
    onChange(v);
    setOpen(false);
  };

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) pick(filtered[0]);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100">
          <Tag className="h-4 w-4 text-neutral-700" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-900">Voucher</h3>
      </div>

      {/* Trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabledTrigger}
            className="w-full h-12 justify-between rounded-2xl border-neutral-200 bg-white px-3 shadow-sm hover:bg-neutral-50"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="flex items-center gap-2 truncate text-left">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                  <span className="text-neutral-500">{placeholder}</span>
                </>
              ) : selected ? (
                <span className="truncate">{formatVoucherLabel(selected)}</span>
              ) : (
                <>
                  <Search className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-500">{placeholder}</span>
                </>
              )}
            </span>
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl shadow-xl"
          align="start"
          side="bottom"
        >
          {isError ? (
            <div className="p-3 text-sm">
              <div className="mb-2 text-red-600">Gagal memuat voucher.</div>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Coba lagi
              </Button>
            </div>
          ) : (
            <Command shouldFilter={false}>
              {/* Input */}
              <div className="p-2">
                <CommandInput
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  onKeyDown={onEnter}
                  placeholder={`Cari kode/nama (min ${MIN_CHARS} karakter)…`}
                />
              </div>

              <CommandList className="max-h-72">
                <div className="px-3 py-2 text-xs text-neutral-500">
                  {debouncedQuery.length < MIN_CHARS
                    ? `Ketik minimal ${MIN_CHARS} karakter untuk mulai mencari`
                    : isLoading
                    ? "Memuat…"
                    : `${filtered.length} hasil`}
                </div>

                {/* Instruksi sebelum 3 karakter */}
                {debouncedQuery.length < MIN_CHARS ? (
                  <div className="px-3 pb-3 text-sm text-neutral-600">
                    Contoh: <span className="font-medium">POTONGAN</span>,{" "}
                    <span className="font-medium">HEMAT10</span>, dst.
                  </div>
                ) : (
                  <>
                    <CommandEmpty>
                      Tidak ada hasil untuk “{debouncedQuery}”.
                    </CommandEmpty>

                    {!isLoading && (
                      <>
                        <CommandGroup heading="Voucher Aktif">
                          {filtered.map((v) => (
                            <CommandItem
                              key={v.id}
                              value={v.code}
                              onSelect={() => pick(v)}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {formatVoucherLabel(v)}
                                </span>
                                {v.description && (
                                  <span className="text-xs text-neutral-500">
                                    {v.description}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem value="none" onSelect={() => pick(null)}>
                            Tanpa Voucher
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>

      {/* Detail voucher terpilih */}
      {selected && (
        <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white">
              {selected.code}
            </span>
            <span className="text-sm font-semibold text-neutral-900">
              {selected.name}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto h-7 text-xs"
              onClick={() => pick(null)}
            >
              Hapus Voucher
            </Button>
          </div>

          {selected.description && (
            <p className="mt-2 text-sm text-neutral-700">
              {selected.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-md bg-white px-2 py-1 text-neutral-700">
              {selected.type === "fixed"
                ? `Potongan Rp ${selected.fixed_amount.toLocaleString("id-ID")}`
                : `Diskon ${selected.percentage_amount}%`}
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-600">
              Berlaku s/d{" "}
              {new Date(selected.end_date).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}