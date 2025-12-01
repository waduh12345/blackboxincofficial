"use client";

import { useSession } from "next-auth/react";
import CartPage from "@/components/main/cart/page";
import PublicTransaction from "./public-transactions";

export default function Cart() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse rounded-2xl border px-4 py-3 text-sm">
          Memuat sesi pengguna…
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {session?.user ? <CartPage /> : <PublicTransaction />}
    </div>
  );
}