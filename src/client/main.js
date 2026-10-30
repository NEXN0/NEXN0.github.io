/**
 * 客户端交互：主题切换、色相调节、搜索、TOC 高亮、目录面板、回到顶部等。
 */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const root = document.documentElement;
const BASE = root.dataset.base || '';
const store = {
  get(k, d) {
    try {
      return localStorage.getItem(k) ?? d;
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

/* ------------------------------------------------------------------ theme */
function applyTheme(mode) {
  const dark = mode === 'dark' || (mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', dark);
  store.set('theme', mode);
  const btn = $('#theme-trigger');
  if (btn) btn.title = `主题：${{ auto: '跟随系统', light: '浅色', dark: '深色' }[mode]}`;
}

function setupTheme() {
  const btn = $('#theme-trigger');
  applyTheme(store.get('theme', root.dataset.theme || 'auto'));
  btn?.addEventListener('click', () => {
    applyTheme(root.classList.contains('dark') ? 'light' : 'dark');
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (store.get('theme', 'auto') === 'auto') applyTheme('auto');
  });
}

/* --------------------------------------------------------------- settings */
function setupSettings() {
  const trigger = $('#settings-trigger');
  const panel = $('#settings-panel');
  if (!trigger || !panel) return;

  const hue = $('#hue-range');
  const hueValue = $('#hue-value');
  const width = $('#width-range');
  const widthValue = $('#width-value');

  const storedHue = store.get('hue');
  const storedWidth = store.get('pageWidth');
  if (storedHue) {
    hue.value = storedHue;
    hueValue.textContent = storedHue;
    root.style.setProperty('--hue', storedHue);
  }
  if (storedWidth) {
    width.value = storedWidth;
    widthValue.textContent = storedWidth;
    root.style.setProperty('--page-width-user', storedWidth);
  }

  hue?.addEventListener('input', () => {
    hueValue.textContent = hue.value;
    root.style.setProperty('--hue', hue.value);
    store.set('hue', hue.value);
  });

  width?.addEventListener('input', () => {
    widthValue.textContent = width.value;
    root.style.setProperty('--page-width-user', width.value);
    store.set('pageWidth', width.value);
  });

  $('#reset-settings')?.addEventListener('click', () => {
    ['hue', 'pageWidth', 'theme'].forEach((k) => store.set(k, ''));
    localStorage.removeItem('hue');
    localStorage.removeItem('pageWidth');
    root.style.removeProperty('--hue');
    root.style.removeProperty('--page-width-user');
    applyTheme('auto');
    hue.value = root.dataset.hue || 225;
    hueValue.textContent = hue.value;
    width.value = 75;
    widthValue.textContent = 75;
  });

  toggleOnClick(trigger, panel);
}

/* ------------------------------------------------------- floating panels */
function closeAll(except) {
  $$('.float-panel').forEach((p) => {
    if (p !== except) p.hidden = true;
  });
  const burger = $('#menu-trigger');
  if (burger) burger.setAttribute('aria-expanded', 'false');
}

function toggleOnClick(trigger, panel) {
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = panel.hidden;
    closeAll(panel);
    panel.hidden = !willOpen;
  });
  panel.addEventListener('click', (e) => e.stopPropagation());
}

function setupPanels() {
  const burger = $('#menu-trigger');
  const navPanel = $('#nav-panel');
  if (burger && navPanel) {
    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = navPanel.hidden;
      closeAll(navPanel);
      navPanel.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
    });
    navPanel.addEventListener('click', (e) => e.stopPropagation());
  }
  document.addEventListener('click', () => closeAll());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}

/* ----------------------------------------------------------------- search */
let searchIndex = null;
let searchPromise = null;

async function loadIndex() {
  if (searchIndex) return searchIndex;
  if (!searchPromise) {
    searchPromise = fetch(`${BASE}/search.json`)
      .then((r) => r.json())
      .then((data) => (searchIndex = data))
      .catch(() => (searchIndex = []));
  }
  return searchPromise;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function highlight(text, q) {
  const safe = escapeHtml(text || '');
  if (!q) return safe;
  const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${pattern})`, 'gi'), '<mark>$1</mark>');
}

function scoreOf(item, q) {
  const t = (item.title || '').toLowerCase();
  const d = (item.description || '').toLowerCase();
  const tags = (item.tags || []).join(' ').toLowerCase();
  let score = 0;
  if (t.includes(q)) score += t.startsWith(q) ? 100 : 60;
  if (tags.includes(q)) score += 30;
  if (d.includes(q)) score += 15;
  if ((item.category || '').toLowerCase().includes(q)) score += 10;
  return score;
}

function setupSearch() {
  const modal = $('#search-modal');
  const input = $('#search-input');
  const results = $('#search-results');
  const trigger = $('#search-trigger');
  if (!modal || !input || !results) return;

  let items = [];
  let selected = 0;

  const render = (q) => {
    const query = q.trim().toLowerCase();
    const list = query
      ? items
          .map((it) => ({ it, s: scoreOf(it, query) }))
          .filter((x) => x.s > 0)
          .sort((a, b) => b.s - a.s || String(b.it.date).localeCompare(String(a.it.date)))
          .slice(0, 30)
          .map((x) => x.it)
      : items.slice(0, 8);

    selected = 0;
    if (!list.length) {
      results.innerHTML = `<div class="empty-state">没有找到与「${escapeHtml(q)}」相关的文章</div>`;
      return;
    }
    results.innerHTML = list
      .map(
        (it, i) => `<a class="search-result${i === 0 ? ' is-selected' : ''}" href="${BASE}${it.url}">
        <span class="search-result-title">${highlight(it.title, q)}</span>
        ${it.description ? `<span class="search-result-desc">${highlight(it.description, q)}</span>` : ''}
      </a>`
      )
      .join('');
  };

  const open = async () => {
    closeAll();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    input.value = '';
    input.focus();
    results.innerHTML = '<div class="empty-state">正在加载…</div>';
    items = await loadIndex();
    render('');
  };

  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  const move = (dir) => {
    const nodes = $$('.search-result', results);
    if (!nodes.length) return;
    nodes[selected]?.classList.remove('is-selected');
    selected = (selected + dir + nodes.length) % nodes.length;
    const node = nodes[selected];
    node.classList.add('is-selected');
    node.scrollIntoView({ block: 'nearest' });
  };

  trigger?.addEventListener('click', open);
  $('#search-close')?.addEventListener('click', close);
  $('[data-close-search]')?.addEventListener('click', close);

  input.addEventListener('input', () => render(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter') {
      const node = $$('.search-result', results)[selected];
      if (node) location.href = node.href;
    } else if (e.key === 'Escape') {
      close();
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      modal.hidden ? open() : close();
    }
    if (e.key === 'Escape' && !modal.hidden) close();
  });
}

/* -------------------------------------------------------------- scroll UX */
function setupScroll() {
  const navbar = $('#navbar');
  const toTop = $('#back-to-top');
  const banner = $('#banner-wrapper');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    navbar?.classList.toggle('scrolled', y > 8);
    toTop?.classList.toggle('is-visible', y > 500);
    if (banner && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      banner.style.setProperty('--banner-shift', `${Math.min(y * 0.22, 160)}px`);
    }
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );

  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  onScroll();
}

/* -------------------------------------------------------------------- toc */
function setupToc() {
  const links = $$('.toc-list a');
  if (!links.length) return;
  const map = new Map();
  links.forEach((a) => {
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const el = document.getElementById(id);
    if (el) map.set(el, a);
  });
  if (!map.size) return;

  const setActive = (active) => {
    links.forEach((a) => a.classList.toggle('is-active', a === active));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length) {
        const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        setActive(map.get(top.target));
      }
    },
    { rootMargin: '-15% 0px -70% 0px', threshold: [0, 1] }
  );

  map.forEach((_, el) => observer.observe(el));

  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      const el = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', a.getAttribute('href'));
      setActive(a);
    });
  });
}

/* ------------------------------------------------------------ copy code */
function setupCopy() {
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const block = btn.closest('.code-block');
      const code = block?.querySelector('code')?.innerText ?? '';
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = '已复制';
        btn.classList.add('is-copied');
      } catch {
        btn.textContent = '复制失败';
      }
      setTimeout(() => {
        btn.textContent = '复制';
        btn.classList.remove('is-copied');
      }, 1600);
    });
  });
}

/* ---------------------------------------------------------- archive filter */
function setupArchiveFilter() {
  const list = $('#archive-list');
  const filters = $('#archive-filters');
  if (!list || !filters) return;

  const items = $$('.archive-item', list);
  const groups = $$('.year-group', list);
  const chips = $$('.filter-chip', filters);
  const empty = $('#archive-empty');

  const apply = (tag) => {
    chips.forEach((c) => c.classList.toggle('is-active', (c.dataset.tag || '') === (tag || '')));
    let visible = 0;
    items.forEach((it) => {
      const itemTags = (it.dataset.tags || '').split('|').filter(Boolean);
      const show = !tag || itemTags.includes(tag);
      it.hidden = !show;
      if (show) visible++;
    });
    groups.forEach((g) => {
      g.hidden = !$$('.archive-item', g).some((i) => !i.hidden);
    });
    if (empty) empty.hidden = visible > 0;
  };

  chips.forEach((c) =>
    c.addEventListener('click', (e) => {
      e.preventDefault();
      const tag = c.dataset.tag || '';
      const u = new URL(location.href);
      if (tag) u.searchParams.set('tag', tag);
      else u.searchParams.delete('tag');
      history.replaceState(null, '', u);
      apply(tag);
    })
  );

  apply(new URL(location.href).searchParams.get('tag') || '');
}

/* ------------------------------------------------------------------- boot */
const yearEl = $('#copyright-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

setupTheme();
setupSettings();
setupPanels();
setupSearch();
setupScroll();
setupToc();
setupCopy();
setupArchiveFilter();
requestAnimationFrame(() => document.body.classList.add('loaded'));
