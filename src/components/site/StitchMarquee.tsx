"use client";

export function StitchMarquee() {
  const items = [
    "single crochet",
    "magic ring",
    "amigurumi",
    "granny square",
    "half double",
    "slip stitch",
    "chain space",
    "fasten off",
  ];
  const row = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-line bg-elevated py-4">
      <div className="anim-marquee flex w-max gap-8 whitespace-nowrap px-4">
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="font-display text-lg text-ink/70"
          >
            <span className="mx-3 text-apricot">✦</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
