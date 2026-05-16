"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BottomNav from "./components/BottomNav";
import {
  addMovieToPlaylist,
  getEnergyValue,
  getMovieStorageKey,
  getPlaylistMovieKeys,
  getPlaylistMovies,
  recordSearchActivity,
} from "./lib/cinemoodStorage";

type PlaylistMovie = {
  id?: number;
  title: string;
  year?: string;
  type?: string;
  score: number;
  reason: string;
  sourceTitle: string;
  sourceUrl: string;
  posterUrl?: string;
  tmdbUrl?: string;
  overview?: string;
};

type RecentItem = {
  id: string;
  query: string;
  firstMovie: string;
  movieCount: number;
  createdAt: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  movies?: PlaylistMovie[];
};

type ReviewResult = {
  title: string;
  url: string;
  source: string;
  excerpt: string;
  score?: number;
};

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [stillQuery, setStillQuery] = useState("");
  const [reviewQuery, setReviewQuery] = useState("");
  const [reviewSummary, setReviewSummary] = useState("");
  const [reviewResults, setReviewResults] = useState<ReviewResult[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "嗨，我是 CineMood。你可以直接告诉我：你现在的心情、观看场景、想要的风格，或者你想找什么片单。我会联网帮你找电影。",
    },
  ]);

  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [energy, setEnergy] = useState(0);
  const [savedMovieKeys, setSavedMovieKeys] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem("cinemood_recent_items");
      setEnergy(getEnergyValue());
      setSavedMovieKeys(getPlaylistMovieKeys());

      if (saved) {
        try {
          setRecentItems(JSON.parse(saved));
        } catch {
          setRecentItems([]);
        }
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  function getSearchTitle(title: string) {
    return title.split("\n").pop() || title;
  }

  function saveRecentSearch(searchQuery: string, searchMovies: PlaylistMovie[]) {
    if (searchMovies.length === 0) return;

    const newItem: RecentItem = {
      id: Date.now().toString(),
      query: searchQuery,
      firstMovie: searchMovies[0].title,
      movieCount: searchMovies.length,
      createdAt: new Date().toLocaleDateString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
      }),
    };

    const nextItems = [newItem, ...recentItems].slice(0, 5);

    setRecentItems(nextItems);
    localStorage.setItem("cinemood_recent_items", JSON.stringify(nextItems));
  }

  function clearRecentItems() {
    setRecentItems([]);
    localStorage.removeItem("cinemood_recent_items");
  }

  function getSeenMovieIds() {
    const saved = localStorage.getItem("cinemood_seen_movie_ids");
    const playlistIds = getPlaylistMovies()
      .map((movie) => movie.id)
      .filter((id): id is number => Boolean(id));
    if (!saved) return playlistIds;

    try {
      const ids = JSON.parse(saved);
      const seenIds = Array.isArray(ids)
        ? ids.filter(Boolean).map(Number)
        : [];

      return Array.from(new Set([...seenIds, ...playlistIds]));
    } catch {
      return playlistIds;
    }
  }

  function getSeenMovieTitles() {
    const saved = localStorage.getItem("cinemood_seen_movie_titles");
    const playlistTitles = getPlaylistMovies()
      .map((movie) => movie.title)
      .filter(Boolean);

    if (!saved) return playlistTitles;

    try {
      const titles = JSON.parse(saved);
      const seenTitles = Array.isArray(titles)
        ? titles.map(String).filter(Boolean)
        : [];

      return Array.from(new Set([...seenTitles, ...playlistTitles]));
    } catch {
      return playlistTitles;
    }
  }

  function rememberMovieIds(movies: PlaylistMovie[]) {
    const nextIds = movies
      .map((movie) => movie.id)
      .filter((id): id is number => Boolean(id));
    const nextTitles = movies.map((movie) => movie.title).filter(Boolean);

    if (nextIds.length > 0) {
      const merged = Array.from(
        new Set([...getSeenMovieIds(), ...nextIds])
      ).slice(-300);

      localStorage.setItem("cinemood_seen_movie_ids", JSON.stringify(merged));
    }

    if (nextTitles.length > 0) {
      const mergedTitles = Array.from(
        new Set([...getSeenMovieTitles(), ...nextTitles])
      ).slice(-300);

      localStorage.setItem(
        "cinemood_seen_movie_titles",
        JSON.stringify(mergedTitles)
      );
    }
  }

  async function sendMessage(customQuery?: string) {
    const finalQuery = customQuery || query;

    if (!finalQuery.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: finalQuery,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      const seenMovieIds = getSeenMovieIds().slice(-240).join(",");
      const seenMovieTitles = getSeenMovieTitles().slice(-240);
      const params = new URLSearchParams({
        q: finalQuery,
        limit: "12",
      });

      if (seenMovieIds) params.set("exclude", seenMovieIds);
      if (seenMovieTitles.length > 0) {
        params.set("excludeTitles", JSON.stringify(seenMovieTitles));
      }
      const response = await fetch(`/api/playlist?${params.toString()}`);

      const result = await response.json();

      const movies: PlaylistMovie[] = result.movies || [];

      if (movies.length > 0) {
        rememberMovieIds(movies);
        recordSearchActivity({
          query: finalQuery,
          movies,
        });
        saveRecentSearch(finalQuery, movies);

        const assistantMessage: ChatMessage = {
          id: Date.now().toString() + "-assistant",
          role: "assistant",
          content: `我从 TMDB 和联网资料里找了一批不重复的电影，下面这些可能适合你的需求：「${finalQuery}」。你可以加入片单、查观看平台，也可以直接用某部电影去生成内容。`,
          movies,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const assistantMessage: ChatMessage = {
          id: Date.now().toString() + "-assistant",
          role: "assistant",
          content:
            "这次没有找到很合适的结果。你可以换一种说法，比如加上情绪、场景或风格：失恋后、深夜独处、轻松治愈、适合约会、适合小红书等。",
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error(error);

      const errorMessage: ChatMessage = {
        id: Date.now().toString() + "-error",
        role: "assistant",
        content:
          "联网搜索失败了，可能是 API 或网络暂时不稳定。你可以稍后再试一次。",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  const quickPrompts = [
    "我失恋了，想看一部不要太虐但有后劲的电影",
    "周末约会想看一部不尴尬的浪漫电影",
    "我今天很焦虑，想看轻松一点的治愈片",
    "想找适合做小红书内容的高颜值电影",
  ];

  function saveMovie(movie: PlaylistMovie) {
    const added = addMovieToPlaylist(movie);
    if (added) {
      setSavedMovieKeys(getPlaylistMovieKeys());
    }
  }

  function openStillSearch(target: "stills" | "quotes") {
    const finalQuery = stillQuery.trim();
    if (!finalQuery) return;

    const url =
      target === "stills"
        ? `https://film-grab.com/?s=${encodeURIComponent(finalQuery)}`
        : `https://www.quodb.com/search/${encodeURIComponent(finalQuery)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function searchMovieReviews() {
    const movieTitle = reviewQuery.trim();
    if (!movieTitle) return;

    setReviewLoading(true);
    setReviewError("");
    setReviewSummary("");
    setReviewResults([]);

    try {
      const response = await fetch(
        `/api/reviews?movie=${encodeURIComponent(movieTitle)}`
      );
      const result = await response.json();

      if (!response.ok) {
        setReviewError(result.error || "影评检索失败，请稍后再试。");
        return;
      }

      setReviewSummary(result.summary || "");
      setReviewResults(result.results || []);
    } catch (error) {
      console.error(error);
      setReviewError("影评检索失败，请检查网络后再试。");
    } finally {
      setReviewLoading(false);
    }
  }

  function clearMovieReviews() {
    setReviewSummary("");
    setReviewResults([]);
    setReviewError("");
  }

  return (
    <main className="min-h-screen bg-[#080A18] text-white px-6 pt-8 pb-28">
      <section className="mx-auto max-w-[390px]">
        <div className="mb-8">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl">
              ⚡
            </div>

            <div className="rounded-full bg-yellow-400/15 border border-yellow-300/20 px-4 py-2 text-yellow-300 font-black shadow-lg">
              ⚡ {energy}
            </div>
          </div>

          <h1 className="text-4xl font-black leading-tight">
            👋 Welcome Back
            <br />
            电影探索者
          </h1>

          <p className="mt-3 text-lg font-bold text-white/80">
            像聊天一样寻找你的今日片单
          </p>
        </div>

        <div className="mb-6 rounded-[28px] bg-gradient-to-br from-emerald-300 via-cyan-300 to-blue-400 p-5 text-slate-950 shadow-xl">
          <p className="mb-4 inline-block rounded-full bg-white/30 px-3 py-1 text-sm font-bold">
            ✨ 开放式电影搜索
          </p>

          <h2 className="text-2xl font-black mb-3">你今天想看什么？</h2>

          <p className="mb-4 text-sm leading-6 text-slate-800">
            直接说你的心情、场景、口味或发布需求，我会联网找片单。
          </p>

          <div className="rounded-[24px] bg-slate-950/90 p-4 text-white">
            <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
              {messages.map((message) => (
                <div key={message.id}>
                  <div
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "bg-cyan-400 text-slate-950"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>

                  {message.movies && message.movies.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {message.movies.map((movie) => (
                        (() => {
                          const movieKey = getMovieStorageKey(movie);
                          const isSaved = savedMovieKeys.includes(movieKey);

                          return (
                        <div
                          key={`${message.id}-${movie.id || movie.title}`}
                          className="rounded-2xl border border-white/10 bg-[#12162B] p-4"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-lg font-black">
                                {movie.title}
                              </h4>

                              <p className="mt-1 text-xs text-white/40">
                                {[movie.year, movie.type].filter(Boolean).join(" · ") ||
                                  `来源：${movie.sourceTitle}`}
                              </p>
                            </div>

                            <div className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950">
                              {movie.score}%
                            </div>
                          </div>

                          {movie.posterUrl && (
                            <div className="mb-3 overflow-hidden rounded-2xl bg-white/5">
                              <Image
                                src={movie.posterUrl}
                                alt={`${movie.title} poster`}
                                width={500}
                                height={750}
                                className="h-auto w-full object-cover"
                              />
                            </div>
                          )}

                          <p className="text-sm leading-6 text-white/70">
                            {movie.reason}
                          </p>

                          <div className="mt-4 grid grid-cols-1 gap-2">
                            <a
                              href={
                                movie.tmdbUrl ||
                                `https://www.justwatch.com/us/search?q=${encodeURIComponent(
                                  getSearchTitle(movie.title)
                                )}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 py-3 text-center text-sm font-black text-slate-950"
                            >
                              {movie.tmdbUrl ? "去 TMDB 查看详情 →" : "去 JustWatch 查看 →"}
                            </a>

                            <a
                              href={`https://www.justwatch.com/us/search?q=${encodeURIComponent(
                                getSearchTitle(movie.title)
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full bg-white/10 py-3 text-center text-sm font-bold text-white"
                            >
                              查找观看平台 →
                            </a>

                            <Link
                              href={`/creator?movie=${encodeURIComponent(
                                getSearchTitle(movie.title)
                              )}`}
                              className="rounded-full bg-white/10 py-3 text-center text-sm font-bold text-white"
                            >
                              用这部电影创作内容 →
                            </Link>

                            <button
                              onClick={() => saveMovie(movie)}
                              disabled={isSaved}
                              className={`rounded-full py-3 text-center text-sm font-bold ${
                                isSaved
                                  ? "bg-emerald-400/20 text-emerald-200"
                                  : "bg-white/10 text-white"
                              }`}
                            >
                              {isSaved ? "已加入片单" : "加入片单"}
                            </button>

                            {movie.sourceUrl && (
                              <a
                                href={movie.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full bg-white/5 py-3 text-center text-sm font-bold text-white/60"
                              >
                                查看搜索来源 →
                              </a>
                            )}
                          </div>
                        </div>
                          );
                        })()
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/60">
                    正在联网搜索电影讨论、影评和片单...
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="输入你的观影需求..."
                className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
              />

              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className={`rounded-full px-5 py-3 text-sm font-black ${
                  loading
                    ? "bg-white/20 text-white/40"
                    : "bg-cyan-400 text-slate-950"
                }`}
              >
                发送
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="rounded-full bg-white/40 px-3 py-2 text-xs font-bold text-slate-800"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-[24px] bg-[#151A33] border border-white/10 p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-white/40 text-sm mb-2">网络影评检索</p>
              <h3 className="text-2xl font-black">看看大家怎么评价</h3>
              <p className="mt-2 text-sm leading-6 text-white/50">
                输入片名，我会联网整理这部电影的影评摘要和原文来源。
              </p>
            </div>

            {(reviewSummary || reviewResults.length > 0 || reviewError) && (
              <button
                onClick={clearMovieReviews}
                className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white/60"
              >
                收起
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={reviewQuery}
              onChange={(event) => setReviewQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  searchMovieReviews();
                }
              }}
              placeholder="例如：哈利波特 / 寄生虫"
              className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
            />

            <button
              onClick={searchMovieReviews}
              disabled={reviewLoading}
              className={`rounded-full px-5 py-3 text-sm font-black ${
                reviewLoading
                  ? "bg-white/20 text-white/40"
                  : "bg-cyan-400 text-slate-950"
              }`}
            >
              {reviewLoading ? "检索中" : "看影评"}
            </button>
          </div>

          {reviewError && (
            <p className="mt-4 rounded-2xl bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {reviewError}
            </p>
          )}

          {reviewSummary && (
            <div className="mt-4 rounded-2xl bg-white/10 p-4">
              <p className="text-sm leading-6 text-white/75">
                {reviewSummary}
              </p>
            </div>
          )}

          {reviewResults.length > 0 && (
            <div className="mt-4 space-y-3">
              {reviewResults.map((result) => (
                <a
                  key={result.url}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl bg-white/10 p-4 transition hover:bg-white/15"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h4 className="min-w-0 flex-1 text-sm font-black leading-5">
                      {result.title}
                    </h4>
                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/45">
                      {result.source}
                    </span>
                  </div>

                  <p className="text-xs leading-5 text-white/55">
                    {result.excerpt}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <Link
            href="/mood"
            className="rounded-[24px] bg-gradient-to-br from-orange-300 to-pink-400 p-5 text-white shadow-lg"
          >
            <p className="mb-8 text-3xl">💗</p>
            <h3 className="text-xl font-black">情绪测片</h3>
          </Link>

          <Link
            href="/creator"
            className="rounded-[24px] bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white shadow-lg"
          >
            <p className="mb-8 text-3xl">🎞️</p>
            <h3 className="text-xl font-black">内容创作</h3>
          </Link>
        </div>

        <div className="mb-6 rounded-[24px] bg-[#151A33] border border-white/10 p-5">
          <div className="mb-4">
            <p className="text-white/40 text-sm mb-2">截图与台词检索</p>
            <h3 className="text-2xl font-black">找画面，也找那句话</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">
              输入电影名或台词关键词，跳转到电影截图和台词检索网站继续查找。
            </p>
          </div>

          <input
            value={stillQuery}
            onChange={(event) => setStillQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                openStillSearch("stills");
              }
            }}
            placeholder="例如：Her / 截图 / 台词关键词"
            className="mb-3 w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-sm text-white outline-none placeholder:text-white/30"
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => openStillSearch("stills")}
              className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 py-3 text-sm font-black text-slate-950"
            >
              搜电影截图
            </button>

            <button
              onClick={() => openStillSearch("quotes")}
              className="rounded-full bg-white/10 py-3 text-sm font-bold text-white"
            >
              搜电影台词
            </button>
          </div>
        </div>

        <div className="rounded-[24px] bg-white/10 border border-white/10 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black">最近生成内容</h3>
              <p className="mt-1 text-xs text-white/40">
                已保存最近 {recentItems.length} 条搜索
              </p>
            </div>

            {recentItems.length > 0 && (
              <button
                onClick={clearRecentItems}
                className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white/50"
              >
                清空
              </button>
            )}
          </div>

          {recentItems.length === 0 && (
            <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/50">
              还没有生成记录。试着在上方输入一句观影需求吧。
            </div>
          )}

          {recentItems.length > 0 && (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <div key={item.id} className="rounded-2xl bg-white/10 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-bold">🎬 联网片单</p>
                    <p className="text-xs text-white/40">{item.createdAt}</p>
                  </div>

                  <p className="text-sm leading-6 text-white/70">
                    {item.query}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-white/50">
                    <p>首推：{item.firstMovie}</p>
                    <p>共 {item.movieCount} 部</p>
                  </div>

                  <button
                    onClick={() => {
                      setQuery(item.query);
                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                    className="mt-3 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-cyan-300"
                  >
                    再用这个需求搜索 →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
