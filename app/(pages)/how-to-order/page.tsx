"use client";

import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
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
  Clock,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import clsx from "clsx";

import DotdLoader from "@/components/loader/3dot";
import { PaymentInstructions } from "@/components/sections/payment-instructions";
import { useGetPublicHowToOrderContentQuery } from "@/services/public-how-to-order-content.service";
import { DEFAULT_HOW_TO_ORDER_CONTENT } from "@/types/admin/how-to-order-content";
import type {
  HowToOrderContent,
  IconKey,
  BgConfig,
} from "@/types/admin/how-to-order-content";

// =========================================
// ICON MAP
// =========================================
const ICON_MAP: Record<IconKey, LucideIcon> = {
  Shield,
  Truck,
  HeadphonesIcon,
  ShoppingCart,
  CreditCard,
  User,
  Package,
  CheckCircle,
  Sparkles,
  MessageCircle,
  Mail,
  Star,
  Ruler,
  Clock,
  Play,
};

const Ico = ({
  name,
  className,
}: {
  name: IconKey;
  className?: string;
}) => {
  const Comp = ICON_MAP[name] || Package;
  return <Comp className={className} />;
};

const bgStyle = (cfg: BgConfig): React.CSSProperties => {
  if (cfg.type === "image" && cfg.image_url) {
    return {
      backgroundImage: `url(${cfg.image_url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }
  if (cfg.type === "gradient" && cfg.color1 && cfg.color2) {
    return {
      background: `linear-gradient(to right, ${cfg.color1}, ${cfg.color2})`,
    };
  }
  return { backgroundColor: cfg.color1 };
};

// =========================================
// EXPORT WRAPPER
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
  const { data, isLoading } = useGetPublicHowToOrderContentQuery();
  const c: HowToOrderContent = useMemo(
    () => ({ ...DEFAULT_HOW_TO_ORDER_CONTENT, ...(data || {}) }),
    [data]
  );

  const [activeStep, setActiveStep] = useState<number>(c.steps[0]?.id ?? 1);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update activeStep saat data baru masuk dan id pertama berbeda
  useEffect(() => {
    if (c.steps.length > 0 && !c.steps.find((s) => s.id === activeStep)) {
      setActiveStep(c.steps[0].id);
    }
  }, [c.steps, activeStep]);

  const THEME = {
    primary: "#000000",
    secondary: "#FFFFFF",
    accentGray: "#1F2937",
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

  if (isLoading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DotdLoader />
      </div>
    );
  }

  const currentStepIndex = c.steps.findIndex((s) => s.id === activeStep);

  return (
    <div className="min-h-screen bg-white">
      {/* ============== HERO ============== */}
      <section
        className="relative pt-24 pb-16 px-6 lg:px-12 overflow-hidden border-b border-gray-100"
        style={bgStyle(c.hero_bg)}
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
            <span className="text-sm font-medium uppercase tracking-wider">
              {c.hero_badge}
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold text-black mb-6 uppercase tracking-tight">
            {c.hero_title_1}
            <span className="block text-gray-700">{c.hero_title_2}</span>
          </h1>

          <p className="text-lg text-gray-700 mx-auto mb-10 font-medium">
            {c.hero_subtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {c.benefits.map((benefit, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-lg p-5 shadow-sm border border-gray-200"
              >
                <div className="flex justify-center mb-3 text-black">
                  <Ico name={benefit.icon} className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-black text-base mb-1 uppercase tracking-wide">
                  {benefit.title}
                </h3>
                <p className="text-xs text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== STEPS ============== */}
      <section
        className="px-6 lg:px-12 mb-16 pt-16"
        style={bgStyle(c.steps_bg)}
      >
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-black mb-4 uppercase">
              {c.steps_header_title}
            </h2>
            <p className="text-gray-700 mx-auto text-lg">
              {c.steps_header_subtitle}
            </p>
          </div>

          {/* Step Navigation */}
          <div className="flex justify-center mb-12">
            <div
              className="bg-white rounded-lg p-3 md:p-6 shadow-xl w-full border border-gray-200"
              style={{ border: `1px solid ${THEME.accentGray}33` }}
            >
              <div className="flex flex-wrap justify-center gap-3">
                {c.steps.map((step, index) => (
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
                            <Ico
                              name={step.icon}
                              className="w-5 h-5"
                            />
                          </div>
                          <span className="hidden sm:inline">
                            {step.id}. {step.title.split(" ")[0]}
                          </span>
                          <span className="sm:hidden">{step.id}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{step.title}</TooltipContent>
                    </Tooltip>
                    {index < c.steps.length - 1 && (
                      <ArrowRight className="hidden md:block w-5 h-5 text-gray-400 mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Step Content */}
          {c.steps.map((step) => (
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
                    <div className="p-8 lg:p-12">
                      <div className="flex items-center gap-4 mb-6">
                        <div
                          className="w-16 h-16 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: THEME.primary }}
                        >
                          <Ico name={step.icon} className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-700 uppercase tracking-wider">
                            Step {step.id}
                          </div>
                          <h3 className="text-3xl font-extrabold text-black uppercase">
                            {step.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                        {step.description}
                      </p>

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
                              {detail}
                            </span>
                          </div>
                        ))}
                      </div>

                      {step.tips && step.tips.length > 0 && (
                        <div className="rounded-lg p-6 bg-gray-50 border border-gray-200">
                          <h4 className="font-bold text-black mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <AlertCircle className="w-5 h-5 text-black" /> Expert
                            Tips:
                          </h4>
                          <ul className="space-y-2">
                            {step.tips.map((tip, index) => (
                              <li
                                key={index}
                                className="text-sm flex items-start gap-2 text-gray-700"
                              >
                                <Star className="w-4 h-4 flex-shrink-0 mt-0.5 text-black" />
                                <div className="w-full">{tip}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="relative flex items-center justify-center p-8 bg-gray-100/70">
                      <div className="relative w-full max-w-md">
                        {step.image_url ? (
                          <Image
                            src={
                              step.image_url.startsWith("http") ||
                              step.image_url.startsWith("/")
                                ? step.image_url
                                : `/${step.image_url}`
                            }
                            alt={step.title}
                            width={400}
                            height={300}
                            className="w-full h-auto rounded-lg shadow-2xl grayscale"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
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
              onClick={() => {
                const prev = c.steps[currentStepIndex - 1];
                if (prev) setActiveStep(prev.id);
              }}
              disabled={currentStepIndex <= 0}
              className="flex items-center gap-2 px-6 py-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-black text-black hover:bg-black hover:text-white font-semibold uppercase tracking-wider"
            >
              <ArrowLeft className="w-5 h-5" /> Previous Step
            </button>
            <button
              onClick={() => {
                const next = c.steps[currentStepIndex + 1];
                if (next) setActiveStep(next.id);
              }}
              disabled={
                currentStepIndex < 0 || currentStepIndex >= c.steps.length - 1
              }
              className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-black hover:bg-gray-800 font-bold uppercase tracking-wider"
            >
              Next Step <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ============== PAYMENT ============== */}
      <section
        className="px-6 lg:px-12 mb-16"
        style={bgStyle(c.payment_bg)}
      >
        <div className="container mx-auto">
          <div className="bg-white rounded-xl p-8 lg:p-12 shadow-lg border border-gray-200">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-black mb-4 uppercase">
                {c.payment_title}
              </h2>
              <p className="text-gray-700 mx-auto text-lg">
                {c.payment_subtitle}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-10">
              {c.payment_methods.map((m, i) => (
                <div
                  key={i}
                  className="text-center p-6 rounded-lg border border-gray-300 bg-gray-50"
                >
                  <div className="text-4xl mb-4 text-black">{m.emoji}</div>
                  <h3 className="font-bold text-black mb-1 uppercase tracking-wide">
                    {m.title}
                  </h3>
                  <p className="text-xs text-gray-600">{m.description}</p>
                </div>
              ))}
            </div>

            <PaymentInstructions />

            <div
              className="rounded-lg p-6 text-center border border-black/20 mt-12"
              style={{ backgroundColor: `${THEME.primary}0D` }}
            >
              <div className="flex justify-center mb-4">
                <Shield className="w-8 h-8 text-black" />
              </div>
              <h3 className="font-bold text-black mb-2 uppercase tracking-wider">
                {c.security_title}
              </h3>
              <p className="text-gray-700 text-sm">{c.security_description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== CONTACT ============== */}
      <section
        className="px-6 lg:px-12 mb-16"
        style={bgStyle(c.contact_bg)}
      >
        <div className="container mx-auto">
          <div
            className="rounded-xl p-8 lg:p-12 text-white shadow-2xl"
            style={{ background: THEME.primary, color: THEME.secondary }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold mb-4 uppercase">
                {c.contact_title}
              </h2>
              <p className="text-white/80 mx-auto text-lg">
                {c.contact_subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {c.contact_items.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-center">
                    <Ico name={item.icon} className="w-8 h-8 mx-auto mb-4" />
                  </div>
                  <h3 className="font-bold uppercase tracking-wider">
                    {item.title}
                  </h3>
                  <p>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== CTA ============== */}
      <section
        className="px-6 lg:px-12 mb-16"
        style={bgStyle(c.cta_bg)}
      >
        <div className="container mx-auto">
          <div className="bg-gray-50 rounded-xl p-8 lg:p-12 text-center shadow-lg border border-gray-200">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black mb-4 uppercase">
              {c.cta_title}
            </h2>
            <p className="text-gray-700 mb-8 mx-auto text-lg">
              {c.cta_subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={c.cta_button_primary_url || "#"}
                className="text-white px-8 py-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 bg-black hover:bg-gray-800 uppercase tracking-wider shadow-xl"
              >
                <ShoppingCart className="w-5 h-5" />
                {c.cta_button_primary_label}
              </Link>
              <Link
                href={c.cta_button_secondary_url || "#"}
                className="px-8 py-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 border border-black text-black hover:bg-black hover:text-white uppercase tracking-wider"
              >
                <Play className="w-5 h-5" />
                {c.cta_button_secondary_label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============== FAQ ============== */}
      <section
        className="px-6 lg:px-12 pb-16 pt-8"
        style={bgStyle(c.faq_bg)}
      >
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-black mb-4 uppercase">
              {c.faq_title}
            </h2>
            <p className="text-gray-700 mx-auto text-lg">{c.faq_subtitle}</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {c.faqs.map((faq, index) => (
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
                    {faq.question}
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
                    <div className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
