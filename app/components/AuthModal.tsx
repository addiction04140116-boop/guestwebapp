"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLoginSuccess?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

export default function AuthModal({
  isOpen = true,
  onClose,
  onLoginSuccess,
  onOpenTerms,
  onOpenPrivacy,
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (isOpen === false) return null;

  // ポートフォリオ閲覧用のお手軽自動入力
  const handleFillDemoAccount = () => {
    setEmail("demo@salon-note.com");
    setPassword("password123");
    setErrorMessage(null);
  };

  const translateError = (errText: string) => {
    if (errText.includes("Invalid login credentials")) {
      return "メールアドレスまたはパスワードが正しくありません。（※Supabase側でデモ用アカウントが登録されていない場合は、新規登録していただくか、SQLでアカウントを作成してください）";
    }
    if (errText.includes("Email not confirmed")) {
      return "メールアドレスの確認が完了していません。";
    }
    if (errText.includes("User already registered")) {
      return "このメールアドレスは既に登録されています。";
    }
    return "処理中にエラーが発生しました。もう一度お試しください。";
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRawError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : "",
        });
        if (error) {
          setRawError(error.message);
          setErrorMessage(translateError(error.message));
        } else {
          setInfoMessage("パスワード再設定用の案内メールを送信しました。");
        }
      } else if (isSignUp) {
        const redirectBase = typeof window !== "undefined" ? window.location.origin : "";
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${redirectBase}/auth/confirm`,
          },
        });
        if (error) {
          setRawError(error.message);
          setErrorMessage(translateError(error.message));
        } else {
          setInfoMessage("確認メールを送信しました。");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setRawError(error.message);
          setErrorMessage(translateError(error.message));
        } else {
          if (onLoginSuccess) onLoginSuccess();
          if (onClose) onClose();
        }
      }
    } catch (err: any) {
      setRawError(err?.message || String(err));
      setErrorMessage("通信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-2 text-2xl border border-emerald-500/20">
            📋
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">SalonNote</h2>
          <p className="text-xs text-slate-400 mt-1">
            {isForgotPassword
              ? "パスワードの再設定"
              : isSignUp
              ? "新規アカウント登録（無料）"
              : "サロンカルテ・SNS管理ツール"}
          </p>
        </div>

        {/* 🌟 採用担当者向けのテスト用アカウント案内ボックス */}
        {!isForgotPassword && !isSignUp && (
          <div className="mb-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs text-slate-300">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <span>💡</span> 採用ご担当者様へ
              </span>
              <button
                type="button"
                onClick={handleFillDemoAccount}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-2 py-1 rounded-lg text-[10px] transition shadow"
              >
                デモ情報を入力する
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ボタンを押すとテスト用アカウントが自動入力されます。そのままログインしてお試しください。
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-xl bg-rose-950/60 border border-rose-800/80 p-3 text-xs text-rose-300 leading-relaxed">
            <p>{errorMessage}</p>
            {rawError && (
              <p className="mt-1.5 text-[10px] text-rose-400/80 font-mono break-all border-t border-rose-900/60 pt-1">
                詳細: {rawError}
              </p>
            )}
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-3 text-xs text-emerald-300 leading-relaxed">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400"
            />
          </div>

          {!isForgotPassword && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  パスワード
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrorMessage(null);
                      setRawError(null);
                      setInfoMessage(null);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    お忘れですか？
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上の英数字"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/40 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50"
          >
            {loading
              ? "処理中..."
              : isForgotPassword
              ? "再設定メールを送信"
              : isSignUp
              ? "無料登録する"
              : "ログイン"}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400">
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setErrorMessage(null);
                setRawError(null);
                setInfoMessage(null);
              }}
              className="text-emerald-400 hover:underline"
            >
              ログイン画面に戻る
            </button>
          ) : isSignUp ? (
            <div>
              すでにアカウントをお持ちの方は{" "}
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMessage(null);
                  setRawError(null);
                  setInfoMessage(null);
                }}
                className="text-emerald-400 font-bold hover:underline"
              >
                ログイン
              </button>
            </div>
          ) : (
            <div>
              はじめての方は{" "}
              <button
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMessage(null);
                  setRawError(null);
                  setInfoMessage(null);
                }}
                className="text-emerald-400 font-bold hover:underline"
              >
                新規登録（無料）
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500">
          ご利用にあたり、
          {onOpenTerms ? (
            <button onClick={onOpenTerms} className="text-emerald-400/80 underline hover:text-emerald-300">
              利用規約
            </button>
          ) : (
            <span>利用規約</span>
          )}
          {" "}および{" "}
          {onOpenPrivacy ? (
            <button onClick={onOpenPrivacy} className="text-emerald-400/80 underline hover:text-emerald-300">
              プライバシーポリシー
            </button>
          ) : (
            <span>プライバシーポリシー</span>
          )}
          {" "}に同意したものとみなされます。
        </div>
      </div>
    </div>
  );
}



