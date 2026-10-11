import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SalonNote - 個人サロン・インフルエンサー向けスマートカルテ＆SNS管理ツール";
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
          backgroundColor: "#090d16",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #0f172a 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* 背景のエメラルド光彩 */}
        <div
          style={{
            position: "absolute",
            top: "-15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "400px",
            backgroundColor: "#10b981",
            filter: "blur(140px)",
            opacity: 0.2,
            borderRadius: "50%",
          }}
        />

        {/* ロゴバッジ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            padding: "8px 24px",
            borderRadius: "9999px",
            marginBottom: "24px",
          }}
        >
          <span style={{ fontSize: "28px" }}>📋</span>
          <span
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#6ee7b7",
              letterSpacing: "0.05em",
            }}
          >
            プロフェッショナル向けカルテ ＆ SNSツール
          </span>
        </div>

        {/* メインタイトル */}
        <h1
          style={{
            fontSize: "76px",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            margin: "0 0 20px 0",
            background: "linear-gradient(to right, #34d399, #10b981, #6ee7b7)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          SalonNote
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
          顧客カルテ・施術メモ管理 ✕ AI文章生成（DM返信・ダイアリー） ✕ 安心のデータ保護
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
            <span>🔒</span>
            <span>完全プライベート暗号化</span>
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
            <span>✨</span>
            <span>AIでSNS文章を高速作成</span>
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
            <span>📝</span>
            <span>詳細な顧客カルテ管理</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}