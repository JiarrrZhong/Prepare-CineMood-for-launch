type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

function getHostName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "网络来源";
  }
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function buildReviewSummary(movieTitle: string, results: TavilyResult[]) {
  const combined = results
    .map((item) => `${item.title || ""} ${item.content || ""}`)
    .join(" ");

  const points: string[] = [];

  if (/剧情|叙事|故事|节奏|反转|plot|story|narrative|pace/i.test(combined)) {
    points.push("剧情和叙事节奏是网络讨论的重点");
  }

  if (/表演|演技|角色|人物|actor|performance|character/i.test(combined)) {
    points.push("角色塑造和演员表现被频繁提到");
  }

  if (/摄影|画面|镜头|色彩|视听|配乐|cinematography|visual|music|score/i.test(combined)) {
    points.push("影像、配乐或视听风格有明显讨论度");
  }

  if (/争议|差评|失望|不足|问题|boring|weak|disappoint/i.test(combined)) {
    points.push("也存在一些争议或负面评价，可以对照阅读");
  }

  if (/经典|神作|推荐|佳作|好看|masterpiece|excellent|great/i.test(combined)) {
    points.push("整体口碑里能看到不少正向推荐");
  }

  const uniquePoints = Array.from(new Set(points)).slice(0, 4);

  if (uniquePoints.length === 0) {
    return `已为《${movieTitle}》找到一些网络影评来源。你可以从下方链接进入原文，重点看观众如何评价剧情、人物、视听风格和争议点。`;
  }

  return `《${movieTitle}》的网络影评里，${uniquePoints.join("；")}。建议结合下方原文来源一起看，避免只被单一观点带偏。`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const movieTitle = searchParams.get("movie")?.trim() || "";
  const apiKey = process.env.TAVILY_API_KEY;

  if (!movieTitle) {
    return new Response(
      JSON.stringify({
        error: "请先输入电影名。",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "缺少 TAVILY_API_KEY，暂时无法联网检索影评。",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }

  const query = `"${movieTitle}" 电影 影评 评价 解析 口碑 豆瓣 知乎 review analysis`;

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "advanced",
        max_results: 8,
        include_answer: false,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "影评检索暂时失败，请稍后再试。",
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    const data = await response.json();
    const rawResults = Array.isArray(data.results) ? data.results : [];
    const seenUrls = new Set<string>();

    const results = rawResults
      .map((item: TavilyResult) => ({
        title: cleanText(item.title || "未命名影评"),
        url: item.url || "",
        source: item.url ? getHostName(item.url) : "网络来源",
        excerpt: cleanText(item.content || "").slice(0, 220),
        score: item.score || 0,
      }))
      .filter((item: { url: string; excerpt: string }) => item.url && item.excerpt)
      .filter((item: { url: string }) => {
        if (seenUrls.has(item.url)) return false;
        seenUrls.add(item.url);
        return true;
      })
      .slice(0, 6);

    return new Response(
      JSON.stringify({
        movieTitle,
        summary: buildReviewSummary(movieTitle, rawResults),
        results,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  } catch (error) {
    console.error("Review search failed:", error);

    return new Response(
      JSON.stringify({
        error: "影评检索超时或网络不稳定，请稍后再试。",
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
