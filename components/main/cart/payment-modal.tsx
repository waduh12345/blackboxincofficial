"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import PaymentPanel, { PaymentResp } from "./payment-panel";

type Props = {
  open: boolean;
  payment: PaymentResp | null;
  onClose: () => void;
  onCopied?: (msg: string) => void;
};

export default function PaymentModal({
  open,
  payment,
  onClose,
  onCopied,
}: Props) {
  // Lock scroll saat modal terbuka + ESC to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !payment) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={onClose}
              className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-white shadow hover:bg-neutral-50"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <PaymentPanel
              payment={payment}
              onClose={onClose}
              onCopied={onCopied}
            />
          </div>
        </div>
      </div>
    </div>
  );
}