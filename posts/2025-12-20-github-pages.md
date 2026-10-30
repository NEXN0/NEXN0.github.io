---
title: 用 GitHub Pages 托管静态站点
published: 2025-12-20
description: 从仓库命名、分支选择到自定义域名，把一份静态产物免费发布到公网上的完整流程。
category: tech
tags: [GitHub, 部署, 工具]
---

GitHub Pages 大概是目前最省心的静态托管方案：免费、有 HTTPS、支持自定义域名，而且和代码放在同一个地方。

## 仓库该叫什么

两种命名方式，区别很关键：

| 仓库名 | 访问地址 | 说明 |
| --- | --- | --- |
| `<用户名>.github.io` | `https://<用户名>.github.io/` | 根路径，会占用主域名 |
| 任意名字 | `https://<用户名>.github.io/<仓库名>/` | 带子路径 |

如果站点里的链接都是绝对路径（`/assets/style.css`），那么放到子路径下就会 404。要么改仓库名，要么给所有链接加前缀。

```js
const BASE = '/my-blog';          // 子路径部署时设置
const url = (p) => `${BASE}${p}`; // 所有内部链接走这个函数
```

## 发布方式

有两种常见做法。

### 1. 从分支直接发布

把构建产物提交到 `main` 分支根目录，在仓库的 **Settings → Pages** 里选择 `Deploy from a branch`，目录选 `/ (root)`。

优点是简单，不需要 CI；缺点是构建产物和源码混在一起。

### 2. 用 GitHub Actions

源码放 `main`，构建产物由 Actions 发布：

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
```

然后在 **Settings → Pages** 的 Source 里选 `GitHub Actions`。

:::tip
如果用 Actions，记得在仓库设置里把 Pages 的来源改成 *GitHub Actions*，否则部署步骤会报错说没有可用的发布目标。
:::

## 几个常见问题

**404 但文件明明存在？**
检查文件名大小写。GitHub Pages 跑在 Linux 上，`Index.html` 和 `index.html` 是两个不同的文件。

**样式丢失？**
多半是绝对路径导致的，尤其当仓库名不是 `<用户名>.github.io` 的时候。

**更新了但页面没变？**
浏览器缓存，或者等待 CDN 刷新（通常一两分钟）。

**如何绑定自定义域名？**
在仓库根目录放一个 `CNAME` 文件，内容就是域名（不带协议），然后去 DNS 服务商加一条 `CNAME` 记录指向 `<用户名>.github.io`。

```text
# CNAME
blog.example.com
```

## 值不值得

对一个个人博客来说，GitHub Pages 的性能和稳定性完全够用。它唯一的限制是纯静态——没有服务端逻辑，没有数据库。

但对于「写点东西，然后让别人看到」这件事，静态已经足够了。
