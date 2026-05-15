"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MoodPage() {
  const router = useRouter();

  const moods = ["焦虑", "孤独", "疲惫", "想哭", "治愈", "浪漫"];
  const scenes = ["深夜独处", "周末放松", "朋友聚会", "约会", "通勤", "找灵感"];

  const [selectedMood, setSelectedMood] = useState("");
  const [selectedScene, setSelectedScene] = useState("");

  return (
    <main className="min-h-screen bg-[#080A18] text-white px-6 py-8">
      <section className="mx-auto max-w-[390px]">
        <div className="mb-8">
          <Link
            href="/"
            className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl transition hover:bg-white/20"
            aria-label="返回主页"
          >
            ←
          </Link>

          <p className="text-white/40 text-sm mb-3">CineMood 影感实验室</p>
          <h1 className="text-3xl font-black leading-tight">
            今天你是什么状态？
          </h1>
          <p className="mt-3 text-white/50 text-sm">
            选择你的情绪和观看场景，我会帮你寻找适合此刻的电影。
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">当前情绪</h2>
          <div className="grid grid-cols-2 gap-3">
            {moods.map((mood) => {
              const isSelected = selectedMood === mood;

              return (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`rounded-2xl border px-4 py-4 text-left font-bold transition ${
                    isSelected
                      ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-400/30"
                      : "bg-white/10 border-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {mood}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">观看场景</h2>
          <div className="grid grid-cols-2 gap-3">
            {scenes.map((scene) => {
              const isSelected = selectedScene === scene;

              return (
                <button
                  key={scene}
                  onClick={() => setSelectedScene(scene)}
                  className={`rounded-2xl border px-4 py-4 text-left font-bold transition ${
                    isSelected
                      ? "bg-purple-400 text-slate-950 border-purple-300 shadow-lg shadow-purple-400/30"
                      : "bg-white/10 border-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {scene}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl bg-white/10 border border-white/10 p-4 mb-6">
          <p className="text-white/40 text-sm mb-2">你当前选择的是：</p>
          <p className="font-bold">
            情绪：{selectedMood || "还没选择"} / 场景：
            {selectedScene || "还没选择"}
          </p>
        </div>

  <button
  disabled={!selectedMood || !selectedScene}
 onClick={() => {
  const params = new URLSearchParams({
    mood: selectedMood,
    scene: selectedScene,
  });

  router.push(`/result?${params.toString()}`);
}}
  className={`w-full rounded-full py-4 font-black text-lg transition ${
    selectedMood && selectedScene
      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-blue-500/30"
      : "bg-white/10 text-white/30 cursor-not-allowed"
  }`}
>
  开始联网寻找电影
</button>
      </section>
    </main>
  );
}
