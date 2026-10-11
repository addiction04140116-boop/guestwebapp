import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 192, height: 192 };
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
          background: "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)",
          borderRadius: "40px",
        }}
      >
        <div style={{ fontSize: "110px", lineHeight: 1 }}>🌸</div>
      </div>
    ),
    { ...size }
  );
}