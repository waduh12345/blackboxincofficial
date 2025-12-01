// components/sections/MarqueeBanner.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Megaphone } from "lucide-react";

export type MarqueeSize = "sm" | "md" | "lg";

type TrackStyle = React.CSSProperties & Record<"--content-width", string>;

export function MarqueeBanner({
  message,
  speed = 80, // pixels per second
  pauseOnHover = true,
  className = "",
  size = "md",
  cta,
}: {
  message: string | string[];
  speed?: number; // px/s
  pauseOnHover?: boolean;
  className?: string;
  size?: MarqueeSize;
  cta?: { label: string; href?: string; onClick?: () => void };
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState<number>(20); // seconds
  const [hovered, setHovered] = useState(false);
  const [contentWidth, setContentWidth] = useState<number>(0);

  // Normalize message into items
  const items = useMemo(() => {
    if (Array.isArray(message))
      return message.filter(Boolean).map((m) => m.trim());
    const parts = message
      .split(/[•|—,]/g)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts : [message];
  }, [message]);

  // Chip & container sizing
  const sizing = useMemo(() => {
    switch (size) {
      case "sm":
        return {
          containerHeight: "h-10",
          itemGap: "gap-3",
          iconSize: "h-4 w-4",
          textSize: "text-sm",
          chipPad: "px-2.5 py-0.5",
        } as const;
      case "lg":
        return {
          containerHeight: "h-16",
          itemGap: "gap-5",
          iconSize: "h-6 w-6",
          textSize: "text-lg",
          chipPad: "px-4 py-1",
        } as const;
      default:
        return {
          containerHeight: "h-12",
          itemGap: "gap-4",
          iconSize: "h-5 w-5",
          textSize: "text-base",
          chipPad: "px-3 py-0.5",
        } as const;
    }
  }, [size]);

  // Measure content width
  useEffect(() => {
    const recalc = () => {
      const container = containerRef.current;
      const text = textRef.current;
      if (!container || !text) return;

      // Add extra buffer to calculation
      const width = text.scrollWidth;
      setContentWidth(width);

      const pxPerSec = Math.max(24, speed);
      const d = Math.max(6, Math.round(width / pxPerSec));
      setDuration(d);
    };

    recalc();
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    if (textRef.current) ro.observe(textRef.current);

    // Slight delay to ensure fonts loaded
    const timeout = setTimeout(recalc, 100);
    return () => {
      ro.disconnect();
      clearTimeout(timeout);
    };
  }, [items, speed]);

  const trackStyle = useMemo<TrackStyle>(
    () => ({
      "--content-width": `${contentWidth}px`,
      animationDuration: `${duration}s`,
      animationPlayState: pauseOnHover && hovered ? "paused" : "running",
    }),
    [contentWidth, duration, hovered, pauseOnHover]
  );

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => pauseOnHover && setHovered(true)}
      onMouseLeave={() => pauseOnHover && setHovered(false)}
      className={[
        "relative flex items-center overflow-hidden shadow-xl w-full",
        // Background Hitam, Text default Putih (untuk icon/label)
        "bg-black text-white",
        "ring-1 ring-gray-800",
        sizing.containerHeight,
        className,
      ].join(" ")}
      aria-live="polite"
    >
      {/* --- BAGIAN KIRI: FIXED ANNOUNCEMENT LABEL --- */}
      <div
        className={[
          "relative z-20 flex flex-shrink-0 items-center gap-2 px-4 h-full bg-black shadow-[10px_0_20px_-5px_rgba(0,0,0,1)]",
          "border-r border-white/10",
        ].join(" ")}
      >
        {/* Status Pulse - Merah juga biar senada? (Opsional, saat ini putih) */}
        <span className="relative inline-flex h-2 w-2 flex-shrink-0 overflow-hidden rounded-full bg-white/70">
          <span className="absolute inset-0 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-white/50" />
        </span>

        <Megaphone className={`${sizing.iconSize} text-white`} aria-hidden />

        <span className="font-medium tracking-wide uppercase text-sm hidden sm:inline-block">
          Announcement
        </span>
      </div>

      {/* --- BAGIAN TENGAH: MARQUEE TRACK --- */}
      <div className="relative flex-1 h-full overflow-hidden flex items-center">
        {/* Gradient Fade */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-black to-transparent" />

        <div className="relative w-full overflow-hidden">
          <div
            className="track flex whitespace-nowrap will-change-transform"
            style={trackStyle}
            role="marquee"
          >
            {[0, 1].map((key) => (
              <div
                key={key}
                ref={key === 0 ? textRef : null}
                className={`sequence inline-flex items-center ${sizing.itemGap} px-4`}
                style={{ width: "var(--content-width)" }}
              >
                {items.map((it, i) => (
                  <span
                    key={`${key}-${i}`}
                    className={[
                      "chip inline-flex items-center rounded-full backdrop-blur-sm shadow-sm",
                      // --- PERUBAHAN WARNA DISINI ---
                      "border border-red-600", // Border Merah
                      "text-red-500", // Text Merah Terang
                      "bg-red-900/20", // Background Merah Gelap Transparan
                      // ------------------------------
                      sizing.chipPad,
                      sizing.textSize,
                      "font-bold whitespace-nowrap", // Pakai bold agar merahnya lebih jelas
                    ].join(" ")}
                  >
                    {it}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- BAGIAN KANAN: CTA BUTTON --- */}
      {cta && (
        <div className="relative z-20 flex flex-shrink-0 items-center px-4 h-full bg-black shadow-[-10px_0_20px_-5px_rgba(0,0,0,1)]">
          {cta.href ? (
            <a
              href={cta.href}
              onClick={cta.onClick}
              className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-colors uppercase border border-white/10"
            >
              {cta.label}
            </a>
          ) : (
            <button
              onClick={cta.onClick}
              className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-colors uppercase border border-white/10"
            >
              {cta.label}
            </button>
          )}
        </div>
      )}

      {/* Sheen Overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] z-30">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,.2),transparent)] animate-[sheen_7s_linear_infinite]" />
      </div>

      <style jsx>{`
        @keyframes marqueeSlide {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-1 * var(--content-width, 0px)));
          }
        }
        @keyframes sheen {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .track {
          width: calc(var(--content-width, 0px) * 2);
          animation-name: marqueeSlide;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .track {
            animation: none;
            transform: translateX(0);
          }
          .animate-[sheen_7s_linear_infinite] {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}