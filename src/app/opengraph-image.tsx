import { ImageResponse } from "next/og";
import { siteConfig, world } from "@/lib/site-config";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#faf6ef",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", fontSize: 22, color: "#6f6a61", letterSpacing: 4 }}>
          {world.totalParcels} EQUAL PARCELS · ETHEREUM
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 128, color: "#16151a", letterSpacing: -4 }}>
            TAKE YOUR GROUND
          </div>
          <div style={{ display: "flex", marginTop: 28, alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", width: 40, height: 40, background: "#f0902b" }} />
            <div style={{ display: "flex", fontSize: 26, color: "#55505c" }}>
              {siteConfig.name}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
