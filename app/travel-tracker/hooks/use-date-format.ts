"use client";

import { useEffect, useState } from "react";

export function useDateFormat(): "dmy" | "mdy" {
  const [format, setFormat] = useState<"dmy" | "mdy">("dmy");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("routebook-date-format") : null;
    setFormat(stored === "mdy" ? "mdy" : "dmy");
  }, []);

  return format;
}
