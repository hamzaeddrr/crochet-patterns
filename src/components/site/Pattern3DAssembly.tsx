"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import type { PatternComponent } from "@/types";
import {
  buildAssemblyParts3D,
  type AssemblyPart3D,
} from "@/lib/crochet/assembly-3d";
import {
  buildStitchInstances,
  createYarnTexture,
} from "@/lib/crochet/yarn-stitches";
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

function CrochetYarnPart({
  part,
  visible,
  highlight,
}: {
  part: AssemblyPart3D;
  visible: boolean;
  highlight: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const stitches = useMemo(
    () => buildStitchInstances(part.shape, 1),
    [part.shape]
  );
  const yarnMap = useMemo(() => createYarnTexture(part.color), [part.color]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color(part.color);
    stitches.forEach((s, i) => {
      dummy.position.set(...s.position);
      dummy.rotation.set(...s.rotation);
      const sc = s.scale * 1.08;
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const c = color.clone().offsetHSL(0, 0, ((i * 17) % 7) * 0.012 - 0.03);
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [stitches, part.color]);

  useFrame((_, dt) => {
    if (!groupRef.current || !visible || !highlight) return;
    groupRef.current.rotation.y += dt * 0.2;
  });

  if (!visible) return null;

  const coreScale: [number, number, number] =
    part.shape === "egg"
      ? [0.9, 1.15, 0.85]
      : part.shape === "disc"
        ? [1, 0.22, 1]
        : part.shape === "wing"
          ? [0.7, 1.15, 0.35]
          : part.shape === "cone"
            ? [0.55, 0.9, 0.55]
            : part.shape === "capsule"
              ? [0.55, 0.95, 0.55]
              : [0.88, 0.88, 0.88];

  return (
    <group
      ref={groupRef}
      position={part.position}
      rotation={part.rotation}
      scale={part.scale}
    >
      {/* Soft stuffed core */}
      <mesh castShadow scale={coreScale}>
        <sphereGeometry args={[0.42, 40, 40]} />
        <meshStandardMaterial
          map={yarnMap}
          color={part.color}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Crochet stitch loops covering the form */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, stitches.length]}
        castShadow
      >
        <torusGeometry args={[0.048, 0.017, 8, 16]} />
        <meshStandardMaterial
          color={part.color}
          roughness={0.86}
          metalness={0}
          map={yarnMap}
        />
      </instancedMesh>
    </group>
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
      <color attach="background" args={["#f7f1e8"]} />
      <fog attach="fog" args={["#f7f1e8", 7, 14]} />
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[3.5, 6, 2.5]}
        intensity={1.05}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-2.5, 2, -2]} intensity={0.4} color="#fff5e8" />
      <hemisphereLight args={["#fff8f0", "#c4b8a8", 0.35]} />

      <group position={[0, -0.1, 0]}>
        {parts.map((part, i) => {
          const visible = showAll || i < stepIndex;
          const highlight = !showAll && i === stepIndex - 1;
          return (
            <CrochetYarnPart
              key={part.id}
              part={part}
              visible={visible}
              highlight={!!highlight}
            />
          );
        })}
      </group>

      <ContactShadows
        position={[0, -1.32, 0]}
        opacity={0.28}
        scale={9}
        blur={2.6}
        far={3.5}
        color="#6e655e"
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.33, 0]}
        receiveShadow
      >
        <circleGeometry args={[2.8, 64]} />
        <meshStandardMaterial color="#efe7db" roughness={1} />
      </mesh>

      <Environment preset="warehouse" />
      <OrbitControls
        enablePan={false}
        minDistance={2.6}
        maxDistance={7.5}
        maxPolarAngle={Math.PI * 0.49}
        autoRotate={autoRotate && showAll}
        autoRotateSpeed={0.55}
        target={[0, 0.25, 0]}
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

  const totalSteps = parts.length + 1;
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
    }, 1700);
    return () => window.clearInterval(id);
  }, [playing, totalSteps]);

  if (!parts.length) return null;

  const isFinal = step >= totalSteps;
  const currentPart = !isFinal && step > 0 ? parts[step - 1] : null;
  const stepLabel = labels.stepOf
    .replace("{current}", String(Math.min(step, parts.length)))
    .replace("{total}", String(parts.length))
    .replace("{part}", currentPart?.label || "");

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-line bg-[#fffdf9] shadow-[0_16px_40px_rgba(43,37,34,0.06)] sm:rounded-[1.75rem]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
            Crochet preview
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

      <div className="relative aspect-[4/3] bg-[radial-gradient(ellipse_at_50%_28%,rgba(217,107,82,0.08),transparent_50%),#f7f1e8] sm:aspect-[16/10]">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-muted">
              {labels.loading}
            </div>
          }
        >
          <Canvas
            shadows
            camera={{ position: [2.6, 1.45, 3.2], fov: 36 }}
            dpr={[1, 1.6]}
            gl={{ antialias: true, alpha: false }}
          >
            <Scene
              parts={parts}
              stepIndex={step}
              autoRotate={isFinal && !playing}
            />
          </Canvas>
        </Suspense>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2b2522]/20 to-transparent px-4 pb-3 pt-10">
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
