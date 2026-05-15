# CineMood TMDB 搭建步骤

## 1. 准备 API Key

1. 注册并登录 TMDB。
2. 进入 Settings -> API。
3. 推荐使用 API Read Access Token。
4. 在项目根目录的 `.env.local` 里加入：

```bash
TMDB_READ_ACCESS_TOKEN=你的_TMDB_Read_Access_Token
```

也可以使用旧版 API Key：

```bash
TMDB_API_KEY=你的_TMDB_API_Key
```

改完 `.env.local` 后需要重启开发服务器。

如果你所在网络访问 `api.themoviedb.org` 超时，可以额外配置一个可访问的代理地址：

```bash
TMDB_API_BASE_URL=https://你的代理域名/3
```

如果你使用 Clash Verge，当前项目也提供了代理启动命令：

```bash
npm run dev:proxy
```

这个命令会让 Next.js/Node 后端请求走 `127.0.0.1:7897`。

## 2. 当前推荐链路

开放式电影搜索：

```text
用户自然语言输入 -> /api/playlist -> TMDB search/movie + discover/movie -> 前端展示
```

情绪测片：

```text
情绪 + 场景 -> /api/recommend -> TMDB discover/movie -> 结果页展示
```

如果没有配置 TMDB，项目会暂时回落到原来的 Tavily 搜索或本地兜底推荐。

## 3. 去重逻辑

前端会把每次推荐出来的 TMDB movie id 存到浏览器本地：

```text
localStorage.cinemood_seen_movie_ids
```

下次请求时会把这些 id 通过 `exclude` 参数发给后端：

```text
/api/playlist?q=...&exclude=123,456,789
/api/recommend?mood=焦虑&scene=深夜独处&exclude=123,456,789
```

后端再过滤掉这些电影，避免重复推荐。

## 4. 后续可以继续加的功能

- 收藏片单：把 movie id 存到数据库，而不是只放浏览器 localStorage。
- 详情页：用 `/movie/{movie_id}` 读取演员、片长、国家、预告片。
- 中文关键词更准：用 OpenAI 把用户输入转成 genre、keyword、runtime、exclude_genres。
- 用户画像：根据收藏、跳过、复制文案次数调整推荐权重。
