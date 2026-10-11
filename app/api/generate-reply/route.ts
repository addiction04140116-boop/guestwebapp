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

    const { receivedMsg, customerContext, replyGoal, characterType, staffName } =
      await req.json();

    if (!receivedMsg) {
      return NextResponse.json(
        { error: "届いたメッセージが入力されていません" },
        { status: 400 }
      );
    }

    const prompt = `
あなたは個人経営のサロン（ネイル・エステ・美容院等）のオーナーや人気インフルエンサーを支える、プロフェッショナルなSNSマーケティング＆顧客対応マネージャー・返信代筆AIです。
お客様やフォロワーから届いたメッセージに対し、あなたのキャラや目的に合わせた最適な【3パターンの返信案】を作成してください。

【担当者・サロン情報】
・担当者名/サロン名：${staffName || "私"}
・キャラ/文体：${characterType || "親しみやすい（丁寧・おしゃれ・共感寄り）"}

【お客様の背景・補足】
${customerContext || "特になし"}

【返信の目的・ゴール】
${replyGoal || "次回予約やリピートへ自然につなげる、または無理なお願いをやんわり断る"}

【届いたメッセージ】
「${receivedMsg}」

【作成ルール】
1. キャラ設定（${characterType}）を徹底してください。
2. 担当者名（${staffName || ""}）がある場合、一人称や文章に自然に活かしてください。
3. 予約の変更やイレギュラーな要望・価格交渉などであっても、お客様の気分を害さず、かつ自分の軸やサロンのルールはブレずにスマートに対応してください。
4. InstagramのDMや公式LINEですぐ使える、絵文字や改行のバランスが良い文章にしてください。
5. 必ず以下のJSONフォーマットのみを出力してください（Markdownコードブロックは不要です）。

{
  "options": [
    {
      "label": "王道・おすすめ（自然なトーン）",
      "text": "ここに返信文"
    },
    {
      "label": "少し親しみやすさ・ファン化重視",
      "text": "ここに返信文"
    },
    {
      "label": "短め・キッパリ・角を立てない",
      "text": "ここに返信文"
    }
  ]
}
`;

    // 軽量高速モデルを採用
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