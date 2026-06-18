import type { ReactNode } from "react";

/**
 * Logo merchant pembayaran (representasi sederhana berbasis wordmark + warna
 * brand) untuk strip informasi "Pembayaran Online".
 *
 * Catatan: ini bukan reproduksi artwork resmi, hanya penanda nama metode
 * pembayaran dalam warna brand agar mudah dikenali pengguna.
 */

const FONT = "Arial, Helvetica, sans-serif";

type LogoSvgProps = {
  viewBox: string;
  children: ReactNode;
  label: string;
};

function LogoSvg({ viewBox, children, label }: LogoSvgProps) {
  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={label}
      className="h-[18px] w-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function QrisLogo() {
  return (
    <LogoSvg viewBox="0 0 70 24" label="QRIS">
      {/* QR glyph */}
      <g fill="#15145A">
        <rect x="0" y="3" width="8" height="8" rx="1.2" />
        <rect x="2" y="5" width="4" height="4" rx="0.6" fill="#fff" />
        <rect x="0" y="14" width="8" height="8" rx="1.2" />
        <rect x="2" y="16" width="4" height="4" rx="0.6" fill="#fff" />
        <rect x="11" y="3" width="3" height="3" />
        <rect x="11" y="9" width="3" height="3" />
        <rect x="11" y="15" width="3" height="3" />
        <rect x="11" y="19" width="3" height="3" />
      </g>
      <text
        x="20"
        y="18"
        fontFamily={FONT}
        fontSize="16"
        fontWeight="800"
        fill="#15145A"
        letterSpacing="0.5"
      >
        QRIS
      </text>
    </LogoSvg>
  );
}

export function GopayLogo() {
  return (
    <LogoSvg viewBox="0 0 66 24" label="GoPay">
      {/* swoosh ring */}
      <circle cx="9" cy="12" r="7.5" fill="none" stroke="#00AED6" strokeWidth="3" />
      <circle cx="9" cy="12" r="2.4" fill="#00AED6" />
      <text
        x="21"
        y="18"
        fontFamily={FONT}
        fontSize="15"
        fontWeight="800"
        fill="#00AED6"
      >
        gopay
      </text>
    </LogoSvg>
  );
}

export function OvoLogo() {
  return (
    <LogoSvg viewBox="0 0 56 24" label="OVO">
      <text
        x="2"
        y="18"
        fontFamily={FONT}
        fontSize="17"
        fontWeight="800"
        fill="#4C2A86"
        letterSpacing="0.5"
      >
        OVO
      </text>
    </LogoSvg>
  );
}

export function DanaLogo() {
  return (
    <LogoSvg viewBox="0 0 62 24" label="DANA">
      <circle cx="6" cy="7" r="3" fill="#1BA0E2" />
      <text
        x="11"
        y="18"
        fontFamily={FONT}
        fontSize="16"
        fontWeight="800"
        fill="#118EEA"
        letterSpacing="0.3"
      >
        DANA
      </text>
    </LogoSvg>
  );
}

export function ShopeePayLogo() {
  return (
    <LogoSvg viewBox="0 0 96 24" label="ShopeePay">
      {/* shopping bag */}
      <g fill="none" stroke="#EE4D2D" strokeWidth="2">
        <path d="M4 8 h12 l-1.2 12.5 a1.5 1.5 0 0 1 -1.5 1.3 h-6.6 a1.5 1.5 0 0 1 -1.5 -1.3 Z" />
        <path d="M7.2 8 a2.8 2.8 0 0 1 5.6 0" />
      </g>
      <text
        x="21"
        y="18"
        fontFamily={FONT}
        fontSize="14.5"
        fontWeight="800"
        fill="#EE4D2D"
      >
        ShopeePay
      </text>
    </LogoSvg>
  );
}

export function LinkAjaLogo() {
  return (
    <LogoSvg viewBox="0 0 70 24" label="LinkAja">
      <text x="2" y="18" fontFamily={FONT} fontSize="15" fontWeight="800">
        <tspan fill="#E01E26">Link</tspan>
        <tspan fill="#231F20">Aja</tspan>
      </text>
    </LogoSvg>
  );
}

export function VirtualAccountLogo() {
  return (
    <LogoSvg viewBox="0 0 92 24" label="Virtual Account semua bank">
      {/* bank building */}
      <g fill="#334155">
        <path d="M9 2 L17 7 H1 Z" />
        <rect x="2" y="8" width="2.6" height="9" />
        <rect x="7.7" y="8" width="2.6" height="9" />
        <rect x="13.4" y="8" width="2.6" height="9" />
        <rect x="0.5" y="18" width="17" height="2.5" rx="0.6" />
      </g>
      <text
        x="22"
        y="13"
        fontFamily={FONT}
        fontSize="9.5"
        fontWeight="800"
        fill="#334155"
      >
        Virtual
      </text>
      <text
        x="22"
        y="22"
        fontFamily={FONT}
        fontSize="9.5"
        fontWeight="800"
        fill="#334155"
      >
        Account
      </text>
    </LogoSvg>
  );
}

export function CardLogo() {
  return (
    <LogoSvg viewBox="0 0 92 24" label="Kartu Kredit / Debit Visa Mastercard">
      <rect
        x="1"
        y="4"
        width="22"
        height="16"
        rx="2.5"
        fill="#1E293B"
      />
      <rect x="1" y="8" width="22" height="3.4" fill="#0f172a" />
      <circle cx="12" cy="16" r="2.6" fill="#EB001B" opacity="0.9" />
      <circle cx="15.4" cy="16" r="2.6" fill="#F79E1B" opacity="0.85" />
      <text
        x="28"
        y="18"
        fontFamily={FONT}
        fontSize="12.5"
        fontWeight="800"
        fill="#1E293B"
      >
        Kartu
      </text>
    </LogoSvg>
  );
}

export type PaymentLogoItem = {
  key: string;
  Logo: () => ReactNode;
};

/** Daftar metode yang ditampilkan di strip informasi. */
export const PAYMENT_LOGOS: PaymentLogoItem[] = [
  { key: "qris", Logo: QrisLogo },
  { key: "gopay", Logo: GopayLogo },
  { key: "ovo", Logo: OvoLogo },
  { key: "dana", Logo: DanaLogo },
  { key: "shopeepay", Logo: ShopeePayLogo },
  { key: "linkaja", Logo: LinkAjaLogo },
  { key: "va", Logo: VirtualAccountLogo },
  { key: "card", Logo: CardLogo },
];
