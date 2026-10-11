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

    const { keywords, tone, target, hasPhoto, staffName } = await req.json();

    const prompt = `
あなたは個人経営のサロン（ネイル・エステ・美容院等）のオーナー、または人気インフルエンサー・インスタグラマーのプロフェッショナルなSNSマーケティングマネージャーです。
Instagram、サロンブログ、HPのお知らせ等に投稿する、リピートや予約、ファン獲得につながる魅力的な文章を1本作ってください。

【設定】
・担当者名/サロン名：${staffName || "私"}
・キャラ/文体：${tone || "親しみやすい（丁寧・おしゃれ・共感寄り）"}
・ターゲット：${target || "新規ご予約・リピート促進"}
・写真/画像あり：${hasPhoto ? "はい（写真や施術ビジュアル、コーディネートに触れる一言を自然に入れてください）" : "いいえ"}
・キーワード/今日の出来事・施術内容：${keywords || "特になし（日常のワンシーンやおすすめのケア・アイテム紹介）"}

【作成ルール】
1. キャラ設定（${tone}）を徹底し、読んだお客様やフォロワーが「この人にお願いしたい」「行ってみたい」と思えるような信頼感と親近感を演出してください。
2. 担当者名（サロン名）が指定されている場合は、文中に自然に活かしてください。
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
    console.error("Post generation error:", err);
    return NextResponse.json(
      { error: "文章の生成に失敗しました: " + (err?.message || "通信エラー") },
      { status: 500 }
    );
  }
}