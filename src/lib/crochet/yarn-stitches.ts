import * as THREE from "three";
import type { PartShape } from "@/lib/crochet/assembly-3d";

export type StitchInstance = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

/**
 * Place yarn-loop stitches over a soft amigurumi form so it reads as crochet,
 * not plastic CAD.
 */
export function buildStitchInstances(
  shape: PartShape,
  density = 1
): StitchInstance[] {
  const out: StitchInstance[] = [];
  const d = Math.max(0.6, Math.min(1.4, density));

  function pushSpherical(
    rx: number,
    ry: number,
    rz: number,
    rings: number,
    perRingBase: number
  ) {
    for (let r = 0; r < rings; r++) {
      const v = (r + 0.5) / rings; // 0..1 pole to pole
      const phi = v * Math.PI;
      const y = Math.cos(phi) * ry;
      const ringR = Math.sin(phi);
      const count = Math.max(
        6,
        Math.round(perRingBase * d * Math.max(0.35, ringR))
      );
      for (let i = 0; i < count; i++) {
        const u = i / count;
        const theta = u * Math.PI * 2 + r * 0.35;
        const x = Math.cos(theta) * ringR * rx;
        const z = Math.sin(theta) * ringR * rz;
        // Orient stitch tangent to surface
        const nx = x / Math.max(rx, 0.001);
        const ny = y / Math.max(ry, 0.001);
        const nz = z / Math.max(rz, 0.001);
        const n = new THREE.Vector3(nx, ny, nz).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          n
        );
        const e = new THREE.Euler().setFromQuaternion(quat);
        out.push({
          position: [x, y, z],
          rotation: [e.x, e.y, e.z],
          scale: 0.85 + (i % 3) * 0.04,
        });
      }
    }
  }

  switch (shape) {
    case "sphere":
      pushSpherical(0.52, 0.52, 0.52, Math.round(14 * d), 18);
      break;
    case "egg":
      pushSpherical(0.55, 0.72, 0.5, Math.round(16 * d), 20);
      break;
    case "disc": {
      const rings = Math.round(5 * d);
      for (let r = 0; r < rings; r++) {
        const rad = 0.12 + (r / rings) * 0.42;
        const count = Math.max(8, Math.round(10 + r * 6 * d));
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          out.push({
            position: [Math.cos(a) * rad, (r % 2) * 0.02, Math.sin(a) * rad],
            rotation: [Math.PI / 2, 0, a],
            scale: 0.9,
          });
        }
      }
      break;
    }
    case "wing": {
      const rows = Math.round(8 * d);
      const cols = Math.round(5 * d);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const u = (col + 0.5) / cols - 0.5;
          const v = (row + 0.5) / rows - 0.5;
          out.push({
            position: [u * 0.5, v * 1.0, Math.sin(v * Math.PI) * 0.06],
            rotation: [0.2, 0, 0],
            scale: 0.75,
          });
        }
      }
      break;
    }
    case "cone": {
      const rings = Math.round(8 * d);
      for (let r = 0; r < rings; r++) {
        const t = r / (rings - 1 || 1);
        const y = 0.35 - t * 0.7;
        const rad = 0.08 + t * 0.32;
        const count = Math.max(6, Math.round(8 + t * 12 * d));
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          out.push({
            position: [Math.cos(a) * rad, y, Math.sin(a) * rad],
            rotation: [0.4, a, 0],
            scale: 0.7,
          });
        }
      }
      break;
    }
    case "capsule":
      pushSpherical(0.28, 0.48, 0.28, Math.round(10 * d), 12);
      break;
    case "torus": {
      const major = 0.38;
      const minor = 0.1;
      const uCount = Math.round(24 * d);
      const vCount = Math.round(10 * d);
      for (let i = 0; i < uCount; i++) {
        for (let j = 0; j < vCount; j++) {
          const u = (i / uCount) * Math.PI * 2;
          const v = (j / vCount) * Math.PI * 2;
          const x = (major + minor * Math.cos(v)) * Math.cos(u);
          const y = minor * Math.sin(v);
          const z = (major + minor * Math.cos(v)) * Math.sin(u);
          out.push({
            position: [x, y, z],
            rotation: [0, u, v],
            scale: 0.55,
          });
        }
      }
      break;
    }
    default:
      pushSpherical(0.48, 0.48, 0.48, 12, 16);
  }

  return out;
}

/** Soft yarn heather as a data texture (no external assets). */
export function createYarnTexture(hex: string, size = 128): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const base = new THREE.Color(hex);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  // Fibers
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = (Math.random() - 0.5) * 0.22;
    const c = base.clone().offsetHSL(0, 0, shade);
    ctx.strokeStyle = `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},0.55)`;
    ctx.lineWidth = 0.6 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 10, y + 4 + Math.random() * 8);
    ctx.stroke();
  }

  // Crochet-ish grid bumps
  ctx.globalAlpha = 0.12;
  for (let y = 0; y < size; y += 6) {
    for (let x = 0; x < size; x += 6) {
      ctx.beginPath();
      ctx.arc(x + 3, y + 3, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
