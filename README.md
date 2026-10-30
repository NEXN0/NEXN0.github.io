# NEXN0's Blog

个人博客与笔记站点，部署在 GitHub Pages 上：**https://nexn0.github.io/**

视觉风格参照 [Fuwari](https://github.com/saicaca/fuwari)（Astro 主题），但整站用**零依赖的原生 Node.js 脚本**重新实现：没有 `node_modules`，没有构建框架，`node scripts/build.mjs` 一句话出站。

---

## 快速开始

```bash
node scripts/build.mjs --serve     # 构建并本地预览 http://localhost:4321
node scripts/build.mjs             # 只构建，输出到 dist/
npm run new -- "文章标题"          # 新建一篇文章
```

需要 Node.js 18 以上。**不需要 `npm install`**——整个项目没有任何第三方依赖。

## 目录结构

```
.
├── site.config.mjs        # 站点配置：标题、作者、导航、分类、友链
├── posts/                 # 文章（Markdown + front matter）
├── page/                  # 独立页面：about.md、links.md
├── src/
│   ├── layout.mjs         # HTML 模板：导航、侧栏、卡片、页脚
│   ├── styles/
│   │   ├── main.css       # 布局、主题变量、组件
│   │   └── markdown.css   # 正文排版、代码块、提示块
│   ├── client/main.js     # 主题切换、搜索、TOC、设置面板
│   └── assets/            # 横幅、头像、封面、图标（SVG）
├── scripts/
│   ├── build.mjs          # 构建器
│   ├── markdown.mjs       # 手写的 Markdown 渲染器
│   └── new-post.mjs       # 新建文章脚手架
└── .github/workflows/     # 推送到 main 后自动构建并发布到 Pages
```

## 写一篇文章

在 `posts/` 下新建 `.md` 文件，文件名建议使用 `YYYY-MM-DD-slug.md`，开头的 front matter 如下：

```yaml
---
title: 文章标题
published: 2026-03-01
description: 一句话摘要，会出现在列表和搜索结果里。
category: tech          # 对应 site.config.mjs 里 categories 的 slug
tags: [建站, CSS]
---

正文……
```

- `category` 只填 slug（`tech` / `essay`），首页与归档会自动统计数量
- `image` 可选，不填会自动根据 slug 生成一张抽象封面
- `draft: true` 的文章不会被打包
- 支持标题、列表、表格、代码块、引用、图片，以及 `:::tip` 提示块
- 文章页面会根据 `##` 与 `###` 自动生成目录

## 改站点信息

几乎所有的个性化内容都在 `site.config.mjs`：

| 字段 | 说明 |
| --- | --- |
| `title` / `subtitle` | 站点标题，出现在浏览器标签与首页 |
| `author` / `bio` | 侧栏显示的名字与一句话简介 |
| `avatar` / `banner` | 头像与横幅图片路径 |
| `hue` | 主题色相（0–360），225 是冷蓝，275 是紫 |
| `theme` | 默认主题：`auto` / `light` / `dark` |
| `github` | 侧栏与导航里的 GitHub 链接 |
| `nav` | 顶部导航项 |
| `categories` | 分类卡片与归档用的分类定义 |
| `projects` | 首页底部的「小项目」 |
| `links` | 友链页的站点列表 |

## 部署

推送到 `main` 分支即可，GitHub Actions 会自动构建并发布到 GitHub Pages：

```
push → actions/checkout → node scripts/build.mjs → upload-pages-artifact → deploy-pages
```

仓库的 **Settings → Pages → Source** 需要设置为 **GitHub Actions**（只需设置一次）。

如果想用自定义域名：在仓库根目录添加 `CNAME` 文件，内容为域名，并在 DNS 添加一条指向 `nexn0.github.io` 的 `CNAME` 记录。

## 功能

- 明暗双主题，跟随系统 / 手动切换，选择会存在浏览器里
- 色相滑块，实时改整站配色；页面宽度也可调
- 全站搜索（`Ctrl/⌘ + K`），基于构建时生成的 `search.json`
- 归档按年份分组，支持按标签筛选
- 文章目录（宽屏浮在右侧，窄屏折叠在正文上方）与滚动高亮
- 代码块一键复制、回到顶部、移动端抽屉导航
- RSS、sitemap、`robots.txt`、Open Graph 元信息
- 响应式，手机上自动变成单栏

## 许可

内容（`posts/`、`page/`）版权归作者所有；代码部分可自由参考。
