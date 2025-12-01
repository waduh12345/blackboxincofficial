"use client";

import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import Image, { ImageProps } from "next/image";
import {
  Check,
  X,
  Pencil,
  Upload,
  Link as LinkIcon,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Helper: Upload File ---
export const handleFileUpload = (
  event: ChangeEvent<HTMLInputElement>,
  callback: (url: string) => void
) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onloadend = () => {
    if (typeof reader.result === "string") callback(reader.result);
  };
  reader.readAsDataURL(file);
};

// =========================================
// 1. EditableText (DIPERBAIKI)
// =========================================

// PERUBAHAN 1: Extend HTMLAttributes agar bisa menerima 'style'
interface EditableTextProps extends React.HTMLAttributes<HTMLElement> {
  text: string;
  onSave: (val: string) => void;
  isEditMode: boolean;
  as?: React.ElementType;
  multiline?: boolean;
}

export const EditableText = ({
  text,
  onSave,
  isEditMode,
  as: Component = "div",
  className,
  multiline = false,
  ...props // PERUBAHAN 2: Tangkap sisa props (termasuk style)
}: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(text);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setTempValue(text);
  }, [text]);

  const handleSave = () => {
    onSave(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(text);
    setIsEditing(false);
  };

  if (isEditMode && isEditing) {
    return (
      <div
        className="relative z-20 my-1 font-normal w-full"
        style={props.style}
      >
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className={cn(
              "w-full p-2 border-2 border-blue-500 rounded bg-white text-gray-900 shadow-lg min-h-[100px] resize-y text-base",
              className
            )}
            onKeyDown={(e) => e.key === "Escape" && handleCancel()}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className={cn(
              "w-full p-2 border-2 border-blue-500 rounded bg-white text-gray-900 shadow-lg",
              className
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
          />
        )}
        <div className="flex gap-1 mt-1 absolute right-0 -bottom-10 z-30">
          <button
            onClick={handleSave}
            className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 shadow"
          >
            <Check size={16} />
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Component
      onClick={(e: React.MouseEvent) => {
        if (isEditMode) {
          e.preventDefault(); // Mencegah link berpindah jika tagnya <a>
          setIsEditing(true);
        }
      }}
      className={cn(
        className,
        isEditMode
          ? "cursor-text hover:outline-2 hover:outline-dashed hover:outline-blue-500 hover:bg-blue-50/50 rounded px-1 -mx-1 transition-all relative group"
          : ""
      )}
      {...props} // PERUBAHAN 3: Teruskan props (seperti style) ke komponen asli
    >
      {text}
      {isEditMode && (
        <span className="absolute -top-2 -right-2 hidden group-hover:flex h-5 w-5 bg-blue-500 text-white rounded-full items-center justify-center shadow-sm pointer-events-none z-50">
          <Pencil size={10} />
        </span>
      )}
    </Component>
  );
};

// =========================================
// 2. EditableLink (Button/Link)
// =========================================
interface EditableLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  label: string;
  href: string;
  onSave: (label: string, href: string) => void;
  isEditMode: boolean;
  className?: string;
  icon?: React.ElementType;
}

export const EditableLink = ({
  label,
  href,
  onSave,
  isEditMode,
  className,
  icon: Icon,
  ...props
}: EditableLinkProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLabel, setTempLabel] = useState(label);
  const [tempUrl, setTempUrl] = useState(href);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempLabel(label);
    setTempUrl(href);
  }, [label, href]);

  useEffect(() => {
    if (isEditing && labelInputRef.current) labelInputRef.current.focus();
  }, [isEditing]);

  const handleSave = () => {
    onSave(tempLabel, tempUrl);
    setIsEditing(false);
  };
  const handleCancel = () => {
    setTempLabel(label);
    setTempUrl(href);
    setIsEditing(false);
  };

  if (isEditMode && isEditing) {
    return (
      <div className="flex flex-col gap-2 p-3 border-2 border-blue-500 bg-white rounded-xl shadow-xl z-30 absolute min-w-[250px] font-normal text-left">
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500 font-semibold flex items-center gap-1 mb-0.5">
              <Pencil size={12} /> Label
            </label>
            <input
              ref={labelInputRef}
              value={tempLabel}
              onChange={(e) => setTempLabel(e.target.value)}
              className="w-full p-1.5 border rounded text-sm text-gray-800"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-semibold flex items-center gap-1 mb-0.5">
              <LinkIcon size={12} /> URL
            </label>
            <input
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              className="w-full p-1.5 border rounded text-sm text-gray-600 bg-gray-50 font-mono"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 text-gray-800"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Simpan
          </button>
        </div>
      </div>
    );
  }

  const Content = (
    <>
      {Icon && <Icon className="size-5 shrink-0" />}
      <span className="truncate">{label}</span>
      {isEditMode && (
        <span className="absolute -top-2 -right-2 hidden group-hover:flex h-5 w-5 bg-blue-600 text-white rounded-full items-center justify-center shadow-md z-10 pointer-events-none">
          <Pencil size={10} />
        </span>
      )}
    </>
  );

  if (isEditMode) {
    return (
      <div
        role="button"
        onClick={() => setIsEditing(true)}
        className={cn(
          className,
          "relative group cursor-pointer flex items-center gap-2 hover:outline-2 hover:outline-dashed hover:outline-blue-500"
        )}
        style={props.style}
      >
        {Content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(className, "flex items-center gap-2")}
      {...props}
    >
      {Content}
    </Link>
  );
};

// =========================================
// 3. EditableImage
// =========================================
interface EditableImageProps extends Omit<ImageProps, "src" | "onLoad"> {
  src: string;
  onSave: (newSrc: string) => void;
  isEditMode: boolean;
  containerClassName?: string;
}

export const EditableImage = ({
  src,
  onSave,
  isEditMode,
  containerClassName,
  alt,
  ...imageProps
}: EditableImageProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    if (isEditMode) fileInputRef.current?.click();
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (url) => onSave(url));
  };

  return (
    <div className={cn("relative group block", containerClassName)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />

      {isEditMode && (
        <div
          onClick={handleImageClick}
          className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl cursor-pointer z-10 flex flex-col items-center justify-center text-white backdrop-blur-sm border-2 border-transparent group-hover:border-blue-400 hover:!border-dashed"
        >
          <ImageIcon size={32} className="mb-2 opacity-80" />
          <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
            <Upload size={12} /> Ubah Gambar
          </span>
        </div>
      )}

      <Image
        src={src}
        alt={alt || "Image"}
        {...imageProps}
        className={cn(
          imageProps.className,
          isEditMode ? "group-hover:blur-[2px] transition-all" : ""
        )}
      />
    </div>
  );
};