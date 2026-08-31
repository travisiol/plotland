"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import parcelData from "@/data/parcels.json";
import coastlineData from "@/data/coastline.json";

/*
 * The map is the product.
 *
 * It draws the world's coastline and the 999 hex parcels laid over it in
 * one equal-area projection, then colours only the ground that has actually
 * been claimed. It is the artwork, the proof of scarcity and the claim
 * counter at once — which is why it is worth being the only place on the
 * page that gets to use colour.
 *
 * Geometry comes precomputed from scripts/build-parcels.py; nothing here
 * projects or fetches anything at runtime.
 */

export interface Parcel {
  id: number;
  x: number;
  y: number;
  country: string;
  continent: string;
  land: number;
}

export const parcels = parcelData.parcels as Parcel[];
const coastRings = coastlineData.rings as [number, number][][];
const [minX, minY, maxX, maxY] = parcelData.bounds as [
  number,
  number,
  number,
  number,
];
const HEX_RADIUS = parcelData.hexRadius as number;

/** Flat-top hex: vertices every 60° starting at 0°. */
const HEX_ANGLES = [0, 1, 2, 3, 4, 5].map((k) => (Math.PI / 3) * k);

interface Layout {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function WorldMap({
  claimed,
  selectedId,
  onSelect,
  className,
}: {
  claimed: Set<number>;
  selectedId: number | null;
  onSelect: (parcel: Parcel | null) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Spatial hash so pointer hit-testing doesn't walk all 999 parcels.
  const buckets = useMemo(() => {
    const cell = HEX_RADIUS * 2;
    const map = new Map<string, Parcel[]>();
    for (const parcel of parcels) {
      const key = `${Math.floor(parcel.x / cell)}:${Math.floor(parcel.y / cell)}`;
      const list = map.get(key);
      if (list) list.push(parcel);
      else map.set(key, [parcel]);
    }
    return { cell, map };
  }, []);

  const layout = useMemo(() => {
    if (size.width === 0 || size.height === 0) return null;
    const pad = HEX_RADIUS * 1.4;
    const worldW = maxX - minX + pad * 2;
    const worldH = maxY - minY + pad * 2;
    const scale = Math.min(size.width / worldW, size.height / worldH);
    const drawnW = (maxX - minX) * scale;
    const drawnH = (maxY - minY) * scale;
    return {
      scale,
      offsetX: (size.width - drawnW) / 2 - minX * scale,
      // Sits slightly high so the lower margin can carry the title block.
      offsetY: (size.height - drawnH) * 0.42 + maxY * scale,
    };
  }, [size]);

  const project = useCallback(
    (x: number, y: number, l: Layout) => ({
      px: x * l.scale + l.offsetX,
      // Flip: projected north is up, canvas y counts down.
      py: l.offsetY - y * l.scale,
    }),
    [],
  );

  const findParcelAt = useCallback(
    (px: number, py: number, l: Layout): Parcel | null => {
      const wx = (px - l.offsetX) / l.scale;
      const wy = (l.offsetY - py) / l.scale;
      const cx = Math.floor(wx / buckets.cell);
      const cy = Math.floor(wy / buckets.cell);
      let best: Parcel | null = null;
      let bestDist = HEX_RADIUS * HEX_RADIUS;
      for (let ix = cx - 1; ix <= cx + 1; ix += 1) {
        for (let iy = cy - 1; iy <= cy + 1; iy += 1) {
          for (const parcel of buckets.map.get(`${ix}:${iy}`) ?? []) {
            const dx = parcel.x - wx;
            const dy = parcel.y - wy;
            const dist = dx * dx + dy * dy;
            if (dist < bestDist) {
              bestDist = dist;
              best = parcel;
            }
          }
        }
      }
      return best;
    },
    [buckets],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(canvas);
    const rect = canvas.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout || size.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size.width * dpr);
    canvas.height = Math.round(size.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);

    // Land first, as a flat tint. It is the ground the parcels sit on, so
    // it must never compete with them.
    ctx.beginPath();
    for (const ring of coastRings) {
      ring.forEach(([x, y], index) => {
        const { px, py } = project(x, y, layout);
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
    }
    ctx.fillStyle = "rgba(198, 224, 240, 0.06)";
    ctx.fill("evenodd");
    ctx.strokeStyle = "rgba(198, 224, 240, 0.40)";
    ctx.lineWidth = 0.7;
    ctx.stroke();

    const r = HEX_RADIUS * layout.scale;
    const traceHex = (px: number, py: number, radius: number) => {
      ctx.beginPath();
      HEX_ANGLES.forEach((angle, index) => {
        const hx = px + Math.cos(angle) * radius;
        const hy = py + Math.sin(angle) * radius;
        if (index === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      });
      ctx.closePath();
    };

    // Unclaimed parcels: one batched path of hairline outlines.
    ctx.beginPath();
    for (const parcel of parcels) {
      if (claimed.has(parcel.id)) continue;
      const { px, py } = project(parcel.x, parcel.y, layout);
      HEX_ANGLES.forEach((angle, index) => {
        const hx = px + Math.cos(angle) * r * 0.92;
        const hy = py + Math.sin(angle) * r * 0.92;
        if (index === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      });
      ctx.closePath();
    }
    ctx.strokeStyle = "rgba(198, 224, 240, 0.22)";
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Claimed ground — the only colour on the sheet.
    ctx.fillStyle = "#f2c14e";
    for (const parcel of parcels) {
      if (!claimed.has(parcel.id)) continue;
      const { px, py } = project(parcel.x, parcel.y, layout);
      traceHex(px, py, r * 0.92);
      ctx.fill();
    }

    const emphasise = (id: number | null, colour: string, width: number) => {
      if (id === null) return;
      const parcel = parcels.find((p) => p.id === id);
      if (!parcel) return;
      const { px, py } = project(parcel.x, parcel.y, layout);
      traceHex(px, py, r * 0.92);
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.stroke();
    };

    emphasise(hoveredId, "rgba(230, 240, 246, 0.65)", 1.4);
    emphasise(selectedId, "#e6f0f6", 2);
  }, [claimed, hoveredId, selectedId, layout, size, project]);

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!layout) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const parcel = findParcelAt(
      event.clientX - rect.left,
      event.clientY - rect.top,
      layout,
    );
    setHoveredId(parcel?.id ?? null);
  };

  const handleClick = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!layout) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const parcel = findParcelAt(
      event.clientX - rect.left,
      event.clientY - rect.top,
      layout,
    );
    onSelect(parcel);
  };

  const hovered = hoveredId
    ? (parcels.find((p) => p.id === hoveredId) ?? null)
    : null;

  return (
    <div className={clsx("relative sheet-grid", className)}>
      {/*
        Title strip. Every survey drawing carries a title block, and it is
        the honest place to state what this map actually is: which
        projection, which source, how the ground was divided. It runs along
        the bottom margin rather than sitting in a corner because the
        drawing has no spare corner — Antarctica reaches the full width of
        the sheet, and it holds 97 parcels worth not covering up.
      */}
      <dl className="pointer-events-none absolute inset-x-0 bottom-0 hidden flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-rule px-4 py-2 sm:flex">
        {[
          ["Sheet", "01 of 01"],
          ["Projection", "Equal Earth"],
          ["Source", "Natural Earth 110m"],
          ["Grid", `${parcels.length} equal-area hexagons`],
          ["Claimed", `${claimed.size} of ${parcels.length}`],
        ].map(([key, value]) => (
          <div key={key} className="flex items-baseline gap-2">
            <dt className="type-label text-chalk-muted">{key}</dt>
            <dd className="type-data text-chalk-soft">{value}</dd>
          </div>
        ))}
      </dl>

      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`World map of ${parcels.length} parcels, ${claimed.size} claimed`}
        className={clsx(
          "h-full w-full touch-none",
          hovered ? "cursor-pointer" : "cursor-crosshair",
        )}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoveredId(null)}
        onClick={handleClick}
      />

      {hovered && (
        <div className="pointer-events-none absolute left-4 top-4 border border-rule-strong bg-field-deep/90 px-3 py-2">
          <span className="type-label block text-chalk-muted">
            Parcel {String(hovered.id).padStart(3, "0")}
          </span>
          <span className="type-data mt-1 block text-chalk">
            {hovered.country}
          </span>
          <span
            className={`type-label mt-1 block ${
              claimed.has(hovered.id) ? "text-claim" : "text-chalk-muted"
            }`}
          >
            {claimed.has(hovered.id) ? "Claimed" : "Open ground"}
          </span>
        </div>
      )}
    </div>
  );
}
