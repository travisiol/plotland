import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** The surveyor's mark: a hexagon with a claimed point set in it. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf6ef",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 28,
            height: 28,
            borderRadius: 14,
            background: "#f0902b",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
