import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** A field mark: chalk yellow struck on the survey ground. */
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
          background: "#0d2a3e",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 28,
            height: 28,
            borderRadius: 14,
            background: "#f2c14e",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
