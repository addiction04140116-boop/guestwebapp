"use client";

import { useState } from "react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "terms" | "privacy";
}

export default function TermsModal({
  isOpen,
  onClose,
  defaultTab = "terms",
}: TermsModalProps) {
  const [tab, setTab] = useState<"terms" | "privacy">(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
        {/* ヘッダー */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h2 className="text-sm sm:text-base font-bold text-slate-100">
              {tab === "terms" ? "利用規約" : "プライバシーポリシー"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm p-1 transition"
          >
            ✕
          </button>
        </div>

        {/* タブ切り替え */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTab("terms")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === "terms"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            利用規約
          </button>
          <button
            type="button"
            onClick={() => setTab("privacy")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === "privacy"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            プライバシーポリシー
          </button>
        </div>

        {/* 本文エリア */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 overflow-y-auto text-xs text-slate-300 leading-relaxed flex flex-col gap-4">
          {tab === "terms" ? (
            <>
              <div>
                <h3 className="font-bold text-slate-100 mb-1 text-[13px]">第1条（目的・適用）</h3>
                <p>
                  本利用規約は、Casty（以下「当サービス」）の提供条件および当サービスの利用に関する利用者と当サービス運営者との間の権利義務関係を定めるものです。利用者は、本規約に同意した上で当サービスを利用するものとします。
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-100 mb-1 text-[13px]">第2条（AI生成機能の免責）</h3>
                <p>
                  1. 当サービスが提供するAI返信案生成および日記執筆補助機能は、文章作成のサポートを目的としたものです。<br />
                  2. 生成された文章の採否、修正、および外部ツール（LINE、各種SNS、店舗管理画面等）への送信は、利用者の自己責任において行われるものとします。<br />
                  3. 当サービスの利用により生じた、顧客・第三者または所属店舗等とのトラブル、指名・売上の変動、その他の不利益に関して、運営者は一切の法的責任を負いません。
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-100 mb-1 text-[13px]">第3条（自衛カルテ・メモ機能の管理）</h3>
                <p>
                  1. 自衛カルテおよび来店履歴機能に入力される情報は、利用者の個人的な安全管理および接客備忘録のために利用されるものです。<br />
                  2. 個人を過度に特定する情報や誹謗中傷、プライバシー侵害にあたる内容の不用意な記録・外部公開を禁じます。<br />
                  3. アカウント管理不備や端末紛失等に起因する情報流出について、運営者は責任を負いかねます。
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-100 mb-1 text-[13px]">第4条（禁止事項）</h3>
                <p>
                  利用者は、法令または公序良俗に違反する行為、当サービスのサーバーやネットワーク機能を妨害する行為、不正アクセス、第三者へのアカウント譲渡・貸与を行ってはなりません。
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-100 mb-1 text-[13px]">第5条（規約の変更）</h3>
                <p>
                  運営者は、必要と判断した場合には利用者に予告なく本規約を変更できるものとします。変更後に当サービスを利用した場合、利用者は変更後の規約に同意したものとみなします。
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="font-bold text-slate-100 mb-1 text-[13px]">1. 取得する情報</h3>
                <p>
                  当サービスは、アカウント認証に必要なメールアドレス、および利用者が登録したカルテ・メモ・設定情報（源氏名等）を取得・保持します。
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-100 mb-1 text-[13px]">2. データの利用目的</h3>
                <p>
                  取得した情報は、当サービスの提供、本人確認・セッション管理、セキュリティの維持、および利用者のサポート対応のみに利用します。
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-100 mb-1 text-[13px]">3. AIモデル学習に関する取り扱い</h3>
                <p>
                  利用者が当サービス内で入力したメッセージ内容、日記キーワード、カルテ情報は、外部AIモデル（Google Gemini等）の一般学習データとして使用・共有されることはありません。
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-100 mb-1 text-[13px]">4. 写真・画像データの安全保護</h3>
                <p>
                  写真金庫にアップロードされた画像は、プライベートストレージ内で暗号化・保護され、位置情報（EXIFデータ）は自動的に破棄されます。
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-100 mb-1 text-[13px]">5. 第三者提供の制限</h3>
                <p>
                  当サービスは、法令に基づく正当な開示要請がある場合を除き、利用者の同意なく個人情報を第三者に提供することはありません。
                </p>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-bold text-slate-200 transition"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}