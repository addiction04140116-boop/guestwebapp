"use client";

import React, { useEffect, useState } from "react";

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PwaInstallModal({ isOpen, onClose }: PwaInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isAppleDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative text-center">
        {/* アイコンプレビュー */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-lg shadow-emerald-950/40 mb-3">
          📋
        </div>

        <div className="inline-block rounded-full bg-emerald-950/80 border border-emerald-500/30 px-3 py-0.5 text-[11px] font-semibold text-emerald-300 mb-2">
          ✨ スムーズなアクセスに
        </div>

        <h3 className="text-lg font-bold text-white mb-2">
          ホーム画面に追加
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed mb-5">
          スマホのホーム画面に追加すると、アプリのようにワンタップで起動できます。<br />
          毎日の顧客カルテの確認や施術メモの記録がさらに便利になります！
        </p>

        {isIos ? (
          /* iPhone / iPad の場合 */
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 text-left text-xs space-y-3 mb-5">
            <div className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                1
              </span>
              <p className="text-slate-200">
                Safari下部（または上部）の <span className="font-bold text-white inline-flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded">共有ボタン ⎋</span> をタップ
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                2
              </span>
              <p className="text-slate-200">
                少し下にスクロールして <span className="font-bold text-white inline-flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded">「ホーム画面に追加 ＋」</span> をタップ
              </p>
            </div>
          </div>
        ) : (
          /* Android / PC / その他 の場合 */
          <div className="space-y-3 mb-5">
            <button
              onClick={handleInstallClick}
              disabled={!deferredPrompt}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/40 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50"
            >
              {deferredPrompt ? "今すぐアプリを追加する" : "ブラウザのメニューから追加"}
            </button>
            {!deferredPrompt && (
              <p className="text-[11px] text-slate-400">
                ※ブラウザ右上の「︙」メニュー ➔「アプリをインストール」または「ホーム画面に追加」からも登録できます。
              </p>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition font-medium"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}