"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShoppingCart,
  CreditCard,
  User,
  Package,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Truck,
  HeadphonesIcon,
  Mail,
  MessageCircle,
  Star,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowLeft,
  Ruler,
  Play,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import clsx from "clsx";

// --- IMPORTS MODE EDIT ---
import { useEditMode } from "@/hooks/use-edit-mode";
import {
  EditableText,
  EditableLink,
  EditableImage,
} from "@/components/ui/editable";
import {
  EditableSection,
  BackgroundConfig,
} from "@/components/ui/editable-section";
import DotdLoader from "@/components/loader/3dot";

// --- IMPORT KOMPONEN PEMBAYARAN BARU ---
import { PaymentInstructions } from "@/components/sections/payment-instructions";

// --- INTERFACES ---
interface Step {
  id: number;
  title: string;
  description: string;
  details: string[];
  icon: React.ReactNode;
  image: string;
  tips?: string[];
}
interface FAQ {
  question: string;
  answer: string;
}

// =========================================
// DEFAULT EXPORT (WRAPPER SUSPENSE)
// =========================================
export default function HowToOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <DotdLoader />
        </div>
      }
    >
      <HowToOrderContent />
    </Suspense>
  );
}

// =========================================
// CONTENT COMPONENT
// =========================================
function HowToOrderContent() {
  const router = useRouter();
  const isEditMode = useEditMode();
  const [activeStep, setActiveStep] = useState(1);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // === THEME CONSTANTS ===
  const THEME = {
    primary: "#000000",
    secondary: "#FFFFFF",
    accentGray: "#1F2937",
  };

  // === 1. BACKGROUND STATES ===
  const [heroBg, setHeroBg] = useState<BackgroundConfig>({
    type: "solid",
    color1: "#ffffff",
  });
  const [stepsBg, setStepsBg] = useState<BackgroundConfig>({
    type: "solid",
    color1: "#ffffff",
  });
  const [paymentBg, setPaymentBg] = useState<BackgroundConfig>({
    type: "solid",
    color1: "#ffffff",
  });
  const [contactBg, setContactBg] = useState<BackgroundConfig>({
    type: "solid",
    color1: "#ffffff",
  });
  const [ctaBg, setCtaBg] = useState<BackgroundConfig>({
    type: "solid",
    color1: "#ffffff",
  });
  const [faqBg, setFaqBg] = useState<BackgroundConfig>({
    type: "solid",
    color1: "#ffffff",
  });

  // === 2. TEXT STATES (General) ===
  const [texts, setTexts] = useState({
    heroBadge: "Ordering Guide",
    heroTitle1: "How To Order From",
    heroTitle2: "BLACKBOX.INC",
    heroSubtitle:
      "Follow our 6 simple steps to successfully purchase your exclusive fashion items. Secure, straightforward, and fast!",

    stepHeaderTitle: "The 6 Steps Process",
    stepHeaderSubtitle:
      "A straightforward and secure journey from selection to delivery.",

    paymentTitle: "Secure Payment Methods",
    paymentSubtitle:
      "Your transaction safety is our priority. Powered by Doku.",
    securityTitle: "100% Security Guarantee",
    securityDesc:
      "All transactions are secured with 256-bit SSL encryption and processed via PCI DSS Level 1 certified gateway.",

    contactTitle: "Need Assistance?",
    contactSubtitle:
      "Our dedicated support team is available during business hours to assist you with any questions.",

    ctaTitle: "Ready To Define Your Style?",
    ctaSubtitle:
      "Explore our exclusive collection and start your journey towards timeless fashion.",
    ctaBtnPrimary: "Shop Now",
    ctaBtnSecondary: "Watch Brand Video",

    faqTitle: "Frequently Asked Questions",
    faqSubtitle:
      "Find quick answers about our shipping, returns, and exchanges.",
  });

  const updateText = (key: keyof typeof texts, val: string) => {
    setTexts((prev) => ({ ...prev, [key]: val }));
  };

  // === 3. ARRAY STATES (Benefits, Steps, FAQs) ===

  // Benefits
  const [benefitsList, setBenefitsList] = useState([
    {
      icon: <Shield className="w-6 h-6" style={{ color: THEME.primary }} />,
      title: "Secure Payment",
      description: "Protected by SSL encryption and Doku.",
    },
    {
      icon: <Truck className="w-6 h-6" style={{ color: THEME.primary }} />,
      title: "Fast Shipping",
      description: "2-5 working days with real-time tracking.",
    },
    {
      icon: (
        <HeadphonesIcon className="w-6 h-6" style={{ color: THEME.primary }} />
      ),
      title: "Expert Support",
      description: "Dedicated team ready to assist 24/7.",
    },
  ]);

  // Steps
  const [stepsList, setStepsList] = useState<Step[]>([
    {
      id: 1,
      title: "Pilih Gaya & Ukuran",
      description:
        "Jelajahi koleksi eksklusif kami dan tentukan item yang sesuai dengan selera dan ukuran Anda.",
      details: [
        "Browse kategori (T-Shirt, Denim, Aksesori, dll.)",
        "Gunakan fitur 'Size Guide' untuk memastikan fitting yang sempurna",
        "Lihat detail material dan instruksi perawatan untuk setiap produk",
        "Pilih warna dan varian yang Anda inginkan",
      ],
      icon: <Ruler className="w-8 h-8" />,
      image: "images/new/order-steps/step-1.png",
      tips: [
        "Selalu cek Size Guide untuk menghindari retur",
        "Perhatikan detail cutting (Slim, Oversized, Regular)",
        "Lihat ulasan untuk real-life fitting feedback",
      ],
    },
    {
      id: 2,
      title: "Review Keranjang Belanja",
      description:
        "Verifikasi item dan pastikan semua detail (ukuran, warna, kuantitas) sudah benar sebelum checkout.",
      details: [
        "Cek ulang kuantitas dan harga total",
        "Pastikan ukuran dan warna sudah sesuai pilihan",
        "Masukkan kode diskon atau voucher jika ada",
        "Klik 'Proceed to Checkout' untuk lanjut",
      ],
      icon: <Package className="w-8 h-8" />,
      image: "images/new/order-steps/step-2.png",
      tips: [
        "Manfaatkan free shipping untuk pembelian di atas Rp 500.000",
        "Periksa kembali detail ukuran sebelum submit",
        "Keranjang akan tersimpan otomatis jika Anda sudah login",
      ],
    },
    {
      id: 3,
      title: "Isi Detail Pengiriman",
      description:
        "Lengkapi data Anda, termasuk nama, kontak, dan alamat pengiriman yang akurat.",
      details: [
        "Isi nama lengkap dan nomor telepon aktif",
        "Masukkan alamat pengiriman selengkap mungkin (patokan, nomor rumah)",
        "Pilih metode dan estimasi biaya pengiriman",
        "Tambahkan catatan khusus untuk kurir jika diperlukan",
      ],
      icon: <User className="w-8 h-8" />,
      image: "images/new/order-steps/step-3.png",
      tips: [
        "Pastikan nomor telepon aktif untuk konfirmasi kurir",
        "Cek kembali kode pos dan alamat Anda",
        "Alamat yang tidak lengkap bisa menunda pengiriman",
      ],
    },
    {
      id: 4,
      title: "Pilih Metode Pembayaran",
      description:
        "Selesaikan transaksi Anda dengan aman melalui berbagai opsi pembayaran terpercaya (Doku).",
      details: [
        "Pilih metode: Transfer Bank, E-Wallet, atau Kartu Kredit/VA",
        "Ikuti instruksi pembayaran yang muncul di layar",
        "Verifikasi pembayaran otomatis dan notifikasi dikirim via email/WhatsApp",
        "Semua transaksi dienkripsi untuk keamanan data Anda",
      ],
      icon: <CreditCard className="w-8 h-8" />,
      image: "images/new/order-steps/step-4.png",
      tips: [
        "Gunakan E-Wallet untuk proses tercepat",
        "Simpan kode pembayaran/Virtual Account Anda",
        "Pembayaran harus dilakukan dalam batas waktu yang ditentukan (maks 2 jam)",
      ],
    },
    {
      id: 5,
      title: "Konfirmasi & Proses Kirim",
      description:
        "Pesanan Anda dikonfirmasi, dan kami segera memulai proses pengepakan dan pengiriman.",
      details: [
        "Pesanan diproses dalam 1x24 jam (hari kerja)",
        "Anda akan menerima nomor resi pengiriman setelah produk dikirim",
        "Kami menggunakan packaging premium untuk menjaga kualitas produk",
        "Update status dikirim via email dan notifikasi WhatsApp",
      ],
      icon: <CheckCircle className="w-8 h-8" />,
      image: "images/new/order-steps/step-5.png",
      tips: [
        "Cek email/WhatsApp secara berkala untuk resi",
        "Pesanan masuk setelah jam 1 siang akan diproses hari kerja berikutnya",
        "Hubungi CS jika resi belum terbit setelah 2 hari kerja",
      ],
    },
    {
      id: 6,
      title: "Terima & Beri Ulasan",
      description:
        "Paket BLACKBOX.INC tiba! Nikmati produk Anda dan bantu kami dengan memberikan ulasan.",
      details: [
        "Periksa kondisi paket saat diterima",
        "Jika ada masalah, hubungi CS segera (sertakan video unboxing)",
        "Login dan berikan review produk untuk mendapatkan loyalty points",
        "Tingkatkan gaya Anda dengan item BLACKBOX.INC yang baru!",
      ],
      icon: <Truck className="w-8 h-8" />,
      image: "images/new/order-steps/step-6.png",
      tips: [
        "Review yang jujur sangat berharga bagi kami",
        "Simpan nota/invoice untuk klaim garansi retur/tukar ukuran",
        "Abadikan gaya Anda dan tag kami di Instagram!",
      ],
    },
  ]);

  // FAQs
  const [faqsList, setFaqsList] = useState<FAQ[]>([
    {
      question: "Berapa lama estimasi pengiriman standar?",
      answer:
        "Estimasi pengiriman standar adalah 2-5 hari kerja untuk wilayah Jabodetabek dan 5-10 hari kerja untuk luar pulau Jawa. Kami akan mengirimkan nomor resi segera setelah pesanan dikirim.",
    },
    {
      question: "Apakah saya bisa menukar ukuran jika tidak pas?",
      answer:
        "Ya, kami menyediakan layanan penukaran ukuran maximal 2 Hari  setelah barang di terima pembeli, selama stok yang di inginkan masih tersedia (Tidak termasuk barang discount)",
    },
    {
      question: "Apa saja metode pembayaran yang tersedia?",
      answer:
        "Kami bekerja sama dengan Payment Gateway DOKU untuk menyediakan pembayaran yang aman dan lengkap, meliputi: Virtual Account (BCA, Mandiri, BNI, BRI, Permata, CIMB), E-Wallet (QRIS, OVO, ShopeePay, DANA, GoPay), Kartu Kredit/Debit (Visa, Mastercard, JCB), serta pembayaran tunai melalui gerai Alfamart dan Indomaret.",
    },
    {
      question: "Bagaimana jika produk yang diterima cacat?",
      answer:
        "Kami menjamin kualitas produk. Jika produk cacat atau salah kirim, hubungi Customer Service kami dalam 48 jam setelah paket diterima (sertakan video unboxing) untuk proses penggantian tanpa biaya tambahan.",
    },
    {
      question: "Apakah ada biaya untuk penukaran ukuran?",
      answer:
        "Penukaran ukuran tidak dikenakan biaya produk, namun biaya pengiriman kembali ke gudang dan pengiriman ulang kepada Anda ditanggung oleh pembeli, kecuali jika terjadi kesalahan dari pihak kami.",
    },
  ]);

  // === UPDATER HELPERS ===
  const updateBenefit = (
    index: number,
    field: "title" | "description",
    val: string
  ) => {
    const newData = [...benefitsList];
    newData[index][field] = val;
    setBenefitsList(newData);
  };

  const updateStep = <K extends keyof Step>(
    id: number,
    field: K,
    val: Step[K]
  ) => {
    setStepsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const updateStepDetail = (
    stepId: number,
    detailIndex: number,
    val: string
  ) => {
    setStepsList((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const newDetails = [...s.details];
        newDetails[detailIndex] = val;
        return { ...s, details: newDetails };
      })
    );
  };

  const updateStepTip = (stepId: number, tipIndex: number, val: string) => {
    setStepsList((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const newTips = [...(s.tips || [])];
        newTips[tipIndex] = val;
        return { ...s, tips: newTips };
      })
    );
  };

  const updateFaq = (index: number, field: keyof FAQ, val: string) => {
    const newData = [...faqsList];
    newData[index][field] = val;
    setFaqsList(newData);
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeButton = scrollContainerRef.current.querySelector(
        `[data-id="${activeStep}"]`
      );
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeStep]);

  return (
    <div className="min-h-screen bg-white">
      {/* ============== HERO (B&W Theme) ============== */}
      <EditableSection
        isEditMode={isEditMode}
        config={heroBg}
        onSave={setHeroBg}
        className="relative pt-24 pb-16 px-6 lg:px-12 overflow-hidden border-b border-gray-100"
      >
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-24 -left-24 w-[40rem] h-[40rem] rounded-full"
            style={{
              background: THEME.primary,
              filter: "blur(80px)",
              opacity: 0.05,
            }}
          />
          <div
            className="absolute top-1/3 right-[-10%] w-[28rem] h-[28rem] rounded-full"
            style={{
              background: THEME.accentGray,
              filter: "blur(100px)",
              opacity: 0.08,
            }}
          />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ backgroundColor: THEME.primary, color: "#FFFFFF" }}
          >
            <Sparkles className="w-4 h-4 text-white" />
            <EditableText
              isEditMode={isEditMode}
              text={texts.heroBadge}
              onSave={(v) => updateText("heroBadge", v)}
              as="span"
              className="text-sm font-medium uppercase tracking-wider"
            />
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold text-black mb-6 uppercase tracking-tight">
            <EditableText
              isEditMode={isEditMode}
              text={texts.heroTitle1}
              onSave={(v) => updateText("heroTitle1", v)}
            />
            <EditableText
              isEditMode={isEditMode}
              text={texts.heroTitle2}
              onSave={(v) => updateText("heroTitle2", v)}
              as="span"
              className="block text-gray-700"
            />
          </h1>

          <EditableText
            isEditMode={isEditMode}
            text={texts.heroSubtitle}
            onSave={(v) => updateText("heroSubtitle", v)}
            as="p"
            multiline
            className="text-lg text-gray-700 mx-auto mb-10 font-medium"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefitsList.map((benefit, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-lg p-5 shadow-sm border border-gray-200"
              >
                <div className="flex justify-center mb-3 text-black">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-black text-base mb-1 uppercase tracking-wide">
                  <EditableText
                    isEditMode={isEditMode}
                    text={benefit.title}
                    onSave={(v) => updateBenefit(i, "title", v)}
                  />
                </h3>
                <EditableText
                  isEditMode={isEditMode}
                  text={benefit.description}
                  onSave={(v) => updateBenefit(i, "description", v)}
                  as="p"
                  multiline
                  className="text-xs text-gray-600"
                />
              </div>
            ))}
          </div>
        </div>
      </EditableSection>

      {/* ============== STEP NAV + CONTENT (B&W Theme) ============== */}
      <EditableSection
        isEditMode={isEditMode}
        config={stepsBg}
        onSave={setStepsBg}
        className="px-6 lg:px-12 mb-16 pt-16"
      >
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-black mb-4 uppercase">
              <EditableText
                isEditMode={isEditMode}
                text={texts.stepHeaderTitle}
                onSave={(v) => updateText("stepHeaderTitle", v)}
              />
            </h2>
            <EditableText
              isEditMode={isEditMode}
              text={texts.stepHeaderSubtitle}
              onSave={(v) => updateText("stepHeaderSubtitle", v)}
              as="p"
              multiline
              className="text-gray-700 mx-auto text-lg"
            />
          </div>

          {/* Step Navigation */}
          <div className="flex justify-center mb-12">
            <div
              className="bg-white rounded-lg p-3 md:p-6 shadow-xl w-full border border-gray-200"
              style={{ border: `1px solid ${THEME.accentGray}33` }}
            >
              <div className="flex flex-wrap justify-center gap-3">
                {stepsList.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveStep(step.id)}
                          className={clsx(
                            "flex items-center gap-3 w-full sm:w-auto px-4 py-3 rounded-lg font-bold transition-all duration-300 text-sm uppercase tracking-wider",
                            activeStep === step.id
                              ? "bg-black text-white shadow-lg"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          <div
                            className="p-2 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor:
                                activeStep === step.id ? "#FFFFFF33" : "#fff",
                            }}
                          >
                            <div
                              style={{
                                color:
                                  activeStep === step.id ? "#fff" : "#000000",
                              }}
                            >
                              {step.icon}
                            </div>
                          </div>
                          <span className="hidden sm:inline">
                            {step.id}. {step.title.split(" ")[0]}
                          </span>
                          <span className="sm:hidden">{step.id}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{step.title}</TooltipContent>
                    </Tooltip>
                    {index < stepsList.length - 1 && (
                      <ArrowRight className="hidden md:block w-5 h-5 text-gray-400 mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Step Content */}
          {stepsList.map((step) => (
            <div
              key={step.id}
              className={`transition-all duration-500 ${
                activeStep === step.id
                  ? "opacity-100 visible"
                  : "opacity-0 invisible absolute"
              }`}
            >
              {activeStep === step.id && (
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Content */}
                    <div className="p-8 lg:p-12">
                      <div className="flex items-center gap-4 mb-6">
                        <div
                          className="w-16 h-16 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: THEME.primary }}
                        >
                          {step.icon}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-700 uppercase tracking-wider">
                            Step {step.id}
                          </div>
                          <h3 className="text-3xl font-extrabold text-black uppercase">
                            <EditableText
                              isEditMode={isEditMode}
                              text={step.title}
                              onSave={(v) => updateStep(step.id, "title", v)}
                            />
                          </h3>
                        </div>
                      </div>

                      <EditableText
                        isEditMode={isEditMode}
                        text={step.description}
                        onSave={(v) => updateStep(step.id, "description", v)}
                        as="p"
                        multiline
                        className="text-gray-700 text-lg mb-6 leading-relaxed"
                      />

                      <div className="space-y-4 mb-8">
                        <h4 className="font-bold text-black uppercase tracking-wider">
                          Key Details:
                        </h4>
                        {step.details.map((detail, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-black/10">
                              <div className="w-1.5 h-1.5 rounded-full bg-black" />
                            </div>
                            <span className="text-gray-700 font-medium text-sm w-full">
                              <EditableText
                                isEditMode={isEditMode}
                                text={detail}
                                onSave={(v) =>
                                  updateStepDetail(step.id, index, v)
                                }
                              />
                            </span>
                          </div>
                        ))}
                      </div>

                      {step.tips && (
                        <div className="rounded-lg p-6 bg-gray-50 border border-gray-200">
                          <h4 className="font-bold text-black mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <AlertCircle className="w-5 h-5 text-black" />{" "}
                            Expert Tips:
                          </h4>
                          <ul className="space-y-2">
                            {step.tips.map((tip, index) => (
                              <li
                                key={index}
                                className="text-sm flex items-start gap-2 text-gray-700"
                              >
                                <Star className="w-4 h-4 flex-shrink-0 mt-0.5 text-black" />
                                <div className="w-full">
                                  <EditableText
                                    isEditMode={isEditMode}
                                    text={tip}
                                    onSave={(v) =>
                                      updateStepTip(step.id, index, v)
                                    }
                                  />
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Visual */}
                    <div className="relative flex items-center justify-center p-8 bg-gray-100/70">
                      <div className="relative w-full max-w-md">
                        <EditableImage
                          isEditMode={isEditMode}
                          src={step.image}
                          onSave={(url) => updateStep(step.id, "image", url)}
                          alt={step.title}
                          width={400}
                          height={300}
                          containerClassName="w-full h-auto"
                          className="w-full h-auto rounded-lg shadow-2xl grayscale"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
              disabled={activeStep === 1}
              className="flex items-center gap-2 px-6 py-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-black text-black hover:bg-black hover:text-white font-semibold uppercase tracking-wider"
            >
              <ArrowLeft className="w-5 h-5" /> Previous Step
            </button>
            <button
              onClick={() => setActiveStep(Math.min(6, activeStep + 1))}
              disabled={activeStep === 6}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-black hover:bg-gray-800 font-bold uppercase tracking-wider"
            >
              Next Step <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </EditableSection>

      {/* ============== PAYMENT METHODS ============== */}
      <EditableSection
        isEditMode={isEditMode}
        config={paymentBg}
        onSave={setPaymentBg}
        className="px-6 lg:px-12 mb-16"
      >
        <div className="container mx-auto">
          <div className="bg-white rounded-xl p-8 lg:p-12 shadow-lg border border-gray-200">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-black mb-4 uppercase">
                <EditableText
                  isEditMode={isEditMode}
                  text={texts.paymentTitle}
                  onSave={(v) => updateText("paymentTitle", v)}
                />
              </h2>
              <EditableText
                isEditMode={isEditMode}
                text={texts.paymentSubtitle}
                onSave={(v) => updateText("paymentSubtitle", v)}
                as="p"
                multiline
                className="text-gray-700 mx-auto text-lg"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-10">
              <div className="text-center p-6 rounded-lg border border-gray-300 bg-gray-50">
                <div className="text-4xl mb-4 text-black">🏦</div>
                <h3 className="font-bold text-black mb-1 uppercase tracking-wide">
                  Transfer Bank
                </h3>
                <p className="text-xs text-gray-600">BCA, Mandiri, BNI</p>
              </div>
              <div className="text-center p-6 rounded-lg border border-gray-300 bg-gray-50">
                <div className="text-4xl mb-4 text-black">📱</div>
                <h3 className="font-bold text-black mb-1 uppercase tracking-wide">
                  E-Wallet
                </h3>
                <p className="text-xs text-gray-600">GoPay, OVO, DANA</p>
              </div>
              <div className="text-center p-6 rounded-lg border border-gray-300 bg-gray-50">
                <div className="text-4xl mb-4 text-black">💳</div>
                <h3 className="font-bold text-black mb-1 uppercase tracking-wide">
                  Credit Card
                </h3>
                <p className="text-xs text-gray-600">Visa, Mastercard</p>
              </div>
              <div className="text-center p-6 rounded-lg border border-gray-300 bg-gray-50">
                <div className="text-4xl mb-4 text-black">🧾</div>
                <h3 className="font-bold text-black mb-1 uppercase tracking-wide">
                  Virtual Account
                </h3>
                <p className="text-xs text-gray-600">All Major Banks</p>
              </div>
            </div>

            {/* --- PENAMBAHAN KOMPONEN BARU DISINI --- */}
            <PaymentInstructions />
            {/* --------------------------------------- */}

            <div
              className="rounded-lg p-6 text-center border border-black/20 mt-12"
              style={{ backgroundColor: `${THEME.primary}0D` }}
            >
              <div className="flex justify-center mb-4">
                <Shield className="w-8 h-8 text-black" />
              </div>
              <h3 className="font-bold text-black mb-2 uppercase tracking-wider">
                <EditableText
                  isEditMode={isEditMode}
                  text={texts.securityTitle}
                  onSave={(v) => updateText("securityTitle", v)}
                />
              </h3>
              <EditableText
                isEditMode={isEditMode}
                text={texts.securityDesc}
                onSave={(v) => updateText("securityDesc", v)}
                as="p"
                multiline
                className="text-gray-700 text-sm"
              />
            </div>
          </div>
        </div>
      </EditableSection>

      {/* ============== CONTACT ============== */}
      <EditableSection
        isEditMode={isEditMode}
        config={contactBg}
        onSave={setContactBg}
        className="px-6 lg:px-12 mb-16"
      >
        <div className="container mx-auto">
          <div
            className="rounded-xl p-8 lg:p-12 text-white shadow-2xl"
            style={{ background: THEME.primary, color: THEME.secondary }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold mb-4 uppercase">
                <EditableText
                  isEditMode={isEditMode}
                  text={texts.contactTitle}
                  onSave={(v) => updateText("contactTitle", v)}
                />
              </h2>
              <EditableText
                isEditMode={isEditMode}
                text={texts.contactSubtitle}
                onSave={(v) => updateText("contactSubtitle", v)}
                as="p"
                multiline
                className="text-white/80 mx-auto text-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <MessageCircle className="w-8 h-8 mx-auto mb-4" />{" "}
                <h3 className="font-bold uppercase tracking-wider">
                  Live Chat WA
                </h3>{" "}
                <p>0895 6227 17884</p>
              </div>
              <div>
                <Mail className="w-8 h-8 mx-auto mb-4" />{" "}
                <h3 className="font-bold uppercase tracking-wider">
                  Email Support
                </h3>{" "}
                <p>blackboxinc14@gmail.com</p>
              </div>
              <div>
                <HeadphonesIcon className="w-8 h-8 mx-auto mb-4" />{" "}
                <h3 className="font-bold uppercase tracking-wider">
                  Operational Hours
                </h3>{" "}
                <p>24 HOURS EVERYDAY</p>
              </div>
            </div>
          </div>
        </div>
      </EditableSection>

      {/* ============== CTA ============== */}
      <EditableSection
        isEditMode={isEditMode}
        config={ctaBg}
        onSave={setCtaBg}
        className="px-6 lg:px-12 mb-16"
      >
        <div className="container mx-auto">
          <div className="bg-gray-50 rounded-xl p-8 lg:p-12 text-center shadow-lg border border-gray-200">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black mb-4 uppercase">
              <EditableText
                isEditMode={isEditMode}
                text={texts.ctaTitle}
                onSave={(v) => updateText("ctaTitle", v)}
              />
            </h2>
            <EditableText
              isEditMode={isEditMode}
              text={texts.ctaSubtitle}
              onSave={(v) => updateText("ctaSubtitle", v)}
              as="p"
              multiline
              className="text-gray-700 mb-8 mx-auto text-lg"
            />

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <EditableLink
                isEditMode={isEditMode}
                label={texts.ctaBtnPrimary}
                href="/product"
                onSave={(l) => updateText("ctaBtnPrimary", l)}
                icon={ShoppingCart}
                className="text-white px-8 py-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 bg-black hover:bg-gray-800 uppercase tracking-wider shadow-xl"
              />
              <EditableLink
                isEditMode={isEditMode}
                label={texts.ctaBtnSecondary}
                href="#"
                onSave={(l) => updateText("ctaBtnSecondary", l)}
                icon={Play}
                className="px-8 py-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 border border-black text-black hover:bg-black hover:text-white uppercase tracking-wider"
              />
            </div>
          </div>
        </div>
      </EditableSection>

      {/* ============== FAQ ============== */}
      <EditableSection
        isEditMode={isEditMode}
        config={faqBg}
        onSave={setFaqBg}
        className="px-6 lg:px-12 pb-16 pt-8"
      >
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-black mb-4 uppercase">
              <EditableText
                isEditMode={isEditMode}
                text={texts.faqTitle}
                onSave={(v) => updateText("faqTitle", v)}
              />
            </h2>
            <EditableText
              isEditMode={isEditMode}
              text={texts.faqSubtitle}
              onSave={(v) => updateText("faqSubtitle", v)}
              as="p"
              multiline
              className="text-gray-700 mx-auto text-lg"
            />
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqsList.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200"
              >
                <button
                  onClick={() =>
                    setExpandedFAQ(expandedFAQ === index ? null : index)
                  }
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-bold text-black pr-4 uppercase tracking-wider text-sm md:text-base w-full">
                    <EditableText
                      isEditMode={isEditMode}
                      text={faq.question}
                      onSave={(v) => updateFaq(index, "question", v)}
                    />
                  </h3>
                  <div className="flex-shrink-0 text-black">
                    {expandedFAQ === index ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>
                {expandedFAQ === index && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <div className="text-gray-700 leading-relaxed text-sm">
                      <EditableText
                        isEditMode={isEditMode}
                        text={faq.answer}
                        onSave={(v) => updateFaq(index, "answer", v)}
                        multiline
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </EditableSection>

      {/* Indikator Mode Edit */}
      {isEditMode && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm font-bold flex items-center gap-2 animate-bounce pointer-events-none">
          Mode Editor Aktif
        </div>
      )}
    </div>
  );
}