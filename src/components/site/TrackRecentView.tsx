"use client";

import { useEffect } from "react";
import { trackRecentView } from "@/lib/client/pattern-library";

export function TrackRecentView({ patternId }: { patternId: string }) {
  useEffect(() => {
    trackRecentView(patternId);
  }, [patternId]);
  return null;
}
