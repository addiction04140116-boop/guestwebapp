"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // メールリンクのハッシュ(#access_token=...)やセッションを検証
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          setStatus("success");
          // 2秒後にアプリのトップページへ自動遷移
          setTimeout(() => {
            router.push("/");
          }, 2000);
          return;
        }

        // 状態変化をリッスン（認証リンク処理完了を検知）
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (event === "SIGNED_IN" || currentSession) {
              setStatus("success");
              setTimeout(() => {
                router.push("/");
              }, 2000);
            }
          }
        );

        return () => subscription.unsubscribe();
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(
          err?.message || "認証リンクの有効期限が切れているか、すでに使用されています。"
        );
      }
    };

    handleAuth();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-5">
        
        {/* ローディング中 */}
        {status === "loading" && (
          <>
            <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin my-2" />
            <h1 className="text-lg font-bold text-slate-100">
              メールアドレスを認証中...
            </h1>
            <p className="text-xs text-slate-400">
              そのまま少々お待ちください
            </p>
          </>
        )}

        {/* 認証成功 */}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-3xl shadow-lg shadow-rose-500/30 animate-bounce">
              ✨
            </div>
            <div>
              <span className="text-[11px] font-bold text-rose-400 tracking-wider uppercase">Casty</span>
              <h1 className="text-xl font-black bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 bg-clip-text text-transparent mt-1">
                認証が完了しました！
              </h1>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Castyへようこそ🌙<br />
                あなた専用のシークレット相棒へ自動で移動します...
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full mt-2 bg-gradient-to-r from-rose-500 to-pink-600 font-bold py-3.5 rounded-xl text-xs sm:text-sm text-white shadow-lg active:scale-95 transition"
            >
              今すぐアプリを開く
            </button>
          </>
        )}

        {/* エラー時 */}
        {status === "error" && (
          <>
            <span className="text-4xl my-2">⚠️</span>
            <div>
              <h1 className="text-lg font-bold text-rose-400">
                認証に失敗しました
              </h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full mt-2 bg-slate-800 hover:bg-slate-700 font-bold py-3 rounded-xl text-xs text-slate-200 transition"
            >
              ログイン画面へ戻る
            </button>
          </>
        )}
      </div>
    </main>
  );
}