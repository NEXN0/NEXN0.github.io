#!/usr/bin/env node
/**
 * 静态站点构建器（零依赖）
 *   node scripts/build.mjs            构建到 dist/
 *   node scripts/build.mjs --serve    构建并启动本地预览服务器
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { site } from '../site.config.mjs';
import * as L from '../src/layout.mjs';
import { renderMarkdown } from './markdown.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const { url, fmtDate } = L;

L.setBase(site.basePath || '');

/* ---------------------------------------------------------------- helpers */

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function rimraf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function writeFile(rel, content) {
  const full = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

/* ------------------------------------------------------------ front matter */

function parseFrontMatter(raw) {
  const text = raw.replace(/\r\n?/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) return { data: {}, body: text };

  const data = {};
  let currentKey = null;
  for (const line of m[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(unquote(listItem[1].trim()));
      continue;
    }
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, key, rawValue] = kv;
    currentKey = key;
    const value = rawValue.trim();
    if (value === '') {
      data[key] = [];
    } else if (/^\[.*\]$/.test(value)) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => unquote(s.trim()))
        .filter(Boolean);
    } else if (value === 'true' || value === 'false') {
      data[key] = value === 'true';
    } else {
      data[key] = unquote(value);
    }
  }
  return { data, body: text.slice(m[0].length) };
}

const unquote = (s) =>
  (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))
    ? s.slice(1, -1)
    : s;

function readingTime(text) {
  const cjk = (text.match(/[\u4e00-\u9fa5\u3040-\u30ff]/g) || []).length;
  const words = (text.replace(/[\u4e00-\u9fa5\u3040-\u30ff]/g, ' ').match(/[A-Za-z0-9_'-]+/g) || []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 220));
}

function formatHuman(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

/* ------------------------------------------------------------------- data */

const categoryBySlug = new Map(site.categories.map((c) => [c.slug, c]));
const categoryByName = new Map(site.categories.map((c) => [c.name, c]));

function resolveCategory(value) {
  if (!value) return null;
  return categoryBySlug.get(value) || categoryByName.get(value) || null;
}

function loadPosts() {
  const dir = path.join(ROOT, 'posts');
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const { data, body } = parseFrontMatter(raw);
    const baseSlug = file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    const slug = data.slug || baseSlug;
    const category = resolveCategory(data.category);
    const rendered = renderMarkdown(body);
    return {
      ...data,
      slug,
      file,
      body,
      html: rendered.html,
      headings: rendered.headings,
      description: data.description || '',
      image: data.image || `/assets/covers/posts/${slug}.svg`,
      autoCover: !data.image,
      published: data.published || file.slice(0, 10),
      updated: data.updated || null,
      tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
      category: category ? category.slug : null,
      categoryName: category ? category.name : null,
      categoryObj: category,
      draft: data.draft === true,
      minutes: readingTime(body),
    };
  });

  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => String(b.published).localeCompare(String(a.published)));
}


/* ---------------------------------------------------------------- covers */

const COVER_HUES = [225, 250, 200, 275, 320, 168, 235, 300];

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** 根据文章 slug 生成一张确定性的抽象封面 */
function coverSvg(seed) {
  const h = hashStr(seed);
  const hue = COVER_HUES[h % COVER_HUES.length];
  const hue2 = (hue + 34) % 360;
  const variant = h % 4;
  const x = 120 + (h % 220);

  const arts = [
    // 0 — 同心圆
    `<g fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.6">
       <circle cx="${620 - (h % 100)}" cy="150" r="70"/>
       <circle cx="${620 - (h % 100)}" cy="150" r="118"/>
       <circle cx="${620 - (h % 100)}" cy="150" r="166"/>
       <circle cx="${620 - (h % 100)}" cy="150" r="214" stroke-opacity=".12"/>
     </g>
     <circle cx="${620 - (h % 100)}" cy="150" r="26" fill="#fff" fill-opacity=".35"/>`,
    // 1 — 光带
    `<g stroke="#fff" stroke-opacity=".18" stroke-width="1.4" fill="none">
       ${Array.from({ length: 9 }, (_, i) => `<path d="M${-60 + i * 34} 340 L${210 + i * 34} -20"/>`).join('')}
     </g>
     <rect x="0" y="238" width="800" height="112" fill="#fff" fill-opacity=".06"/>`,
    // 2 — 网格 + 光球
    `<g stroke="#fff" stroke-opacity=".1" stroke-width="1">
       ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 100} 0V350"/>`).join('')}
       ${Array.from({ length: 5 }, (_, i) => `<path d="M0 ${i * 78}H800"/>`).join('')}
     </g>
     <circle cx="${x + 320}" cy="130" r="86" fill="#fff" fill-opacity=".2"/>
     <circle cx="${x + 320}" cy="130" r="86" fill="none" stroke="#fff" stroke-opacity=".3"/>`,
    // 3 — 山形层叠
    `<path d="M0 250 C 140 210, 250 246, 380 218 C 520 188, 620 226, 800 200 L800 350 L0 350Z" fill="#fff" fill-opacity=".12"/>
     <path d="M0 292 C 160 262, 280 296, 420 272 C 560 248, 660 282, 800 262 L800 350 L0 350Z" fill="#fff" fill-opacity=".1"/>
     <path d="M0 322 C 180 302, 300 326, 450 308 C 600 290, 690 314, 800 300 L800 350 L0 350Z" fill="#fff" fill-opacity=".08"/>`,
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 350" width="800" height="350">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 62% 58%)"/>
      <stop offset=".55" stop-color="hsl(${hue2} 58% 46%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 350) % 360} 55% 34%)"/>
    </linearGradient>
    <filter id="blur" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="58"/>
    </filter>
  </defs>
  <rect width="800" height="350" fill="url(#bg)"/>
  <g filter="url(#blur)">
    <ellipse cx="${520 + (h % 120)}" cy="${40 + (h % 60)}" rx="220" ry="150" fill="hsl(${(hue + 55) % 360} 85% 72%)" opacity=".5"/>
    <ellipse cx="${100 + (h % 80)}" cy="${320 - (h % 60)}" rx="200" ry="140" fill="hsl(${(hue + 320) % 360} 78% 64%)" opacity=".38"/>
  </g>
  ${arts[variant]}
  <g opacity=".45" fill="#fff">
    <circle cx="726" cy="286" r="2.6"/>
    <circle cx="700" cy="308" r="1.8"/>
    <circle cx="748" cy="250" r="2"/>
  </g>
</svg>`;
}

/* ----------------------------------------------------------------- pieces */

function metaLine(post) {
  const parts = [
    `<span>${L.icon('calendar')} ${formatHuman(post.published)}</span>`,
    `<span>${L.icon('clock')} 约 ${post.minutes} 分钟</span>`,
  ];
  if (post.categoryName) {
    parts.push(
      `<a href="${url(`/categories/${post.category}/`)}">${L.icon('folder')} ${esc(post.categoryName)}</a>`
    );
  }
  return `<div class="article-meta">${parts.join('<span class="dot"></span>')}</div>`;
}

function tocHtml(headings) {
  const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
  if (items.length < 2) return { rail: '', inline: '' };
  const list = `<ul class="toc-list">${items
    .map(
      (h) =>
        `<li class="depth-${h.depth}"><a href="#${encodeURIComponent(h.id)}">${esc(h.text)}</a></li>`
    )
    .join('')}</ul>`;
  return {
    list,
    rail: `<aside class="toc-rail"><div class="toc-rail-title">目录</div><nav class="toc">${list}</nav></aside>`,
    inline: `<details class="toc-inline"><summary>${L.icon('menuBook')} 本文目录</summary><nav class="toc">${list}</nav></details>`,
  };
}

/* ------------------------------------------------------------------ pages */

const posts = loadPosts();
const tags = [...new Set(posts.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, 'zh'));
const categoryCounts = Object.fromEntries(site.categories.map((c) => [c.slug, 0]));
posts.forEach((p) => {
  if (p.category && categoryCounts[p.category] !== undefined) categoryCounts[p.category]++;
});

function baseOptions(extra) {
  return {
    active: '/',
    categoryCounts,
    tags,
    ...extra,
  };
}

/* ------------------------------------------------------------------- home */

function buildHome() {
  const recent = posts.slice(0, site.homePostCount);
  const cards = recent.map((p, i) => L.postCard(p, 120 + i * 40)).join('');

  const content = [
    site.categories
      .map((c, i) => L.categoryCard(c, site, categoryCounts[c.slug] || 0, i * 50))
      .join('\n'),
    L.sectionDivider('最新文章'),
    `<div class="post-grid">${cards}</div>`,
    `<div class="home-more onload-animation"><a class="btn-regular" href="${url('/archive/')}">查看全部文章${L.icon(
      'arrowRight'
    )}</a></div>`,
    site.projects.length ? L.sectionDivider('小项目') : '',
    site.projects.map((p) => L.projectCard(p)).join(''),
  ].join('\n');

  return L.layout(
    baseOptions({
      isHome: true,
      title: '',
      path: '/',
      content,
    }),
    site
  );
}

/* ---------------------------------------------------------------- archive */

function buildArchive() {
  const byYear = new Map();
  for (const p of posts) {
    const year = String(p.published).slice(0, 4) || '未分类';
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(p);
  }

  const chips = [
    `<a class="filter-chip is-active" href="${url('/archive/')}" data-tag="">全部</a>`,
    ...tags.map(
      (t) =>
        `<a class="filter-chip" href="${url(`/archive/?tag=${encodeURIComponent(t)}`)}" data-tag="${esc(
          t
        )}">${esc(t)}</a>`
    ),
  ].join('');

  const groups = [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(
      ([year, list]) => `<section class="year-group" data-year="${esc(year)}">
  <h2 class="year-label">${esc(year)}</h2>
  ${list
    .map(
      (p) => `<a class="archive-item" href="${url(`/posts/${p.slug}/`)}" data-tags="${esc(
        p.tags.join('|')
      )}" data-cat="${esc(p.categoryName || '')}">
    <span class="archive-date">${fmtDate(p.published).slice(5)}</span>
    <span class="archive-title">${esc(p.title)}</span>
    <span class="archive-tags">${p.tags
      .slice(0, 2)
      .map((t) => `<span class="tag-chip tag-chip-sm">${esc(t)}</span>`)
      .join('')}</span>
  </a>`
    )
    .join('\n')}
</section>`
    )
    .join('\n');

  const content = `<div class="card-base archive-card onload-animation">
  <div class="filter-row" id="archive-filters">${chips}</div>
  <div id="archive-list">${groups || '<p class="empty-state">还没有文章。</p>'}</div>
  <p class="empty-state" id="archive-empty" hidden>这个标签下暂时没有文章。</p>
</div>`;

  return L.layout(
    baseOptions({
      active: '/archive/',
      path: '/archive/',
      title: '归档',
      description: `全部 ${posts.length} 篇文章的归档列表`,
      content: L.pageHeader(`归档 · ${posts.length} 篇`, '按时间倒序排列，点击标签可以筛选。') + content,
    }),
    site
  );
}

/* ------------------------------------------------------------------ posts */

function buildPost(post, index) {
  const newer = posts[index - 1] || null;
  const older = posts[index + 1] || null;

  const prevNext =
    newer || older
      ? `<div class="prev-next">
  ${
    older
      ? `<a class="card-base onload-animation" href="${url(`/posts/${older.slug}/`)}"><span class="prev-next-label">上一篇</span><span class="prev-next-title">${esc(
          older.title
        )}</span></a>`
      : '<span></span>'
  }
  ${
    newer
      ? `<a class="card-base next onload-animation" href="${url(`/posts/${newer.slug}/`)}"><span class="prev-next-label">下一篇</span><span class="prev-next-title">${esc(
          newer.title
        )}</span></a>`
      : '<span></span>'
  }
</div>`
      : '';

  const toc = tocHtml(post.headings);

  const tagChips = post.tags
    .map(
      (t) =>
        `<a class="tag-chip" href="${url(`/archive/?tag=${encodeURIComponent(t)}`)}">${esc(t)}</a>`
    )
    .join('');

  const cover = post.image
    ? `<div class="article-cover"><img src="${url(post.image)}" alt="${esc(post.title)}的封面" decoding="async"></div>`
    : '';

  const article = `<article class="card-base article-card onload-animation">
  <header class="article-head">
    <h1 class="article-title">${esc(post.title)}</h1>
    ${metaLine(post)}
  </header>
  ${toc.inline}
  ${cover}
  <div class="prose">${post.html}</div>
  ${tagChips ? `<div class="article-tags">${tagChips}</div>` : ''}
</article>
${prevNext}
${toc.rail}`;

  return L.layout(
    baseOptions({
      active: '/archive/',
      path: `/posts/${post.slug}/`,
      title: post.title,
      description: post.description,
      image: post.image,
      ogType: 'article',
      content: article,
    }),
    site
  );
}

/* -------------------------------------------------------------- categories */

function buildCategory(cat) {
  const list = posts.filter((p) => p.category === cat.slug);
  const cards = list.map((p, i) => L.postCard(p, 60 + i * 40)).join('');
  const content = `${L.pageHeader(cat.name, `${cat.title} · 共 ${list.length} 篇文章`)}
<div class="category-lead onload-animation">${esc(cat.description)}</div>
<div class="post-grid">${cards || '<p class="empty-state">这个分类下还没有文章。</p>'}</div>`;

  return L.layout(
    baseOptions({
      active: '/',
      path: `/categories/${cat.slug}/`,
      title: cat.name,
      description: cat.description,
      content,
    }),
    site
  );
}

/* ------------------------------------------------------------- static pages */

function loadPage(name) {
  const file = path.join(ROOT, 'page', `${name}.md`);
  if (!fs.existsSync(file)) return { data: {}, html: '' };
  const { data, body } = parseFrontMatter(fs.readFileSync(file, 'utf8'));
  return { data, html: renderMarkdown(body).html };
}

function buildAbout() {
  const page = loadPage('about');
  const title = page.data.title || '关于';
  const content = `${L.pageHeader(title, page.data.subtitle || site.subtitle)}
<div class="card-base article-card about-card onload-animation">
  <div class="about-head">
    <div class="about-avatar"><img src="${url(site.avatar)}" alt="${esc(site.author)}" width="200" height="200" decoding="async"></div>
    <div>
      <div class="about-name">${esc(page.data.name || site.author)}</div>
      <div class="about-sub">${esc(page.data.role || site.bio)}</div>
    </div>
  </div>
  <div class="prose">${page.html}</div>
</div>`;

  return L.layout(
    baseOptions({ active: '/about/', path: '/about/', title, content }),
    site
  );
}

function buildLinks() {
  const page = loadPage('links');
  const cards = site.links
    .map(
      (l) => `<a class="card-base link-card onload-animation" href="${esc(l.href)}" target="_blank" rel="noopener">
  <span class="link-avatar"><img src="${url(l.avatar)}" alt="" width="96" height="96" loading="lazy"></span>
  <span>
    <span class="link-name">${esc(l.name)}</span>
    <span class="link-desc">${esc(l.description)}</span>
  </span>
</a>`
    )
    .join('');

  const content = `${L.pageHeader('友链', '一些值得一看的站点与工具')}
${
  page.html
    ? `<div class="card-base article-card onload-animation"><div class="prose">${page.html}</div></div>`
    : ''
}
<div class="links-grid">${cards}</div>`;

  return L.layout(
    baseOptions({ active: '/links/', path: '/links/', title: '友链', content }),
    site
  );
}

function build404() {
  const content = `<div class="card-base not-found onload-animation">
  <p class="not-found-code">404</p>
  <p class="not-found-text">这个页面好像不存在，可能已经被移动或删除了。</p>
  <a class="btn-regular" href="${url('/')}">${L.icon('arrowRight')} 回到主页</a>
</div>`;
  return L.layout(baseOptions({ path: '/404.html', title: '页面不存在', content, hideFab: true }), site);
}

/* --------------------------------------------------------------- feeds */

function buildRss() {
  const items = posts
    .slice(0, 20)
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${site.url}/posts/${p.slug}/</link>
      <guid isPermaLink="true">${site.url}/posts/${p.slug}/</guid>
      <description>${esc(p.description)}</description>
      <pubDate>${new Date(p.published).toUTCString()}</pubDate>
    </item>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.title)}</title>
    <link>${site.url}/</link>
    <description>${esc(site.subtitle)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

function buildSitemap(routes) {
  const urls = routes
    .map(
      (r) =>
        `  <url><loc>${site.url}${r.loc}</loc>${
          r.lastmod ? `<lastmod>${r.lastmod}</lastmod>` : ''
        }</url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/* ------------------------------------------------------------------- main */

function build() {
  const started = Date.now();
  rimraf(DIST);
  fs.mkdirSync(DIST, { recursive: true });

  // 静态资源
  copyDir(path.join(ROOT, 'src/assets'), path.join(DIST, 'assets'));
  fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
  const css =
    fs.readFileSync(path.join(ROOT, 'src/styles/main.css'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(ROOT, 'src/styles/markdown.css'), 'utf8') +
    `
/* 构建过程中追加的零散样式 */
.category-lead {
  padding: 0 0.35rem;
  margin-top: -0.35rem;
  font-size: 0.92rem;
  color: var(--text-60);
}
.home-more {
  display: flex;
  justify-content: center;
  margin-top: 0.25rem;
}
.not-found {
  padding: 4rem 2rem;
  text-align: center;
}
.not-found-code {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
  color: var(--primary);
  opacity: 0.85;
}
.not-found-text {
  margin: 0.8rem 0 1.6rem;
  color: var(--text-50);
}
#archive-list .year-group[hidden],
#archive-list .archive-item[hidden] {
  display: none;
}
`;
  fs.writeFileSync(path.join(DIST, 'assets/main.css'), css);
  fs.copyFileSync(path.join(ROOT, 'src/client/main.js'), path.join(DIST, 'assets/main.js'));

  // 自动封面
  posts.filter((p) => p.autoCover).forEach((p) => {
    writeFile(`assets/covers/posts/${p.slug}.svg`, coverSvg(p.slug));
  });

  // 页面
  writeFile('index.html', buildHome());
  writeFile('archive/index.html', buildArchive());
  writeFile('about/index.html', buildAbout());
  writeFile('links/index.html', buildLinks());
  writeFile('404.html', build404());

  posts.forEach((p, i) => writeFile(`posts/${p.slug}/index.html`, buildPost(p, i)));
  site.categories.forEach((c) => writeFile(`categories/${c.slug}/index.html`, buildCategory(c)));

  // 订阅与索引
  writeFile('rss.xml', buildRss());
  writeFile(
    'search.json',
    JSON.stringify(
      posts.map((p) => ({
        title: p.title,
        url: `/posts/${p.slug}/`,
        description: p.description,
        date: p.published,
        tags: p.tags,
        category: p.categoryName || '',
      })),
      null,
      0
    )
  );

  const routes = [
    { loc: '/' },
    { loc: '/archive/' },
    { loc: '/about/' },
    { loc: '/links/' },
    ...site.categories.map((c) => ({ loc: `/categories/${c.slug}/` })),
    ...posts.map((p) => ({ loc: `/posts/${p.slug}/`, lastmod: p.updated || p.published })),
  ];
  writeFile('sitemap.xml', buildSitemap(routes));
  writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
  writeFile('.nojekyll', '');

  const ms = Date.now() - started;
  console.log(
    `✓ 构建完成：${posts.length} 篇文章 · ${site.categories.length} 个分类 · ${routes.length} 个页面 (${ms}ms)`
  );
  console.log(`  输出目录：${path.relative(ROOT, DIST)}/`);
}

/* ----------------------------------------------------------------- server */

function serve() {
  const port = Number(process.env.PORT || 4321);
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.xml': 'application/xml; charset=utf-8',
    '.ico': 'image/x-icon',
  };

  http
    .createServer((req, res) => {
      const clean = decodeURIComponent(req.url.split('?')[0]);
      let file = path.join(DIST, clean);
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) {
        file = path.join(DIST, '404.html');
        res.statusCode = 404;
      }
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      fs.createReadStream(file).pipe(res);
    })
    .listen(port, () => {
      console.log(`\n  本地预览： http://localhost:${port}\n  Ctrl+C 停止\n`);
    });
}

build();
if (process.argv.includes('--serve')) serve();
