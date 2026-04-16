"use client";

import Link from "next/link";

export default function WhatsAppFloat() {
  // Format nomor: hapus awalan 0, tambah kode negara 62
  const phoneNumber = "62895622717884";
  const waUrl = `https://wa.me/${phoneNumber}`;

  return (
    <Link
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat via WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        fill="white"
        className="h-8 w-8"
      >
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.052 31.2l6.012-1.93A15.89 15.89 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.334 22.594c-.39 1.1-1.932 2.014-3.164 2.28-.844.18-1.946.324-5.66-1.216-4.752-1.97-7.806-6.79-8.04-7.104-.226-.314-1.892-2.52-1.892-4.808 0-2.288 1.198-3.412 1.622-3.878.424-.466.926-.582 1.234-.582.308 0 .616.002.886.016.284.014.666-.108 1.042.794.39.934 1.324 3.222 1.44 3.456.116.234.194.506.038.82-.156.314-.234.51-.468.786-.234.276-.49.616-.7.826-.234.234-.478.488-.206.958.272.468 1.212 2 2.602 3.24 1.786 1.592 3.292 2.086 3.76 2.32.468.234.742.194 1.014-.116.272-.312 1.17-1.364 1.482-1.834.312-.468.624-.39 1.054-.234.43.156 2.716 1.282 3.182 1.516.466.234.778.35.894.544.116.194.116 1.118-.274 2.216z" />
      </svg>
    </Link>
  );
}
