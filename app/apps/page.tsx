import Link from "next/link";
import BottomNav from "../components/BottomNav";

const appItems = [
  {
    emoji: "🎭",
    title: "情绪测片",
    desc: "根据你的心情和场景推荐电影",
    href: "/mood",
    color: "from-cyan-500/30 to-blue-500/20",
  },
  {
    emoji: "✍️",
    title: "内容创作",
    desc: "生成小红书、抖音、B站、公众号文案",
    href: "/creator",
    color: "from-purple-500/30 to-pink-500/20",
  },
  {
    emoji: "🌙",
    title: "深夜独处",
    desc: "为一个人的夜晚寻找合适电影",
    href: "/mood",
    color: "from-indigo-500/30 to-violet-500/20",
  },
  {
    emoji: "💕",
    title: "约会片单",
    desc: "为约会、暧昧、周末放松找电影",
    href: "/mood",
    color: "from-rose-500/30 to-orange-500/20",
  },
  {
    emoji: "📱",
    title: "短视频灵感",
    desc: "把电影变成口播稿和视频选题",
    href: "/creator",
    color: "from-emerald-500/30 to-cyan-500/20",
  },
  {
    emoji: "🎓",
    title: "课堂展示",
    desc: "为 presentation 找电影案例和分析角度",
    href: "/creator",
    color: "from-yellow-500/30 to-orange-500/20",
  },
  {
    emoji: "📣",
    title: "影视营销",
    desc: "分析电影如何种草、传播和破圈",
    href: "/creator",
    color: "from-red-500/30 to-purple-500/20",
  },
];

export default function AppsPage() {
  return (
    <main className="min-h-screen bg-[#080A18] text-white px-6 pt-8 pb-28">
      <section className="mx-auto max-w-[390px]">
        <div className="mb-8">
          <Link
            href="/"
            className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl"
          >
            ←
          </Link>

          <div className="mb-6 grid grid-cols-3 rounded-full bg-white/10 p-1 text-sm font-bold text-white/50">
            <div className="rounded-full px-3 py-3 text-center">随心寻片</div>
            <div className="rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-3 py-3 text-center text-white">
              生活应用
            </div>
            <div className="rounded-full px-3 py-3 text-center">场景实用</div>
          </div>

          <h1 className="text-3xl font-black leading-tight text-cyan-300">
            让电影为你赋能
          </h1>

          <p className="mt-3 text-white/50 text-sm leading-6">
            选择一个使用场景，把电影推荐、内容创作和影视分析变成你的工具。
          </p>
        </div>

        <div className="space-y-4">
          {appItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`block rounded-[22px] border border-white/10 bg-gradient-to-r ${item.color} p-5`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                    {item.emoji}
                  </div>

                  <div>
                    <h2 className="text-xl font-black">{item.title}</h2>
                    <p className="mt-1 text-sm text-white/50">{item.desc}</p>
                  </div>
                </div>

                <p className="text-2xl text-white/60">→</p>
              </div>
            </Link>
          ))}

          <div className="rounded-[22px] border border-white/10 bg-white/5 p-5 opacity-70">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                  🧠
                </div>

                <div>
                  <h2 className="text-xl font-black">电影人格测试</h2>
                  <p className="mt-1 text-sm text-white/50">
                    根据观影偏好生成你的电影人格
                  </p>
                </div>
              </div>

              <p className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-bold text-yellow-300">
                开发中
              </p>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}