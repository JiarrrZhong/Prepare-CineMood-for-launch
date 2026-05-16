import {
  hasTmdbCredential,
  recommendFromTmdb,
  type MovieSearchFilters,
} from "@/app/lib/tmdb";

type SearchResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function uniqueFallbackMovies<T extends { title: string }>(movies: T[]) {
  const seen = new Set<string>();

  return movies.filter((movie) => {
    const key = movie.title.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseExcludedTitles(value?: string | null) {
  if (!value) return new Set<string>();

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return new Set(
        parsed.map((title) => String(title).trim().toLowerCase()).filter(Boolean)
      );
    }
  } catch {
    // Fall back to comma-separated titles for older clients.
  }

  return new Set(
    value
      .split(",")
      .map((title) => title.trim().toLowerCase())
      .filter(Boolean)
  );
}

function filterExcludedTitles<T extends { title: string }>(
  movies: T[],
  excludedTitles: Set<string>
) {
  if (excludedTitles.size === 0) return movies;

  return movies.filter((movie) => !excludedTitles.has(movie.title.toLowerCase()));
}

function extractMovieCandidates(text: string) {
  const knownMovies = [
    "The Secret Life of Walter Mitty",
    "白日梦想家",
    "Little Forest",
    "小森林",
    "Before Sunrise",
    "爱在黎明破晓前",
    "About Time",
    "时空恋旅人",
    "Paddington",
    "帕丁顿熊",
    "Paddington 2",
    "帕丁顿熊2",
    "Sing Street",
    "初恋这首情歌",
    "Back To The Future",
    "回到未来",
    "Soul",
    "心灵奇旅",
    "Her",
    "她",
    "Amélie",
    "天使爱美丽",
    "Lost in Translation",
    "迷失东京",
    "The Intern",
    "实习生",
    "Chef",
    "落魄大厨",
    "Julie & Julia",
    "朱莉与朱莉娅",
    "La La Land",
    "爱乐之城",
    "Begin Again",
    "再次出发之纽约遇见你",
    "The Grand Budapest Hotel",
    "布达佩斯大饭店",
    "Everything Everywhere All at Once",
    "瞬息全宇宙",
    "Moonlight",
    "月光男孩",
    "Aftersun",
    "晒后假日",
  ];

  const candidates: string[] = [];

  for (const movie of knownMovies) {
    if (text.toLowerCase().includes(movie.toLowerCase())) {
      candidates.push(movie);
    }
  }

  return Array.from(new Set(candidates)).slice(0, 6);
}

function buildMovieCards(query: string, results: SearchResult[]) {
  const allText = results
    .map((result) => `${result.title}\n${result.content}`)
    .join("\n\n");

  const candidates = extractMovieCandidates(allText);

  if (candidates.length > 0) {
    return candidates.map((title, index) => ({
      title,
      score: Math.max(92 - index * 4, 72),
      reason: `这部电影出现在与你的需求「${query}」相关的联网资料中，适合进一步加入片单参考。`,
      sourceTitle: results[index % results.length]?.title || "联网搜索结果",
      sourceUrl: results[index % results.length]?.url || "",
    }));
  }

  return results.slice(0, 5).map((result, index) => ({
    title: result.title
      .replace(" - IMDb", "")
      .replace(" | Rotten Tomatoes", "")
      .replace(" - Reddit", "")
      .slice(0, 42),
    score: Math.max(88 - index * 4, 70),
    reason:
      result.content?.slice(0, 120) ||
      `这条结果和你的需求「${query}」相关，可以作为电影片单灵感。`,
    sourceTitle: result.title,
    sourceUrl: result.url,
  }));
}

const fallbackPools: Record<string, string[]> = {
  战争: [
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
  治愈: [
    "Little Forest",
    "Paddington 2",
    "About Time",
    "Chef",
    "The Intern",
    "Soul",
    "Our Little Sister",
    "The Secret Life of Walter Mitty",
  ],
  浪漫: [
    "Before Sunrise",
    "Before Sunset",
    "About Time",
    "La La Land",
    "Sing Street",
    "Call Me by Your Name",
    "The Worst Person in the World",
    "Lost in Translation",
  ],
  深夜: [
    "Her",
    "Paterson",
    "Columbus",
    "Lost in Translation",
    "Before Sunrise",
    "Drive My Car",
    "Aftersun",
    "Moonlight",
  ],
  焦虑: [
    "Paddington",
    "Paddington 2",
    "Little Forest",
    "Soul",
    "The Intern",
    "Chef",
    "Julie & Julia",
    "The Secret Life of Walter Mitty",
  ],
  想哭: [
    "Aftersun",
    "Manchester by the Sea",
    "Our Little Sister",
    "Moonlight",
    "Drive My Car",
    "Shoplifters",
    "The Farewell",
    "A Man Called Otto",
  ],
  高颜值: [
    "The Grand Budapest Hotel",
    "Amélie",
    "La La Land",
    "Before Sunrise",
    "Call Me by Your Name",
    "Columbus",
    "Her",
    "The Fall",
  ],
  魔幻: [
    "Harry Potter and the Sorcerer's Stone",
    "Harry Potter and the Chamber of Secrets",
    "Harry Potter and the Prisoner of Azkaban",
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
  奇幻: [
    "Harry Potter and the Sorcerer's Stone",
    "The Lord of the Rings: The Fellowship of the Ring",
    "The Hobbit: An Unexpected Journey",
    "Spirited Away",
    "Howl's Moving Castle",
    "The Wizard of Oz",
    "Big Fish",
    "The Green Knight",
  ],
  奥斯卡: [
    "Parasite",
    "Everything Everywhere All at Once",
    "Moonlight",
    "Nomadland",
    "The Shape of Water",
    "Spotlight",
    "Birdman",
    "The Lord of the Rings: The Return of the King",
  ],
  英语学习: [
    "The Intern",
    "The Devil Wears Prada",
    "The Social Network",
    "Before Sunrise",
    "Notting Hill",
    "Forrest Gump",
    "The King's Speech",
    "Paddington 2",
  ],
};

function buildCuratedFallbackMovies(query: string) {
  const matchedTitles = Object.entries(fallbackPools)
    .filter(([keyword]) => query.includes(keyword))
    .flatMap(([, titles]) => titles);

  const titles =
    matchedTitles.length > 0
      ? matchedTitles
      : Object.values(fallbackPools).flatMap((movies) => movies);

  return Array.from(new Set(titles)).map((title, index) => ({
    title,
    score: Math.max(90 - index, 76),
    reason: `这是 CineMood 根据「${query}」匹配出的兜底候选。TMDB 网络暂时不可用时，可先作为片单参考。`,
    sourceTitle: "CineMood 兜底片库",
    sourceUrl: "",
  }));
}

function hasCuratedFallbackMatch(query: string) {
  return Object.keys(fallbackPools).some((keyword) => query.includes(keyword));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query =
    searchParams.get("q") ||
    "适合深夜一个人看的治愈电影 推荐 片单 movie recommendations";
  const exclude = searchParams.get("exclude");
  const excludedTitles = parseExcludedTitles(searchParams.get("excludeTitles"));
  const limit = Math.min(Number(searchParams.get("limit")) || 12, 20);
  const filters: MovieSearchFilters = {
    topic: searchParams.get("topic") || "",
    yearFrom: searchParams.get("yearFrom") || "",
    yearTo: searchParams.get("yearTo") || "",
    region: searchParams.get("region") || "",
    director: searchParams.get("director") || "",
    actor: searchParams.get("actor") || "",
    language: searchParams.get("language") || "",
    award: searchParams.get("award") || "",
  };
  const hasFilters = Object.values(filters).some(Boolean);
  const searchContext = hasFilters
    ? [
        query,
        filters.topic && `题材 ${filters.topic}`,
        filters.yearFrom && `从 ${filters.yearFrom}`,
        filters.yearTo && `到 ${filters.yearTo}`,
        filters.region && `地区 ${filters.region}`,
        filters.director && `导演 ${filters.director}`,
        filters.actor && `演员 ${filters.actor}`,
        filters.language && `语言 ${filters.language}`,
        filters.award && `奖项 ${filters.award}`,
      ]
        .filter(Boolean)
        .join(" ")
    : query;

  if (hasTmdbCredential()) {
    try {
      const movies = filterExcludedTitles(
        await recommendFromTmdb(searchContext, {
          exclude,
          limit,
          filters,
        }),
        excludedTitles
      ).slice(0, limit);

      if (movies.length > 0) {
        return new Response(
          JSON.stringify({
            query: searchContext,
            movies,
            sources: [
              {
                title: "The Movie Database (TMDB)",
                url: "https://www.themoviedb.org/",
                content:
                  "开放式搜索已优先使用 TMDB 电影数据库，并根据本地已推荐电影 ID 做去重。",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
            },
          }
        );
      }
    } catch (error: unknown) {
      console.error("TMDB playlist search failed:", getErrorMessage(error));
    }
  }

  const tavilyKey = process.env.TAVILY_API_KEY;

  if (!tavilyKey) {
    return new Response(
      JSON.stringify({
        error: "Missing TAVILY_API_KEY",
        details: "请检查 .env.local 里是否有 TAVILY_API_KEY。",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }

  try {
    const searchQuery = `${searchContext} movie recommendations film list review`;

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tavilyKey}`,
      },
      body: JSON.stringify({
        query: searchQuery,
        search_depth: "basic",
        max_results: 6,
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Tavily search failed",
          status: response.status,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    const data = await response.json();

    const results: SearchResult[] = (data.results || []).map(
      (item: SearchResult) => ({
        title: item.title,
        url: item.url,
        content: item.content,
        score: item.score,
      })
    );

    const curatedFallback = buildCuratedFallbackMovies(searchContext);
    const onlineFallback = buildMovieCards(searchContext, results);
    const fallbackMovies = hasCuratedFallbackMatch(searchContext)
      ? [...curatedFallback, ...onlineFallback]
      : [...onlineFallback, ...curatedFallback];
    const movies = filterExcludedTitles(
      uniqueFallbackMovies(fallbackMovies),
      excludedTitles
    ).slice(0, limit);

    return new Response(
      JSON.stringify({
        query,
        movies,
        sources: results.slice(0, 4),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Playlist search error:", error);

    return new Response(
      JSON.stringify({
        error: "联网搜索片单失败",
        details: getErrorMessage(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
