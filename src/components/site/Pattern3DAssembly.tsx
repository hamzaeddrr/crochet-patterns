"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
} from "@react-three/drei";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import type { PatternComponent } from "@/types";
import {
  buildAssemblyParts3D,
  type AssemblyPart3D,
  type PartShape,
} from "@/lib/crochet/assembly-3d";
import { cn } from "@/lib/utils";

export type Pattern3DLabels = {
  title: string;
  subtitle: string;
  stepOf: string;
  finalResult: string;
  play: string;
  pause: string;
  reset: string;
  dragHint: string;
  loading: string;
};

function YarnMesh({
  shape,
  color,
}: {
  shape: PartShape;
  color: string;
}) {
  const mat = (
    <meshStandardMaterial
      color={color}
      roughness={0.72}
      metalness={0.04}
    />
  );

  switch (shape) {
    case "sphere":
      return (
        <mesh castShadow>
          <sphereGeometry args={[0.5, 48, 48]} />
          {mat}
        </mesh>
      );
    case "egg":
      return (
        <mesh castShadow scale={[1, 1.25, 0.95]}>
          <sphereGeometry args={[0.5, 48, 48]} />
          {mat}
        </mesh>
      );
    case "disc":
      return (
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.12, 48]} />
          {mat}
        </mesh>
      );
    case "wing":
      return (
        <mesh castShadow>
          <boxGeometry args={[0.55, 1.1, 0.22]} />
          {mat}
        </mesh>
      );
    case "cone":
      return (
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.35, 0.7, 32]} />
          {mat}
        </mesh>
      );
    case "capsule":
      return (
        <mesh castShadow>
          <capsuleGeometry args={[0.22, 0.45, 8, 16]} />
          {mat}
        </mesh>
      );
    case "torus":
      return (
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.38, 0.1, 16, 48]} />
          {mat}
        </mesh>
      );
    default:
      return (
        <mesh castShadow>
          <sphereGeometry args={[0.45, 32, 32]} />
          {mat}
        </mesh>
      );
  }
}

function AssemblyPart({
  part,
  visible,
  settled,
}: {
  part: AssemblyPart3D;
  visible: boolean;
  settled: boolean;
}) {
  if (!visible) return null;

  const t = settled ? 1 : 0.35;
  const pos: [number, number, number] = settled
    ? part.position
    : [
        part.position[0] * 0.35 + part.enterFrom[0] * 0.65,
        part.position[1] * 0.35 + part.enterFrom[1] * 0.65,
        part.position[2] * 0.35 + part.enterFrom[2] * 0.65,
      ];

  // make > 1: show a subtle twin offset
  const clones = Math.min(part.make, 2);

  return (
    <>
      {Array.from({ length: clones }).map((_, i) => {
        const twin: [number, number, number] =
          i === 0
            ? pos
            : [pos[0] + 0.55, pos[1], pos[2] - 0.15];
        return (
          <group
            key={`${part.id}-${i}`}
            position={twin}
            rotation={part.rotation}
            scale={[
              part.scale[0] * (0.85 + t * 0.15),
              part.scale[1] * (0.85 + t * 0.15),
              part.scale[2] * (0.85 + t * 0.15),
            ]}
          >
            <YarnMesh shape={part.shape} color={part.color} />
          </group>
        );
      })}
    </>
  );
}

function Scene({
  parts,
  stepIndex,
  autoRotate,
}: {
  parts: AssemblyPart3D[];
  stepIndex: number;
  autoRotate: boolean;
}) {
  const finalStep = parts.length;
  const showAll = stepIndex >= finalStep;

  return (
    <>
      <color attach="background" args={["#f3ebe0"]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[4, 8, 3]}
        intensity={1.15}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />

      <group position={[0, -0.15, 0]}>
        {parts.map((part, i) => (
          <AssemblyPart
            key={part.id}
            part={part}
            visible={showAll || i < stepIndex}
            settled={showAll || i < stepIndex}
          />
        ))}
      </group>

      <ContactShadows
        position={[0, -1.35, 0]}
        opacity={0.35}
        scale={10}
        blur={2.4}
        far={4}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.36, 0]} receiveShadow>
        <circleGeometry args={[3.2, 64]} />
        <meshStandardMaterial color="#efe7db" roughness={1} />
      </mesh>

      <Environment preset="apartment" />
      <OrbitControls
        enablePan={false}
        minDistance={2.8}
        maxDistance={8}
        maxPolarAngle={Math.PI * 0.48}
        autoRotate={autoRotate && showAll}
        autoRotateSpeed={0.7}
        target={[0, 0.2, 0]}
      />
    </>
  );
}

export function Pattern3DAssembly({
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
  const parts = useMemo(
    () => buildAssemblyParts3D(components, colors),
    [components, colors]
  );

  const totalSteps = parts.length + 1; // pieces + final
  const [step, setStep] = useState(1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setStep((s) => {
        if (s >= totalSteps) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1600);
    return () => window.clearInterval(id);
  }, [playing, totalSteps]);

  if (!parts.length) return null;

  const isFinal = step >= totalSteps;
  const currentPart = !isFinal && step > 0 ? parts[step - 1] : null;
  const stepLabel = isFinal
    ? labels.finalResult
    : labels.stepOf
        .replace("{current}", String(step))
        .replace("{total}", String(parts.length))
        .replace("{part}", currentPart?.label || "");

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-line bg-[#fffdf9] shadow-[0_16px_40px_rgba(43,37,34,0.06)] sm:rounded-[1.75rem]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
            3D
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink sm:text-3xl">
            {labels.title}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">{labels.subtitle}</p>
        </div>
        <p className="rounded-full bg-elevated px-3 py-1.5 text-xs font-bold capitalize text-ink">
          {objectLabel}
        </p>
      </div>

      <div className="relative aspect-[4/3] bg-[radial-gradient(ellipse_at_50%_30%,rgba(217,107,82,0.1),transparent_55%),#f3ebe0] sm:aspect-[16/10]">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-muted">
              {labels.loading}
            </div>
          }
        >
          <Canvas
            shadows
            camera={{ position: [2.8, 1.6, 3.4], fov: 38 }}
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: false }}
          >
            <Scene
              parts={parts}
              stepIndex={step}
              autoRotate={isFinal && !playing}
            />
          </Canvas>
        </Suspense>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2b2522]/25 to-transparent px-4 pb-3 pt-10">
          <p className="text-center text-[11px] font-semibold text-bone/90">
            {labels.dragHint}
          </p>
        </div>
      </div>

      <div className="border-t border-line px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
              {isFinal ? labels.finalResult : `Step ${step}`}
            </p>
            <p className="mt-1 truncate font-display text-xl text-ink sm:text-2xl">
              {isFinal
                ? labels.finalResult
                : currentPart
                  ? currentPart.label
                  : stepLabel}
            </p>
            {!isFinal && currentPart ? (
              <p className="mt-0.5 text-sm text-muted">{stepLabel}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setStep(1);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg text-ink transition hover:bg-elevated"
              aria-label={labels.reset}
              title={labels.reset}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={step <= 1}
              onClick={() => {
                setPlaying(false);
                setStep((s) => Math.max(1, s - 1));
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg text-ink transition hover:bg-elevated disabled:opacity-35"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-apricot px-4 text-sm font-bold text-bone transition hover:brightness-105"
            >
              {playing ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="h-4 w-4" fill="currentColor" />
              )}
              {playing ? labels.pause : labels.play}
            </button>
            <button
              type="button"
              disabled={step >= totalSteps}
              onClick={() => {
                setPlaying(false);
                setStep((s) => Math.min(totalSteps, s + 1));
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg text-ink transition hover:bg-elevated disabled:opacity-35"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Step chips */}
        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {parts.map((p, i) => {
            const n = i + 1;
            const on = step === n;
            const done = step > n;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setStep(n);
                }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition",
                  on
                    ? "bg-apricot text-bone"
                    : done
                      ? "bg-celadon/20 text-celadon"
                      : "bg-elevated text-muted hover:text-ink"
                )}
              >
                {n}. {p.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setStep(totalSteps);
            }}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition",
              isFinal
                ? "bg-ink text-bone"
                : "bg-elevated text-muted hover:text-ink"
            )}
          >
            {labels.finalResult}
          </button>
        </div>

        {/* Progress */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-apricot transition-[width] duration-500 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
