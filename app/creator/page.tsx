"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { addCreationRecord } from "../lib/cinemoodStorage";

type Platform = "小红书" | "抖音" | "B站" | "公众号";
type Style =
  | "治愈走心"
  | "犀利影评"
  | "浪漫氛围"
  | "电影营销分析"
  | "适合短视频口播";
type Goal =
  | "种草推荐"
  | "引发评论互动"
  | "做个人片单"
  | "练习影视营销分析";

function CreatorContent() {
  const searchParams = useSearchParams();
  const movieFromUrl = searchParams.get("movie") || "";

  const [movieTitle, setMovieTitle] = useState(movieFromUrl);
  const [platform, setPlatform] = useState<Platform>("小红书");
  const [style, setStyle] = useState<Style>("治愈走心");
  const [goal, setGoal] = useState<Goal>("种草推荐");
  const [generatedContent, setGeneratedContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const [recordSaved, setRecordSaved] = useState(false);

  async function generateContent() {
    if (!movieTitle.trim()) {
      setGeneratedContent("请先输入一部电影名。");
      return;
    }

    setLoading(true);
    setGeneratedContent("");
    setCopied(false);
    setSource("");
    setNote("");
    setRecordSaved(false);

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieTitle,
          platform,
          style,
          goal,
        }),
      });

      const result = await response.json();

      if (result.content) {
        setGeneratedContent(result.content);
        setSource(result.source || "");
        setNote(result.note || "");
        addCreationRecord({
          movieTitle,
          platform,
          style,
          goal,
          content: result.content,
          source: result.source || "",
        });
        setRecordSaved(true);
      } else {
        setGeneratedContent(result.error || "生成失败，请稍后重试。");
      }
    } catch (error) {
      console.error(error);
      setGeneratedContent("生成失败，请检查网络或稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  async function copyContent() {
    if (!generatedContent) return;

    await navigator.clipboard.writeText(generatedContent);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function clearContent() {
    setGeneratedContent("");
    setCopied(false);
    setSource("");
    setNote("");
  }

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

          <p className="text-white/40 text-sm mb-3">CineMood 创作工具</p>

          <h1 className="text-3xl font-black leading-tight">
            把电影变成一篇内容
          </h1>

          <p className="mt-3 text-white/50 text-sm">
            输入电影名和内容方向，由 AI 或联网资料为你生成平台适配文案。
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-white/50 text-sm mb-2">电影名</label>
            <input
              value={movieTitle}
              onChange={(event) => setMovieTitle(event.target.value)}
              placeholder="例如：白日梦想家"
              className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-white placeholder:text-white/30 outline-none"
            />
          </div>

          <div>
            <label className="block text-white/50 text-sm mb-2">发布平台</label>
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value as Platform)}
              className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-white outline-none"
            >
              <option>小红书</option>
              <option>抖音</option>
              <option>B站</option>
              <option>公众号</option>
            </select>
          </div>

          <div>
            <label className="block text-white/50 text-sm mb-2">内容风格</label>
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value as Style)}
              className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-white outline-none"
            >
              <option>治愈走心</option>
              <option>犀利影评</option>
              <option>浪漫氛围</option>
              <option>电影营销分析</option>
              <option>适合短视频口播</option>
            </select>
          </div>

          <div>
            <label className="block text-white/50 text-sm mb-2">发布目的</label>
            <select
              value={goal}
              onChange={(event) => setGoal(event.target.value as Goal)}
              className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-white outline-none"
            >
              <option>种草推荐</option>
              <option>引发评论互动</option>
              <option>做个人片单</option>
              <option>练习影视营销分析</option>
            </select>
          </div>

          <button
            onClick={generateContent}
            disabled={loading}
            className={`w-full rounded-full py-4 font-black text-slate-950 ${
              loading
                ? "bg-white/30 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-400 to-blue-500"
            }`}
          >
            {loading ? "正在联网理解电影..." : "生成内容灵感"}
          </button>

          <Link
            href="/mood"
            className="block w-full rounded-full bg-white/10 py-4 text-center font-bold"
          >
            回到情绪测片 →
          </Link>
        </div>

        {generatedContent && (
          <div className="mt-6 rounded-[28px] bg-white/10 border border-white/10 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-white/40 text-sm">生成结果</p>
                {recordSaved && (
                  <p className="mt-1 text-xs text-emerald-300">
                    已自动保存到创作记录
                  </p>
                )}

                {source && (
                  <p className="mt-1 text-xs text-white/30">
                    来源：
                    {source === "openai"
                      ? "AI 生成"
                      : "联网资料 + 智能兜底生成"}
                  </p>
                )}

                {note && (
                  <p className="mt-1 text-xs text-white/25">
                    {note}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyContent}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80"
                >
                  {copied ? "已复制 ✓" : "复制"}
                </button>

                <button
                  onClick={clearContent}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80"
                >
                  收起
                </button>
              </div>
            </div>

            <p className="whitespace-pre-line text-sm leading-7">
              {generatedContent}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export default function CreatorPage() {
  return (
    <Suspense fallback={null}>
      <CreatorContent />
    </Suspense>
  );
}
