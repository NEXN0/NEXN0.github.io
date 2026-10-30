/**
 * 页面模板 —— 纯字符串拼接，无框架。
 */

/* ------------------------------------------------------------------ icons */

const ICONS = {
  github:
    '<path fill="currentColor" stroke="none" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  arrowUp: '<path d="m5 12 7-7 7 7M12 19V5"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  tag: '<path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  rss: '<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.5" fill="currentColor"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  sliders:
    '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  sparkles: '<path d="m12 3 1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z"/><path d="M19 15l.9 2.1 2.1.9-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/>',
  menuBook:
    '<path d="M4 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4V4Z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h6V4Z"/>',
};

export function icon(name, extra = '') {
  const body = ICONS[name] || ICONS.chevron;
  return `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/* ------------------------------------------------------------------ utils */

export function url(p = '/') {
  return p.startsWith('http') ? p : `${siteBase}${p}`;
}

export let siteBase = '';

export function setBase(base) {
  siteBase = base && base !== '/' ? base.replace(/\/$/, '') : '';
}

export const fmtDate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
};

/* -------------------------------------------------------------- page shell */

export function head(o, site) {
  const title = o.title ? `${o.title} - ${site.title}` : `${site.title} - ${site.subtitle}`;
  const desc = o.description || site.subtitle;
  return `<!DOCTYPE html>
<html lang="zh-CN" data-hue="${site.hue}" data-theme="${site.theme}" data-base="${siteBase}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${ep(title)}</title>
<meta name="description" content="${ep(desc)}">
<meta name="author" content="${ep(site.author)}">
<meta property="og:site_name" content="${ep(site.title)}">
<meta property="og:title" content="${ep(title)}">
<meta property="og:description" content="${ep(desc)}">
<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:url" content="${ep(site.url + (o.path || '/'))}">
${o.image ? `<meta property="og:image" content="${ep(site.url + o.image)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#f3f5f9" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1a1c22" media="(prefers-color-scheme: dark)">
<link rel="canonical" href="${ep(site.url + (o.path || '/'))}">
<link rel="icon" href="${url('/assets/favicon.svg')}" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${ep(site.title)}" href="${url('/rss.xml')}">
<link rel="stylesheet" href="${url('/assets/main.css')}">
<script>${bootstrapScript(site)}</script>
</head>`;
}

function bootstrapScript(site) {
  return `(function(){try{
var D=${JSON.stringify(site.theme || 'auto')},hue=${Number(site.hue)||225};
var t=localStorage.getItem('theme')||D;
var dark=t==='dark'||(t==='auto'&&matchMedia('(prefers-color-scheme:dark)').matches);
document.documentElement.classList.toggle('dark',dark);
document.documentElement.style.setProperty('--hue',localStorage.getItem('hue')||hue);
var w=localStorage.getItem('pageWidth');
if(w)document.documentElement.style.setProperty('--page-width-user',w+'rem');
}catch(e){}})();`;
}

export function layout(o, site) {
  return `${head(o, site)}
<body class="${o.bodyClass || ''}" data-hue="${site.hue}">
<div id="top-row">
  ${navbar(o.active, site)}
</div>
<div id="banner-wrapper" class="${o.isHome ? 'banner-home' : 'banner-page'}">
  <div id="banner">
    <div class="banner-scrim"></div>
    <img src="${url(site.banner)}" alt="" aria-hidden="true" fetchpriority="high" decoding="async">
  </div>
</div>
<div id="page">
  <div id="main-grid">
    <aside id="sidebar">
      ${sidebar(site, o)}
    </aside>
    <main id="main-content">
      ${o.content}
    </main>
    <footer id="site-footer">${footer(site)}</footer>
  </div>
</div>
${o.hideFab ? '' : fab()}
<div id="overlay" hidden></div>
<script src="${url('/assets/main.js')}" type="module"></script>
</body>
</html>`;
}

/* ----------------------------------------------------------------- navbar */

function navbar(active, site) {
  const links = site.nav
    .map(
      (n) =>
        `<a class="nav-link${n.href === active ? ' is-active' : ''}" href="${url(n.href)}">${ep(
          n.text
        )}</a>`
    )
    .join('');
  const mobile = site.nav
    .map(
      (n) =>
        `<a class="panel-link" href="${url(n.href)}"><span>${ep(n.text)}</span>${icon(
          'chevron'
        )}</a>`
    )
    .join('');

  return `<header id="navbar" class="card-base">
  <div class="navbar-inner">
    <a class="brand" href="${url('/')}">
      ${icon('sparkles', 'brand-icon')}
      <span>${ep(site.title)}</span>
    </a>
    <nav class="nav-links" aria-label="主导航">${links}
      <a class="nav-link" href="${ep(site.github)}" target="_blank" rel="noopener">GitHub${icon(
    'external'
  )}</a>
    </nav>
    <div class="navbar-actions">
      <button class="btn-icon" id="search-trigger" aria-label="搜索" title="搜索 (Ctrl/⌘ K)">${icon(
        'search'
      )}</button>
      <button class="btn-icon" id="settings-trigger" aria-label="显示设置" title="显示设置">${icon(
        'sliders'
      )}</button>
      <button class="btn-icon" id="theme-trigger" aria-label="切换主题" title="切换主题">${icon(
        'sun',
        'icon-sun'
      )}${icon('moon', 'icon-moon')}</button>
      <button class="btn-icon nav-burger" id="menu-trigger" aria-label="菜单" aria-expanded="false">${icon(
        'menu',
        'icon-menu'
      )}${icon('close', 'icon-close')}</button>
    </div>
  </div>
  <div class="float-panel nav-panel" id="nav-panel" hidden>
    ${mobile}
    <a class="panel-link" href="${ep(site.github)}" target="_blank" rel="noopener"><span>GitHub</span>${icon(
    'external'
  )}</a>
  </div>
</header>`;
}

/* ---------------------------------------------------------------- sidebar */

function profileCard(site) {
  return `<div class="card-base profile-card">
  <a class="avatar-link" href="${url('/about/')}" aria-label="关于我">
    <span class="avatar-hover">${icon('arrowRight')}</span>
    <img class="avatar" src="${url(site.avatar)}" alt="${ep(site.author)} 的头像" width="480" height="480" loading="eager">
  </a>
  <h2 class="profile-name">${ep(site.author)}</h2>
  <div class="profile-accent"></div>
  <p class="profile-bio">${ep(site.bio)}</p>
  <div class="profile-social">
    <a class="btn-regular" href="${ep(site.github)}" target="_blank" rel="noopener">${icon(
    'github'
  )}<span>GitHub</span></a>
  </div>
</div>`;
}

function widgetCategories(site, counts) {
  const rows = site.categories
    .map(
      (c) => `<a class="widget-row" href="${url(`/categories/${c.slug}/`)}">
      <span class="widget-row-name">${ep(c.name)}</span>
      <span class="widget-row-count">${counts[c.slug] || 0}</span>
    </a>`
    )
    .join('');
  return `<div class="card-base widget">
  <h3 class="widget-title">分类</h3>
  <div class="widget-body">${rows}</div>
</div>`;
}

function widgetTags(tags) {
  const rows = tags
    .map((t) => {
      const name = typeof t === 'string' ? t : t.name;
      return `<a class="tag-chip" href="${url(`/archive/?tag=${encodeURIComponent(name)}`)}">${ep(
        name
      )}</a>`;
    })
    .join('');
  return `<div class="card-base widget">
  <h3 class="widget-title">标签</h3>
  <div class="widget-body"><div class="tag-cloud">${rows}</div></div>
</div>`;
}

function sidebar(site, o) {
  return `<div class="sidebar-sticky">
    ${profileCard(site)}
    ${o.categories !== false ? widgetCategories(site, (o.categoryCounts || {})) : ''}
    ${o.tags && o.tags.length ? widgetTags(o.tags) : ''}
  </div>`;
}

/* ---------------------------------------------------------------- footer */

function footer(site) {
  return `<div class="footer-rule"></div>
<div class="footer-box">
  <p>&copy; <span id="copyright-year">${new Date().getFullYear()}</span> ${ep(
    site.footer.copyright
  )}. All Rights Reserved. / <a href="${url('/rss.xml')}">RSS</a> / <a href="${url(
    '/sitemap.xml'
  )}">Sitemap</a></p>
  ${
    site.footer.poweredBy
      ? `<p class="powered">Powered by <a href="https://nodejs.org" target="_blank" rel="noopener">Node.js</a> &middot; 风格灵感 <a href="https://github.com/saicaca/fuwari" target="_blank" rel="noopener">Fuwari</a></p>`
      : ''
  }
</div>`;
}

function fab() {
  return `<div class="back-to-top-wrap">
  <button id="back-to-top" class="back-to-top" aria-label="回到顶部" title="回到顶部">${icon(
    'arrowUp'
  )}</button>
</div>
<div class="float-panel settings-panel" id="settings-panel" hidden>
  <div class="panel-title">显示设置</div>
  <p class="panel-desc">拖动色相来换一个主题色，效果会保存在本地。</p>
  <label class="panel-label" for="hue-range">主题色相 <span id="hue-value">225</span></label>
  <input type="range" id="hue-range" min="0" max="360" step="1" value="225">
  <label class="panel-label" for="width-range">页面宽度 <span id="width-value">75</span>rem</label>
  <input type="range" id="width-range" min="60" max="100" step="1" value="75">
  <div class="panel-actions">
    <button class="btn-plain" id="reset-settings">恢复默认</button>
  </div>
</div>
<div class="search-modal" id="search-modal" hidden>
  <div class="search-backdrop" data-close-search></div>
  <div class="search-panel card-base" role="dialog" aria-modal="true" aria-label="搜索文章">
    <div class="search-input-row">
      ${icon('search')}
      <input type="search" id="search-input" placeholder="搜索标题、摘要、标签…" autocomplete="off" spellcheck="false">
      <button class="btn-icon" id="search-close" aria-label="关闭">${icon('close')}</button>
    </div>
    <div class="search-results" id="search-results"></div>
    <div class="search-hint"><kbd>↑</kbd><kbd>↓</kbd> 选择 &middot; <kbd>Enter</kbd> 打开 &middot; <kbd>Esc</kbd> 关闭</div>
  </div>
</div>`;
}

/* ---------------------------------------------------------------- cards */

export function categoryCard(c, site, count, delay = 0) {
  return `<a class="card-base category-card onload-animation" style="animation-delay:${delay}ms" href="${url(
    `/categories/${c.slug}/`
  )}">
  <div class="category-card-body">
    <h2 class="category-card-title">${ep(c.title)}</h2>
    <div class="meta-row">${icon('folder')}<span>${ep(c.name)}</span></div>
    <p class="category-card-desc">${ep(c.description)}</p>
    <div class="category-card-count">${count} 篇文章</div>
  </div>
  <div class="category-card-cover">
    <span class="cover-arrow">${icon('arrowRight')}</span>
    <img src="${url(c.cover)}" alt="" loading="lazy" decoding="async">
  </div>
</a>`;
}

export function postCard(p, delay = 0) {
  const cover = p.image
    ? `<div class="post-card-cover"><img src="${url(p.image)}" alt="${ep(p.title)}的封面" loading="lazy" decoding="async"></div>`
    : '';
  const tags = (p.tags || [])
    .slice(0, 3)
    .map((t) => `<span class="tag-chip tag-chip-sm">${ep(t)}</span>`)
    .join('');
  return `<a class="card-base post-card onload-animation${p.image ? '' : ' no-cover'}" style="animation-delay:${delay}ms" href="${url(
    `/posts/${p.slug}/`
  )}">
  ${cover}
  <div class="post-card-content">
    <h3 class="post-card-title">${ep(p.title)}</h3>
    <div class="meta-row meta-row-sm">
      ${icon('calendar')}<span>${fmtDate(p.published)}</span>
      ${p.category ? `${icon('folder')}<span>${ep(p.categoryName || p.category)}</span>` : ''}
    </div>
    <p class="post-card-desc">${ep(p.description || '')}</p>
    ${tags ? `<div class="post-card-tags">${tags}</div>` : ''}
  </div>
</a>`;
}

export function projectCard(pr) {
  const cover = (pr.coverText || [])
    .map((t) => `<span>${ep(t)}</span>`)
    .join('');
  return `<a class="card-base project-card onload-animation" href="${ep(pr.href)}" target="_blank" rel="noopener">
  <div class="project-card-body">
    <div class="project-card-eyebrow">${icon('sparkles')}<span>${ep(pr.tagline)}</span></div>
    <h2 class="project-card-title">${ep(pr.name)}</h2>
    <p class="project-card-desc">${ep(pr.description)}</p>
    <span class="project-card-cta">${ep(pr.cta || '查看')}${icon('arrowRight')}</span>
  </div>
  <div class="project-cover">${cover}</div>
</a>`;
}

export function sectionDivider(text) {
  return `<div class="section-divider" role="separator"><span class="line"></span><span class="label">${ep(
    text
  )}</span><span class="line"></span></div>`;
}

export function pageHeader(title, desc) {
  return `<div class="card-base page-header onload-animation">
  <h1 class="page-header-title">${ep(title)}</h1>
  ${desc ? `<p class="page-header-desc">${ep(desc)}</p>` : ''}
</div>`;
}

const ep = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export { ep as escapeText };
