"use client";

import type { TechniqueKey } from "@/lib/crochet/technique-tutor";
import { cn } from "@/lib/utils";

const INK = "#2b2522";
const APRICOT = "#d96b52";
const YARN = "#c49a5a";
const BONE = "#faf7f2";
const MUTED = "#6e655e";

/** Multi-frame SVG illustrations for beginner technique tutorials. */
export function TechniqueVisual({
  technique,
  frame,
  className,
}: {
  technique: TechniqueKey;
  frame: number;
  className?: string;
}) {
  const f = Math.max(0, frame);
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.15rem] border border-line bg-[linear-gradient(165deg,#fffdf9,#f3ebe0)]",
        className
      )}
    >
      <svg
        viewBox="0 0 280 180"
        className="h-auto w-full"
        role="img"
        aria-hidden
      >
        {technique === "magic_ring" ? (
          <MagicRingFrames frame={f} />
        ) : technique === "inc" ? (
          <IncFrames frame={f} />
        ) : technique === "dec" ? (
          <DecFrames frame={f} />
        ) : technique === "fo" ? (
          <FoFrames frame={f} />
        ) : (
          <ScFrames frame={f} />
        )}
      </svg>
    </div>
  );
}

export function techniqueFrameCount(key: TechniqueKey): number {
  switch (key) {
    case "magic_ring":
      return 4;
    case "inc":
      return 4;
    case "dec":
      return 3;
    case "fo":
      return 3;
    case "sc":
    default:
      return 3;
  }
}

function Hook({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M8 8 C8 2, 20 2, 20 10 L20 52"
        fill="none"
        stroke={INK}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M20 10 C28 4, 34 12, 26 16"
        fill="none"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
}

function MagicRingFrames({ frame }: { frame: number }) {
  if (frame <= 0) {
    return (
      <g>
        <ellipse
          cx="140"
          cy="95"
          rx="48"
          ry="28"
          fill="none"
          stroke={YARN}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M90 95 Q70 70 95 55"
          fill="none"
          stroke={YARN}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    );
  }
  if (frame === 1) {
    return (
      <g>
        <ellipse
          cx="130"
          cy="100"
          rx="42"
          ry="24"
          fill="none"
          stroke={YARN}
          strokeWidth="7"
        />
        <Hook x={150} y={28} />
        <path
          d="M170 55 Q150 90 130 100"
          fill="none"
          stroke={APRICOT}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    );
  }
  if (frame === 2) {
    return (
      <g>
        <ellipse
          cx="130"
          cy="105"
          rx="40"
          ry="22"
          fill="none"
          stroke={YARN}
          strokeWidth="6"
        />
        {/* stitches around ring */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
          const x = 130 + Math.cos(a) * 38;
          const y = 105 + Math.sin(a) * 20;
          return (
            <path
              key={i}
              d={`M${x - 5} ${y - 4} L${x + 5} ${y + 4} M${x + 5} ${y - 4} L${x - 5} ${y + 4}`}
              stroke={APRICOT}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          );
        })}
        <Hook x={168} y={22} />
      </g>
    );
  }
  return (
    <g>
      <circle cx="140" cy="95" r="28" fill={BONE} stroke={YARN} strokeWidth="5" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
        const x = 140 + Math.cos(a) * 22;
        const y = 95 + Math.sin(a) * 22;
        return (
          <path
            key={i}
            d={`M${x - 4} ${y - 4} L${x + 4} ${y + 4} M${x + 4} ${y - 4} L${x - 4} ${y + 4}`}
            stroke={APRICOT}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        );
      })}
      <path
        d="M95 115 Q80 130 70 150"
        fill="none"
        stroke={YARN}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </g>
  );
}

function ScFrames({ frame }: { frame: number }) {
  if (frame <= 0) {
    return (
      <g>
        <path
          d="M70 110 H210"
          stroke={YARN}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="120" cy="110" r="8" fill={BONE} stroke={INK} strokeWidth="2" />
        <Hook x={128} y={40} />
      </g>
    );
  }
  if (frame === 1) {
    return (
      <g>
        <path
          d="M70 110 H210"
          stroke={YARN}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M148 70 Q130 100 120 110"
          fill="none"
          stroke={APRICOT}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Hook x={128} y={36} />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M70 110 H210"
        stroke={YARN}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M120 90 L135 110 M135 90 L120 110"
        stroke={APRICOT}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <Hook x={150} y={34} />
    </g>
  );
}

function IncFrames({ frame }: { frame: number }) {
  if (frame <= 0) {
    return (
      <g>
        <path d="M60 115 H220" stroke={YARN} strokeWidth="11" strokeLinecap="round" />
        <circle cx="140" cy="115" r="10" fill={BONE} stroke={INK} strokeWidth="2.2" />
      </g>
    );
  }
  if (frame === 1) {
    return (
      <g>
        <path d="M60 115 H220" stroke={YARN} strokeWidth="11" strokeLinecap="round" />
        <path
          d="M130 95 L145 115 M145 95 L130 115"
          stroke={APRICOT}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Hook x={150} y={38} />
      </g>
    );
  }
  if (frame === 2) {
    return (
      <g>
        <path d="M60 115 H220" stroke={YARN} strokeWidth="11" strokeLinecap="round" />
        <path
          d="M122 92 L137 115 M137 92 L122 115"
          stroke={APRICOT}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M148 88 L163 115 M163 88 L148 115"
          stroke={APRICOT}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.55"
        />
        <Hook x={160} y={32} />
      </g>
    );
  }
  return (
    <g>
      <path d="M60 115 H220" stroke={YARN} strokeWidth="11" strokeLinecap="round" />
      {/* V shape = increase */}
      <path
        d="M140 125 L118 85 M140 125 L162 85"
        stroke={APRICOT}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function DecFrames({ frame }: { frame: number }) {
  if (frame <= 0) {
    return (
      <g>
        <path d="M55 115 H225" stroke={YARN} strokeWidth="11" strokeLinecap="round" />
        <circle cx="120" cy="115" r="9" fill={BONE} stroke={INK} strokeWidth="2" />
        <circle cx="160" cy="115" r="9" fill={BONE} stroke={INK} strokeWidth="2" />
      </g>
    );
  }
  if (frame === 1) {
    return (
      <g>
        <path d="M55 115 H225" stroke={YARN} strokeWidth="11" strokeLinecap="round" />
        <path
          d="M120 115 Q140 70 160 115"
          fill="none"
          stroke={APRICOT}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Hook x={132} y={28} />
      </g>
    );
  }
  return (
    <g>
      <path d="M55 115 H225" stroke={YARN} strokeWidth="11" strokeLinecap="round" />
      <path
        d="M140 70 L125 110 M140 70 L155 110"
        stroke={APRICOT}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <Hook x={150} y={24} />
    </g>
  );
}

function FoFrames({ frame }: { frame: number }) {
  if (frame <= 0) {
    return (
      <g>
        <Hook x={120} y={40} />
        <circle cx="148" cy="58" r="10" fill="none" stroke={YARN} strokeWidth="5" />
      </g>
    );
  }
  if (frame === 1) {
    return (
      <g>
        <Hook x={118} y={36} />
        <path
          d="M148 55 Q170 80 160 110"
          fill="none"
          stroke={YARN}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M90 70 Q140 50 190 90"
        fill="none"
        stroke={YARN}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M150 95 L165 115 M165 95 L150 115"
        stroke={APRICOT}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
}
