"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import {
  getMovieStorageKey,
  getPlaylistMovies,
  removeMovieFromPlaylist,
  type StoredMovie,
} from "../lib/cinemoodStorage";

export default function PlaylistPage() {
  const [movies, setMovies] = useState<StoredMovie[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMovies(getPlaylistMovies());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function removeMovie(movie: StoredMovie) {
    setMovies(removeMovieFromPlaylist(getMovieStorageKey(movie)));
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

          <p className="text-white/40 text-sm mb-3">CineMood 收藏仓库</p>
          <h1 className="text-3xl font-black leading-tight">我的片单</h1>
          <p className="mt-3 text-white/50 text-sm">
            搜索结果和情绪测片里的电影，都可以先收进这里慢慢看。
          </p>
        </div>

        {movies.length === 0 ? (
          <div className="rounded-[24px] bg-white/10 border border-white/10 p-5">
            <p className="text-white/60 text-sm leading-6">
              片单里还没有电影。回到首页搜索时，点击“加入片单”就会出现在这里。
            </p>
            <Link
              href="/"
              className="mt-5 block rounded-full bg-cyan-400 py-3 text-center font-black text-slate-950"
            >
              去找电影
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {movies.map((movie) => (
              <div
                key={getMovieStorageKey(movie)}
                className="rounded-[24px] bg-[#12162B] border border-white/10 p-4"
              >
                {movie.posterUrl && (
                  <div className="mb-4 overflow-hidden rounded-2xl bg-white/5">
                    <Image
                      src={movie.posterUrl}
                      alt={`${movie.title} poster`}
                      width={500}
                      height={750}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                )}

                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">{movie.title}</h2>
                    <p className="mt-1 text-xs text-white/40">
                      {[movie.year, movie.type].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  {movie.score && (
                    <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950">
                      {movie.score}%
                    </span>
                  )}
                </div>

                {movie.reason && (
                  <p className="text-sm leading-6 text-white/60">
                    {movie.reason}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-1 gap-2">
                  {movie.tmdbUrl && (
                    <a
                      href={movie.tmdbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 py-3 text-center text-sm font-black text-slate-950"
                    >
                      TMDB 详情
                    </a>
                  )}

                  <Link
                    href={`/creator?movie=${encodeURIComponent(movie.title)}`}
                    className="rounded-full bg-white/10 py-3 text-center text-sm font-bold text-white"
                  >
                    用它创作内容
                  </Link>

                  <button
                    onClick={() => removeMovie(movie)}
                    className="rounded-full bg-white/5 py-3 text-sm font-bold text-white/50"
                  >
                    移出片单
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
