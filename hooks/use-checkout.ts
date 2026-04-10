"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import {
  useCreateTransactionMutation,
  useCreatePublicTransactionMutation,
} from "@/services/admin/transaction.service";

import type {
  CheckoutDeps,
  StoredCartItem,
  ShippingCostOption,
  PrivateDetailItem,
  PublicDetailItem,
} from "@/types/checkout";
import type {
  CreateTransactionRequest,
  CreatePublicTransactionRequest,
} from "@/types/admin/transaction";

const STORAGE_KEY = "cart-storage";
const GUEST_INFO_KEY = "__guest_checkout_info__";

/* =========================
   Utils & Type Guards
========================= */

type GuestInfo = {
  fullName: string;
  phone: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  postal_code: string;
  rajaongkir_province_id: number;
  rajaongkir_city_id: number;
  rajaongkir_district_id: number;
};


function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function hasPaymentLink(
  v: unknown
): v is { payment: { account_number?: string | null } } {
  if (!isRecord(v)) return false;
  const p = v["payment"];
  if (!isRecord(p)) return false;
  const acc = (p as Record<string, unknown>)["account_number"];
  return typeof acc === "string" || acc === null;
}

function hasReference(v: unknown): v is { reference: string } {
  return isRecord(v) && typeof v["reference"] === "string";
}

function parseStorage(): StoredCartItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as {
      state?: { cartItems?: StoredCartItem[] };
    };
    return Array.isArray(parsed?.state?.cartItems)
      ? parsed.state!.cartItems!
      : [];
  } catch {
    return [];
  }
}

function calcTotalWeight(items: StoredCartItem[]): number {
  const total = items.reduce((sum, item) => {
    const w = typeof item.weight === "number" ? item.weight : 0;
    return sum + w * (item.quantity ?? 1);
  }, 0);
  return total > 0 ? total : 1; // minimal 1 gram
}

function buildShipmentPayload(
  courier: string | null,
  method: ShippingCostOption | null,
  destinationDistrictId: number,
  totalWeight: number
) {
  return {
    parameter: JSON.stringify({
      destination: String(destinationDistrictId),
      weight: totalWeight,
      height: 0,
      length: 0,
      width: 0,
      diameter: 0,
      courier: courier ?? "jne",
    }),
    shipment_detail: JSON.stringify(method ?? null),
    courier: courier ?? "jne",
    cost: method?.cost ?? 0,
  };
}

function saveGuestInfo(info: GuestInfo): void {
  try {
    localStorage.setItem(GUEST_INFO_KEY, JSON.stringify(info));
  } catch {}
}

/** Helper Type untuk ekstraksi properti dinamis dari StoredCartItem */
type CartItemIds = {
  product_variant_id?: unknown;
  product_variant_size_id?: unknown;
};

/** Helper: Ambil Variant ID dengan aman */
function getVariantId(item: StoredCartItem): number | null {
  const v = (item as unknown as CartItemIds).product_variant_id;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Helper: Ambil Size ID dengan aman (BARU) */
function getSizeId(item: StoredCartItem): number | null {
  const s = (item as unknown as CartItemIds).product_variant_size_id;
  return typeof s === "number" && Number.isFinite(s) ? s : null;
}

/* =========================
   Hook Utama
========================= */
export function useCheckout() {
  const router = useRouter();
  const [createPrivateTx] = useCreateTransactionMutation();
  const [createPublicTx] = useCreatePublicTransactionMutation();

  const handleCheckout = useCallback(
    async (deps: CheckoutDeps) => {
      const {
        sessionEmail,
        shippingCourier,
        shippingMethod,
        shippingInfo,
        paymentType,
        paymentMethod,
        paymentChannel,
        clearCart,
        voucher,
      } = deps;

      // Validasi dasar
      if (
        !shippingMethod ||
        !shippingInfo.fullName ||
        !shippingInfo.address_line_1 ||
        !shippingInfo.postal_code
      ) {
        await Swal.fire({
          icon: "warning",
          title: "Lengkapi Data",
          text: "Harap lengkapi semua informasi yang diperlukan untuk melanjutkan.",
        });
        return;
      }

      // Validasi payment method & channel jika automatic
      if (paymentType === "automatic" && (!paymentMethod || !paymentChannel)) {
        await Swal.fire({
          icon: "warning",
          title: "Pilih Metode Pembayaran",
          text: "Harap pilih metode dan channel pembayaran untuk melanjutkan.",
        });
        return;
      }

      const stored = parseStorage();
      const totalWeight = calcTotalWeight(stored);

      /* =========================
          LOGIN → /transaction
         ========================= */
      if (sessionEmail) {
        const privateDetails = stored.map((item) => {
          const variantId = getVariantId(item) ?? item.id;
          const sizeId = getSizeId(item);

          return {
            product_id: item.id,
            product_variant_id: variantId,
            product_variant_size_id: sizeId ?? null,
            quantity: item.quantity ?? 1,
          };
        });

        const payload: CreateTransactionRequest = {
          address_line_1: shippingInfo.address_line_1,
          postal_code: shippingInfo.postal_code,
          payment_type: paymentType as "automatic" | "manual",
          payment_method: paymentMethod,
          payment_channel: paymentChannel,
          voucher: voucher,
          data: [
            {
              shop_id: 1,
              // Casting ke tipe yang diharapkan service (asumsi service menerima extra field)
              details: privateDetails as PrivateDetailItem[],
              shipment: buildShipmentPayload(
                shippingCourier,
                shippingMethod,
                shippingInfo.rajaongkir_district_id,
                totalWeight
              ),
              customer_info: {
                name: shippingInfo.fullName,
                phone: shippingInfo.phone,
                address_line_1: shippingInfo.address_line_1,
                postal_code: shippingInfo.postal_code,
                province_id: shippingInfo.rajaongkir_province_id,
                city_id: shippingInfo.rajaongkir_city_id,
                district_id: shippingInfo.rajaongkir_district_id,
              },
            },
          ],
        };

        const result = await createPrivateTx(payload).unwrap();

        if (
          typeof result === "object" &&
          result !== null &&
          "data" in result &&
          result.data &&
          !Array.isArray(result.data)
        ) {
          const dataUnknown: unknown = result.data;

          // DOKU Full API: pembayaran otomatis mengembalikan detail langsung
          // (VA number, QRIS string, e-wallet deep link) — BUKAN redirect URL
          if (paymentType === "automatic" && hasReference(dataUnknown)) {
            const ref = dataUnknown.reference;
            await Swal.fire({
              icon: "success",
              title: "Pesanan Berhasil Dibuat",
              text: `Pesanan #${ref} berhasil dibuat. Silakan selesaikan pembayaran.`,
              confirmButtonText: "Lihat Detail Pembayaran",
              confirmButtonColor: "#000000",
            });
            clearCart();
            router.push("/me");
            return;
          }

          if (hasReference(dataUnknown)) {
            await Swal.fire({
              icon: "success",
              title: "Pesanan Dibuat",
              text: `Pesanan #${dataUnknown.reference} berhasil dibuat. Silakan cek halaman Pesanan Anda.`,
              confirmButtonText: "Lihat Pesanan Saya",
              confirmButtonColor: "#000000",
            });
            clearCart();
            router.push("/me");
            return;
          }
        }

        await Swal.fire({
          icon: "info",
          title: "Pesanan Dibuat",
          text: "Pesanan berhasil dibuat, silakan cek profil Anda.",
          confirmButtonColor: "#000000",
        });
        clearCart();
        router.push("/me");
        return;
      }

      /* =========================
          GUEST → /public/transaction
         ========================= */
      if (!shippingInfo.email) {
        await Swal.fire({
          icon: "warning",
          title: "Email diperlukan",
          text: "Masukkan alamat email untuk mengirimkan detail pesanan.",
        });
        return;
      }

      const publicDetails = stored.map((item) => {
        const variantId = getVariantId(item) ?? item.id;
        const sizeId = getSizeId(item);

        return {
          product_id: item.id,
          product_variant_id: variantId,
          product_variant_size_id: sizeId ?? null,
          quantity: item.quantity ?? 1,
        };
      });

      const publicPayload: CreatePublicTransactionRequest = {
        guest_name: shippingInfo.fullName,
        guest_email: shippingInfo.email!,
        guest_phone: shippingInfo.phone,
        address_line_1: shippingInfo.address_line_1,
        address_line_2: shippingInfo.address_line_2 ?? null,
        postal_code: shippingInfo.postal_code,
        payment_type: paymentType as "automatic" | "manual",
        payment_method: paymentMethod,
        payment_channel: paymentChannel,
        voucher: voucher,
        data: [
          {
            shop_id: 1,
            shipment: buildShipmentPayload(
              shippingCourier,
              shippingMethod,
              shippingInfo.rajaongkir_district_id,
              totalWeight
            ),
            details: publicDetails,
          },
        ],
      };

      const res = await createPublicTx(publicPayload).unwrap();

      // Prefill next time
      saveGuestInfo({
        fullName: shippingInfo.fullName,
        phone: shippingInfo.phone,
        email: shippingInfo.email,
        address_line_1: shippingInfo.address_line_1,
        address_line_2: shippingInfo.address_line_2 ?? "",
        postal_code: shippingInfo.postal_code,
        rajaongkir_province_id: shippingInfo.rajaongkir_province_id,
        rajaongkir_city_id: shippingInfo.rajaongkir_city_id,
        rajaongkir_district_id: shippingInfo.rajaongkir_district_id,
      });

      // Handle Response — DOKU Full API: detail pembayaran langsung (bukan redirect)
      const txData = res.data;
      const referenceCode = txData?.reference ?? "";
      const txEncryptedId = txData?.id ?? "";

      if (paymentType === "automatic") {
        await Swal.fire({
          icon: "success",
          title: "Pesanan Berhasil Dibuat",
          html: `
            Kode pesanan Anda: <strong>${referenceCode}</strong><br/>
            Silakan selesaikan pembayaran sebelum batas waktu.
          `,
          confirmButtonColor: "#000000",
          confirmButtonText: "Lihat Detail Pembayaran",
          allowOutsideClick: false,
          allowEscapeKey: false,
        });
      } else {
        await Swal.fire({
          icon: "success",
          title: "Pesanan Berhasil Dibuat",
          html: `Kode pesanan Anda: <strong>${referenceCode}</strong><br/>Simpan kode ini untuk melacak pesanan Anda.`,
          confirmButtonColor: "#000000",
          confirmButtonText: "Lacak Pesanan",
          allowOutsideClick: false,
          allowEscapeKey: false,
        });
      }

      clearCart();
      // Untuk pembayaran otomatis, arahkan ke halaman detail transaksi
      // agar user bisa melihat VA number / QRIS / e-wallet langsung
      if (paymentType === "automatic" && txEncryptedId) {
        router.push(`/transaction/${txEncryptedId}`);
      } else {
        router.push(`/cek-order?ref=${encodeURIComponent(referenceCode)}`);
      }
    },
    [createPrivateTx, createPublicTx, router]
  );

  return { handleCheckout };
}