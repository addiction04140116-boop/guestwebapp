"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface VisitRecord {
  id: string;
  date: string;
  course: string;
  amount: string;
  memo: string;
}

export interface KarteItem {
  id: string;
  customer_name: string;
  danger_level: "safe" | "caution" | "danger"; // カスハラ・トラブル警戒度
  ng_actions: string; // カスハラ・迷惑行為・禁止事項
  allergy_info: string; // アレルギーや肌・髪・体質の注意点
  preferences: string; // 好み・会話の話題・デザインのこだわり
  memo: string; // 総合メモ
  visit_history?: VisitRecord[];
  created_at: string;
}

export default function KarteTab() {
  const [kartes, setKartes] = useState<KarteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<"all" | "safe" | "caution" | "danger">("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 新規・編集モーダル
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formLevel, setFormLevel] = useState<"safe" | "caution" | "danger">("safe");
  const [formNg, setFormNg] = useState("");
  const [formAllergy, setFormAllergy] = useState("");
  const [formPreferences, setFormPreferences] = useState("");
  const [formMemo, setFormMemo] = useState("");

  // 来店履歴モーダル
  const [activeKarteForVisit, setActiveKarteForVisit] = useState<KarteItem | null>(null);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [visitCourse, setVisitCourse] = useState("通常メニュー");
  const [visitAmount, setVisitAmount] = useState("");
  const [visitMemo, setVisitMemo] = useState("");

  const loadKartes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customer_kartes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setKartes(data || []);
    } catch (err: any) {
      console.error("カルテ取得エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKartes();
  }, []);

  const openNewModal = () => {
    setEditId(null);
    setFormName("");
    setFormLevel("safe");
    setFormNg("");
    setFormAllergy("");
    setFormPreferences("");
    setFormMemo("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: KarteItem) => {
    setEditId(item.id);
    setFormName(item.customer_name);
    setFormLevel(item.danger_level);
    setFormNg(item.ng_actions || "");
    setFormAllergy(item.allergy_info || "");
    setFormPreferences(item.preferences || "");
    setFormMemo(item.memo || "");
    setIsModalOpen(true);
  };

  const handleSaveKarte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("お客様のお名前を入力してください");
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("ログインセッションが切れています");
        return;
      }

      if (editId) {
        const { error } = await supabase
          .from("customer_kartes")
          .update({
            customer_name: formName,
            danger_level: formLevel,
            ng_actions: formNg,
            allergy_info: formAllergy,
            preferences: formPreferences,
            memo: formMemo,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("customer_kartes").insert({
          user_id: user.id,
          customer_name: formName,
          danger_level: formLevel,
          ng_actions: formNg,
          allergy_info: formAllergy,
          preferences: formPreferences,
          memo: formMemo,
          visit_history: [],
        });

        if (error) throw error;
      }

      setIsModalOpen(false);
      await loadKartes();
    } catch (err: any) {
      alert("保存に失敗しました: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKarte = async (id: string, name: string) => {
    if (!confirm(`「${name}様」のカルテを削除しますか？`)) return;
    try {
      const { error } = await supabase.from("customer_kartes").delete().eq("id", id);
      if (error) throw error;
      setKartes((prev) => prev.filter((k) => k.id !== id));
      if (activeKarteForVisit?.id === id) setActiveKarteForVisit(null);
    } catch (err: any) {
      alert("削除に失敗しました: " + err.message);
    }
  };

  // 来店記録の追加
  const handleAddVisitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKarteForVisit) return;

    const newRecord: VisitRecord = {
      id: crypto.randomUUID(),
      date: visitDate,
      course: visitCourse,
      amount: visitAmount ? `${visitAmount}円` : "未記入",
      memo: visitMemo,
    };

    const currentHistory = activeKarteForVisit.visit_history || [];
    const updatedHistory = [newRecord, ...currentHistory];

    try {
      setSaving(true);
      const { error } = await supabase
        .from("customer_kartes")
        .update({ visit_history: updatedHistory })
        .eq("id", activeKarteForVisit.id);

      if (error) throw error;

      setActiveKarteForVisit({
        ...activeKarteForVisit,
        visit_history: updatedHistory,
      });

      setKartes((prev) =>
        prev.map((k) =>
          k.id === activeKarteForVisit.id ? { ...k, visit_history: updatedHistory } : k
        )
      );

      setVisitAmount("");
      setVisitMemo("");
      alert("施術・来店履歴を追加しました！");
    } catch (err: any) {
      alert("履歴の追加に失敗しました: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 来店記録の個別削除
  const handleDeleteVisitRecord = async (recordId: string) => {
    if (!activeKarteForVisit || !confirm("この施術履歴を削除しますか？")) return;
    const currentHistory = activeKarteForVisit.visit_history || [];
    const updatedHistory = currentHistory.filter((r) => r.id !== recordId);

    try {
      const { error } = await supabase
        .from("customer_kartes")
        .update({ visit_history: updatedHistory })
        .eq("id", activeKarteForVisit.id);

      if (error) throw error;

      setActiveKarteForVisit({
        ...activeKarteForVisit,
        visit_history: updatedHistory,
      });

      setKartes((prev) =>
        prev.map((k) =>
          k.id === activeKarteForVisit.id ? { ...k, visit_history: updatedHistory } : k
        )
      );
    } catch (err: any) {
      alert("削除に失敗しました: " + err.message);
    }
  };

  // 検索＆絞り込み
  const filteredKartes = kartes.filter((k) => {
    const matchesSearch =
      k.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.ng_actions && k.ng_actions.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (k.allergy_info && k.allergy_info.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (k.preferences && k.preferences.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (k.memo && k.memo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = filterLevel === "all" || k.danger_level === filterLevel;
    return matchesSearch && matchesFilter;
  });

  return (
    <section className="flex flex-col gap-4">
      {/* 検索・新規追加バー */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs sm:text-sm font-semibold text-rose-400">📋 顧客カルテ・施術管理</span>
            <p className="text-[10px] text-slate-400">好み・アレルギー・かすはら対策・来店履歴をスマート管理</p>
          </div>
          <button
            type="button"
            onClick={openNewModal}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 font-bold px-3.5 py-1.5 rounded-xl text-xs text-white shadow active:scale-95 transition"
          >
            ＋ カルテ作成
          </button>
        </div>

        {/* 検索窓 */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="お名前、好み、アレルギー、メモなどで検索..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-400"
        />

        {/* 警戒度フィルター */}
        <div className="flex gap-2">
          {(
            [
              { key: "all", label: "すべて" },
              { key: "safe", label: "✨ 優良・リピーター" },
              { key: "caution", label: "⚠️ 要注意・要確認" },
              { key: "danger", label: "🚨 トラブル・カスハラ警戒" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterLevel(tab.key)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition ${
                filterLevel === tab.key
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* カルテ一覧 */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-center text-xs text-slate-500 py-6">カルテを読み込み中...</p>
        ) : filteredKartes.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-8 border border-dashed border-slate-800 rounded-2xl">
            {searchQuery ? "一致するカルテが見つかりません" : "まだ登録されたカルテがありません"}
          </div>
        ) : (
          filteredKartes.map((item) => (
            <div
              key={item.id}
              className={`bg-slate-900 border rounded-2xl p-4 flex flex-col gap-3 transition ${
                item.danger_level === "danger"
                  ? "border-red-500/40 bg-red-950/10"
                  : item.danger_level === "caution"
                  ? "border-amber-500/40 bg-amber-950/10"
                  : "border-slate-800"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      item.danger_level === "danger"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : item.danger_level === "caution"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {item.danger_level === "danger" && "🚨 トラブル・カスハラ警戒"}
                    {item.danger_level === "caution" && "⚠️ 要注意・要確認"}
                    {item.danger_level === "safe" && "✨ 優良・リピーター"}
                  </span>
                  <h3 className="font-bold text-sm text-slate-100">{item.customer_name} 様</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveKarteForVisit(item)}
                    className="text-[10px] text-rose-300 hover:text-white bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30 font-bold"
                  >
                    📋 施術履歴 ({item.visit_history?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="text-[10px] text-slate-400 hover:text-white bg-slate-950 px-2 py-1 rounded-lg border border-slate-800"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteKarte(item.id, item.customer_name)}
                    className="text-[10px] text-red-400 hover:text-red-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800"
                  >
                    削除
                  </button>
                </div>
              </div>

              {/* アレルギー・体質注意 */}
              {item.allergy_info && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-xs text-amber-300">
                  <span className="font-bold block text-[10px] text-amber-400 mb-0.5">⚠️ アレルギー・体質・肌の注意点</span>
                  {item.allergy_info}
                </div>
              )}

              {/* カスハラ・迷惑行為・禁止事項 */}
              {item.ng_actions && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-xs text-red-300">
                  <span className="font-bold block text-[10px] text-red-400 mb-0.5">🛑 カスタマーハラスメント・迷惑行為フィルター</span>
                  {item.ng_actions}
                </div>
              )}

              {/* 好み・話題・こだわり */}
              {item.preferences && (
                <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-rose-400 font-bold block mb-0.5">💬 好み・会話した話題・デザインのこだわり</span>
                  {item.preferences}
                </div>
              )}

              {/* 総合メモ */}
              {item.memo && (
                <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 whitespace-pre-wrap">
                  <span className="text-[10px] text-slate-500 block mb-0.5">📝 総合メモ</span>
                  {item.memo}
                </div>
              )}

              {/* 最新の来店履歴が1件あればチラ見せ表示 */}
              {item.visit_history && item.visit_history.length > 0 && (
                <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>
                    🕒 直近施術: <strong className="text-slate-200">{item.visit_history[0].date}</strong>（{item.visit_history[0].course} / {item.visit_history[0].amount}）
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveKarteForVisit(item)}
                    className="text-rose-400 underline text-[10px]"
                  >
                    履歴を見る
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 施術履歴モーダル */}
      {activeKarteForVisit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-rose-400 font-bold block">施術・来店履歴 ＆ 売上管理</span>
                <h2 className="text-sm sm:text-base font-bold text-slate-100">
                  {activeKarteForVisit.customer_name} 様のカルテ
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveKarteForVisit(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* 新規施術記録フォーム */}
            <form onSubmit={handleAddVisitRecord} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2.5">
              <span className="text-[11px] font-bold text-slate-300">＋ 新しい施術・来店を記録する</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">日付</label>
                  <input
                    type="date"
                    required
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">メニュー / コース</label>
                  <input
                    type="text"
                    value={visitCourse}
                    onChange={(e) => setVisitCourse(e.target.value)}
                    placeholder="例: カット+カラー, 90分コース"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">お支払い金額</label>
                  <input
                    type="text"
                    value={visitAmount}
                    onChange={(e) => setVisitAmount(e.target.value)}
                    placeholder="例: 12,000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">施術内容・使った商材・話した内容</label>
                <input
                  type="text"
                  value={visitMemo}
                  onChange={(e) => setVisitMemo(e.target.value)}
                  placeholder="例: アディクシーカラー 7トーン。次回は前髪パーマ検討とのこと。"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-rose-500 hover:bg-rose-600 font-bold py-2 rounded-xl text-xs text-white transition active:scale-95 disabled:opacity-50 mt-1"
              >
                {saving ? "記録中..." : "＋ この施術記録を保存"}
              </button>
            </form>

            {/* 履歴リスト */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-[11px] font-bold text-slate-400">過去の施術履歴（新しい順）</span>
              {(!activeKarteForVisit.visit_history || activeKarteForVisit.visit_history.length === 0) ? (
                <p className="text-xs text-slate-500 text-center py-4">まだ施術履歴がありません</p>
              ) : (
                activeKarteForVisit.visit_history.map((record) => (
                  <div
                    key={record.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-1 text-xs"
                  >
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="font-bold text-rose-300">📅 {record.date}</span>
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-400 border border-slate-800">
                          {record.course}
                        </span>
                        <span className="text-emerald-400 font-bold">{record.amount}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteVisitRecord(record.id)}
                          className="text-red-400 hover:text-red-300 text-[10px] ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {record.memo && (
                      <p className="text-slate-400 text-[11px] mt-1 bg-slate-900/50 p-2 rounded-lg">
                        {record.memo}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 新規・編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-100">
                {editId ? "📝 カルテを編集" : "📋 新規カルテ登録"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveKarte} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  お客様のお名前 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例: 山田 花子"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">ステータス・警戒度</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "safe", label: "✨ 優良・リピ" },
                    { key: "caution", label: "⚠️ 要注意" },
                    { key: "danger", label: "🚨 カスハラ警戒" },
                  ].map((lvl) => (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => setFormLevel(lvl.key as any)}
                      className={`py-2 rounded-xl text-[11px] font-bold border transition ${
                        formLevel === lvl.key
                          ? lvl.key === "danger"
                            ? "bg-red-500/20 border-red-500 text-red-300"
                            : lvl.key === "caution"
                            ? "bg-amber-500/20 border-amber-500 text-amber-300"
                            : "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  アレルギー・肌や髪・身体の注意点
                </label>
                <input
                  type="text"
                  value={formAllergy}
                  onChange={(e) => setFormAllergy(e.target.value)}
                  placeholder="例: カラー剤で頭皮が染みやすい、金属アレルギーあり"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  カスハラ・迷惑行為・NG対応フィルター
                </label>
                <input
                  type="text"
                  value={formNg}
                  onChange={(e) => setFormNg(e.target.value)}
                  placeholder="例: 度重なる無断キャンセル、理不尽なクレーム履歴"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  好み・会話した話題・デザインのこだわり
                </label>
                <input
                  type="text"
                  value={formPreferences}
                  onChange={(e) => setFormPreferences(e.target.value)}
                  placeholder="例: 静かに過ごしたい派、旅行好き、ニュアンスネイルが好き"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">総合メモ</label>
                <textarea
                  value={formMemo}
                  onChange={(e) => setFormMemo(e.target.value)}
                  rows={3}
                  placeholder="例: 施術後はハーブティーを好む。お仕事はアパレル系。"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-rose-400 resize-none"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-950 border border-slate-800 py-3 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 font-bold py-3 rounded-xl text-xs text-white shadow active:scale-95 disabled:opacity-50"
                >
                  {saving ? "保存中..." : "カルテを保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}