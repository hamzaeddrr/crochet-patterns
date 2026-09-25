"use client";

import { useRef } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

export function HomeHero({
  title,
  subtitle,
  cta,
  ctaSecondary,
  cardEyebrow = "Soft makes · Clear rounds",
  cardTitle = "Stitch by stitch",
  cardBody = "Cozy patterns with photos and print-ready PDFs.",
  heroImage,
}: {
  title: string;
  subtitle: string;
  cta: string;
  ctaSecondary: string;
  cardEyebrow?: string;
  cardTitle?: string;
  cardBody?: string;
  heroImage?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--mx", `${x * 14}px`);
    el.style.setProperty("--my", `${y * 10}px`);
  }

  function onLeave() {
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty("--mx", "0px");
    el.style.setProperty("--my", "0px");
  }

  return (
    <section className="hero-cozy relative overflow-hidden pb-10 pt-28 sm:pt-32">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
        viewBox="0 0 1200 700"
        fill="none"
        aria-hidden
      >
        <path
          className="anim-yarn"
          d="M-10 160 C 200 40, 360 280, 560 180 S 880 40, 1220 220"
          stroke="#D96B52"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          className="anim-yarn"
          style={{ animationDelay: "0.35s" }}
          d="M-20 480 C 220 560, 420 380, 640 460 S 980 580, 1220 420"
          stroke="#8FA58B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      <div className="anim-bob pointer-events-none absolute left-[6%] top-36 hidden h-16 w-16 rounded-full bg-apricot/25 blur-[1px] lg:block" />
      <div
        className="anim-bob pointer-events-none absolute right-[8%] top-44 hidden h-12 w-12 rounded-full bg-celadon/35 lg:block"
        style={{ animationDelay: "1.2s" }}
      />
      <div
        className="anim-bob pointer-events-none absolute bottom-24 left-[18%] hidden h-10 w-10 rounded-full bg-gold/30 lg:block"
        style={{ animationDelay: "0.6s" }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-elevated px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-celadon">
            <span className="h-2 w-2 rounded-full bg-apricot" />
            Crochet patterns
          </span>
          <p className="mt-5 font-display text-5xl leading-[1.05] text-ink sm:text-6xl lg:text-7xl">
            Loopcraft
          </p>
          <h1 className="mt-5 max-w-lg font-display text-2xl leading-snug text-ink/85 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted sm:text-lg">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/patterns" className="btn-primary">
              {cta}
              <span aria-hidden>→</span>
            </Link>
            <Link href="/categories" className="btn-ghost">
              {ctaSecondary}
            </Link>
          </div>
        </div>

        <div
          ref={stageRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
          style={{ "--mx": "0px", "--my": "0px" } as React.CSSProperties}
        >
          <div className="absolute -left-4 top-8 h-24 w-24 rounded-full border-[3px] border-dashed border-gold/50 anim-spin-slow" />
          <div className="absolute -right-3 bottom-10 h-20 w-20 rounded-full bg-celadon/25" />

          <div
            className="relative overflow-hidden rounded-[2.5rem] bg-elevated p-3 shadow-[0_20px_50px_rgba(43,37,34,0.1)]"
            style={{
              transform: "translate(var(--mx), var(--my))",
              transition: "transform 0.2s ease-out",
            }}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-bg-deep">
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt=""
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width:1024px) 100vw, 40vw"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(217,107,82,0.5),transparent_48%),radial-gradient(circle_at_78%_78%,rgba(143,165,139,0.45),transparent_45%),radial-gradient(circle_at_50%_50%,rgba(196,154,90,0.2),transparent_55%)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-7 text-bone">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
                  {cardEyebrow}
                </p>
                <p className="mt-2 font-display text-4xl leading-none">
                  {cardTitle}
                </p>
                <p className="mt-3 max-w-[13rem] text-sm text-bone/75">
                  {cardBody}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
