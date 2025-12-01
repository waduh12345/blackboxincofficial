// app/actions/transaction.ts
"use server";

import { encrypt } from "@/lib/crypto";

export async function getEncryptedTransactionId(id: number | string) {
  try {
    const encryptedId = encrypt(id.toString());
    return { success: true, data: encryptedId };
  } catch (error) {
    return { success: false, error: "Failed to encrypt" };
  }
}