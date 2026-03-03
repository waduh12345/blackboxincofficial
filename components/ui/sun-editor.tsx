"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "suneditor/dist/css/suneditor.min.css";

const SunEditorComponent = dynamic(() => import("suneditor-react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-32 border border-gray-300 rounded-md bg-gray-50 animate-pulse" />
  ),
});

interface SunEditorWrapperProps {
  value: string;
  onChange: (content: string) => void;
  height?: string;
  placeholder?: string;
}

export default function SunEditorWrapper({
  value,
  onChange,
  height = "200",
  placeholder = "",
}: SunEditorWrapperProps) {
  const options = useMemo(
    () => ({
      height,
      buttonList: [
        ["undo", "redo"],
        ["bold", "underline", "italic", "strike"],
        ["fontColor", "hiliteColor"],
        ["removeFormat"],
        ["outdent", "indent"],
        ["align", "list"],
        ["link", "image"],
        ["fullScreen", "codeView"],
      ],
      placeholder,
    }),
    [height, placeholder]
  );

  return (
    <SunEditorComponent
      defaultValue={value}
      onChange={onChange}
      setOptions={options}
    />
  );
}
