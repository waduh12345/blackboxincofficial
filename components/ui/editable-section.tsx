"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { Palette, X, Check, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// --- 1. UPDATE TIPE DATA DISINI (Tambahkan arah diagonal) ---
export type GradientDirection =
  | "to right"
  | "to left"
  | "to bottom"
  | "to top"
  | "to bottom right" // <--- Ini yang menyebabkan error sebelumnya
  | "to bottom left"
  | "to top right"
  | "to top left";

export interface BackgroundConfig {
  type: "solid" | "gradient" | "image";
  color1: string;
  color2?: string;
  direction?: GradientDirection;
  imageUrl?: string;
}

interface EditableSectionProps extends React.HTMLAttributes<HTMLElement> {
  config: BackgroundConfig;
  onSave: (newConfig: BackgroundConfig) => void;
  isEditMode: boolean;
  children: React.ReactNode;
  className?: string;
}

const getBackgroundStyle = (config: BackgroundConfig): React.CSSProperties => {
  if (config.type === "image" && config.imageUrl) {
    return {
      backgroundImage: `url(${config.imageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }
  if (config.type === "gradient" && config.color1 && config.color2) {
    return {
      background: `linear-gradient(${config.direction || "to right"}, ${
        config.color1
      }, ${config.color2})`,
    };
  }
  return { backgroundColor: config.color1 };
};

export const EditableSection = ({
  config,
  onSave,
  isEditMode,
  children,
  className,
  ...props
}: EditableSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<BackgroundConfig>(config);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setTempConfig((prev) => ({
            ...prev,
            imageUrl: reader.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(tempConfig);
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setTempConfig(config);
    setIsModalOpen(false);
  };

  return (
    <section
      className={cn(
        "relative group/section transition-all",
        className,
        isEditMode ? "hover:ring-4 hover:ring-blue-400/50" : ""
      )}
      style={getBackgroundStyle(config)}
      {...props}
    >
      {/* Tombol Edit Background */}
      {isEditMode && (
        <button
          onClick={() => {
            setTempConfig(config);
            setIsModalOpen(true);
          }}
          className="absolute top-24 right-8 z-40 bg-white text-gray-900 px-6 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 opacity-0 group-hover/section:opacity-100 transition-all transform hover:scale-110 border-2 border-blue-500 hover:bg-blue-50"
        >
          <Palette size={20} className="text-blue-600" /> Edit Background
        </button>
      )}

      <div className="relative z-10">{children}</div>

      {config.type === "image" && (
        <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />
      )}

      {/* --- MODAL EDITOR --- */}
      {isEditMode && isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Palette size={18} /> Atur Background
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Tabs Type */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                {(["solid", "gradient", "image"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      setTempConfig((prev) => ({ ...prev, type: t }))
                    }
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all",
                      tempConfig.type === t
                        ? "bg-white shadow text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Input Color Solid */}
              {tempConfig.type === "solid" && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Warna Solid
                  </label>
                  <div className="flex items-center gap-3 border p-2 rounded-lg">
                    <input
                      type="color"
                      value={tempConfig.color1}
                      onChange={(e) =>
                        setTempConfig({ ...tempConfig, color1: e.target.value })
                      }
                      className="h-10 w-10 rounded cursor-pointer border-none p-0"
                    />
                    <span className="font-mono text-gray-600 uppercase">
                      {tempConfig.color1}
                    </span>
                  </div>
                </div>
              )}

              {/* Input Gradient */}
              {tempConfig.type === "gradient" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Start Color
                      </label>
                      <div className="flex items-center gap-2 border p-1 rounded">
                        <input
                          type="color"
                          value={tempConfig.color1}
                          onChange={(e) =>
                            setTempConfig({
                              ...tempConfig,
                              color1: e.target.value,
                            })
                          }
                          className="h-10 w-full rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        End Color
                      </label>
                      <div className="flex items-center gap-2 border p-1 rounded">
                        <input
                          type="color"
                          value={tempConfig.color2 || "#ffffff"}
                          onChange={(e) =>
                            setTempConfig({
                              ...tempConfig,
                              color2: e.target.value,
                            })
                          }
                          className="h-10 w-full rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Direction
                    </label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={tempConfig.direction}
                      onChange={(e) =>
                        setTempConfig({
                          ...tempConfig,
                          direction: e.target.value as GradientDirection,
                        })
                      }
                    >
                      <option value="to right">To Right (→)</option>
                      <option value="to left">To Left (←)</option>
                      <option value="to bottom">To Bottom (↓)</option>
                      <option value="to top">To Top (↑)</option>
                      <option value="to bottom right">
                        Diagonal Bottom Right (↘)
                      </option>
                      <option value="to bottom left">
                        Diagonal Bottom Left (↙)
                      </option>
                      <option value="to top right">
                        Diagonal Top Right (↗)
                      </option>
                      <option value="to top left">Diagonal Top Left (↖)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Input Image */}
              {tempConfig.type === "image" && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all gap-2 text-center"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <Upload className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Klik untuk upload gambar
                    </span>
                  </div>
                  {tempConfig.imageUrl && (
                    <div className="h-32 w-full rounded-lg bg-gray-100 relative overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tempConfig.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
              >
                <Check size={16} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};