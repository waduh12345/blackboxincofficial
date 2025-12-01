"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useEditMode() {
  const searchParams = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setIsEditMode(searchParams.get("mode") === "edit");
  }, [searchParams]);

  return isEditMode;
}