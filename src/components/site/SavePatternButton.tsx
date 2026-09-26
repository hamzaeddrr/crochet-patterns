"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { isFavorite, toggleFavorite } from "@/lib/client/pattern-library";
import { cn } from "@/lib/utils";

export function SavePatternButton({
  patternId,
  saveLabel,
  savedLabel,
  className,
}: {
  patternId: string;
  saveLabel: string;
  savedLabel: string;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isFavorite(patternId));
    const sync = () => setSaved(isFavorite(patternId));
    window.addEventListener("loopcraft:library", sync);
    return () => window.removeEventListener("loopcraft:library", sync);
  }, [patternId]);

  return (
    <button
      type="button"
      onClick={() => setSaved(toggleFavorite(patternId))}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-line bg-bg px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-elevated",
        saved && "border-apricot/40 bg-apricot/10 text-apricot",
        className
      )}
      aria-pressed={saved}
    >
      {saved ? (
        <BookmarkCheck className="h-4 w-4" strokeWidth={2.5} />
      ) : (
        <Bookmark className="h-4 w-4" strokeWidth={2.5} />
      )}
      {saved ? savedLabel : saveLabel}
    </button>
  );
}
