import dayjs from "dayjs";
import "dayjs/locale/id";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

// ===== Rupiah Helpers: robust decimal → integer (rounded) =====

// Deteksi pemisah desimal yang "masuk akal":
// - Jika ada koma & titik → anggap format lokal: desimal = ','
// - Jika hanya satu pemisah → desimal jika bagian setelahnya ≤ 2 digit (contoh: "12,5" atau "12.50")
//   selain itu diasumsikan sebagai pemisah ribuan (contoh: "100.000" / "1,234")
const findDecimalSeparatorIndex = (raw: string): number => {
  const s = raw;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    return s.lastIndexOf(","); // format Indonesia: 1.234,56
  }
  if (hasComma) {
    const after = s.split(",").pop() ?? "";
    return after.length <= 2 ? s.lastIndexOf(",") : -1;
  }
  if (hasDot) {
    const after = s.split(".").pop() ?? "";
    return after.length <= 2 ? s.lastIndexOf(".") : -1;
  }
  return -1;
};

// Ubah string/id ke float "mentah", memahami Rp, spasi, titik/koma, dan minus.
// Lalu kembalikan number (bisa desimal). Nanti pemanggil yang membulatkan.
const parseLocaleNumberToFloat = (input: string | number): number => {
  if (typeof input === "number") return input;
  if (input == null) return NaN;

  // Bersihkan simbol non-angka umum (Rp, spasi, huruf)
  let s = String(input).trim().replace(/Rp/gi, "").replace(/\s+/g, "");
  if (!s) return NaN;

  // Simpan tanda minus bila ada
  const negative = s.includes("-");
  s = s.replace(/-/g, "");

  // Sisakan digit + pemisah [, .]
  s = s.replace(/[^0-9.,]/g, "");
  if (!s) return NaN;

  const decIdx = findDecimalSeparatorIndex(s);
  let intPart = s;
  let fracPart = "";

  if (decIdx >= 0) {
    intPart = s.slice(0, decIdx);
    fracPart = s.slice(decIdx + 1);
  }

  // Buang semua pemisah ribuan dari bagian integer
  intPart = intPart.replace(/\D/g, "");
  // Buang non-digit dari fraksi
  fracPart = fracPart.replace(/\D/g, "");

  // Rakit ke bentuk standar dengan titik sebagai desimal
  const numStr = intPart + (fracPart ? "." + fracPart : "");
  if (!numStr) return NaN;

  const val = parseFloat(numStr);
  return negative ? -val : val;
};

// 1) Format saat KETIK (onChange): ribuan saja, dibulatkan ke integer
export const formatRupiah = (value: number | string) => {
  if (value === null || value === undefined || value === "") return "";
  const f = parseLocaleNumberToFloat(value);
  if (!Number.isFinite(f)) return "";
  const rounded = Math.round(f);
  return rounded.toLocaleString("id-ID"); // contoh: 100000.49 → "100.000"
};

// 2) Format FINAL (onBlur/readonly): "Rp " + ribuan (tanpa desimal), dibulatkan
export const formatRupiahWithRp = (value: number | string | null) => {
  if (value === null || value === undefined || value === "") return "Rp ";
  const f = parseLocaleNumberToFloat(value);
  if (!Number.isFinite(f)) return "Rp ";
  const rounded = Math.round(f);
  return `Rp ${rounded.toLocaleString("id-ID")}`; // "Rp 100.000"
};

// 3) Parser umum: terima input apa pun (1.234,56 / 1,234.56 / "Rp 1.234")
//    kembalikan number integer (dibulatkan)
export const parseRupiah = (raw: string) => {
  if (!raw) return 0;
  const f = parseLocaleNumberToFloat(raw);
  if (!Number.isFinite(f)) return 0;
  return Math.round(f);
};

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.locale("id");

const hasZone = (s: string) => /[zZ]|[+\-]\d{2}:\d{2}/.test(s);

// Potong fraksi detik > 3 digit (API kamu kirim .000000Z)
const normalizeIsoFraction = (s: string) =>
  s.replace(/(\.\d{3})\d+(Z)$/, "$1$2");

export function formatDate(date?: string | Date | null) {
  if (!date) return "";

  // Jika Date object dari JS, anggap local time → jadikan YYYY-MM-DD tanpa TZ
  if (date instanceof Date) {
    return dayjs(date).format("YYYY-MM-DD");
  }

  const str = String(date).trim();
  if (!str) return "";

  // Jika ada zona waktu → konversi ke Asia/Jakarta
  if (hasZone(str)) {
    const safe = normalizeIsoFraction(str);
    return dayjs.utc(safe).tz("Asia/Jakarta").format("YYYY-MM-DD");
  }

  // Jika tanggal polos → JANGAN di-UTC/TZ (hindari geser hari)
  const parsed = dayjs(str, ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY"], true);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
}
export const displayDate = (dateString?: string | null) => {
  if (!dateString) return "-";

  const parsed = dayjs(
    dateString,
    ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY"],
    true
  );

  const date = parsed.isValid() ? parsed : dayjs(dateString);

  return date.isValid()
    ? date.locale("id").format("D MMMM YYYY")
    : "Tanggal tidak valid";
};

// export const formatDateForInput = (dateString?: string | null) => {
//   if (!dateString) return "";
//   const d = new Date(dateString);
//   if (isNaN(d.getTime())) return ""; // antisipasi invalid date

//   const year = d.getFullYear();
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

export const formatNumber = (value?: number | string, maxDecimal = 3) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (isNaN(num)) return "-";
  return Number(num.toFixed(maxDecimal)).toString();
};

export const formatDateForInput = (dateString?: string | null) => {
  if (!dateString) return "";
  const str = String(dateString).trim();

  // 1) Izinkan nilai parsial saat user mengetik (biar gak ke-reset)
  if (
    /^(\d{4})$/.test(str) || // YYYY
    /^(\d{4})-$/.test(str) || // YYYY-
    /^(\d{4})-(\d{1,2})$/.test(str) || // YYYY-M(M)
    /^(\d{4})-(\d{2})-$/.test(str) || // YYYY-MM-
    /^(\d{4})-(\d{2})-(\d{1,2})$/.test(str) // YYYY-MM-D(D)
  ) {
    return str;
  }

  // 2) Punya zona waktu → konversi ke Asia/Jakarta
  if (hasZone(str)) {
    const safe = normalizeIsoFraction(str);
    const d = dayjs.utc(safe).tz("Asia/Jakarta");
    return d.isValid() ? d.format("YYYY-MM-DD") : "";
  }

  // 3) **TANGANI DATETIME TANPA TZ**: "YYYY-MM-DD HH:mm:ss" / "YYYY-MM-DDTHH:mm:ss(.SSS...)"
  const dt = dayjs(
    str,
    [
      "YYYY-MM-DD HH:mm:ss",
      "YYYY-MM-DDTHH:mm:ss",
      "YYYY-MM-DD HH:mm:ss.SSS",
      "YYYY-MM-DDTHH:mm:ss.SSS",
      "YYYY-MM-DD HH:mm:ss.SSSSSS",
      "YYYY-MM-DDTHH:mm:ss.SSSSSS",
    ],
    true
  );
  if (dt.isValid()) return dt.format("YYYY-MM-DD");

  // 4) Tanggal polos
  const d = dayjs(str, ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY"], true);
  return d.isValid() ? d.format("YYYY-MM-DD") : "";
};

export const formatProgress = (value: number | string) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return parseFloat(num.toFixed(3)); // batasi 3 angka di belakang koma
};