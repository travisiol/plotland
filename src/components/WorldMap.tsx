"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  HEX_ANGLES,
  HEX_RADIUS,
  bounds,
  coastRings,
  parcels,
  type Parcel,
} from "@/lib/parcels";
import { marketFor, peakActivity, tokenPrice, usd } from "@/lib/market";

/*
 * The map is the product.
 *
 * Every hexagon is a plot with its own token and its own market. A plot
 * with no market yet is drawn as an empty outline; one that trades burns
 * gold in proportion to its activity, and the busiest carry a halo. Gold
 * is spent nowhere else on the page, so on a map of 999 identical shapes
 * colour reads as one thing only: this is where something is happening.
 */

export type { Parcel };
export { parcels };

const [minX, minY, maxX, maxY] = bounds;

interface Layout {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function WorldMap({
  selectedId,
  onSelect,
  className,
}: {
  selectedId: number | null;
  onSelect: (parcel: Parcel | null) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Spatial hash so pointer hit-testing doesn't walk all 999 plots.
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

  const layout = useMemo<Layout | null>(() => {
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
      // Sits slightly high so the lower margin can carry the readout strip.
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
    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    measure();
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

    // Landmass underneath, flat. It is the ground the markets sit on and
    // must never compete with them.
    ctx.beginPath();
    for (const ring of coastRings) {
      ring.forEach(([x, y], index) => {
        const { px, py } = project(x, y, layout);
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
    }
    ctx.fillStyle = "rgba(140, 185, 230, 0.07)";
    ctx.fill("evenodd");
    ctx.strokeStyle = "rgba(140, 185, 230, 0.30)";
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

    // Plots with no market yet: one batched path of hairlines.
    ctx.beginPath();
    for (const parcel of parcels) {
      if (marketFor(parcel.id).isLive) continue;
      const { px, py } = project(parcel.x, parcel.y, layout);
      HEX_ANGLES.forEach((angle, index) => {
        const hx = px + Math.cos(angle) * r * 0.92;
        const hy = py + Math.sin(angle) * r * 0.92;
        if (index === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      });
      ctx.closePath();
    }
    ctx.strokeStyle = "rgba(140, 185, 230, 0.26)";
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Halo under the busiest plots — drawn first so the hex sits on top.
    for (const parcel of parcels) {
      const market = marketFor(parcel.id);
      if (!market.isLive) continue;
      const heat = market.activity / peakActivity;
      if (heat < 0.55) continue;
      const { px, py } = project(parcel.x, parcel.y, layout);
      const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 4.2);
      glow.addColorStop(0, `rgba(242, 167, 27, ${0.3 * heat})`);
      glow.addColorStop(1, "rgba(242, 167, 27, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(px - r * 4.2, py - r * 4.2, r * 8.4, r * 8.4);
    }

    // Live markets. Brightness carries activity, so the map reads as a
    // heat map of where trading is actually happening.
    for (const parcel of parcels) {
      const market = marketFor(parcel.id);
      if (!market.isLive) continue;
      const heat = market.activity / peakActivity;
      const { px, py } = project(parcel.x, parcel.y, layout);
      traceHex(px, py, r * 0.92);
      ctx.fillStyle = `rgba(242, 167, 27, ${0.22 + heat * 0.78})`;
      ctx.fill();
    }

    const emphasise = (id: number | null, colour: string, width: number) => {
      if (id === null) return;
      const parcel = parcels.find((p) => p.id === id);
      if (!parcel) return;
      const { px, py } = project(parcel.x, parcel.y, layout);
      traceHex(px, py, r * 1.5);
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.stroke();
    };

    emphasise(hoveredId, "rgba(255, 255, 255, 0.55)", 1.2);
    emphasise(selectedId, "#ffffff", 2);
  }, [hoveredId, selectedId, layout, size, project]);

  const pointerParcel = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!layout) return null;
    const rect = event.currentTarget.getBoundingClientRect();
    return findParcelAt(
      event.clientX - rect.left,
      event.clientY - rect.top,
      layout,
    );
  };

  const hovered = hoveredId
    ? (parcels.find((p) => p.id === hoveredId) ?? null)
    : null;
  const hoveredMarket = hovered ? marketFor(hovered.id) : null;

  return (
    <div className={clsx("relative sheet-grid", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`World map of ${parcels.length} plots, each with its own market`}
        className="h-full w-full cursor-crosshair touch-none"
        onPointerMove={(event) => setHoveredId(pointerParcel(event)?.id ?? null)}
        onPointerLeave={() => setHoveredId(null)}
        onClick={(event) => onSelect(pointerParcel(event))}
      />

      {hovered && hoveredMarket && (
        <div className="pointer-events-none absolute left-4 top-4 border border-rule-strong bg-void/95 px-3 py-2">
          <div className="flex items-baseline gap-3">
            <span className="type-label text-gold">
              Plot #{String(hovered.id).padStart(3, "0")}
            </span>
            <span className="type-label text-chalk-muted">
              {hovered.country}
            </span>
          </div>
          {hoveredMarket.isLive ? (
            <dl className="mt-2 grid grid-cols-3 gap-x-5">
              {[
                ["Price", tokenPrice(hoveredMarket.priceUsd)],
                ["Owners", String(hoveredMarket.owners)],
                ["24h vol", usd(hoveredMarket.volume24hUsd)],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt className="type-label text-chalk-muted">{key}</dt>
                  <dd className="type-data text-chalk">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <span className="type-data mt-1 block text-chalk-muted">
              No market open yet
            </span>
          )}
        </div>
      )}

      {/*
        Readout strip along the bottom margin. It runs full width rather
        than sitting in a corner because Antarctica reaches the edge of the
        sheet and holds 97 plots worth not covering up.
      */}
      <dl className="pointer-events-none absolute inset-x-0 bottom-0 hidden flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-rule px-4 py-2 sm:flex">
        {[
          ["Grid", `${parcels.length} plots`],
          ["Projection", "Equal Earth"],
          ["Key", "Gold = open market · brighter = more activity"],
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
