export type TmdbMovie = {
  id: number;
  title: string;
  originalTitle: string;
  year: string;
  type: string;
  score: number;
  reason: string;
  time: string;
  warning: string;
  angle: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  tmdbUrl: string;
  sourceTitle: string;
  sourceUrl: string;
};

type TmdbMovieResult = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  release_date?: string;
  genre_ids?: number[];
  vote_average?: number;
  vote_count?: number;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
};

type DiscoverIntent = {
  genres: number[];
  withoutGenres: number[];
  sortBy: string;
  voteAverageGte: number;
  voteCountGte: number;
  runtimeLte?: number;
  keywords: string[];
  countries: string[];
  originalLanguage?: string;
  yearFrom?: string;
  yearTo?: string;
};

export type MovieSearchFilters = {
  topic?: string;
  yearFrom?: string;
  yearTo?: string;
  region?: string;
  director?: string;
  actor?: string;
  language?: string;
  award?: string;
};

const genreNames: Record<number, string> = {
  12: "冒险",
  14: "奇幻",
  16: "动画",
  18: "剧情",
  27: "恐怖",
  28: "动作",
  35: "喜剧",
  36: "历史",
  53: "惊悚",
  80: "犯罪",
  99: "纪录",
  878: "科幻",
  9648: "悬疑",
  10402: "音乐",
  10749: "爱情",
  10751: "家庭",
  10752: "战争",
};

const tmdbRequestTimeoutMs = 12000;

const languageCodes: Record<string, string> = {
  英语: "en",
  英文: "en",
  english: "en",
  日语: "ja",
  日文: "ja",
  japanese: "ja",
  韩语: "ko",
  韩文: "ko",
  korean: "ko",
  法语: "fr",
  french: "fr",
  西班牙语: "es",
  spanish: "es",
  德语: "de",
  german: "de",
  意大利语: "it",
  italian: "it",
  中文: "zh",
  华语: "zh",
  普通话: "zh",
  国语: "zh",
  chinese: "zh",
};

const countryCodes: Record<string, string> = {
  美国: "US",
  好莱坞: "US",
  英国: "GB",
  日本: "JP",
  韩国: "KR",
  法国: "FR",
  中国: "CN",
  内地: "CN",
  大陆: "CN",
  香港: "HK",
  台湾: "TW",
  印度: "IN",
  德国: "DE",
  意大利: "IT",
  西班牙: "ES",
};

const awardTitleSeeds: Record<string, string[]> = {
  奥斯卡: [
    "Parasite",
    "Everything Everywhere All at Once",
    "Moonlight",
    "Nomadland",
    "The Shape of Water",
    "Spotlight",
    "Birdman",
    "12 Years a Slave",
    "The Lord of the Rings: The Return of the King",
  ],
  金棕榈: [
    "Parasite",
    "Anora",
    "Anatomy of a Fall",
    "Triangle of Sadness",
    "Titane",
    "Shoplifters",
    "The Square",
    "I, Daniel Blake",
  ],
  金熊: [
    "Synonyms",
    "Touch Me Not",
    "On Body and Soul",
    "Fuocoammare",
  ],
  金狮: [
    "Poor Things",
    "All the Beauty and the Bloodshed",
    "Nomadland",
    "Joker",
    "Roma",
    "The Shape of Water",
  ],
};

const curatedTitleSeeds: Array<{
  pattern: RegExp;
  titles: string[];
}> = [
  {
    pattern: /焦虑|疲惫|低能量|压力|紧张|轻松|治愈|疗愈|不虐|comfort|healing|anxiety|stress|tired/i,
    titles: [
      "Paddington",
      "Paddington 2",
      "Little Forest",
      "The Intern",
      "Chef",
      "Julie & Julia",
      "Soul",
      "The Secret Life of Walter Mitty",
      "Our Little Sister",
      "Kiki's Delivery Service",
      "About Time",
      "A Man Called Otto",
    ],
  },
  {
    pattern: /失恋|分手|后劲|不要太虐|爱情创伤|heartbreak|breakup/i,
    titles: [
      "About Time",
      "Before Sunrise",
      "Before Sunset",
      "The Worst Person in the World",
      "La La Land",
      "Begin Again",
      "Her",
      "Eternal Sunshine of the Spotless Mind",
      "Lost in Translation",
      "Sing Street",
      "500 Days of Summer",
      "Past Lives",
    ],
  },
  {
    pattern: /深夜|独处|孤独|一个人|文艺|安静|late night|lonely|alone/i,
    titles: [
      "Her",
      "Paterson",
      "Columbus",
      "Lost in Translation",
      "Before Sunrise",
      "Drive My Car",
      "Aftersun",
      "Moonlight",
      "Frances Ha",
      "The Secret Life of Walter Mitty",
    ],
  },
  {
    pattern: /周末|放松|朋友聚会|约会|开心|快乐|feel good|weekend|date night/i,
    titles: [
      "About Time",
      "Paddington 2",
      "Sing Street",
      "La La Land",
      "Chef",
      "The Grand Budapest Hotel",
      "Amélie",
      "Before Sunrise",
      "The Intern",
      "Begin Again",
    ],
  },
  {
    pattern: /战争|战场|军事|二战|一战|反战|军旅|war|military|battle|wwii|world war/i,
    titles: [
      "Saving Private Ryan",
      "1917",
      "Dunkirk",
      "Hacksaw Ridge",
      "Apocalypse Now",
      "Full Metal Jacket",
      "Platoon",
      "The Thin Red Line",
      "Come and See",
      "All Quiet on the Western Front",
      "Paths of Glory",
      "Letters from Iwo Jima",
      "Das Boot",
      "The Hurt Locker",
      "The Pianist",
    ],
  },
  {
    pattern: /魔幻|奇幻|魔法|巫师|史诗|中土|fantasy|magic|wizard|epic/i,
    titles: [
      "Harry Potter and the Sorcerer's Stone",
      "Harry Potter and the Chamber of Secrets",
      "Harry Potter and the Prisoner of Azkaban",
      "Harry Potter and the Goblet of Fire",
      "The Lord of the Rings: The Fellowship of the Ring",
      "The Lord of the Rings: The Two Towers",
      "The Lord of the Rings: The Return of the King",
      "The Hobbit: An Unexpected Journey",
      "The Chronicles of Narnia: The Lion, the Witch and the Wardrobe",
      "Pan's Labyrinth",
      "Stardust",
      "Fantastic Beasts and Where to Find Them",
      "The NeverEnding Story",
      "The Golden Compass",
      "Labyrinth",
      "Willow",
    ],
  },
  {
    pattern: /英语学习|学英语|练听力|language learning|learn english/i,
    titles: [
      "The Intern",
      "The Devil Wears Prada",
      "The Social Network",
      "Before Sunrise",
      "Notting Hill",
      "Forrest Gump",
      "The King's Speech",
      "Paddington 2",
    ],
  },
  {
    pattern: /日语学习|学日语|练日语|learn japanese/i,
    titles: [
      "Our Little Sister",
      "Little Forest",
      "Departures",
      "Shoplifters",
      "Drive My Car",
      "Spirited Away",
    ],
  },
  {
    pattern: /导演|作者电影|auteur/i,
    titles: [
      "In the Mood for Love",
      "Drive My Car",
      "The Grand Budapest Hotel",
      "Lost in Translation",
      "Parasite",
    ],
  },
];

function getTmdbCredential() {
  const configuredToken =
    process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_TOKEN || "";
  const configuredApiKey = process.env.TMDB_API_KEY || "";
  const tokenLooksLikeBearer = configuredToken.startsWith("eyJ");

  return {
    bearerToken: tokenLooksLikeBearer ? configuredToken : "",
    apiKey: configuredApiKey || (tokenLooksLikeBearer ? "" : configuredToken),
  };
}

export function hasTmdbCredential() {
  const credential = getTmdbCredential();
  return Boolean(credential.bearerToken || credential.apiKey);
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}) {
  const credential = getTmdbCredential();

  if (!credential.bearerToken && !credential.apiKey) {
    throw new Error(
      "Missing TMDB credential. Add TMDB_READ_ACCESS_TOKEN or TMDB_API_KEY to .env.local."
    );
  }

  const apiBaseUrl =
    process.env.TMDB_API_BASE_URL || "https://api.themoviedb.org/3";
  const url = new URL(`${apiBaseUrl}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  if (credential.apiKey && !credential.bearerToken) {
    url.searchParams.set("api_key", credential.apiKey);
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), tmdbRequestTimeoutMs);

    try {
      const response = await fetch(url, {
        headers: credential.bearerToken
          ? {
              Authorization: `Bearer ${credential.bearerToken}`,
              accept: "application/json",
            }
          : {
              accept: "application/json",
            },
        next: {
          revalidate: 60 * 60,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`TMDB request failed: ${response.status}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error;

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 400));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function imageUrl(path?: string | null, size = "w500") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : "";
}

function uniqueById(movies: TmdbMovieResult[]) {
  const seen = new Set<number>();

  return movies.filter((movie) => {
    if (!movie.id || seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
}

function uniqueCardsById(movies: TmdbMovie[]) {
  const seen = new Set<number>();

  return movies.filter((movie) => {
    if (!movie.id || seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
}

function hasSpecificMovieQuery(text: string) {
  const trimmed = text.trim();
  const demandPattern =
    /我想|想看|推荐|题材|类型|风格|适合|有没有|找|片单|电影|需求|学习|获奖|奖项|导演|演员|地区|语言/;

  if (demandPattern.test(trimmed)) return false;

  if (trimmed.length <= 18 && !/[，。！？,.!?]/.test(trimmed)) return true;
  if (/《.+》/.test(trimmed)) return true;
  if (/^(the |a |an )?[a-z0-9:' -]{2,60}$/i.test(trimmed)) return true;

  return false;
}

function normalizeSearchContext(text: string, filters?: MovieSearchFilters) {
  return [
    text,
    filters?.topic,
    filters?.yearFrom,
    filters?.yearTo,
    filters?.region,
    filters?.director,
    filters?.actor,
    filters?.language,
    filters?.award,
  ]
    .filter(Boolean)
    .join(" ");
}

function getLanguageCode(text?: string) {
  if (!text) return "";
  const value = text.trim().toLowerCase();

  return languageCodes[value] || value.match(/^[a-z]{2}$/)?.[0] || "";
}

function getCountryCode(text?: string) {
  if (!text) return "";
  const value = text.trim();
  const upper = value.toUpperCase();

  return countryCodes[value] || (upper.match(/^[A-Z]{2}$/)?.[0] ?? "");
}

function getAwardSeeds(text: string) {
  return Object.entries(awardTitleSeeds)
    .filter(([keyword]) => text.includes(keyword))
    .flatMap(([, titles]) => titles);
}

function getCuratedSeeds(text: string, filters?: MovieSearchFilters) {
  const context = normalizeSearchContext(text, filters);
  const seedTitles = curatedTitleSeeds
    .filter((group) => group.pattern.test(context))
    .flatMap((group) => group.titles);

  return Array.from(new Set([...seedTitles, ...getAwardSeeds(context)]));
}

function toMovieCard(
  movie: TmdbMovieResult,
  queryContext: string,
  index: number
): TmdbMovie {
  const title = movie.title || movie.name || movie.original_title || "未命名电影";
  const year = movie.release_date?.slice(0, 4) || "年份未知";
  const genres = (movie.genre_ids || [])
    .map((id) => genreNames[id])
    .filter(Boolean)
    .slice(0, 3);
  const genreText = genres.length > 0 ? genres.join(" / ") : "电影";
  const voteAverage = movie.vote_average || 0;
  const score = Math.min(98, Math.max(72, Math.round(voteAverage * 10) + 5 - index));
  const overview = movie.overview || "TMDB 暂无中文简介，可点开详情页进一步查看。";

  return {
    id: movie.id,
    title,
    originalTitle: movie.original_title || title,
    year,
    type: genreText,
    score,
    reason: `它和「${queryContext}」这个需求匹配：${overview}`,
    time: "适合在你想认真挑一部片、又不想被随机片单打扰时观看。",
    warning: voteAverage < 6.5 ? "TMDB 评分不算特别高，建议先看预告或简介再决定。" : "建议根据片长、分级和个人雷点再做最终选择。",
    angle: `可以从“${genreText}如何回应当前观影需求”的角度记录你的感受。`,
    overview,
    posterUrl: imageUrl(movie.poster_path),
    backdropUrl: imageUrl(movie.backdrop_path, "w780"),
    tmdbUrl: `https://www.themoviedb.org/movie/${movie.id}`,
    sourceTitle: "The Movie Database (TMDB)",
    sourceUrl: `https://www.themoviedb.org/movie/${movie.id}`,
  };
}

function parseExcludedIds(exclude?: string | null) {
  return new Set(
    (exclude || "")
      .split(",")
      .map((id) => Number(id.trim()))
      .filter(Boolean)
  );
}

function buildIntent(text: string, filters?: MovieSearchFilters): DiscoverIntent {
  const input = normalizeSearchContext(text, filters).toLowerCase();
  const genres = new Set<number>();
  const withoutGenres = new Set<number>();
  const keywords = new Set<string>();
  const countries = new Set<string>();
  let sortBy = "popularity.desc";
  let voteAverageGte = 6.2;
  let voteCountGte = 120;
  let runtimeLte: number | undefined;
  let originalLanguage = getLanguageCode(filters?.language);
  const yearFrom = filters?.yearFrom;
  const yearTo = filters?.yearTo;

  const add = (...ids: number[]) => ids.forEach((id) => genres.add(id));
  const avoid = (...ids: number[]) => ids.forEach((id) => withoutGenres.add(id));
  const addKeyword = (...values: string[]) =>
    values.forEach((value) => keywords.add(value));

  if (/浪漫|爱情|约会|心动|暧昧|romance|date/.test(input)) add(10749, 35);
  if (/战争|战场|军事|二战|一战|反战|军旅|war|military|battle|wwii|world war/.test(input)) {
    add(10752);
    addKeyword("war", "world war", "military", "battle");
    sortBy = "vote_average.desc";
    voteAverageGte = 6.8;
    voteCountGte = 250;
  }
  if (/魔幻|奇幻|魔法|巫师|史诗|中土|fantasy|magic|wizard|epic/.test(input)) {
    add(14, 12, 10751);
    addKeyword("magic", "wizard", "fantasy", "middle earth");
    sortBy = "popularity.desc";
    voteAverageGte = 6.6;
    voteCountGte = 500;
  }
  if (/治愈|轻松|开心|快乐|温暖|不虐|喜剧|comfort|healing|feel.?good/.test(input)) {
    add(35, 10751, 16);
    avoid(27, 53, 80);
  }
  if (/焦虑|疲惫|低能量|失恋|难过|疗愈|anxiety|tired|sad/.test(input)) {
    add(18, 35, 10751);
    avoid(27, 53);
    voteAverageGte = 6.8;
  }
  if (/想哭|后劲|催泪|悲伤|cry|emotional/.test(input)) add(18, 10749);
  if (/孤独|深夜|独处|文艺|lonely|alone|late night/.test(input)) add(18, 10749, 878);
  if (/悬疑|推理|反转|烧脑|mystery/.test(input)) add(9648, 53);
  if (/恐怖|惊悚|吓人|horror|thriller/.test(input)) add(27, 53);
  if (/科幻|未来|宇宙|ai|sci.?fi/.test(input)) add(878, 12);
  if (/动作|爽片|冒险|action|adventure/.test(input)) add(28, 12);
  if (/音乐|青春|校园|music|youth/.test(input)) add(10402, 35, 18);
  if (/动画|亲子|家庭|animation|family/.test(input)) add(16, 10751);
  if (/获奖|奖项|奥斯卡|金棕榈|金熊|金狮|award|oscar|cannes/.test(input)) {
    sortBy = "vote_average.desc";
    voteAverageGte = 7;
    voteCountGte = 300;
  }
  if (/英语学习|学英语|练听力|learn english/.test(input)) {
    originalLanguage = "en";
    add(35, 18, 10749);
    voteAverageGte = 6.5;
  }
  if (/小红书|高颜值|画面|审美|氛围|visual|aesthetic/.test(input)) {
    add(18, 14, 10749);
    sortBy = "vote_average.desc";
    voteCountGte = 300;
  }
  if (/通勤|短|短一点|不费脑|short/.test(input)) runtimeLte = 110;

  const country = getCountryCode(filters?.region);
  if (country) countries.add(country);

  return {
    genres: Array.from(genres).slice(0, 5),
    withoutGenres: Array.from(withoutGenres),
    keywords: Array.from(keywords).slice(0, 4),
    countries: Array.from(countries),
    originalLanguage,
    yearFrom,
    yearTo,
    sortBy,
    voteAverageGte,
    voteCountGte,
    runtimeLte,
  };
}

async function searchKeywordIds(keywords: string[]) {
  const ids: number[] = [];

  for (const keyword of keywords) {
    const data = await tmdbFetch<{ results: Array<{ id: number; name: string }> }>(
      "/search/keyword",
      {
        query: keyword,
        page: "1",
      }
    );

    const first = data.results?.[0];
    if (first?.id) ids.push(first.id);
  }

  return Array.from(new Set(ids));
}

async function searchPersonId(name?: string) {
  if (!name?.trim()) return "";

  const data = await tmdbFetch<{
    results: Array<{ id: number; name: string; known_for_department?: string }>;
  }>("/search/person", {
    query: name,
    include_adult: "false",
    language: "zh-CN",
    page: "1",
  });

  return data.results?.[0]?.id ? String(data.results[0].id) : "";
}

async function searchSeedMovies(
  queryContext: string,
  seedTitles: string[],
  options: {
    exclude?: string | null;
    limit?: number;
  }
) {
  const excludedIds = parseExcludedIds(options.exclude);
  const limit = options.limit || 12;
  const results = await Promise.allSettled(
    seedTitles.slice(0, limit).map(async (title) => {
      const data = await tmdbFetch<{ results: TmdbMovieResult[] }>("/search/movie", {
        query: title,
        language: "zh-CN",
        include_adult: "false",
        page: "1",
      });

      return data.results?.[0];
    })
  );

  const fulfilledMovies = results.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : []
  );

  return uniqueById(fulfilledMovies)
    .filter((movie) => !excludedIds.has(movie.id))
    .filter((movie) => movie.poster_path && movie.overview)
    .slice(0, limit)
    .map((movie, index) => toMovieCard(movie, queryContext, index));
}

export async function searchTmdbMovies(
  query: string,
  options: {
    exclude?: string | null;
    limit?: number;
  } = {}
) {
  const excludedIds = parseExcludedIds(options.exclude);
  const limit = options.limit || 12;
  const collected: TmdbMovieResult[] = [];

  for (const page of [1, 2, 3]) {
    const data = await tmdbFetch<{ results: TmdbMovieResult[] }>("/search/movie", {
      query,
      language: "zh-CN",
      include_adult: "false",
      page: String(page),
    });

    collected.push(...(data.results || []));

    if (collected.length >= limit * 2) break;
  }

  const movies = uniqueById(collected)
    .filter((movie) => !excludedIds.has(movie.id))
    .filter((movie) => movie.poster_path && movie.overview)
    .slice(0, limit)
    .map((movie, index) => toMovieCard(movie, query, index));

  return movies;
}

export async function discoverTmdbMovies(
  queryContext: string,
  options: {
    exclude?: string | null;
    limit?: number;
    filters?: MovieSearchFilters;
  } = {}
) {
  const excludedIds = parseExcludedIds(options.exclude);
  const limit = options.limit || 12;
  const intent = buildIntent(queryContext, options.filters);
  const keywordIds =
    intent.keywords.length > 0 ? await searchKeywordIds(intent.keywords) : [];
  const actorId = await searchPersonId(options.filters?.actor);
  const directorId = await searchPersonId(options.filters?.director);
  const collected: TmdbMovieResult[] = [];

  for (const page of [1, 2, 3, 4, 5, 6]) {
    const data = await tmdbFetch<{ results: TmdbMovieResult[] }>("/discover/movie", {
      language: "zh-CN",
      include_adult: "false",
      include_video: "false",
      sort_by: intent.sortBy,
      page: String(page),
      "vote_average.gte": String(intent.voteAverageGte),
      "vote_count.gte": String(intent.voteCountGte),
      with_genres: intent.genres.join("|"),
      without_genres: intent.withoutGenres.join(","),
      with_keywords: keywordIds.join("|"),
      with_cast: actorId,
      with_crew: directorId,
      with_origin_country: intent.countries.join("|"),
      with_original_language: intent.originalLanguage || "",
      "primary_release_date.gte": intent.yearFrom
        ? `${intent.yearFrom}-01-01`
        : "",
      "primary_release_date.lte": intent.yearTo ? `${intent.yearTo}-12-31` : "",
      ...(intent.runtimeLte
        ? {
            "with_runtime.lte": String(intent.runtimeLte),
          }
        : {}),
    });

    collected.push(...(data.results || []));

    if (collected.length >= limit * 3) break;
  }

  return uniqueById(collected)
    .filter((movie) => !excludedIds.has(movie.id))
    .filter((movie) => movie.poster_path && movie.overview)
    .slice(0, limit)
    .map((movie, index) => toMovieCard(movie, queryContext, index));
}

async function discoverBroadTmdbMovies(
  queryContext: string,
  options: {
    exclude?: string | null;
    limit?: number;
  } = {}
) {
  const excludedIds = parseExcludedIds(options.exclude);
  const limit = options.limit || 12;
  const collected: TmdbMovieResult[] = [];

  for (const page of [1, 2, 3, 4, 5]) {
    const data = await tmdbFetch<{ results: TmdbMovieResult[] }>("/discover/movie", {
      language: "zh-CN",
      include_adult: "false",
      include_video: "false",
      sort_by: "popularity.desc",
      page: String(page),
      "vote_average.gte": "6.4",
      "vote_count.gte": "180",
    });

    collected.push(...(data.results || []));

    if (collected.length >= limit * 2) break;
  }

  return uniqueById(collected)
    .filter((movie) => !excludedIds.has(movie.id))
    .filter((movie) => movie.poster_path && movie.overview)
    .slice(0, limit)
    .map((movie, index) => toMovieCard(movie, queryContext, index));
}

export async function recommendFromTmdb(
  queryContext: string,
  options: {
    exclude?: string | null;
    limit?: number;
    filters?: MovieSearchFilters;
  } = {}
) {
  const limit = options.limit || 12;
  const context = normalizeSearchContext(queryContext, options.filters);
  const seedTitles = getCuratedSeeds(queryContext, options.filters);
  const seedResults =
    seedTitles.length > 0
      ? await searchSeedMovies(context, seedTitles, {
          exclude: options.exclude,
          limit,
        })
      : [];
  const searchResults = hasSpecificMovieQuery(queryContext)
    ? await searchTmdbMovies(queryContext, {
        exclude: options.exclude,
        limit,
      }).catch(() => [])
    : [];

  const discoverResults = await discoverTmdbMovies(queryContext, {
    exclude: options.exclude,
    limit,
    filters: options.filters,
  }).catch(() => []);

  if (seedResults.length >= Math.min(4, limit)) {
    return seedResults.slice(0, limit);
  }

  const mixedResults = uniqueCardsById(
    seedResults.length > 0
      ? [...seedResults, ...discoverResults, ...searchResults]
      : hasSpecificMovieQuery(queryContext)
        ? [...searchResults, ...discoverResults]
        : [...discoverResults, ...searchResults]
  );

  if (mixedResults.length >= limit) return mixedResults.slice(0, limit);

  const hasStrongIntent =
    seedResults.length > 0 ||
    Boolean(options.filters?.actor || options.filters?.director) ||
    buildIntent(queryContext, options.filters).genres.length > 0;

  if (hasStrongIntent) return mixedResults.slice(0, limit);

  const broadResults = await discoverBroadTmdbMovies(queryContext, {
    exclude: options.exclude,
    limit,
  });

  return uniqueCardsById([...mixedResults, ...broadResults]).slice(0, limit);
}
