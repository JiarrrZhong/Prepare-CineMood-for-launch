# CineMood 正式上线步骤

推荐先用 Vercel 部署。这个项目是 Next.js，Vercel 可以自动识别并部署。

## 1. 上线前必须知道的事

现在的网站可以部署成公开链接，任何人都可以在手机、电脑、平板上访问。

但目前的登录、片单、日记、头像、昵称、签到数据保存在浏览器 `localStorage`。这意味着：

- 同一个人在不同设备上访问，数据不会自动同步。
- 清理浏览器缓存后，本地数据可能消失。
- 这适合原型、公测、作品集展示。
- 如果要做真正的多设备账号系统，需要接 Supabase、Firebase 或自建后端数据库。

## 2. 准备代码仓库

确认 `.env.local` 不要上传。当前 `.gitignore` 已经忽略 `.env*`，这是正确的。

如果还没有 Git 仓库：

```bash
git init
git add .
git commit -m "Prepare CineMood for launch"
```

然后在 GitHub 新建一个仓库，把代码推上去：

```bash
git remote add origin https://github.com/你的用户名/cinemood.git
git branch -M main
git push -u origin main
```

## 3. 在 Vercel 导入项目

1. 打开 https://vercel.com
2. 登录后点击 `Add New...` -> `Project`
3. 选择刚才的 GitHub 仓库
4. Framework Preset 选择 `Next.js`
5. Build Command 保持 `npm run build`
6. Output Directory 留空

## 4. 配置环境变量

在 Vercel 项目里进入：

`Settings` -> `Environment Variables`

添加这些变量：

```bash
TMDB_READ_ACCESS_TOKEN=你的 TMDB v4 Read Access Token
TAVILY_API_KEY=你的 Tavily API Key
OPENAI_API_KEY=你的 OpenAI API Key
```

如果你用的是 TMDB v3 API Key，也可以加：

```bash
TMDB_API_KEY=你的 TMDB v3 API Key
```

如果生产环境访问 TMDB 不稳定，再额外配置：

```bash
TMDB_API_BASE_URL=https://你的代理域名/3
```

## 5. 部署

环境变量填完后点击 `Deploy`。

部署完成后，Vercel 会给你一个类似这样的链接：

```text
https://cinemood-你的用户名.vercel.app
```

把这个链接发给别人，别人就可以在任意设备访问。

## 6. 每次更新网站

本地改完代码后：

```bash
npm run lint
npm run build
git add .
git commit -m "Update CineMood"
git push
```

Vercel 会自动重新部署。

## 7. 自定义域名

如果你有自己的域名：

1. Vercel 项目进入 `Settings` -> `Domains`
2. 输入你的域名，比如 `cinemood.cn`
3. 按 Vercel 提示去域名服务商添加 DNS 记录
4. 等待生效

## 8. 真正多设备账号的下一步

如果目标是让用户在任意设备登录后看到同一份片单、日记、头像、昵称和签到记录，下一步需要把这些功能从 `localStorage` 迁移到数据库。

推荐方案：

- Supabase Auth：邮箱/手机号登录
- Supabase Postgres：保存用户资料、片单、日记、创作记录、签到
- Vercel：继续负责部署网站

需要迁移的数据表：

- `profiles`：昵称、头像、能量值
- `playlists`：用户片单
- `diary_entries`：观影日记
- `creation_records`：创作记录
- `search_activities`：搜索记录和电影基因
- `daily_checkins`：每日签到记录

这样才是真正意义上的“任意设备登录同一个账号，看到同一份个性化数据”。
