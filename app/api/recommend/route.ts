import { discoverTmdbMovies, hasTmdbCredential } from "@/app/lib/tmdb";

type SearchResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

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
  backdropUrl?: string;
  tmdbUrl?: string;
  sourceTitle?: string;
  sourceUrl?: string;
};

const fallbackMovieGroups: Record<
  string,
  {
    filmDNA: {
      pace: string;
      style: string;
    };
    movies: Movie[];
  }
> = {
  焦虑: {
    filmDNA: {
      pace: "慢热",
      style: "生活流治愈",
    },
    movies: [
      {
        title: "小森林",
        year: "2018",
        type: "剧情 / 治愈 / 生活流",
        score: 94,
        reason:
          "它不是用大道理安慰你，而是用食物、季节和日常细节，让人慢慢重新回到生活里。",
        time: "适合晚上十点后，一个人安静地看。",
        warning: "节奏较慢，不适合现在很想看强剧情反转的时候。",
        angle: "适合做一篇关于低能量时期如何重新找回生活感的内容。",
      },
      {
        title: "Paddington 2",
        year: "2017",
        type: "喜剧 / 家庭 / 治愈",
        score: 90,
        reason:
          "它轻松、善良、色彩明亮，适合在焦虑的时候给自己一点柔软的缓冲。",
        time: "适合睡前、周末下午或情绪紧绷的时候。",
        warning: "偏童话质感，如果想看现实向电影可能会觉得太甜。",
        angle: "适合做善意为什么仍然有效的内容主题。",
      },
    ],
  },
  孤独: {
    filmDNA: {
      pace: "慢热",
      style: "自我探索",
    },
    movies: [
      {
        title: "白日梦想家",
        year: "2013",
        type: "冒险 / 成长 / 自我寻找",
        score: 92,
        reason:
          "它适合那种生活卡住了、但心里还想重新出发的时候。",
        time: "适合周末晚上，一个人看完后整理计划。",
        warning: "前半段节奏偏铺垫，不是强刺激爽片。",
        angle: "适合做普通人如何重新开始的短视频主题。",
      },
      {
        title: "Her",
        year: "2013",
        type: "爱情 / 科幻 / 孤独",
        score: 88,
        reason:
          "它很适合讨论现代亲密关系、孤独感和情感投射。",
        time: "适合深夜独处时观看。",
        warning: "情绪比较空旷，可能会放大孤独感。",
        angle: "适合做科技时代我们为什么更孤独的内容。",
      },
    ],
  },
  疲惫: {
    filmDNA: {
      pace: "舒缓",
      style: "轻松恢复",
    },
    movies: [
      {
        title: "The Intern",
        year: "2015",
        type: "喜剧 / 职场 / 治愈",
        score: 89,
        reason:
          "它不沉重，也不空洞，适合疲惫时看一点温柔但不费脑的故事。",
        time: "适合下课、下班后放松观看。",
        warning: "剧情比较轻，不适合想看深度冲突的时候。",
        angle: "适合做职场疲惫时为什么需要轻盈电影的内容。",
      },
      {
        title: "Chef",
        year: "2014",
        type: "喜剧 / 公路 / 美食",
        score: 87,
        reason:
          "它有食物、公路和重新开始的能量，适合累的时候恢复一点行动力。",
        time: "适合周末饭后观看。",
        warning: "会有强烈美食诱惑。",
        angle: "适合做成年人如何重新找回热爱的主题。",
      },
    ],
  },
  想哭: {
    filmDNA: {
      pace: "缓慢",
      style: "情绪释放",
    },
    movies: [
      {
        title: "Aftersun",
        year: "2022",
        type: "剧情 / 回忆 / 亲情",
        score: 91,
        reason:
          "它的悲伤不是爆发式的，而是很后知后觉，很适合情绪需要出口的时候。",
        time: "适合深夜安静观看。",
        warning: "后劲很大，情绪低落时谨慎观看。",
        angle: "适合做长大后才理解父母的内容主题。",
      },
      {
        title: "海街日记",
        year: "2015",
        type: "剧情 / 家庭 / 女性",
        score: 89,
        reason:
          "它用很克制的方式讲亲情、陪伴和生活里的伤口。",
        time: "适合一个人慢慢看。",
        warning: "节奏偏慢，不是强情节电影。",
        angle: "适合做女性关系和家庭疗愈主题。",
      },
    ],
  },
  治愈: {
    filmDNA: {
      pace: "慢热",
      style: "生活流治愈",
    },
    movies: [
      {
        title: "小森林",
        year: "2018",
        type: "剧情 / 治愈 / 生活流",
        score: 94,
        reason:
          "它把治愈落在非常具体的食物、季节和劳动里，不空泛。",
        time: "适合晚上一个人安静地看。",
        warning: "节奏很慢，需要沉下来。",
        angle: "适合做低能量自救片单。",
      },
      {
        title: "About Time",
        year: "2013",
        type: "爱情 / 家庭 / 治愈",
        score: 90,
        reason:
          "它提醒人重新看见普通日子本身的价值。",
        time: "适合周末晚上观看。",
        warning: "后半段有亲情情节，可能会想哭。",
        angle: "适合做普通一天为什么值得珍惜的内容。",
      },
    ],
  },
  浪漫: {
    filmDNA: {
      pace: "慢热",
      style: "城市漫游爱情",
    },
    movies: [
      {
        title: "Before Sunrise",
        year: "1995",
        type: "爱情 / 对话 / 城市漫游",
        score: 95,
        reason:
          "它适合那种想要一点浪漫、但又不想看狗血爱情故事的时候。",
        time: "适合约会、深夜，或者想听人认真聊天的时候。",
        warning: "主要靠对话推进，不适合想看快节奏剧情的时候。",
        angle: "适合分析城市漫游感和年轻人的精神连接。",
      },
      {
        title: "Sing Street",
        year: "2016",
        type: "青春 / 音乐 / 爱情",
        score: 88,
        reason:
          "它有青春、音乐和心动，轻盈但不空。",
        time: "适合周末放松观看。",
        warning: "偏青春片，不是成熟爱情片。",
        angle: "适合做为什么青春爱情让人重新相信表达的主题。",
      },
    ],
  },
};

const movieDatabase = [
  "The Secret Life of Walter Mitty",
  "白日梦想家",
  "Little Forest",
  "小森林",
  "Before Sunrise",
  "爱在黎明破晓前",
  "Before Sunset",
  "Before Midnight",
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
  "Manchester by the Sea",
  "海边的曼彻斯特",
  "Call Me by Your Name",
  "请以你的名字呼唤我",
  "The Perks of Being a Wallflower",
  "壁花少年",
  "Frances Ha",
  "弗兰西丝哈",
  "Lady Bird",
  "伯德小姐",
  "Paterson",
  "帕特森",
  "Columbus",
  "哥伦布",
  "The Worst Person in the World",
  "世界上最糟糕的人",
  "Drive My Car",
  "驾驶我的车",
  "Shoplifters",
  "小偷家族",
  "Our Little Sister",
  "海街日记",
  "The Farewell",
  "别告诉她",
  "A Man Called Otto",
  "一个叫欧维的男人决定去死",
];

function getSearchQuery(mood: string, scene: string) {
  const moodMap: Record<string, string> = {
    焦虑: "comfort movies for anxiety calming films",
    孤独: "movies to watch when feeling lonely",
    疲惫: "relaxing movies to watch when tired",
    想哭: "sad emotional movies to cry to",
    治愈: "healing comfort movies feel good films",
    浪漫: "romantic movies for date night",
  };

  const sceneMap: Record<string, string> = {
    深夜独处: "late night alone",
    周末放松: "weekend relaxing",
    朋友聚会: "watch with friends",
    约会: "date night",
    通勤: "short easy watch",
    找灵感: "creative inspiration",
  };

  return `${moodMap[mood] || "movie recommendations"} ${
    sceneMap[scene] || ""
  } film list recommendations`;
}

function extractMoviesFromSearch(results: SearchResult[]) {
  const text = results
    .map((result) => `${result.title}\n${result.content}`)
    .join("\n\n")
    .toLowerCase();

  const found: string[] = [];

  for (const movie of movieDatabase) {
    if (text.includes(movie.toLowerCase())) {
      found.push(movie);
    }
  }

  return Array.from(new Set(found));
}

function normalizeMovieTitle(title: string) {
  const pairs: Record<string, string> = {
    白日梦想家: "The Secret Life of Walter Mitty",
    小森林: "Little Forest",
    爱在黎明破晓前: "Before Sunrise",
    时空恋旅人: "About Time",
    帕丁顿熊: "Paddington",
    帕丁顿熊2: "Paddington 2",
    初恋这首情歌: "Sing Street",
    回到未来: "Back To The Future",
    心灵奇旅: "Soul",
    她: "Her",
    天使爱美丽: "Amélie",
    迷失东京: "Lost in Translation",
    实习生: "The Intern",
    落魄大厨: "Chef",
    朱莉与朱莉娅: "Julie & Julia",
    爱乐之城: "La La Land",
    再次出发之纽约遇见你: "Begin Again",
    布达佩斯大饭店: "The Grand Budapest Hotel",
    瞬息全宇宙: "Everything Everywhere All at Once",
    月光男孩: "Moonlight",
    晒后假日: "Aftersun",
    海边的曼彻斯特: "Manchester by the Sea",
    请以你的名字呼唤我: "Call Me by Your Name",
    壁花少年: "The Perks of Being a Wallflower",
    弗兰西丝哈: "Frances Ha",
    伯德小姐: "Lady Bird",
    帕特森: "Paterson",
    哥伦布: "Columbus",
    世界上最糟糕的人: "The Worst Person in the World",
    驾驶我的车: "Drive My Car",
    小偷家族: "Shoplifters",
    海街日记: "Our Little Sister",
    别告诉她: "The Farewell",
    一个叫欧维的男人决定去死: "A Man Called Otto",
  };

  return pairs[title] || title;
}

function buildOnlineMovie(
  title: string,
  index: number,
  mood: string,
  scene: string,
  sources: SearchResult[]
): Movie {
  const cleanTitle = normalizeMovieTitle(title);
  const source = sources[index % Math.max(sources.length, 1)];

  return {
    title: cleanTitle,
    year: "联网搜索结果",
    type: "网络片单 / 情绪推荐 / 候选电影",
    score: Math.max(92 - index * 3, 76),
    reason: `这部电影出现在与你当前「${mood}」状态和「${scene}」场景相关的联网电影讨论或片单中，可以作为此刻的候选片。`,
    time: `适合在「${scene}」这个场景下尝试观看。`,
    warning:
      "这是联网搜索候选结果，建议进一步查看简介、预告片或评分后再决定是否观看。",
    angle: `适合从“为什么这部电影适合${mood}状态下观看”的角度来做观影记录。来源参考：${
      source?.title || "联网电影片单"
    }`,
  };
}

async function searchOnlineMovies(mood: string, scene: string) {
  const tavilyKey = process.env.TAVILY_API_KEY;

  if (!tavilyKey) {
    return {
      movies: [],
      sources: [],
    };
  }

  const query = getSearchQuery(mood, scene);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tavilyKey}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        max_results: 8,
      }),
    });

    if (!response.ok) {
      return {
        movies: [],
        sources: [],
      };
    }

    const data = await response.json();

    const sources: SearchResult[] = (data.results || []).map(
      (item: SearchResult) => ({
        title: item.title,
        url: item.url,
        content: item.content,
        score: item.score,
      })
    );

    const extractedTitles = extractMoviesFromSearch(sources);

    const onlineMovies = extractedTitles
      .slice(0, 8)
      .map((title, index) =>
        buildOnlineMovie(title, index, mood, scene, sources)
      );

    return {
      movies: onlineMovies,
      sources: sources.slice(0, 5),
    };
  } catch (error) {
    console.error("Online movie search failed:", error);

    return {
      movies: [],
      sources: [],
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mood = searchParams.get("mood") || "焦虑";
  const scene = searchParams.get("scene") || "深夜独处";
  const exclude = searchParams.get("exclude");

  const group = fallbackMovieGroups[mood] || fallbackMovieGroups["焦虑"];

  if (hasTmdbCredential()) {
    try {
      const tmdbMovies = await discoverTmdbMovies(`${mood} ${scene}`, {
        exclude,
        limit: 6,
      });

      if (tmdbMovies.length >= 3) {
        return new Response(
          JSON.stringify({
            filmDNA: {
              mood,
              scene,
              pace: group.filmDNA.pace,
              style: group.filmDNA.style,
            },
            movies: tmdbMovies,
            sources: [
              {
                title: "The Movie Database (TMDB)",
                url: "https://www.themoviedb.org/",
                content:
                  "情绪测片已优先使用 TMDB 电影数据库，并根据本地已推荐电影 ID 做去重。",
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
      console.error("TMDB mood recommendation failed:", getErrorMessage(error));
    }
  }

  const onlineResult = await searchOnlineMovies(mood, scene);

  const movies =
    onlineResult.movies.length >= 4
      ? onlineResult.movies
      : [...onlineResult.movies, ...group.movies].slice(0, 6);

  return new Response(
    JSON.stringify({
      filmDNA: {
        mood,
        scene,
        pace: group.filmDNA.pace,
        style: group.filmDNA.style,
      },
      movies,
      sources: onlineResult.sources,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    }
  );
}
