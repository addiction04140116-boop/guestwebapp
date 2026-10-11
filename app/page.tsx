"use client";

import { useState, useEffect } from "react";
import AuthModal from "./components/AuthModal";
import VaultTab, { VaultPhoto } from "./components/VaultTab";
import KarteTab from "./components/KarteTab";
import SupportModal from "./components/SupportModal";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isPwaGuideOpen, setIsPwaGuideOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // 担当者名 / サロン名
  const [staffName, setStaffName] = useState("");

  // タブ管理
  const [activeTab, setActiveTab] = useState<"diary" | "vault" | "reply" | "karte">("reply");

  // SNS・ブログ投稿作成
  const [diaryKeywords, setDiaryKeywords] = useState("");
  const [diaryTone, setDiaryTone] = useState("親しみやすい（丁寧・おしゃれ・共感寄り）");
  const [diaryTarget, setDiaryTarget] = useState("新規ご予約・リピート促進");
  const [diaryGenerated, setDiaryGenerated] = useState("");
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<VaultPhoto | null>(null);

  // メッセージ・DM返信代筆
  const [receivedMsg, setReceivedMsg] = useState("");
  const [customerContext, setCustomerContext] = useState("");
  const [characterType, setCharacterType] = useState("親しみやすい（丁寧・おしゃれ・共感寄り）");
  const [replyGoal, setReplyGoal] = useState("次回予約やリピートへ自然につなげる、または無理なお願いをやんわり断る");
  const [replyOptions, setReplyOptions] = useState<{ label: string; text: string }[]>([]);
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("salonnote_staff_name");
      if (savedName) setStaffName(savedName);

      const hash = window.location.hash || "";
      const search = window.location.search || "";
      if (hash.includes("type=recovery") || search.includes("type=recovery")) {
        setIsRecovering(true);
        window.location.replace(`/reset-password${hash || search}`);
        return;
      }
    }

    supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovering(true);
        window.location.replace("/reset-password");
        return;
      }
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleStaffNameChange = (val: string) => {
    setStaffName(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("salonnote_staff_name", val);
    }
  };

  const handleLogout = async () => {
    if (!confirm("ログアウトしますか？")) return;
    try {
      await supabase.auth.signOut();
      setSession(null);
      window.location.reload();
    } catch (err: any) {
      alert("ログアウト処理中にエラーが発生しました: " + err.message);
    }
  };

  const handleDownloadSelectedPhoto = async () => {
    if (!selectedPhoto) return;
    try {
      const res = await fetch(selectedPhoto.url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `salonnote_${selectedPhoto.name || "photo.webp"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      alert("画像のダウンロードに失敗しました");
    }
  };

  const handleGenerateDiary = async () => {
    if (!diaryKeywords && !selectedPhoto) {
      alert("施術内容やキーワードを入力するか、写真をセットしてください");
      return;
    }

    try {
      setDiaryLoading(true);
      const res = await fetch("/api/generate-diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: diaryKeywords,
          tone: diaryTone,
          target: diaryTarget,
          hasPhoto: !!selectedPhoto,
          staffName,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDiaryGenerated(data.text);
    } catch (err: any) {
      alert("文章の生成に失敗しました: " + err.message);
    } finally {
      setDiaryLoading(false);
    }
  };

  const handleGenerateReply = async () => {
    if (!receivedMsg) {
      alert("お客様から届いたメッセージを入力してください");
      return;
    }

    try {
      setReplyLoading(true);
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receivedMsg,
          customerContext,
          replyGoal,
          characterType,
          staffName,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReplyOptions(data.options || []);
    } catch (err: any) {
      alert("返信案の生成に失敗しました: " + err.message);
    } finally {
      setReplyLoading(false);
    }
  };

  if (isRecovering) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-400 text-sm gap-2">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p>パスワード再設定画面へ移動しています...🔑</p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 text-sm">
        セッション確認中...
      </div>
    );
  }

  if (!session) {
    return (
      <AuthModal
        onLoginSuccess={async () => {
          const { data } = await supabase.auth.getSession();
          setSession(data.session);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-xl md:max-w-2xl px-3 sm:px-6 pt-3 flex flex-col gap-4">
        {/* クリーンなサロン風ヘッダー */}
        <header className="flex justify-between items-center py-2 border-b border-slate-900 gap-1">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl sm:text-2xl">✨</span>
            <div>
              <h1 className="text-base sm:text-xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent leading-none">
                SalonNote
              </h1>
              <p className="text-[9px] text-slate-400 hidden sm:block mt-0.5">
                サロン・インフルエンサー向け顧客＆SNS管理
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
   
            <button
              type="button"
              onClick={() => setIsPwaGuideOpen(true)}
              className="text-[10px] sm:text-xs text-emerald-300 hover:text-white transition bg-emerald-500/20 border border-emerald-500/40 px-2 py-1.5 rounded-full font-bold active:scale-95 whitespace-nowrap"
            >
              📲 <span className="inline">アプリ化</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSupportOpen(true)}
              title="ヘルプ＆Q&A"
              className="text-xs sm:text-[11px] text-slate-300 hover:text-emerald-300 transition bg-slate-900 border border-slate-800 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full whitespace-nowrap flex items-center gap-1 active:scale-95"
            >
              <span>❓</span>
              <span className="hidden sm:inline">ヘルプ</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="ログアウト"
              className="text-xs sm:text-[11px] text-slate-400 hover:text-emerald-400 transition bg-slate-900 border border-slate-800 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full whitespace-nowrap flex items-center gap-1 active:scale-95"
            >
              <span>🔒</span>
              <span className="hidden sm:inline">ログアウト</span>
            </button>
          </div>
        </header>

        {/* 担当者名クイックバー */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold whitespace-nowrap">
            <span>🌿</span>
            <span>担当者名 / サロン名:</span>
          </div>
          <input
            type="text"
            value={staffName}
            onChange={(e) => handleStaffNameChange(e.target.value)}
            placeholder="例: Mio / Private Salon"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* 1. SNS・ブログ文章作成タブ */}
        {activeTab === "diary" && (
          <section className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-semibold text-emerald-400">✨ SNS・ブログ文章AI作成</span>
                {!selectedPhoto && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("vault")}
                    className="text-[10px] sm:text-xs text-emerald-300 hover:underline"
                  >
                    📸 ギャラリーから写真を選ぶ
                  </button>
                )}
              </div>

              {selectedPhoto && (
                <div className="relative bg-slate-950 border border-emerald-500/30 rounded-xl p-2.5 flex items-center gap-3">
                  <img
                    src={selectedPhoto.url}
                    alt="選択写真"
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border border-emerald-400/30"
                  />
                  <div className="flex-1 text-[11px] sm:text-xs text-slate-300">
                    <p className="font-medium text-emerald-300">📷 この写真を使用する</p>
                    <p className="text-[10px] text-slate-500">{selectedPhoto.createdAt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadSelectedPhoto}
                    className="text-[10px] sm:text-xs text-emerald-300 hover:text-white px-2.5 py-1.5 bg-slate-900 rounded-lg border border-slate-800 transition"
                  >
                    📥 保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(null)}
                    className="text-[10px] sm:text-xs text-slate-400 hover:text-emerald-400 px-2.5 py-1.5 bg-slate-900 rounded-lg border border-slate-800 transition"
                  >
                    外す
                  </button>
                </div>
              )}

              <div>
                <label className="text-[11px] sm:text-xs text-slate-400 block mb-1">
                  施術内容や今日のワンシーン・おすすめアイテム
                </label>
                <textarea
                  value={diaryKeywords}
                  onChange={(e) => setDiaryKeywords(e.target.value)}
                  placeholder="例: トレンドのニュアンスネイル、アディクシーカラーで透明感アップ、ご予約枠残りわずかです"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-400 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] sm:text-[11px] text-slate-400 block mb-1">
                    トーン・文体
                  </label>
                  <select
                    value={diaryTone}
                    onChange={(e) => setDiaryTone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px] sm:text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
                  >
                    <option>親しみやすい（丁寧・おしゃれ・共感寄り）</option>
                    <option>プロフェッショナル（上品・専門的・信頼感）</option>
                    <option>カジュアル（柔らかい・トレンド感）</option>
                    <option>ナチュラル（シンプル・丁寧な暮らし風）</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] sm:text-[11px] text-slate-400 block mb-1">目的・ターゲット</label>
                  <select
                    value={diaryTarget}
                    onChange={(e) => setDiaryTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px] sm:text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
                  >
                    <option>新規ご予約・リピート促進</option>
                    <option>空き枠のご案内・お知らせ</option>
                    <option>施術こだわり・アイテム紹介</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={diaryLoading}
                onClick={handleGenerateDiary}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 font-bold py-3.5 rounded-xl text-xs sm:text-sm text-white shadow-md active:scale-95 transition disabled:opacity-50 mt-1"
              >
                {diaryLoading ? "AIが文章を作成中..." : "💎 SNS・ブログ文章を生成"}
              </button>
            </div>

            {diaryGenerated && (
              <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm font-bold text-emerald-300">🎉 完成した文章</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(diaryGenerated);
                      alert("文章をコピーしました！");
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow"
                  >
                    📋 本文をコピー
                  </button>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs sm:text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                  {diaryGenerated}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 2. ギャラリータブ */}
        {activeTab === "vault" && (
          <VaultTab
            onSelectPhotoForDiary={(photo: VaultPhoto) => {
              setSelectedPhoto(photo);
              setActiveTab("diary");
            }}
          />
        )}

        {/* 3. DM・チャット返信タブ */}
        {activeTab === "reply" && (
          <section className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
              <span className="text-xs sm:text-sm font-semibold text-emerald-400">💌 DM・顧客メッセージ返信作成</span>

              <div>
                <label className="text-[11px] sm:text-xs text-slate-400 block mb-1">
                  届いたメッセージ（コピペ）
                </label>
                <textarea
                  value={receivedMsg}
                  onChange={(e) => setReceivedMsg(e.target.value)}
                  placeholder="例: 来週の予約を変更したいのですが、空きはありますか？"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-slate-400 block mb-1">
                  お客様の背景・補足（任意）
                </label>
                <input
                  type="text"
                  value={customerContext}
                  onChange={(e) => setCustomerContext(e.target.value)}
                  placeholder="例: いつも来てくださる大切なリピーター様、丁寧に対応したい"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] sm:text-[11px] text-slate-400 block mb-1">
                    トーン・文体
                  </label>
                  <select
                    value={characterType}
                    onChange={(e) => setCharacterType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px] sm:text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
                  >
                    <option>親しみやすい（丁寧・おしゃれ・共感寄り）</option>
                    <option>プロフェッショナル（上品・専門的・信頼感）</option>
                    <option>カジュアル（柔らかい・トレンド感）</option>
                    <option>ナチュラル（シンプル・丁寧な暮らし風）</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] sm:text-[11px] text-slate-400 block mb-1">返信の目的・ゴール</label>
                  <select
                    value={replyGoal}
                    onChange={(e) => setReplyGoal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px] sm:text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
                  >
                    <option>次回予約やリピートへ自然につなげる、または無理なお願いをやんわり断る</option>
                    <option>予約の変更・キャンセル調整をスムーズに行う</option>
                    <option>丁寧にお礼を伝えつつ次のご提案をする</option>
                    <option>短く的確に返信して会話をまとめる</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={replyLoading}
                onClick={handleGenerateReply}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 font-bold py-3.5 rounded-xl text-xs sm:text-sm text-white shadow-md active:scale-95 transition disabled:opacity-50 mt-1"
              >
                {replyLoading ? "返信案を作成中..." : "🎯 返信案を3パターン作成"}
              </button>
            </div>

            {replyOptions.length > 0 && (
              <div className="flex flex-col gap-3">
                {replyOptions.map((opt, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs font-bold text-emerald-400">{opt.label}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(opt.text);
                          alert("返信文をコピーしました！");
                        }}
                        className="bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[10px] sm:text-xs px-2.5 py-1 rounded-lg text-slate-300 transition"
                      >
                        📋 コピー
                      </button>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {opt.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 4. カルテタブ */}
        {activeTab === "karte" && <KarteTab />}
      </div>

      {/* サポート＆Q&Aモーダル */}
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      

      {/* 📲 PWA（ホーム画面追加）案内モーダル */}
      {isPwaGuideOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="font-bold text-sm text-slate-100">ホーム画面に追加</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPwaGuideOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0 border border-emerald-300/40">
                📋
              </div>
              <div className="text-xs">
                <span className="text-[10px] text-emerald-400 font-bold block mb-0.5">🚀 アプリのように快適に</span>
                <strong className="text-slate-100 text-sm">SalonNote</strong>
                <p className="text-[10px] text-slate-400 mt-0.5">ワンタップで素早く起動できます</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 flex flex-col gap-2.5 leading-relaxed">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                <span className="font-bold text-emerald-300 text-[11px]">📱 iPhone（Safari）</span>
                <p className="text-[11px] text-slate-400">
                  1. 画面下の <strong>「共有（四角に↑）」</strong> を押す<br />
                  2. 少し下にスクロールして <strong>「ホーム画面に追加」</strong> を押す<br />
                  3. 右上の <strong>「追加」</strong> を押せば完了！
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                <span className="font-bold text-emerald-300 text-[11px]">🤖 Android（Chrome）</span>
                <p className="text-[11px] text-slate-400">
                  1. 右上の <strong>「︙（メニュー）」</strong> を押す<br />
                  2. <strong>「アプリをインストール」</strong> または <strong>「ホーム画面に追加」</strong> を押す
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPwaGuideOpen(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-bold text-slate-200 transition"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 下部ナビゲーションバー */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] px-4 sm:px-8 flex justify-around items-center z-50 max-w-xl md:max-w-2xl mx-auto shadow-2xl">
        <button
          onClick={() => setActiveTab("diary")}
          className={`flex flex-col items-center gap-1 text-[10px] sm:text-xs py-1 transition ${
            activeTab === "diary" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-lg sm:text-xl">✨</span>
          <span>SNS投稿</span>
        </button>

        <button
          onClick={() => setActiveTab("vault")}
          className={`flex flex-col items-center gap-1 text-[10px] sm:text-xs py-1 transition ${
            activeTab === "vault" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-lg sm:text-xl">📸</span>
          <span>ギャラリー</span>
        </button>

        <button
          onClick={() => setActiveTab("reply")}
          className={`flex flex-col items-center gap-1 text-[10px] sm:text-xs py-1 transition ${
            activeTab === "reply" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-lg sm:text-xl">💬</span>
          <span>DM返信</span>
        </button>

        <button
          onClick={() => setActiveTab("karte")}
          className={`flex flex-col items-center gap-1 text-[10px] sm:text-xs py-1 transition ${
            activeTab === "karte" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-lg sm:text-xl">📋</span>
          <span>顧客カルテ</span>
        </button>
      </nav>
    </main>
  );
}

