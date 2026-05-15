"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "发现",
    href: "/",
    icon: "🟢",
  },
  {
    label: "我的",
    href: "/profile",
    icon: "👤",
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[260px] -translate-x-1/2 rounded-full border border-white/10 bg-[#14172B]/90 px-4 py-3 shadow-2xl backdrop-blur">
      <div className="grid grid-cols-2 gap-2">
        {navItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-bold transition ${
                active
                  ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950"
                  : "text-white/50"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
