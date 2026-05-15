"use client";

export type StoredMovie = {
  id?: number;
  title: string;
  year?: string;
  type?: string;
  score?: number;
  reason?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  posterUrl?: string;
  tmdbUrl?: string;
  overview?: string;
  savedAt?: string;
};

export type SearchActivity = {
  id: string;
  query: string;
  mood?: string;
  scene?: string;
  movieTitles: string[];
  movieTypes: string[];
  createdAt: string;
};

export type CreationRecord = {
  id: string;
  movieTitle: string;
  platform: string;
  style: string;
  goal: string;
  content: string;
  source?: string;
  createdAt: string;
};

export type DiaryEntry = {
  id: string;
  title: string;
  movieTitle: string;
  body: string;
  rating: string;
  mood: string;
  createdAt: string;
  updatedAt: string;
};

export type ProfileStats = {
  totalExplores: number;
  coreMood: string;
  coreScene: string;
  tags: string[];
};

export type CheckinState = {
  lastClaimDate: string;
  totalBonus: number;
  history: string[];
};

export type UserProfile = {
  nickname: string;
  avatar: string;
  avatarType?: "emoji" | "image";
};

export type AuthUser = {
  id: string;
  identifier: string;
  identifierType: "phone" | "email";
  nickname: string;
  createdAt: string;
  lastLoginAt: string;
};

type StoredAuthUser = AuthUser & {
  password: string;
};

const keys = {
  playlist: "cinemood_playlist_movies",
  activities: "cinemood_search_activities",
  creationRecords: "cinemood_creation_records",
  diaries: "cinemood_diary_entries",
  checkin: "cinemood_daily_checkin",
  userProfile: "cinemood_user_profile",
  authUsers: "cinemood_auth_users",
  currentUser: "cinemood_current_user",
};

const baseEnergy = 0;
const dailyEnergyReward = 5;

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

function getIdentifierType(identifier: string): AuthUser["identifierType"] | "" {
  const value = normalizeIdentifier(identifier);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
  if (/^[0-9+\-\s]{6,20}$/.test(identifier.trim())) return "phone";
  return "";
}

function createUserId(identifier: string) {
  return normalizeIdentifier(identifier).replace(/[^a-z0-9]+/g, "_");
}

function getAuthUsers() {
  const saved = localStorage.getItem(keys.authUsers);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as StoredAuthUser[]) : [];
  } catch {
    return [];
  }
}

function saveAuthUsers(users: StoredAuthUser[]) {
  localStorage.setItem(keys.authUsers, JSON.stringify(users));
}

function getScopedKey(key: string) {
  if (key === keys.authUsers || key === keys.currentUser) return key;

  const user = getCurrentAuthUser();
  return user ? `cinemood_account_${user.id}_${key}` : key;
}

function readArray<T>(key: string): T[] {
  const saved = localStorage.getItem(getScopedKey(key));
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, items: T[]) {
  localStorage.setItem(getScopedKey(key), JSON.stringify(items));
}

function readObject<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(getScopedKey(key));
  if (!saved) return fallback;

  try {
    return {
      ...fallback,
      ...JSON.parse(saved),
    };
  } catch {
    return fallback;
  }
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function countOne(counter: Record<string, number>, value?: string) {
  if (!value) return;
  counter[value] = (counter[value] || 0) + 1;
}

function topValue(counter: Record<string, number>, fallback: string) {
  const sorted = Object.entries(counter).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || fallback;
}

function inferMood(text: string) {
  if (/焦虑|压力|紧张|不安|anxiety|stress/i.test(text)) return "焦虑";
  if (/孤独|独处|一个人|lonely|alone/i.test(text)) return "孤独";
  if (/疲惫|累|低能量|下班|tired/i.test(text)) return "疲惫";
  if (/想哭|催泪|难过|悲伤|cry|sad/i.test(text)) return "想哭";
  if (/浪漫|爱情|约会|心动|romance|date/i.test(text)) return "浪漫";
  if (/治愈|轻松|温暖|开心|comfort|healing/i.test(text)) return "治愈";
  return "";
}

function inferScene(text: string) {
  if (/深夜|夜晚|睡前|late night/i.test(text)) return "深夜";
  if (/周末|放松|weekend/i.test(text)) return "周末";
  if (/朋友|聚会|一起看|friends/i.test(text)) return "朋友";
  if (/约会|暧昧|date/i.test(text)) return "约会";
  if (/通勤|短片|短一点|commute/i.test(text)) return "通勤";
  if (/灵感|创作|小红书|审美|inspiration/i.test(text)) return "灵感";
  return "";
}

function inferTags(text: string) {
  const tags: string[] = [];
  const pairs: Array<[RegExp, string]> = [
    [/治愈|轻松|温暖|comfort|healing/i, "治愈"],
    [/深夜|夜晚|late night/i, "深夜"],
    [/爱情|浪漫|约会|romance/i, "浪漫"],
    [/喜剧|开心|comedy/i, "喜剧"],
    [/剧情|文艺|drama/i, "剧情"],
    [/科幻|未来|宇宙|sci.?fi/i, "科幻"],
    [/悬疑|推理|反转|mystery/i, "悬疑"],
    [/动画|家庭|亲子|animation|family/i, "动画"],
    [/音乐|青春|校园|music/i, "音乐"],
    [/高颜值|画面|审美|氛围|visual|aesthetic/i, "高颜值"],
  ];

  for (const [pattern, tag] of pairs) {
    if (pattern.test(text)) tags.push(tag);
  }

  return tags;
}

export function getMovieStorageKey(movie: Pick<StoredMovie, "id" | "title">) {
  return movie.id ? `tmdb-${movie.id}` : `title-${movie.title.toLowerCase()}`;
}

export function getPlaylistMovies() {
  return readArray<StoredMovie>(keys.playlist);
}

export function getPlaylistMovieKeys() {
  return getPlaylistMovies().map(getMovieStorageKey);
}

export function addMovieToPlaylist(movie: StoredMovie) {
  const movies = getPlaylistMovies();
  const movieKey = getMovieStorageKey(movie);
  const exists = movies.some((item) => getMovieStorageKey(item) === movieKey);

  if (exists) return false;

  writeArray(keys.playlist, [
    {
      ...movie,
      savedAt: new Date().toISOString(),
    },
    ...movies,
  ]);

  return true;
}

export function removeMovieFromPlaylist(movieKey: string) {
  const movies = getPlaylistMovies().filter(
    (movie) => getMovieStorageKey(movie) !== movieKey
  );
  writeArray(keys.playlist, movies);
  return movies;
}

export function recordSearchActivity(input: {
  query: string;
  mood?: string;
  scene?: string;
  movies?: StoredMovie[];
}) {
  const activities = readArray<SearchActivity>(keys.activities);
  const next: SearchActivity = {
    id: Date.now().toString(),
    query: input.query,
    mood: input.mood,
    scene: input.scene,
    movieTitles: (input.movies || []).map((movie) => movie.title).slice(0, 8),
    movieTypes: (input.movies || [])
      .map((movie) => movie.type || "")
      .filter(Boolean)
      .slice(0, 8),
    createdAt: new Date().toISOString(),
  };

  writeArray(keys.activities, [next, ...activities].slice(0, 200));
}

export function getProfileStats(): ProfileStats {
  const activities = readArray<SearchActivity>(keys.activities);
  const moodCounter: Record<string, number> = {};
  const sceneCounter: Record<string, number> = {};
  const tagCounter: Record<string, number> = {};

  for (const activity of activities) {
    const text = `${activity.query} ${activity.movieTypes.join(" ")}`;
    countOne(moodCounter, activity.mood || inferMood(text));
    countOne(sceneCounter, activity.scene || inferScene(text));

    for (const tag of inferTags(text)) {
      countOne(tagCounter, tag);
    }
  }

  const tags = Object.entries(tagCounter)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 2);

  return {
    totalExplores: activities.length,
    coreMood: topValue(moodCounter, "治愈"),
    coreScene: topValue(sceneCounter, "深夜"),
    tags: tags.length > 0 ? tags : ["深夜", "治愈"],
  };
}

export function getCheckinState(): CheckinState {
  return readObject<CheckinState>(keys.checkin, {
    lastClaimDate: "",
    totalBonus: 0,
    history: [],
  });
}

export function canClaimDailyEnergy() {
  return getCheckinState().lastClaimDate !== getTodayKey();
}

export function claimDailyEnergy() {
  const today = getTodayKey();
  const state = getCheckinState();

  if (state.lastClaimDate === today) {
    return {
      ...state,
      claimed: false,
      today,
      reward: dailyEnergyReward,
    };
  }

  const nextState: CheckinState = {
    lastClaimDate: today,
    totalBonus: state.totalBonus + dailyEnergyReward,
    history: Array.from(new Set([today, ...state.history])).slice(0, 365),
  };

  localStorage.setItem(getScopedKey(keys.checkin), JSON.stringify(nextState));

  return {
    ...nextState,
    claimed: true,
    today,
    reward: dailyEnergyReward,
  };
}

export function getEnergyValue(stats = getProfileStats()) {
  return baseEnergy + stats.totalExplores * 2 + getCheckinState().totalBonus;
}

export function getUserProfile(): UserProfile {
  return readObject<UserProfile>(keys.userProfile, {
    nickname: "电影探索者",
    avatar: "⚡",
    avatarType: "emoji",
  });
}

export function saveUserProfile(profile: UserProfile) {
  const nextProfile = {
    nickname: profile.nickname.trim() || "电影探索者",
    avatar: profile.avatar || "⚡",
    avatarType: profile.avatarType || "emoji",
  };

  localStorage.setItem(getScopedKey(keys.userProfile), JSON.stringify(nextProfile));
  return nextProfile;
}

export function getCurrentAuthUser(): AuthUser | null {
  const saved = localStorage.getItem(keys.currentUser);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved) as AuthUser;
    return parsed?.id && parsed?.identifier ? parsed : null;
  } catch {
    return null;
  }
}

export function registerAuthUser(input: {
  identifier: string;
  password: string;
  nickname?: string;
}) {
  const identifier = normalizeIdentifier(input.identifier);
  const identifierType = getIdentifierType(input.identifier);
  const password = input.password.trim();

  if (!identifierType) {
    return {
      ok: false,
      error: "请输入有效的手机号或邮箱",
    };
  }

  if (password.length < 6) {
    return {
      ok: false,
      error: "密码至少需要 6 位",
    };
  }

  const users = getAuthUsers();
  const exists = users.some((user) => user.identifier === identifier);

  if (exists) {
    return {
      ok: false,
      error: "这个账号已经注册，可以直接登录",
    };
  }

  const now = new Date().toISOString();
  const user: StoredAuthUser = {
    id: createUserId(identifier),
    identifier,
    identifierType,
    nickname: input.nickname?.trim() || "电影探索者",
    password,
    createdAt: now,
    lastLoginAt: now,
  };

  saveAuthUsers([user, ...users]);

  const currentUser = toAuthUser(user);
  localStorage.setItem(keys.currentUser, JSON.stringify(currentUser));
  saveUserProfile({
    nickname: currentUser.nickname,
    avatar: "⚡",
    avatarType: "emoji",
  });

  return {
    ok: true,
    user: currentUser,
  };
}

export function loginAuthUser(input: { identifier: string; password: string }) {
  const identifier = normalizeIdentifier(input.identifier);
  const password = input.password.trim();
  const users = getAuthUsers();
  const userIndex = users.findIndex((user) => user.identifier === identifier);
  const user = users[userIndex];

  if (!user || user.password !== password) {
    return {
      ok: false,
      error: "账号或密码不正确",
    };
  }

  const nextUser: StoredAuthUser = {
    ...user,
    lastLoginAt: new Date().toISOString(),
  };

  users[userIndex] = nextUser;
  saveAuthUsers(users);

  const currentUser = toAuthUser(nextUser);
  localStorage.setItem(keys.currentUser, JSON.stringify(currentUser));

  return {
    ok: true,
    user: currentUser,
  };
}

export function logoutAuthUser() {
  localStorage.removeItem(keys.currentUser);
}

function toAuthUser(user: StoredAuthUser): AuthUser {
  return {
    id: user.id,
    identifier: user.identifier,
    identifierType: user.identifierType,
    nickname: user.nickname,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export function getCreationRecords() {
  return readArray<CreationRecord>(keys.creationRecords);
}

export function addCreationRecord(record: Omit<CreationRecord, "id" | "createdAt">) {
  const records = getCreationRecords();
  const next: CreationRecord = {
    ...record,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };

  writeArray(keys.creationRecords, [next, ...records].slice(0, 100));
  return next;
}

export function removeCreationRecord(recordId: string) {
  const records = getCreationRecords().filter((record) => record.id !== recordId);
  writeArray(keys.creationRecords, records);
  return records;
}

export function getDiaryEntries() {
  return readArray<DiaryEntry>(keys.diaries);
}

export function addDiaryEntry(entry: Omit<DiaryEntry, "id" | "createdAt" | "updatedAt">) {
  const entries = getDiaryEntries();
  const now = new Date().toISOString();
  const next: DiaryEntry = {
    ...entry,
    id: Date.now().toString(),
    createdAt: now,
    updatedAt: now,
  };

  writeArray(keys.diaries, [next, ...entries].slice(0, 200));
  return next;
}

export function updateDiaryEntry(
  entryId: string,
  updates: Omit<DiaryEntry, "id" | "createdAt" | "updatedAt">
) {
  const now = new Date().toISOString();
  const entries = getDiaryEntries();
  let updatedEntry: DiaryEntry | null = null;

  const nextEntries = entries.map((entry) => {
    if (entry.id !== entryId) return entry;

    updatedEntry = {
      ...entry,
      ...updates,
      updatedAt: now,
    };

    return updatedEntry;
  });

  writeArray(keys.diaries, nextEntries);
  return updatedEntry;
}

export function removeDiaryEntry(entryId: string) {
  const entries = getDiaryEntries().filter((entry) => entry.id !== entryId);
  writeArray(keys.diaries, entries);
  return entries;
}
