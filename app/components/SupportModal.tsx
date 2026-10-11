"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import TermsModal from "./TermsModal";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQ_LIST = [
  {
    q: "お客様のカルテや施術メモは他の人に見られませんか？",
    a: "完全に暗号化されており、あなた以外のサロンスタッフや第三者に見られることは一切ありません。安心してお使いいただけます。",
  },
  {
    q: "文章生成やチャットの利用制限はありますか？",
    a: "現在はβ版として完全無料でご利用いただけます。連打による負荷を防ぐため、3秒程度のインターバルを設けています。",
  },
  {
    q: "お客様の本名や個人情報を登録しても大丈夫ですか？",
    a: "データは厳重なセキュリティで保護されていますが、万が一の画面チラ見え対策として、あだ名やイニシャルでのご登録もおすすめです。",
  },
  {
    q: "パスワードを忘れてしまった場合はどうすればいいですか？",
    a: "ログイン画面の「お忘れですか？」からご登録のメールアドレスを入力すると、パスワード再設定用のメールが届きます。",
  },
];

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [tab, setTab] = useState<"faq" | "contact">("faq");
  const [category, setCategory] = useState<"bug" | "feature" | "other">("feature");
  const [content, setContent] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // 規約モーダル用
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">SalonNote サポート＆ヘルプ</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-sm p-1"
            >
              ✕
            </button>
          </div>

          {/* タブ切り替え */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTab("faq")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === "faq"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ❓ よくある質問 (Q&A)
            </button>
            <button
              type="button"
              onClick={() => setTab("contact")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === "contact"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              💌 ご意見・不具合報告
            </button>
          </div>

          {/* Q&A 表示 */}
          {tab === "faq" && (
            <div className="flex flex-col gap-2.5">
              {FAQ_LIST.map((item, index) => {
                const isOpenItem = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpenItem ? null : index)}
                      className="w-full text-left p-3 text-xs font-bold text-slate-200 flex justify-between items-center gap-2"
                    >
                      <span>Q. {item.q}</span>
                      <span className="text-emerald-400 text-sm">{isOpenItem ? "−" : "＋"}</span>
                    </button>
                    {isOpenItem && (
                      <div className="px-3 pb-3 text-[11px] sm:text-xs text-slate-400 leading-relaxed border-t border-slate-900 pt-2 bg-slate-900/40">
                        A. {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 報告・お問い合わせフォーム */}
          {tab === "contact" && (
            <div>
              {sentMessage ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center text-xs text-emerald-300 leading-relaxed animate-fadeIn">
                  ✨ 送信が完了しました！<br />
                  ご意見・ご報告ありがとうございます。今後のサービス改善に役立てます。
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!content.trim()) {
                      alert("内容を入力してください");
                      return;
                    }

                    try {
                      setSending(true);
                      const { data: { user } } = await supabase.auth.getUser();

                      const { error } = await supabase.from("user_feedback").insert({
                        user_id: user?.id,
                        category,
                        content: content.trim(),
                        contact_email: contactEmail.trim() || user?.email || "",
                      });

                      if (error) throw error;

                      setSentMessage(true);
                      setContent("");
                      setTimeout(() => {
                        setSentMessage(false);
                        onClose();
                      }, 2000);
                    } catch (err: any) {
                      alert("送信に失敗しました: " + (err?.message || "通信エラー"));
                    } finally {
                      setSending(false);
                    }
                  }}
                  className="flex flex-col gap-3"
                >
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">カテゴリー</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "feature", label: "💡 機能の要望" },
                        { key: "bug", label: "⚠️ 不具合報告" },
                        { key: "other", label: "💬 その他" },
                      ].map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setCategory(c.key as any)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold border transition ${
                            category === c.key
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-slate-950 text-slate-400 border-slate-800"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      内容・リクエスト詳細 <span className="text-emerald-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="例: カルテに写真添付機能がほしい、予約管理の項目を追加してほしい、など"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      返信希望時の連絡先（任意）
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full mt-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 font-bold py-2.5 rounded-xl text-xs text-white shadow active:scale-95 transition disabled:opacity-50"
                  >
                    {sending ? "送信中..." : "ご意見・報告を送信する"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 規約モーダルを開くボタン */}
          <div className="border-t border-slate-800/80 pt-3 text-center">
            <button
              type="button"
              onClick={() => setIsTermsOpen(true)}
              className="text-[11px] text-slate-400 hover:text-emerald-300 underline transition"
            >
              📜 利用規約・プライバシーポリシーを確認
            </button>
          </div>
        </div>
      </div>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </>
  );
}