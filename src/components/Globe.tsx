"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  HEX_ANGULAR_RADIUS,
  coastVectors,
  graticule,
  parcelCentres,
  parcelCorners,
  parcels,
  type Parcel,
} from "@/lib/parcels";
import { CROWDED_OWNERS } from "@/lib/preview";
import { useWorld } from "@/lib/worldState";

/*
 * The world as a globe.
 *
 * Every point on it — plot centres, plot corners, coastlines, graticule —
 * was turned into a unit vector once at module load, so a frame here is a
 * rotation, a back-hemisphere cull and an orthographic projection, with no
 * trigonometry per point. That is what makes 999 clickable hexes on a
 * spinning sphere cheap enough to run at 60fps.
 *
 * A plot with no market is an outline; one that trades burns gold in
 * proportion to its activity. Gold appears nowhere else, so on a sphere of
 * 999 identical shapes colour reads as one thing only: something is
 * happening here.
 */

export type { Parcel };
export { parcels };

interface Frame {
  cx: number;
  cy: number;
  radius: number;
  cosYaw: number;
  sinYaw: number;
  cosPitch: number;
  sinPitch: number;
}

/*
 * A fixed starfield behind the globe. Positions are seeded so they never
 * flicker between frames, and held in normalised coordinates so a resize
 * rescales them instead of reshuffling the sky.
 */
const STARS = (() => {
  let state = 0x9e3779b9;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: 220 }, () => ({
    x: random(),
    y: random(),
    r: 0.4 + random() * 1.1,
    a: 0.12 + random() * 0.5,
  }));
})();

/** Rotate a unit vector by yaw then pitch. Returns screen x, y and depth. */
function project(
  vx: number,
  vy: number,
  vz: number,
  f: Frame,
): { x: number; y: number; z: number } {
  const x1 = vx * f.cosYaw + vz * f.sinYaw;
  const z1 = -vx * f.sinYaw + vz * f.cosYaw;
  const y2 = vy * f.cosPitch - z1 * f.sinPitch;
  const z2 = vy * f.sinPitch + z1 * f.cosPitch;
  return { x: f.cx + x1 * f.radius, y: f.cy - y2 * f.radius, z: z2 };
}

export function Globe({
  selectedId,
  onSelect,
  className,
  /**
   * Where the sphere sits, as fractions of the canvas. The globe is moved
   * out from under whatever is open rather than dimmed: text over a
   * line-drawn sphere is unreadable, and fading the globe would spoil the
   * one thing on the page worth looking at.
   */
  bias = 0.5,
  biasY = 0.5,
}: {
  selectedId: number | null;
  onSelect: (parcel: Parcel | null) => void;
  className?: string;
  bias?: number;
  biasY?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<Parcel | null>(null);
  const { marketFor, peakActivity, totals } = useWorld();

  // Rotation lives in refs, not state: it changes every frame and must not
  // drag React through a re-render each time.
  const yaw = useRef(-0.35);
  const pitch = useRef(0.32);
  const frameRef = useRef<Frame | null>(null);

  // Hover and selection are read by the draw loop, never depended on by the
  // effect that owns it. Depending on them would tear down the animation
  // frame, the observers and every listener on each pointer move.
  const hoveredRef = useRef<Parcel | null>(null);
  const selectedRef = useRef<number | null>(null);
  useEffect(() => {
    hoveredRef.current = hovered;
    selectedRef.current = selectedId;
  }, [hovered, selectedId, marketFor, peakActivity]);

  const biasRef = useRef(bias);
  const biasYRef = useRef(biasY);
  useEffect(() => {
    biasRef.current = bias;
    biasYRef.current = biasY;
  }, [bias, biasY]);

  const parcelAt = useCallback((px: number, py: number): Parcel | null => {
    const f = frameRef.current;
    if (!f) return null;
    // A plot is hit if the pointer lands inside its cap. Compare in screen
    // space against the cap's projected radius, and ignore the far side.
    const reach = Math.sin(HEX_ANGULAR_RADIUS) * f.radius * 1.15;
    let best: Parcel | null = null;
    let bestDist = reach * reach;
    for (let i = 0; i < parcels.length; i += 1) {
      const p = project(
        parcelCentres[i * 3],
        parcelCentres[i * 3 + 1],
        parcelCentres[i * 3 + 2],
        f,
      );
      if (p.z <= 0) continue;
      const dx = p.x - px;
      const dy = p.y - py;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = parcels[i];
      }
    }
    return best;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let spin = reduceMotion ? 0 : 0.0016;
    let dragging = false;
    let visible = true;
    let running = false;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const strokePolyline = (
      points: Float64Array,
      f: Frame,
      closed: boolean,
    ) => {
      let penDown = false;
      ctx.beginPath();
      const count = points.length / 3;
      for (let i = 0; i <= count; i += 1) {
        const index = (i % count) * 3;
        if (i === count && !closed) break;
        const p = project(points[index], points[index + 1], points[index + 2], f);
        if (p.z <= 0) {
          penDown = false;
          continue;
        }
        if (penDown) ctx.lineTo(p.x, p.y);
        else {
          ctx.moveTo(p.x, p.y);
          penDown = true;
        }
      }
      ctx.stroke();
    };

    const traceHex = (index: number, f: Frame) => {
      ctx.beginPath();
      for (let k = 0; k < 6; k += 1) {
        const base = index * 18 + k * 3;
        const p = project(
          parcelCorners[base],
          parcelCorners[base + 1],
          parcelCorners[base + 2],
          f,
        );
        if (k === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
    };

    const render = () => {
      // Fit the sphere to the smaller side of wherever it has been biased
      // to, so moving it shrinks it instead of clipping it off the canvas.
      const roomX = Math.min(
        width * biasRef.current,
        width * (1 - biasRef.current),
      );
      const roomY = Math.min(
        height * biasYRef.current,
        height * (1 - biasYRef.current),
      );
      const radius = Math.min(roomX * 0.94, roomY * 0.94);
      const f: Frame = {
        cx: width * biasRef.current,
        cy: height * biasYRef.current,
        radius,
        cosYaw: Math.cos(yaw.current),
        sinYaw: Math.sin(yaw.current),
        cosPitch: Math.cos(pitch.current),
        sinPitch: Math.sin(pitch.current),
      };
      frameRef.current = f;

      ctx.clearRect(0, 0, width, height);

      // Sky first. Stars sit behind everything and are the cheapest way to
      // say this is a body in space rather than a circle on a page.
      for (const star of STARS) {
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(198, 224, 240, ${star.a})`;
        ctx.fill();
      }

      // Atmosphere: a halo bleeding outward past the limb. Drawn before the
      // sphere so the disc covers its inner half and only the glow shows.
      const halo = ctx.createRadialGradient(
        f.cx,
        f.cy,
        radius * 0.9,
        f.cx,
        f.cy,
        radius * 1.28,
      );
      halo.addColorStop(0, "rgba(120, 175, 225, 0.30)");
      halo.addColorStop(0.45, "rgba(120, 175, 225, 0.10)");
      halo.addColorStop(1, "rgba(120, 175, 225, 0)");
      ctx.beginPath();
      ctx.arc(f.cx, f.cy, radius * 1.28, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // The ocean, lit from the upper left.
      const ocean = ctx.createRadialGradient(
        f.cx - radius * 0.4,
        f.cy - radius * 0.45,
        radius * 0.05,
        f.cx,
        f.cy,
        radius,
      );
      ocean.addColorStop(0, "#17395c");
      ocean.addColorStop(0.55, "#0e2743");
      ocean.addColorStop(1, "#050d18");
      ctx.beginPath();
      ctx.arc(f.cx, f.cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = ocean;
      ctx.fill();

      // Limb darkening: the edge falls away from the viewer, so it loses
      // light. Without this the sphere reads as a flat disc no matter how
      // the coastlines are drawn.
      const limb = ctx.createRadialGradient(
        f.cx,
        f.cy,
        radius * 0.55,
        f.cx,
        f.cy,
        radius,
      );
      limb.addColorStop(0, "rgba(3, 8, 16, 0)");
      limb.addColorStop(1, "rgba(3, 8, 16, 0.75)");
      ctx.beginPath();
      ctx.arc(f.cx, f.cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = limb;
      ctx.fill();

      ctx.strokeStyle = "rgba(160, 205, 245, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(f.cx, f.cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(140, 185, 230, 0.10)";
      for (const line of graticule) strokePolyline(line, f, false);

      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "rgba(140, 185, 230, 0.42)";
      for (const ring of coastVectors) strokePolyline(ring, f, true);

      /*
       * Plots with no market yet.
       *
       * Batched into three depth bands rather than stroked one by one: 999
       * separate paths a frame is wasteful, and a single flat pass makes
       * the sphere look like a sticker. Three passes is enough for the eye
       * to read curvature.
       *
       * The hexes tile the land exactly, so filling them at a low alpha is
       * also what gives the continents their mass — no separate landmass
       * polygon, which would have to be clipped to the visible hemisphere
       * and would tear at the limb.
       */
      const bands = [
        { min: 0.62, fill: 0.075, stroke: 0.4 },
        { min: 0.28, fill: 0.05, stroke: 0.26 },
        { min: 0.02, fill: 0.028, stroke: 0.14 },
      ];

      for (let b = 0; b < bands.length; b += 1) {
        const band = bands[b];
        const max = b === 0 ? 2 : bands[b - 1].min;
        ctx.beginPath();
        for (let i = 0; i < parcels.length; i += 1) {
          if (marketFor(parcels[i].id).isLive) continue;
          const c = project(
            parcelCentres[i * 3],
            parcelCentres[i * 3 + 1],
            parcelCentres[i * 3 + 2],
            f,
          );
          if (c.z <= band.min || c.z > max) continue;
          for (let k = 0; k < 6; k += 1) {
            const base = i * 18 + k * 3;
            const p = project(
              parcelCorners[base],
              parcelCorners[base + 1],
              parcelCorners[base + 2],
              f,
            );
            if (k === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.closePath();
        }
        ctx.fillStyle = `rgba(150, 195, 235, ${band.fill})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(150, 195, 235, ${band.stroke})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      // How wide one plot is on screen, for sizing its halo.
      const hexPx = Math.sin(HEX_ANGULAR_RADIUS) * f.radius;

      // Live markets, brightness by activity.
      for (let i = 0; i < parcels.length; i += 1) {
        const market = marketFor(parcels[i].id);
        if (!market.isLive) continue;
        const c = project(
          parcelCentres[i * 3],
          parcelCentres[i * 3 + 1],
          parcelCentres[i * 3 + 2],
          f,
        );
        if (c.z <= 0.02) continue;
        const heat = market.activity / peakActivity;
        // Green once a plot has the most owners: at a glance, gold is a
        // market that exists and green is one people are piling into.
        const alpha = (0.35 + heat * 0.65) * Math.min(1, c.z * 2.2);
        const rgb =
          market.owners >= CROWDED_OWNERS ? "53, 201, 138" : "242, 167, 27";

        // A halo first, so an opened plot is findable on a spinning globe
        // before it is close enough to read.
        const spot = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, hexPx * 5);
        spot.addColorStop(0, `rgba(${rgb}, ${0.42 * alpha})`);
        spot.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = spot;
        ctx.fillRect(c.x - hexPx * 5, c.y - hexPx * 5, hexPx * 10, hexPx * 10);

        traceHex(i, f);
        ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${rgb}, ${Math.min(1, alpha + 0.3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const emphasise = (id: number | null, colour: string, lineWidth: number) => {
        if (id === null) return;
        const index = parcels.findIndex((parcel) => parcel.id === id);
        if (index < 0) return;
        const c = project(
          parcelCentres[index * 3],
          parcelCentres[index * 3 + 1],
          parcelCentres[index * 3 + 2],
          f,
        );
        if (c.z <= 0) return;
        traceHex(index, f);
        ctx.strokeStyle = colour;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      };

      emphasise(hoveredRef.current?.id ?? null, "rgba(255, 255, 255, 0.7)", 1.4);
      emphasise(selectedRef.current, "#f2a71b", 2.2);

      yaw.current += spin;
      raf = window.requestAnimationFrame(render);
    };

    const start = () => {
      if (running) return;
      running = true;
      render();
    };
    const stop = () => {
      if (!running) return;
      running = false;
      window.cancelAnimationFrame(raf);
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      spin = 0;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!dragging) {
        setHovered(parcelAt(event.clientX - rect.left, event.clientY - rect.top));
        return;
      }
      yaw.current += (event.clientX - lastX) * 0.006;
      pitch.current = Math.min(
        1.35,
        Math.max(-1.35, pitch.current + (event.clientY - lastY) * 0.006),
      );
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      spin = reduceMotion ? 0 : 0.0016;
      canvas.releasePointerCapture(event.pointerId);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    visibilityObserver.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, [parcelAt, marketFor, peakActivity]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onSelect(parcelAt(event.clientX - rect.left, event.clientY - rect.top));
  };

  return (
    <div className={clsx("relative", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Rotating globe showing ${parcels.length} plots`}
        className="h-full w-full cursor-crosshair touch-none"
        onPointerLeave={() => setHovered(null)}
        onClick={handleClick}
      />

      {hovered && (
        <div className="pointer-events-none absolute left-4 top-4 border border-rule-strong bg-void/95 px-3 py-2">
          <div className="flex items-baseline gap-3">
            <span className="type-label text-gold">
              Plot #{String(hovered.id).padStart(3, "0")}
            </span>
            <span className="type-label text-chalk-muted">
              {hovered.country}
            </span>
          </div>
          <span className="type-data mt-1 block text-chalk-soft">
            {marketFor(hovered.id).isLive
              ? `${marketFor(hovered.id).owners} owners`
              : "Open — no market yet"}
          </span>
        </div>
      )}

      <dl className="pointer-events-none absolute inset-x-0 bottom-0 hidden flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-rule px-4 py-2 sm:flex">
        {[
          ["Grid", `${parcels.length} plots`],
          [
            "Status",
            totals.livePlots === 0
              ? "Every plot open · none taken"
              : `${totals.livePlots} opened · ${totals.totalPlots - totals.livePlots} still open`,
          ],
          ["Controls", "Drag to spin · click a plot"],
        ].map(([key, value]) => (
          <div key={key} className="flex items-baseline gap-2">
            <dt className="type-label text-chalk-muted">{key}</dt>
            <dd className="type-data text-chalk-soft">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
