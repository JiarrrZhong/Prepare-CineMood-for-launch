import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 12000,
  maxRetries: 0,
});

type MovieSource = {
  title: string;
  url: string;
  content: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function searchMovieInfo(movieTitle: string) {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const tmdbInfo = await searchTmdbMovieInfo(movieTitle);

  if (!tavilyKey) {
    return {
      summary: tmdbInfo,
      sources: [],
    };
  }

  const query = `${movieTitle} movie plot synopsis themes ending analysis review characters visual style`;

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
        max_results: 4,
      }),
    });

    if (!response.ok) {
      return {
        summary: "",
        sources: [],
      };
    }

    const data = await response.json();

    const sources: MovieSource[] = (data.results || []).map(
      (item: { title: string; url: string; content: string }) => ({
        title: item.title,
        url: item.url,
        content: item.content,
      })
    );

    const webSummary = sources
      .map((source) => `${source.title}. ${source.content}`)
      .join("\n")
      .slice(0, 1800);

    return {
      summary: [tmdbInfo, webSummary].filter(Boolean).join("\n\n").slice(0, 2600),
      sources,
    };
  } catch (error) {
    console.error("Tavily movie search failed:", error);

    return {
      summary: tmdbInfo,
      sources: [],
    };
  }
}

async function searchTmdbMovieInfo(movieTitle: string) {
  const token =
    process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_TOKEN || "";
  const apiKey = process.env.TMDB_API_KEY || "";
  const tokenLooksLikeBearer = token.startsWith("eyJ");
  const bearerToken = tokenLooksLikeBearer ? token : "";
  const v3ApiKey = apiKey || (tokenLooksLikeBearer ? "" : token);

  if (!bearerToken && !v3ApiKey) return "";

  const params = new URLSearchParams({
    query: movieTitle,
    language: "zh-CN",
    include_adult: "false",
    page: "1",
  });

  if (v3ApiKey) params.set("api_key", v3ApiKey);

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?${params.toString()}`,
      {
        headers: bearerToken
          ? {
              Authorization: `Bearer ${bearerToken}`,
            }
          : undefined,
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) return "";

    const data = await response.json();
    const movie = data.results?.[0];

    if (!movie) return "";

    const title = movie.title || movie.original_title || movieTitle;
    const originalTitle = movie.original_title || title;
    const year = movie.release_date?.slice(0, 4) || "";
    const overview = movie.overview || "";

    return [
      `TMDB 电影资料：${title}${year ? `（${year}）` : ""}`,
      originalTitle !== title ? `原名：${originalTitle}` : "",
      overview ? `剧情简介：${overview}` : "",
      movie.vote_average ? `观众评分：${movie.vote_average}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  } catch (error) {
    console.error("TMDB creative context failed:", error);
    return "";
  }
}

function getMovieAngle(movieTitle: string, movieInfo: string) {
  const text = `${movieTitle} ${movieInfo}`.toLowerCase();

  if (
    text.includes("walter mitty") ||
    text.includes("白日梦想家") ||
    text.includes("secret life")
  ) {
    return {
      theme: "从麻木的日常里重新夺回生活感",
      hook: "一个总在幻想里逃跑的人，终于真的走进了世界",
      visual: "杂志社、冰岛、公路、滑板和远方风景",
      audience: "适合那些觉得生活卡住了、但心里还想重新出发的人",
      tension: "它表面是冒险喜剧，真正打动人的却是普通人对自我可能性的重新确认",
    };
  }

  if (text.includes("little forest") || text.includes("小森林")) {
    return {
      theme: "低能量时期，如何慢慢把自己养回来",
      hook: "一个人、一间厨房、四季食物，把生活重新过顺",
      visual: "田野、厨房、四季、食物和独居生活",
      audience: "适合累到不想社交、只想安静恢复的人",
      tension: "它不靠剧情刺激，而是靠日常细节让人重新相信生活可以被整理好",
    };
  }

  if (text.includes("before sunrise") || text.includes("爱在黎明破晓前")) {
    return {
      theme: "真正的浪漫，是有人认真听你说话",
      hook: "两个陌生人在一座城市里，用一整夜确认彼此的存在",
      visual: "维也纳街头、火车、夜晚漫游和长对话",
      audience: "适合想看不狗血但有真实心动感的人",
      tension: "它几乎没有强剧情，却把精神连接拍得比告白更动人",
    };
  }

  if (text.includes("moonlight") || text.includes("月光男孩")) {
    return {
      theme: "一个人如何在沉默里寻找自己的身份",
      hook: "它讲的不是一个人的成功，而是一个人如何艰难地成为自己",
      visual: "蓝色光影、海边、沉默、成长阶段和身体记忆",
      audience: "适合想看细腻、克制但后劲很强的电影的人",
      tension: "它最强的不是戏剧冲突，而是把无法说出口的孤独拍成了影像",
    };
  }

  if (text.includes("paddington") || text.includes("帕丁顿")) {
    return {
      theme: "善意不是幼稚，而是一种很难得的生活能力",
      hook: "一只小熊用礼貌和真诚，把混乱世界重新变得柔软",
      visual: "伦敦、彩色街区、果酱、家庭和童话感日常",
      audience: "适合想看轻松、可爱、但又不空洞的治愈电影的人",
      tension: "它看起来像儿童电影，但真正动人的是它相信善良仍然有效",
    };
  }

  if (
    text.includes("harry potter") ||
    text.includes("哈利波特") ||
    text.includes("霍格沃茨")
  ) {
    return {
      theme: "一个孤独的孩子如何在魔法世界里找到归属、勇气和选择善良的能力",
      hook: "它吸引人的从来不只是魔法，而是霍格沃茨像一个被现实拒绝过的人终于抵达的家",
      visual: "九又四分之三站台、城堡大厅、魔杖、魁地奇、禁林和少年们一次次面对黑暗的瞬间",
      audience: "适合想重温童年、寻找冒险感，也想看成长与友情的人",
      tension: "它把魔幻冒险拍成了成长寓言：真正的魔法不是咒语，而是人在恐惧里仍然选择保护别人",
    };
  }

  if (
    text.includes("lord of the rings") ||
    text.includes("指环王") ||
    text.includes("魔戒") ||
    text.includes("中土")
  ) {
    return {
      theme: "弱小的人如何背负超出自身的使命，并在黑暗时代守住希望",
      hook: "它最震撼的不是史诗场面，而是每个普通人都在问：我能不能撑过这一段路",
      visual: "夏尔、远征队、雪山、末日火山、精灵国度和大战前的沉默",
      audience: "适合想看宏大史诗、友情、牺牲和命运感的人",
      tension: "它的后劲来自一种很朴素的信念：世界会被改变，不一定靠最强大的人，而可能靠最不肯放弃的人",
    };
  }

  if (text.includes("parasite") || text.includes("寄生虫")) {
    return {
      theme: "阶层距离如何渗进房子、气味、雨水和每一次假装体面的笑里",
      hook: "它不是简单的贫富冲突，而是把阶层变成了一个人怎么站、怎么躲、怎么闻起来",
      visual: "半地下室、豪宅楼梯、暴雨、生日派对和逐渐失控的家庭骗局",
      audience: "适合想看黑色幽默、社会讽刺和强情节反转的人",
      tension: "它可怕的地方在于，每个角色都在努力活下去，但系统早就把他们放在了不同楼层",
    };
  }

  return {
    theme: "一个人在具体处境里如何面对选择、关系和自我确认",
    hook: `《${movieTitle}》真正适合写的地方，不是把剧情复述一遍，而是抓住它留给观众的情绪后坐力`,
    visual: "人物选择、关键场景、影像风格、台词余味和情绪后劲",
    audience: "适合想找一部不只是消遣、而是能留下回响的电影的人",
    tension: "它值得被讨论的地方，不是单纯的故事设定，而是电影如何把人物处境和观众当下的生活感连接起来",
  };
}

function getPlatformTone(platform: string) {
  if (platform === "小红书") {
    return {
      opening: "开头要像真实小红书笔记，第一句直接给情绪判断或收藏理由，不要官方腔。",
      shape:
        "结构：标题 1-2 个；正文 4-6 段短段落；每段不超过 55 字；结尾给互动问题；最后给 6-8 个标签。",
      rhythm: "语气有个人观影感，可以有金句，但不要堆感叹号，不要像广告。",
    };
  }

  if (platform === "抖音") {
    return {
      opening: "前 3 秒必须有强钩子，像真人口播，不要铺垫。",
      shape:
        "结构：3秒钩子、30秒口播脚本、可剪画面提示、结尾互动、字幕关键词。",
      rhythm: "句子短、有停顿、有反转，适合直接照着念。",
    };
  }

  if (platform === "B站") {
    return {
      opening: "标题要有观点，不要只有片名。",
      shape:
        "结构：视频标题、核心观点、3-4 个分段标题、每段讲什么、评论区问题。",
      rhythm: "更像深度影视区口吻，观点清楚，能展开剧情、主题和视听语言。",
    };
  }

  if (platform === "公众号") {
    return {
      opening: "开头要有散文感和观点，不要像影单简介。",
      shape: "结构：文章标题、导语、正文 5-7 段、结尾回扣主题。",
      rhythm: "文字可以更沉稳，重视电影主题、人物命运和现实共鸣。",
    };
  }

  return {
    opening: "开头直接有观点和情绪钩子。",
    shape: "结构清楚，适合发布。",
    rhythm: "文字要像真人写作，不要模板化。",
  };
}

function buildFallbackContent(
  movieTitle: string,
  platform: string,
  style: string,
  goal: string,
  movieInfo: string
) {
  const title = movieTitle || "未命名电影";
  const angle = getMovieAngle(title, movieInfo);

  if (platform === "抖音") {
    return `【3秒开头钩子】
别急着划走。《${title}》不是那种看完就结束的电影，它会在你关掉屏幕后慢慢回来。

【口播正文】
我建议你不要把它当成普通剧情片去看。
它真正好看的地方，是电影一直在追问一件事：${angle.theme}。

很多电影会急着告诉你答案，但《${title}》更像是把一个人放进具体处境里，让你看见他的犹豫、逃避、选择和代价。

剪辑时可以抓这几个点：${angle.visual}。
口播不要复述剧情，而是抓住这个角度：${angle.hook}。

它最适合打动的观众，是${angle.audience}。
因为它的后劲不在反转，而在${angle.tension}。

【结尾互动】
你有没有一部电影，是当时没觉得怎样，过几天才突然理解它的？

【字幕关键词】
${title}｜电影推荐｜情绪片单｜${style}｜${goal}`;
  }

  if (platform === "B站") {
    return `【视频标题】
为什么《${title}》看似在讲故事，真正留下来的却是一种状态？

【核心观点】
《${title}》值得拆，不是因为它有多少信息点，而是它把「${angle.theme}」拍成了观众能代入的体验。

【分段结构】
1. 观众为什么会被它击中：${angle.audience}
2. 电影的核心钩子是什么：${angle.hook}
3. 哪些画面和场景最适合剪出来讲：${angle.visual}
4. 它为什么有讨论价值：${angle.tension}

【视频正文方向】
这期不要只聊“电影好不好看”。更有意思的是，它为什么能被观众记住。

《${title}》的价值不只是剧情，而是它能把一种抽象感受变得具体。观众愿意分享它，往往不是因为知道了结局，而是因为某个段落突然说中了自己。

所以这部片适合从“人物处境”和“观众状态”两条线一起讲：一条线讲电影里的人怎么走到这一步，另一条线讲我们为什么会在那一刻被击中。

【评论区问题】
你觉得一部电影最容易让人记住的是剧情、台词、画面，还是它击中的那个瞬间？`;
  }

  if (platform === "公众号") {
    return `【文章标题】
《${title}》：有些电影让人念念不忘，是因为它说中了我们

【导语】
有些电影不是靠一个反转留住人，而是靠一种很细的情绪。你看完时未必立刻激动，但过一阵子，它会在某个瞬间重新浮上来。

《${title}》就是这种电影。

【正文】
它真正适合被写的地方，不是剧情梗概，而是它提供了一种状态：${angle.theme}。

这也是它比普通推荐更有后劲的原因。它让观众看到的不是“别人发生了什么”，而是“我是不是也正在经历类似的东西”。

它的内容切口可以放在这里：${angle.hook}。

如果从影像和传播角度看，它的记忆点也很清晰：${angle.visual}。这些不是装饰，而是电影把情绪落到具体场景里的方式。

所以写这部电影时，不建议只复述剧情。更好的切入方式是：为什么它会在某个阶段击中观众？为什么它适合被收藏、被转发、被反复提起？

《${title}》真正动人的地方，正在于${angle.tension}。

【结尾互动】
你有没有一部电影，是过了很久才突然看懂的？`;
  }

  return `【标题参考】
看完《${title}》，我终于明白它为什么会被反复提起

【开头钩子】
有些电影不是靠“神片”两个字打动人，而是你看完之后，会突然想起里面某个场景、某个选择，甚至某个沉默的瞬间。

【正文文案】
《${title}》就是这样的电影。

它真正打动人的地方，是它拍出了一个很具体的状态：${angle.theme}。

如果要推荐这部电影，我不会从剧情简介开始。更好的切口是：${angle.hook}。

它的记忆点也很清楚：${angle.visual}。这些细节会让观众在看完之后，还能想起电影的气味和温度。

所以它适合的人，不一定是“想找一部热闹电影”的人，而是${angle.audience}。

我觉得《${title}》最值得被分享的地方在于：${angle.tension}。

【互动引导】
你有没有一部电影，是在某个阶段突然击中你的？

【标签】
#电影推荐 #今日片单 #值得重看的电影 #${title} #CineMood影感实验室`;
}

export async function POST(request: Request) {
  let movieTitle = "";
  let platform = "小红书";
  let style = "治愈走心";
  let goal = "种草推荐";
  let movieInfo = "";
  let sources: MovieSource[] = [];

  try {
    const body = await request.json();

    movieTitle = body.movieTitle || "";
    platform = body.platform || "小红书";
    style = body.style || "治愈走心";
    goal = body.goal || "种草推荐";

    if (!movieTitle.trim()) {
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

    const movieSearch = await searchMovieInfo(movieTitle);
    movieInfo = movieSearch.summary;
    sources = movieSearch.sources;

    if (!process.env.OPENAI_API_KEY) {
      const fallback = buildFallbackContent(
        movieTitle,
        platform,
        style,
        goal,
        movieInfo
      );

      return new Response(
        JSON.stringify({
          content: fallback,
          source: "fallback",
          note: "没有检测到 OPENAI_API_KEY，已使用联网资料兜底生成。",
          sources,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    const angle = getMovieAngle(movieTitle, movieInfo);
    const platformTone = getPlatformTone(platform);

    const prompt = `
你是一个成熟的中文电影内容创作者，熟悉小红书、抖音、B站、公众号的真实表达方式，也懂电影剧情分析、人物弧光、主题表达和视听语言。

请根据以下信息生成一份可发布内容。

电影名：${movieTitle}
发布平台：${platform}
内容风格：${style}
发布目的：${goal}

电影理解：
主题：${angle.theme}
内容钩子：${angle.hook}
视觉/记忆点：${angle.visual}
适合受众：${angle.audience}
传播张力：${angle.tension}

联网资料参考：
${movieInfo.slice(0, 1800) || "暂无资料。"}

平台语感：
${platformTone.opening}
${platformTone.shape}
${platformTone.rhythm}

要求：
1. 输出中文。
2. 控制在 650 字以内。
3. 必须体现你理解这部电影的剧情、人物处境、主题或影像气质，不要只写泛泛情绪。
4. 不要写万能模板，不要出现“这部电影值得一看”这种空话。
5. 不要原样复制联网资料，不要堆百科信息、演员名单、制片信息。
6. 开头必须有让人继续读下去的钩子。
7. 文案要有真实创作者的口吻，可以有观点、有审美判断、有情绪，但不要夸张营销腔。
8. 如果资料不足，请坦诚地围绕片名和已知信息写成“内容切入方案”，不要编造具体剧情。
9. 不要解释过程，直接输出内容。

平台格式：
- 小红书：标题、正文、互动问题、标签
- 抖音：3秒钩子、口播正文、结尾互动、字幕关键词
- B站：视频标题、分段结构、核心观点、评论区问题
- 公众号：文章标题、导语、正文、结尾互动
`;

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      max_output_tokens: 1000,
    });

    const generatedText =
      response.output_text ||
      buildFallbackContent(movieTitle, platform, style, goal, movieInfo);

    return new Response(
      JSON.stringify({
        content: generatedText,
        source: "openai",
        sources,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Generate content error message:", getErrorMessage(error));

    const fallback = buildFallbackContent(
      movieTitle,
      platform,
      style,
      goal,
      movieInfo
    );

    return new Response(
      JSON.stringify({
        content: fallback,
        source: "fallback",
        note: "AI 额度或网络暂时不可用，已使用电影资料生成备用文案。",
        sources,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
