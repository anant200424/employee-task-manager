"use client";

import { useState } from "react";

interface FlagImageProps {
  iso: string;
  size?: "sm" | "md";
}

// Renders a real flag image (flagcdn.com) instead of an emoji flag.
// Emoji flags render inconsistently on Windows — many browsers/fonts there
// fall back to showing the raw two-letter country code instead of an actual
// flag, which is the "flag not showing" issue. Using an image guarantees the
// flag renders the same way on every OS. If the image ever fails to load, we
// fall back to the country code as a small uppercase badge (never lowercase).
export const FlagImage = ({ iso, size = "sm" }: FlagImageProps) => {
  const [failed, setFailed] = useState(false);
  const code = iso.toLowerCase();
  const dims = size === "sm" ? "h-3.5 w-5" : "h-4 w-6";

  if (failed) {
    return (
      <span className={`flex ${dims} items-center justify-center rounded-[3px] bg-ink-100 text-[9px] font-bold uppercase leading-none text-ink-600`}>
        {iso.toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={`${iso.toUpperCase()} flag`}
      className={`${dims} shrink-0 rounded-[3px] object-cover ring-1 ring-black/5`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};
