"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import BottomNav from "../components/BottomNav";
import {
  getCurrentAuthUser,
  canClaimDailyEnergy,
  claimDailyEnergy,
  getCheckinState,
  getCreationRecords,
  getDiaryEntries,
  getEnergyValue,
  getPlaylistMovies,
  getProfileStats,
  getUserProfile,
  saveUserProfile,
  loginAuthUser,
  logoutAuthUser,
  registerAuthUser,
  type AuthUser,
  type CheckinState,
  type ProfileStats,
  type UserProfile,
} from "../lib/cinemoodStorage";

const defaultStats: ProfileStats = {
  totalExplores: 0,
  coreMood: "治愈",
  coreScene: "深夜",
  tags: ["深夜", "治愈"],
};

const avatarOptions = ["⚡", "🎬", "🌙", "🍿", "🎞️", "📽️", "💫", "🪐"];

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authIdentifier, setAuthIdentifier] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authNickname, setAuthNickname] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthPanelOpen, setIsAuthPanelOpen] = useState(true);
  const [stats, setStats] = useState(defaultStats);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    nickname: "电影探索者",
    avatar: "⚡",
    avatarType: "emoji",
  });
  const [nicknameDraft, setNicknameDraft] = useState("电影探索者");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [energy, setEnergy] = useState(0);
  const [checkinState, setCheckinState] = useState<CheckinState>({
    lastClaimDate: "",
    totalBonus: 0,
    history: [],
  });
  const [canClaim, setCanClaim] = useState(false);
  const [playlistCount, setPlaylistCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [diaryCount, setDiaryCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadProfileData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function loadProfileData() {
    const authUser = getCurrentAuthUser();
    const currentStats = getProfileStats();
    const currentProfile = getUserProfile();

    setCurrentUser(authUser);
    setIsAuthPanelOpen(!authUser);
    setStats(currentStats);
    setUserProfile(currentProfile);
    setNicknameDraft(currentProfile.nickname);
    setEnergy(getEnergyValue(currentStats));
    setCheckinState(getCheckinState());
    setCanClaim(canClaimDailyEnergy());
    setPlaylistCount(getPlaylistMovies().length);
    setRecordCount(getCreationRecords().length);
    setDiaryCount(getDiaryEntries().length);
  }

  function resetAuthForm() {
    setAuthIdentifier("");
    setAuthPassword("");
    setAuthNickname("");
    setAuthError("");
  }

  function handleAuthSubmit() {
    setAuthError("");

    const result =
      authMode === "register"
        ? registerAuthUser({
            identifier: authIdentifier,
            password: authPassword,
            nickname: authNickname,
          })
        : loginAuthUser({
            identifier: authIdentifier,
            password: authPassword,
          });

    if (!result.ok) {
      setAuthError(result.error || "登录失败，请检查后再试");
      return;
    }

    resetAuthForm();
    setIsEditingProfile(false);
    setIsAuthPanelOpen(false);
    loadProfileData();
  }

  function handleLogout() {
    logoutAuthUser();
    resetAuthForm();
    setIsEditingProfile(false);
    setIsAuthPanelOpen(true);
    loadProfileData();
  }

  function handleDailyCheckin() {
    const result = claimDailyEnergy();
    const currentStats = getProfileStats();

    setStats(currentStats);
    setEnergy(getEnergyValue(currentStats));
    setCheckinState({
      lastClaimDate: result.lastClaimDate,
      totalBonus: result.totalBonus,
      history: result.history,
    });
    setCanClaim(false);
  }

  function updateAvatar(avatar: string) {
    const nextProfile = saveUserProfile({
      ...userProfile,
      avatar,
      avatarType: "emoji",
    });

    setUserProfile(nextProfile);
  }

  function updateNickname() {
    const nextProfile = saveUserProfile({
      ...userProfile,
      nickname: nicknameDraft,
    });

    setUserProfile(nextProfile);
    setNicknameDraft(nextProfile.nickname);
    setIsEditingProfile(false);
  }

  function uploadAvatar(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = () => {
      const avatar = String(reader.result || "");
      const nextProfile = saveUserProfile({
        ...userProfile,
        avatar,
        avatarType: "image",
      });

      setUserProfile(nextProfile);
    };

    reader.readAsDataURL(file);
  }

  function renderAvatar(sizeClass: string, textClass: string) {
    if (userProfile.avatarType === "image" && userProfile.avatar) {
      return (
        <span
          className={`relative inline-flex overflow-hidden rounded-full bg-white ${sizeClass}`}
        >
          <Image
            src={userProfile.avatar}
            alt="用户头像"
            fill
            unoptimized
            className="object-cover"
          />
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-white ${sizeClass} ${textClass}`}
      >
        {userProfile.avatar}
      </span>
    );
  }

  return (
    <main className="min-h-screen bg-[#080A18] text-white px-6 pt-8 pb-28">
      <section className="mx-auto max-w-[390px]">
        <div className="mb-6 text-center">
          <h1 className="mb-6 text-4xl font-black">
            <span className="bg-gradient-to-r from-lime-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
              CineMood
            </span>
          </h1>

          <div className="mb-4">{renderAvatar("h-24 w-24", "text-5xl")}</div>

          <h2 className="text-3xl font-black">{userProfile.nickname}</h2>

          <button
            onClick={() => setIsEditingProfile((value) => !value)}
            className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/70"
          >
            {isEditingProfile ? "收起编辑" : "编辑个人资料"}
          </button>

          {currentUser && !isAuthPanelOpen && (
            <button
              onClick={() => setIsAuthPanelOpen(true)}
              className="mt-3 rounded-full bg-cyan-400/15 px-4 py-2 text-xs font-bold text-cyan-200"
            >
              已登录：{currentUser.identifier} · 管理账号
            </button>
          )}
        </div>

        {(!currentUser || isAuthPanelOpen) && (
        <div className="mb-5 rounded-[24px] bg-white/10 border border-white/10 p-5">
          {currentUser ? (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-white/40">当前账号</p>
                <p className="mt-1 truncate text-base font-black">
                  {currentUser.identifier}
                </p>
                <p className="mt-1 text-xs text-white/35">
                  已开启个人化数据空间
                </p>
              </div>

              <button
                onClick={() => setIsAuthPanelOpen(false)}
                className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/60"
              >
                收起
              </button>
              <button
                onClick={handleLogout}
                className="shrink-0 rounded-full bg-red-400/10 px-4 py-2 text-sm font-bold text-red-200"
              >
                退出
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex rounded-full bg-white/5 p-1">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                  }}
                  className={`flex-1 rounded-full py-2 text-sm font-black ${
                    authMode === "login"
                      ? "bg-cyan-400 text-slate-950"
                      : "text-white/45"
                  }`}
                >
                  登录
                </button>

                <button
                  onClick={() => {
                    setAuthMode("register");
                    setAuthError("");
                  }}
                  className={`flex-1 rounded-full py-2 text-sm font-black ${
                    authMode === "register"
                      ? "bg-cyan-400 text-slate-950"
                      : "text-white/45"
                  }`}
                >
                  注册
                </button>
              </div>

              <div className="space-y-3">
                <input
                  value={authIdentifier}
                  onChange={(event) => setAuthIdentifier(event.target.value)}
                  placeholder="手机号或邮箱"
                  className="w-full rounded-full bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                />

                <input
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleAuthSubmit();
                  }}
                  type="password"
                  placeholder="密码，至少 6 位"
                  className="w-full rounded-full bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                />

                {authMode === "register" && (
                  <input
                    value={authNickname}
                    onChange={(event) => setAuthNickname(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleAuthSubmit();
                    }}
                    placeholder="昵称，可选"
                    className="w-full rounded-full bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                  />
                )}
              </div>

              {authError && (
                <p className="mt-3 rounded-2xl bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {authError}
                </p>
              )}

              <button
                onClick={handleAuthSubmit}
                className="mt-4 w-full rounded-full bg-cyan-400 py-3 text-sm font-black text-slate-950"
              >
                {authMode === "register" ? "创建账号并登录" : "登录到我的空间"}
              </button>

              <p className="mt-3 text-xs leading-5 text-white/35">
                当前为原型版本，账号资料保存在本机浏览器中。
              </p>
            </div>
          )}
        </div>
        )}

        {isEditingProfile && (
          <div className="mb-5 rounded-[24px] bg-white/10 border border-white/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-white/40">个人资料</p>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/50"
              >
                收起
              </button>
            </div>

            <div className="mb-4 flex items-center gap-4">
              {renderAvatar("h-16 w-16", "text-3xl")}

              <div className="min-w-0 flex-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-full bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950"
                >
                  上传头像图片
                </button>
                <p className="mt-2 text-xs leading-5 text-white/35">
                  图片会保存在当前浏览器中。
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => {
                uploadAvatar(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
              className="hidden"
            />

            <div className="mb-4 grid grid-cols-4 gap-3">
              {avatarOptions.map((avatar) => {
                const active =
                  userProfile.avatarType !== "image" &&
                  userProfile.avatar === avatar;

                return (
                  <button
                    key={avatar}
                    onClick={() => updateAvatar(avatar)}
                    className={`flex aspect-square items-center justify-center rounded-2xl border text-3xl transition ${
                      active
                        ? "border-cyan-300 bg-cyan-300 text-slate-950"
                        : "border-white/10 bg-white/5 text-white"
                    }`}
                    aria-label={`选择头像 ${avatar}`}
                  >
                    {avatar}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                value={nicknameDraft}
                onChange={(event) => setNicknameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") updateNickname();
                }}
                placeholder="输入你的昵称"
                className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
              />

              <button
                onClick={updateNickname}
                className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950"
              >
                保存
              </button>
            </div>
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 gap-4">
          <div className="rounded-[22px] bg-white/5 border border-white/10 p-5">
            <p className="mb-4 text-4xl">⚡</p>
            <p className="text-4xl font-black text-yellow-300">
              {energy}
            </p>
            <p className="mt-1 text-sm text-white/50">能量值</p>
          </div>

          <div className="rounded-[22px] bg-white/5 border border-white/10 p-5">
            <p className="mb-4 text-4xl">🌙 + 🎬</p>
            <h3 className="text-xl font-black">标签偏好</h3>
            <p className="mt-1 text-sm text-white/50">
              {stats.tags.join(" · ")}
            </p>
          </div>
        </div>

        <Link
          href="/mood"
          className="mb-5 block rounded-[24px] bg-white/10 border border-white/10 p-5"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black">我的电影基因</h3>
              <p className="mt-1 text-sm text-white/40">
                会根据搜索关键词、情绪测片和片单持续变化
              </p>
            </div>

            <p className="text-3xl text-white/50">›</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-3xl font-black text-cyan-300">
                {stats.totalExplores}
              </p>
              <p className="mt-1 text-xs text-white/40">累计探索</p>
            </div>

            <div>
              <p className="text-xl font-black text-yellow-300">
                {stats.coreMood}
              </p>
              <p className="mt-1 text-xs text-white/40">核心情绪</p>
            </div>

            <div>
              <p className="text-xl font-black text-pink-300">
                {stats.coreScene}
              </p>
              <p className="mt-1 text-xs text-white/40">核心场景</p>
            </div>
          </div>
        </Link>

        <div className="rounded-[24px] bg-white/10 border border-white/10 overflow-hidden">
          <button
            onClick={handleDailyCheckin}
            disabled={!canClaim}
            className="flex w-full items-center justify-between border-b border-white/10 px-5 py-5 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <span className="text-left">
                <span className="block font-black">每日签到</span>
                <span className="mt-1 block text-xs font-normal text-white/35">
                  {checkinState.lastClaimDate
                    ? `上次打卡：${checkinState.lastClaimDate}`
                    : "今天来领取第一份能量"}
                </span>
              </span>
            </div>

            <span
              className={`font-bold ${
                canClaim ? "text-cyan-300" : "text-white/35"
              }`}
            >
              {canClaim ? "+5 能量 ›" : "今日已领"}
            </span>
          </button>

          <Link
            href="/playlist"
            className="flex items-center justify-between border-b border-white/10 px-5 py-5"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎬</span>
              <span className="font-black">我的片单</span>
            </div>

            <span className="text-white/40">
              {playlistCount > 0 ? `${playlistCount} 部 ›` : "去收藏 ›"}
            </span>
          </Link>

          <Link
            href="/records"
            className="flex items-center justify-between border-b border-white/10 px-5 py-5"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✍️</span>
              <span className="font-black">创作记录</span>
            </div>

            <span className="text-white/40">
              {recordCount > 0 ? `${recordCount} 条 ›` : "查看 ›"}
            </span>
          </Link>

          <Link
            href="/diary"
            className="flex items-center justify-between border-b border-white/10 px-5 py-5"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📓</span>
              <span className="font-black">观影日记</span>
            </div>

            <span className="text-white/40">
              {diaryCount > 0 ? `${diaryCount} 篇 ›` : "写影评 ›"}
            </span>
          </Link>

          <div className="flex items-center justify-between px-5 py-5 opacity-50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <span className="font-black">联系客服</span>
            </div>

            <span className="text-white/40">›</span>
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
