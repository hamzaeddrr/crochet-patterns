"use client";

import nextDynamic from "next/dynamic";
import type { PatternComponent } from "@/types";
import type { Pattern3DLabels } from "@/components/site/Pattern3DAssembly";

const Pattern3DAssembly = nextDynamic(
  () =>
    import("@/components/site/Pattern3DAssembly").then(
      (m) => m.Pattern3DAssembly
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[16/10] items-center justify-center rounded-[1.5rem] border border-line bg-[#f3ebe0] text-sm text-muted">
        Loading 3D studio…
      </div>
    ),
  }
);

export function Pattern3DAssemblyLazy({
  components,
  colors,
  objectLabel,
  labels,
}: {
  components: PatternComponent[];
  colors: string[];
  objectLabel: string;
  labels: Pattern3DLabels;
}) {
  return (
    <Pattern3DAssembly
      components={components}
      colors={colors}
      objectLabel={objectLabel}
      labels={labels}
    />
  );
}
