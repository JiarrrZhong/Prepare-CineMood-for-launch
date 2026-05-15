"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import {
  getCreationRecords,
  removeCreationRecord,
  type CreationRecord,
} from "../lib/cinemoodStorage";

export default function RecordsPage() {
  const [records, setRecords] = useState<CreationRecord[]>([]);
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRecords(getCreationRecords());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function copyRecord(record: CreationRecord) {
    await navigator.clipboard.writeText(record.content);
    setCopiedId(record.id);
    window.setTimeout(() => setCopiedId(""), 1200);
  }

  function removeRecord(recordId: string) {
    setRecords(removeCreationRecord(recordId));
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

          <p className="text-white/40 text-sm mb-3">CineMood 内容库</p>
          <h1 className="text-3xl font-black leading-tight">创作记录</h1>
          <p className="mt-3 text-white/50 text-sm">
            每一次在文案板块生成的内容，都会自动沉淀在这里。
          </p>
        </div>

        {records.length === 0 ? (
          <div className="rounded-[24px] bg-white/10 border border-white/10 p-5">
            <p className="text-white/60 text-sm leading-6">
              还没有创作记录。去内容创作页生成一次文案，就会自动保存。
            </p>
            <Link
              href="/creator"
              className="mt-5 block rounded-full bg-cyan-400 py-3 text-center font-black text-slate-950"
            >
              去创作
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="rounded-[24px] bg-[#12162B] border border-white/10 p-5"
              >
                <div className="mb-4">
                  <p className="text-xs text-white/40">
                    {new Date(record.createdAt).toLocaleString("zh-CN")}
                  </p>
                  <h2 className="mt-2 text-xl font-black">
                    {record.movieTitle}
                  </h2>
                  <p className="mt-1 text-xs text-white/40">
                    {record.platform} · {record.style} · {record.goal}
                  </p>
                </div>

                <p className="whitespace-pre-line text-sm leading-7 text-white/70 line-clamp-6">
                  {record.content}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => copyRecord(record)}
                    className="rounded-full bg-cyan-400 py-3 text-sm font-black text-slate-950"
                  >
                    {copiedId === record.id ? "已复制" : "复制"}
                  </button>

                  <button
                    onClick={() => removeRecord(record.id)}
                    className="rounded-full bg-white/10 py-3 text-sm font-bold text-white/60"
                  >
                    删除
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
