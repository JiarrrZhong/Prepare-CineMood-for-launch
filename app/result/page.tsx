"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  addMovieToPlaylist,
  getMovieStorageKey,
  getPlaylistMovieKeys,
  recordSearchActivity,
} from "../lib/cinemoodStorage";

type Movie = {
  id?: number;
  title: string;
  year: string;
  type: string;
  score: number;
  reason: string;
  time: string;
  warning: string;
  angle: string;
  overview?: string;
  posterUrl?: string;
  tmdbUrl?: string;
  sourceTitle?: string;
  sourceUrl?: string;
};

type Source = {
  title: string;
  url: string;
  content: string;
  score?: number;
};

type RecommendData = {
  filmDNA: {
    mood: string;
    scene: string;
    pace: string;
    style: string;
  };
  movies: Movie[];
  sources?: Source[];
};

function getSeenMovieIds() {
  const saved = localStorage.getItem("cinemood_seen_movie_ids");
  if (!saved) return [];

  try {
    const ids = JSON.parse(saved);
    return Array.isArray(ids) ? ids.filter(Boolean).map(Number) : [];
  } catch {
    return [];
  }
}

function rememberMovieIds(movies: Movie[]) {
  const nextIds = movies
    .map((movie) => movie.id)
    .filter((id): id is number => Boolean(id));

  if (nextIds.length === 0) return;

  const merged = Array.from(new Set([...getSeenMovieIds(), ...nextIds])).slice(
    -200
  );

  localStorage.setItem("cinemood_seen_movie_ids", JSON.stringify(merged));
}

function ResultContent() {
  const searchParams = useSearchParams();

  const mood = searchParams.get("mood") || "焦虑";
  const scene = searchParams.get("scene") || "深夜独处";

  const [data, setData] = useState<RecommendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedCopy, setGeneratedCopy] = useState("");
  const [generatedMovieTitle, setGeneratedMovieTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedMovieKeys, setSavedMovieKeys] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSavedMovieKeys(getPlaylistMovieKeys());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function fetchRecommendation() {
      setLoading(true);
      setGeneratedCopy("");
      setGeneratedMovieTitle("");
      setCopied(false);

      const params = new URLSearchParams({
        mood,
        scene,
      });
      const seenMovieIds = getSeenMovieIds().slice(-120).join(",");

      if (seenMovieIds) params.set("exclude", seenMovieIds);

      const response = await fetch(`/api/recommend?${params.toString()}`);
      const result = await response.json();

      await new Promise((resolve) => setTimeout(resolve, 1200));

      rememberMovieIds(result.movies || []);
      recordSearchActivity({
        query: `${mood} ${scene}`,
        mood,
        scene,
        movies: result.movies || [],
      });
      setData(result);
      setLoading(false);
    }

    fetchRecommendation();
  }, [mood, scene]);

  function getSearchTitle(title: string) {
    return title.split("\n").pop() || title;
  }

  function generateXiaohongshuCopy(movie: Movie) {
    if (generatedMovieTitle === movie.title && generatedCopy) {
      setGeneratedCopy("");
      setGeneratedMovieTitle("");
      setCopied(false);
      return;
    }

    const cleanTitle = movie.title.replace("\n", " / ");

    const copy = `《${cleanTitle}》不是那种只负责“好看”的电影。

它更像是一种情绪陪伴：当你处在「${data?.filmDNA.mood}」的状态里，又刚好在「${data?.filmDNA.scene}」这个场景下，它会给你一点缓冲、一点理解，也可能给你一点重新出发的感觉。

推荐理由：
${movie.reason}

适合观看时刻：
${movie.time}

内容提醒：
${movie.warning}

如果你最近也有类似的状态，可以把它加入你的片单里。不是每一部电影都要立刻改变人生，有些电影的意义只是：在某个晚上，刚好接住了你。

#电影推荐 #情绪片单 #治愈电影 #周末看什么 #CineMood影感实验室`;

    setGeneratedCopy(copy);
    setGeneratedMovieTitle(movie.title);
    setCopied(false);
  }

  async function copyToClipboard() {
    if (!generatedCopy) return;

    await navigator.clipboard.writeText(generatedCopy);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function saveMovie(movie: Movie) {
    const added = addMovieToPlaylist(movie);
    if (added) {
      setSavedMovieKeys(getPlaylistMovieKeys());
    }
  }

  if (loading || !data) {
    return (
      <main className="min-h-screen bg-[#080A18] text-white px-6 py-8">
        <section className="mx-auto max-w-[390px]">
          <div className="rounded-[28px] bg-white/10 border border-white/10 p-6">
            <p className="text-white/40 text-sm mb-3">CineMood 正在生成</p>

            <h1 className="text-3xl font-black leading-tight">
              正在寻找适合你的电影...
            </h1>

            <p className="mt-3 text-white/50 text-sm">
              当前选择：{mood} / {scene}
            </p>

            <div className="mt-6 space-y-3 text-sm text-white/60">
              <p>正在理解你的情绪状态...</p>
              <p>正在搜索相关电影片单...</p>
              <p>正在生成推荐理由...</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080A18] text-white px-6 py-8">
      <section className="mx-auto max-w-[390px]">
        <div className="mb-8">
          <p className="text-white/40 text-sm mb-3">CineMood 情绪测片</p>

          <h1 className="text-3xl font-black leading-tight">
            你的今日电影 DNA
          </h1>

          <p className="mt-3 text-white/50 text-sm">
            根据你刚刚选择的情绪和观看场景，我为你生成一组适合此刻的电影。
          </p>
        </div>

        <div className="rounded-[28px] bg-white/10 border border-white/10 p-5 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/40 mb-1">情绪</p>
              <p className="font-bold text-cyan-300">{data.filmDNA.mood}</p>
            </div>

            <div>
              <p className="text-white/40 mb-1">场景</p>
              <p className="font-bold text-purple-300">{data.filmDNA.scene}</p>
            </div>

            <div>
              <p className="text-white/40 mb-1">节奏</p>
              <p className="font-bold text-pink-300">{data.filmDNA.pace}</p>
            </div>

            <div>
              <p className="text-white/40 mb-1">风格</p>
              <p className="font-bold text-emerald-300">
                {data.filmDNA.style}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <Link
            href="/mood"
            className="rounded-full bg-white/10 py-3 text-center font-bold text-white"
          >
            重新测片
          </Link>

          <Link
            href="/"
            className="rounded-full bg-white/10 py-3 text-center font-bold text-white"
          >
            回到首页
          </Link>
        </div>

        <div className="space-y-5">
          {data.movies.map((movie) => {
            const isCopyVisible =
              generatedMovieTitle === movie.title && Boolean(generatedCopy);
            const movieKey = getMovieStorageKey(movie);
            const isSaved = savedMovieKeys.includes(movieKey);

            return (
              <div
                key={movie.id || movie.title}
                className="rounded-[28px] bg-[#12162B] border border-white/10 p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-black whitespace-pre-line">
                      {movie.title}
                    </h2>

                    <p className="text-white/40 text-sm mt-1">
                      {movie.year} · {movie.type}
                    </p>
                  </div>

                  <div className="rounded-full bg-cyan-400 text-slate-950 px-3 py-1 text-sm font-black">
                    {movie.score}%
                  </div>
                </div>

                {movie.posterUrl && (
                  <div className="mb-5 overflow-hidden rounded-3xl bg-white/5">
                    <Image
                      src={movie.posterUrl}
                      alt={`${movie.title} poster`}
                      width={500}
                      height={750}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-4 text-sm leading-6">
                  <div>
                    <p className="text-white/40 mb-1">为什么适合你</p>
                    <p>{movie.reason}</p>
                  </div>

                  <div>
                    <p className="text-white/40 mb-1">适合观看时刻</p>
                    <p>{movie.time}</p>
                  </div>

                  <div>
                    <p className="text-white/40 mb-1">内容提醒</p>
                    <p>{movie.warning}</p>
                  </div>

                  <div>
                    <p className="text-white/40 mb-1">情绪观看角度</p>
                    <p>{movie.angle}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  {movie.tmdbUrl && (
                    <a
                      href={movie.tmdbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 py-3 text-center font-bold text-slate-950"
                    >
                      去 TMDB 查看电影详情 →
                    </a>
                  )}

                  <a
                    href={`https://www.justwatch.com/us/search?q=${encodeURIComponent(
                      getSearchTitle(movie.title)
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-full bg-white/10 py-3 text-center font-bold text-white"
                  >
                    去 JustWatch 查看观看平台 →
                  </a>

                  <button
                    onClick={() => generateXiaohongshuCopy(movie)}
                    className="w-full rounded-full bg-white/10 py-3 font-bold"
                  >
                    {isCopyVisible ? "收起情绪观影文案" : "生成情绪观影文案"}
                  </button>

                  <button
                    onClick={() => saveMovie(movie)}
                    disabled={isSaved}
                    className={`w-full rounded-full py-3 font-bold ${
                      isSaved
                        ? "bg-emerald-400/20 text-emerald-200"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {isSaved ? "已加入片单" : "加入片单"}
                  </button>

                  {isCopyVisible && (
                    <div className="mt-4 rounded-2xl bg-white/10 border border-white/10 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-white/40 text-sm">
                          已生成情绪观影文案
                        </p>

                        <button
                          onClick={copyToClipboard}
                          className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80"
                        >
                          {copied ? "已复制 ✓" : "复制文案"}
                        </button>
                      </div>

                      <p className="whitespace-pre-line text-sm leading-7">
                        {generatedCopy}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {data.sources && data.sources.length > 0 && (
          <div className="mt-6 rounded-[28px] bg-white/10 border border-white/10 p-5">
            <p className="text-white/40 text-sm mb-3">推荐来源</p>

            <div className="space-y-4">
              {data.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl bg-white/10 border border-white/10 p-4"
                >
                  <p className="font-bold text-sm leading-6 mb-2">
                    {source.title}
                  </p>

                  <p className="text-white/50 text-xs leading-5 line-clamp-3">
                    {source.content}
                  </p>

                  <p className="mt-3 text-cyan-300 text-xs font-bold">
                    查看来源 →
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultContent />
    </Suspense>
  );
}
