import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI();

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

    const { keywords, tone, target, hasPhoto, castName } = await req.json();

    const prompt = `
あなたは夜職（キャバクラ、ラウンジ、ガールズバー、風俗等）で働くプロキャストの敏腕SNSマネージャーです。
オフィシャルブログや写メ日記（ポケパラ、姫デコ、駅ちか等）に投稿する、指名や来店につながる魅力的な日記文を1本作ってください。

【設定】
・源氏名：${castName || "私"}
・キャラ/文体：${tone || "あざと可愛い（小悪魔・甘え上手）"}
・ターゲット：${target || "初回・フリー指名狙い"}
・写真あり：${hasPhoto ? "はい（写真に触れる一言を自然に入れてください）" : "いいえ"}
・キーワード/今日の出来事：${keywords || "特になし（日常の可愛い一コマ）"}

【作成ルール】
1. キャラ設定（${tone}）を徹底し、読んだお客さんが「会いたい」「お店に行きたい」と思える適度な甘さと親近感を演出してください。
2. 源氏名が指定されている場合は、自分の名前を文中に自然に活かしてください。
3. タイトル（1行目）と本文をセットで作成してください。
4. 絵文字や改行をバランス良く配置し、スマホで読みやすくしてください。
5. Markdown記法は使わず、そのままコピペできるテキストのみを出力してください。
`;

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

    const text = response.text?.trim() || "";
    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("Diary generation error:", err);
    return NextResponse.json(
      { error: "日記の生成に失敗しました: " + (err?.message || "通信エラー") },
      { status: 500 }
    );
  }
}