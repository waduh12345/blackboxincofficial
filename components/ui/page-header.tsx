"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PageHeaderProps = {
  title: string;
  primaryLabel?: string;
  onPrimaryAction?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  rightSlot?: React.ReactNode;
};

export function PageHeader({
  title,
  primaryLabel = "Tambah",
  onPrimaryAction,
  searchPlaceholder = "Cari...",
  searchValue,
  onSearchChange,
  rightSlot,
}: PageHeaderProps) {
  const hasSearch = typeof onSearchChange === "function";

  return (
    <div className="rounded-lg bg-white p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        {/* Bar judul + actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold">{title}</h1>

          <div className="flex items-center gap-2">
            {rightSlot}
            {onPrimaryAction && (
              <Button onClick={onPrimaryAction}>{primaryLabel}</Button>
            )}
          </div>
        </div>

        {/* Search (opsional) */}
        {hasSearch && (
          <div>
            <Input
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>
        )}
      </div>
    </div>
  );
}