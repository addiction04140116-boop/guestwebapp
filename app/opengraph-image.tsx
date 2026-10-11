import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Casty - キャスト専用シークレット相棒アプリ";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#020617",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #0f172a 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* 背景の光彩 */}
        <div
          style={{
            position: "absolute",
            top: "-15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "400px",
            backgroundColor: "#f43f5e",
            filter: "blur(140px)",
            opacity: 0.25,
            borderRadius: "50%",
          }}
        />

        {/* ロゴバッジ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: "rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.4)",
            padding: "8px 24px",
            borderRadius: "9999px",
            marginBottom: "24px",
          }}
        >
          <span style={{ fontSize: "28px" }}>🌙</span>
          <span
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#fda4af",
              letterSpacing: "0.05em",
            }}
          >
            キャスト専用シークレット相棒アプリ
          </span>
        </div>

        {/* メインタイトル */}
        <h1
          style={{
            fontSize: "76px",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            margin: "0 0 20px 0",
            background: "linear-gradient(to right, #fb7185, #f43f5e, #fda4af)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Casty
        </h1>

        {/* サブコピー */}
        <p
          style={{
            fontSize: "26px",
            color: "#cbd5e1",
            maxWidth: "850px",
            textAlign: "center",
            lineHeight: 1.5,
            margin: "0 0 36px 0",
            fontWeight: 500,
          }}
        >
          客信・LINE返信のAI代筆 ✕ 位置情報消去の写真金庫 ✕ 自衛カルテ
        </p>

        {/* 3大ポイントタグ */}
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "10px 20px",
              fontSize: "18px",
              color: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>🤫</span>
            <span>生理管理アプリに偽装</span>
          </div>

          <div
            style={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "10px 20px",
              fontSize: "18px",
              color: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>💎</span>
            <span>AI写メ日記作成</span>
          </div>

          <div
            style={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "10px 20px",
              fontSize: "18px",
              color: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>🛡️</span>
            <span>地雷・NG顧客を記録</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}