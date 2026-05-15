"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import {
  addDiaryEntry,
  getDiaryEntries,
  removeDiaryEntry,
  updateDiaryEntry,
  type DiaryEntry,
} from "../lib/cinemoodStorage";

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [movieTitle, setMovieTitle] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState("4");
  const [mood, setMood] = useState("治愈");
  const [editingEntryId, setEditingEntryId] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEntries(getDiaryEntries());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function saveEntry() {
    if (!body.trim()) return;

    if (editingEntryId) {
      updateDiaryEntry(editingEntryId, {
        title: title.trim() || "未命名影评",
        movieTitle: movieTitle.trim() || "未填写电影名",
        body,
        rating,
        mood,
      });

      setEntries(getDiaryEntries());
      resetForm();
      return;
    }

    const entry = addDiaryEntry({
      title: title.trim() || "未命名影评",
      movieTitle: movieTitle.trim() || "未填写电影名",
      body,
      rating,
      mood,
    });

    setEntries([entry, ...entries]);
    resetForm();
  }

  function resetForm() {
    setMovieTitle("");
    setTitle("");
    setBody("");
    setRating("4");
    setMood("治愈");
    setEditingEntryId("");
  }

  function editEntry(entry: DiaryEntry) {
    setEditingEntryId(entry.id);
    setMovieTitle(entry.movieTitle === "未填写电影名" ? "" : entry.movieTitle);
    setTitle(entry.title === "未命名影评" ? "" : entry.title);
    setBody(entry.body);
    setRating(entry.rating);
    setMood(entry.mood);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function deleteEntry(entryId: string) {
    setEntries(removeDiaryEntry(entryId));
  }

  return (
    <main className="min-h-screen bg-[#080A18] text-white px-6 pt-8 pb-28">
      <section className="mx-auto max-w-[390px]">
        <div className="mb-8">
          <Link
            href="/profile"
            className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl"
          >
            ←
          </Link>

          <p className="text-white/40 text-sm mb-3">CineMood 日记</p>
          <h1 className="text-3xl font-black leading-tight">观影日记</h1>
          <p className="mt-3 text-white/50 text-sm">
            写下你自己的影评、情绪和观看记忆。
          </p>
        </div>

        <div className="mb-6 rounded-[24px] bg-white/10 border border-white/10 p-5">
          <div className="space-y-4">
            <input
              value={movieTitle}
              onChange={(event) => setMovieTitle(event.target.value)}
              placeholder="电影名"
              className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-white outline-none placeholder:text-white/30"
            />

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="标题，例如：看完之后我突然松了一口气"
              className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-white outline-none placeholder:text-white/30"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                className="rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-white outline-none"
              >
                <option>5</option>
                <option>4.5</option>
                <option>4</option>
                <option>3.5</option>
                <option>3</option>
                <option>2</option>
              </select>

              <select
                value={mood}
                onChange={(event) => setMood(event.target.value)}
                className="rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-white outline-none"
              >
                <option>治愈</option>
                <option>浪漫</option>
                <option>孤独</option>
                <option>想哭</option>
                <option>焦虑</option>
                <option>兴奋</option>
              </select>
            </div>

            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="写下你的影评..."
              rows={8}
              className="w-full resize-none rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-white outline-none placeholder:text-white/30"
            />

            <button
              onClick={saveEntry}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 py-4 font-black text-slate-950"
            >
              {editingEntryId ? "保存修改" : "保存日记"}
            </button>

            {editingEntryId && (
              <button
                onClick={resetForm}
                className="w-full rounded-full bg-white/10 py-4 font-bold text-white/60"
              >
                取消编辑
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-[24px] bg-[#12162B] border border-white/10 p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-white/40">
                    {new Date(entry.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                  <h2 className="mt-2 text-xl font-black">{entry.title}</h2>
                  <p className="mt-1 text-xs text-white/40">
                    {entry.movieTitle} · {entry.rating} 星 · {entry.mood}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => editEntry(entry)}
                    className="rounded-full bg-cyan-400/15 px-3 py-2 text-xs font-bold text-cyan-200"
                  >
                    编辑
                  </button>

                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white/50"
                  >
                    删除
                  </button>
                </div>
              </div>

              <p className="whitespace-pre-line text-sm leading-7 text-white/70">
                {entry.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
