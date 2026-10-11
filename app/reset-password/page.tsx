"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function getFriendlyResetError(err: any): string {
  const msg = err?.message || String(err || "");
  if (msg.includes("Password should be at least 6 characters")) {
    return "パスワードは6文字以上で入力してください。";
  }
  if (msg.includes("New password should be different")) {
    return "これまでと同じパスワードです。別のパスワードを入力してください。";
  }
  if (msg.includes("Auth session missing") || msg.includes("recovery")) {
    return "認証の有効期限が切れています。もう一度再設定メールを送信してください。";
  }
  return "更新に失敗しました。電波の良いところで再度お試しください。";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setIsReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("パスワードは6文字以上で入力してください。");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage("パスワードを更新しました！Castyへ移動します...");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      setError(getFriendlyResetError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5">
        <div className="text-center">
          <span className="text-3xl mb-2 inline-block">🌙</span>
          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 bg-clip-text text-transparent">
            Casty
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            新しいパスワードを入力して再設定を完了してください
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs p-3.5 rounded-xl leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs p-3.5 rounded-xl leading-relaxed">
            ✨ {message}
          </div>
        )}

        {!isReady && !message && (
          <div className="text-xs text-slate-400 text-center py-4">
            認証情報を確認中...<br />
            （※メール内のリンクから直接開いてください）
          </div>
        )}

        {isReady && !message && (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] text-slate-300 block mb-1">
                新しいパスワード（6文字以上）
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6文字以上のパスワード"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-400 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 font-bold py-3.5 rounded-xl text-xs sm:text-sm text-white shadow-lg active:scale-95 transition disabled:opacity-50"
            >
              {loading ? "更新中..." : "パスワードを再設定してログイン"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}