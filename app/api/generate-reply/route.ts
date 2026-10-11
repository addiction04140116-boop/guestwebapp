import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI();

// 3秒以内の連打防止
const ipRateLimit = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0] : "anonymous";
    const now = Date.now();

    const lastRequestTime = ipRateLimit.get(clientIp) || 0;
    if (now - lastRequestTime < 3000) {
      return NextResponse.json(
        { error: "少し時間を置いてから再度お試しください（連打防止）。" },
        { status: 429 }
      );
    }
    ipRateLimit.set(clientIp, now);

    const { receivedMsg, customerContext, replyGoal, characterType, castName } =
      await req.json();

    if (!receivedMsg) {
      return NextResponse.json(
        { error: "届いたメッセージが入力されていません" },
        { status: 400 }
      );
    }

    const prompt = `
あなたは夜職（キャバクラ、ガールズバー、ラウンジ、風俗等）で働くプロキャストの敏腕マネージャー・返信代筆AIです。
お客さんから届いたメッセージに対し、キャストのキャラや目的に合わせた最適な【3パターンの返信案】を作成してください。

【キャスト情報】
・源氏名：${castName || "私"}
・キャラ/文体：${characterType || "あざと可愛い（小悪魔・甘え上手）"}

【お客さんの背景・補足】
${customerContext || "特になし"}

【返信の目的・ゴール】
${replyGoal || "無理なプレイ・NG行為をやんわり＆しっかり断る"}

【届いたメッセージ】
「${receivedMsg}」

【作成ルール】
1. キャストのキャラ（${characterType}）を徹底してください。
2. 源氏名（${castName || ""}）がある場合、一人称や文章に自然に活かしてください。
3. セクハラ・下ネタ・無理な要求であっても、客のプライドを無駄に傷つけず、かつ断るべき一線はブレずに可愛く・スマートにかわしてください。
4. LINEや各種DMですぐ使える絵文字・改行にしてください。
5. 必ず以下のJSONフォーマットのみを出力してください（Markdownコードブロックは不要です）。

{
  "options": [
    {
      "label": "王道・おすすめ（自然なトーン）",
      "text": "ここに返信文"
    },
    {
      "label": "少し甘め・あざとく誘導",
      "text": "ここに返信文"
    },
    {
      "label": "短め・キッパリ・角を立てない",
      "text": "ここに返信文"
    }
  ]
}
`;

    // 無料枠の制限が非常に緩い軽量高速モデルを採用
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        safetySettings: [
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any,
            threshold: "BLOCK_NONE" as any,
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH" as any,
            threshold: "BLOCK_NONE" as any,
          },
          {
            category: "HARM_CATEGORY_HARASSMENT" as any,
            threshold: "BLOCK_NONE" as any,
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
            threshold: "BLOCK_NONE" as any,
          },
        ],
      },
    });

    const rawText = response.text?.trim() || "";
    const cleanJson = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleanJson);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        options: [{ label: "返信案（おすすめ）", text: rawText }],
      });
    }
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err?.message || "返信文の生成に失敗しました" },
      { status: 500 }
    );
  }
}