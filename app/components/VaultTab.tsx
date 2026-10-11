"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export interface VaultPhoto {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  timestamp: number;
  usedCount: number;
}

export default function VaultTab({
  onSelectPhotoForDiary,
}: {
  onSelectPhotoForDiary: (photo: VaultPhoto) => void;
}) {
  const [photos, setPhotos] = useState<VaultPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [gachaResult, setGachaResult] = useState<VaultPhoto | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ローカルで使用回数を保持（ユーザーごと）
  const getUsedCounts = (): Record<string, number> => {
    try {
      return JSON.parse(localStorage.getItem("vault_photo_used_counts") || "{}");
    } catch {
      return {};
    }
  };

  const incrementUsedCount = (photoName: string) => {
    const counts = getUsedCounts();
    counts[photoName] = (counts[photoName] || 0) + 1;
    localStorage.setItem("vault_photo_used_counts", JSON.stringify(counts));
    setPhotos((prev) =>
      prev.map((p) => (p.name === photoName ? { ...p, usedCount: counts[photoName] } : p))
    );
  };

  // 写真の読み込み
  const loadPhotos = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const folderPath = `${user.id}`;
      const { data: fileList, error: listError } = await supabase.storage
        .from("photos")
        .list(folderPath, {
          sortBy: { column: "created_at", order: "asc" }, // 古い順に取得
        });

      if (listError) throw listError;
      if (!fileList || fileList.length === 0) {
        setPhotos([]);
        return;
      }

      const usedCounts = getUsedCounts();

      const photoPromises = fileList
        .filter((file) => file.name !== ".emptyFolderPlaceholder")
        .map(async (file) => {
          const filePath = `${folderPath}/${file.name}`;
          const { data: signedData } = await supabase.storage
            .from("photos")
            .createSignedUrl(filePath, 3600);

          const time = file.created_at ? new Date(file.created_at).getTime() : 0;

          return {
            id: file.id || file.name,
            name: file.name,
            url: signedData?.signedUrl || "",
            createdAt: file.created_at
              ? new Date(file.created_at).toLocaleDateString("ja-JP")
              : "最近",
            timestamp: time,
            usedCount: usedCounts[file.name] || 0,
          };
        });

      const loaded = await Promise.all(photoPromises);
      setPhotos(loaded.filter((p) => p.url));
    } catch (err) {
      console.error("写真読み込みエラー:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  // 写真を端末にダウンロード保存する関数
  const downloadPhoto = async (photo: VaultPhoto) => {
    try {
      const res = await fetch(photo.url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `diary_${photo.name || "photo.webp"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      alert("画像のダウンロードに失敗しました");
    }
  };

  // 写真アップロード
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("ログインセッションが見つかりません");
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const webpBlob = await convertToWebP(file);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(filePath, webpBlob, {
            contentType: "image/webp",
            upsert: false,
          });

        if (uploadError) throw uploadError;
      }

      await loadPhotos();
    } catch (err: any) {
      alert("写真の保存に失敗しました: " + (err.message || ""));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const convertToWebP = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("WebP変換失敗"));
            },
            "image/webp",
            0.82
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // 写真削除
  const handleDeletePhoto = async (name: string) => {
    if (!confirm("この写真を金庫から削除しますか？")) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const filePath = `${user.id}/${name}`;
      const { error } = await supabase.storage.from("photos").remove([filePath]);
      if (error) throw error;

      setPhotos((prev) => prev.filter((p) => p.name !== name));
      if (gachaResult?.name === name) setGachaResult(null);
    } catch (err: any) {
      alert("削除に失敗しました: " + err.message);
    }
  };

  // 【最重要】「古い順」×「あまり使ってない順」を最優先するガチャロジック
  const handleSpinGacha = () => {
    if (photos.length === 0) {
      alert("まずは写真をストック追加してください！");
      return;
    }

    setIsSpinning(true);
    setGachaResult(null);

    // 1. 写真を「使用回数が少ない順」かつ「登録日が古い順」にソート
    const sorted = [...photos].sort((a, b) => {
      if (a.usedCount !== b.usedCount) {
        return a.usedCount - b.usedCount; // 使用回数が少ないものを優先
      }
      return a.timestamp - b.timestamp; // 古いものを優先
    });

    // 2. 上位候補（最も古くて使われていない上位数枚）の中から選ぶ
    const poolSize = Math.min(sorted.length, Math.max(3, Math.ceil(sorted.length * 0.4)));
    const targetPool = sorted.slice(0, poolSize);
    const chosen = targetPool[Math.floor(Math.random() * targetPool.length)];

    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * photos.length);
      setGachaResult(photos[randomIdx]);
      counter++;
      if (counter > 14) {
        clearInterval(interval);
        setGachaResult(chosen);
        setIsSpinning(false);
      }
    }, 70);
  };

  const handleUseInDiary = (photo: VaultPhoto) => {
    incrementUsedCount(photo.name);
    // 端末への保存も同時に促す
    downloadPhoto(photo);
    onSelectPhotoForDiary(photo);
  };

  return (
    <section className="flex flex-col gap-4">
      {/* アップロードバー */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-rose-400">📸 ストック写真を追加</span>
          <span className="text-[10px] text-slate-400">クラウド暗号化保存</span>
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-slate-950 border border-slate-800 hover:border-rose-400 font-bold py-3 rounded-xl text-xs text-slate-200 transition shadow active:scale-95 disabled:opacity-50"
        >
          {uploading ? "🔐 クラウド金庫へ安全に保存中..." : "＋ 写真をストック金庫に入れる（複数OK）"}
        </button>
      </div>

      {/* ストックガチャ（古い＆未消化優先） */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-rose-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-rose-300">🎲 お宝発掘写真ガチャ</span>
            <p className="text-[10px] text-slate-400">古い＆まだ使ってない写真を優先選出！</p>
          </div>
          <button
            type="button"
            disabled={isSpinning || photos.length === 0}
            onClick={handleSpinGacha}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 font-bold px-3.5 py-1.5 rounded-lg text-xs text-white shadow active:scale-95 transition disabled:opacity-40"
          >
            {isSpinning ? "選定中..." : "ガチャを回す"}
          </button>
        </div>

        {gachaResult && (
          <div className="bg-slate-950/90 border border-rose-500/50 rounded-xl p-3 flex items-center justify-between gap-3 animate-fadeIn">
            <img
              src={gachaResult.url}
              alt="ガチャ当選"
              className="w-16 h-16 rounded-lg object-cover border border-rose-400/50 shadow"
            />
            <div className="flex-1 text-[11px] text-slate-300">
              <p className="font-bold text-rose-300">🎉 本日の発掘写真！</p>
              <p className="text-[10px] text-slate-400">
                {gachaResult.createdAt}（使用: {gachaResult.usedCount}回）
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleUseInDiary(gachaResult)}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 text-white text-xs px-3 py-2 rounded-xl font-bold transition shadow active:scale-95"
            >
              ✍️ 日記で使う
            </button>
          </div>
        )}
      </div>

      {/* 写真一覧ギャラリー */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-rose-400">
            🗄️ 金庫の写真（{photos.length}枚 / 古い順）
          </span>
          <span className="text-[10px] text-slate-500">タップで日記にセット</span>
        </div>

        {loading ? (
          <p className="text-center text-xs text-slate-500 py-6">金庫を確認中...</p>
        ) : photos.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-6 border border-dashed border-slate-800 rounded-xl">
            まだ金庫に写真がありません
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.name}
                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer"
                onClick={() => handleUseInDiary(photo)}
              >
                <img
                  src={photo.url}
                  alt="金庫写真"
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                {photo.usedCount > 0 && (
                  <span className="absolute bottom-1 left-1 bg-black/70 text-rose-300 text-[9px] px-1.5 py-0.5 rounded">
                    使済 {photo.usedCount}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <span className="text-[10px] text-white font-bold bg-rose-500/80 px-2 py-1 rounded-full">
                    日記で使う
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(photo.name);
                  }}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center transition z-10"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}