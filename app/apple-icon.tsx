import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
          borderRadius: "38px",
        }}
      >
        <div style={{ fontSize: "100px", lineHeight: 1 }}>📋</div>
      </div>
    ),
    { ...size }
  );
}