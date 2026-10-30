/**
 * 零依赖 Markdown 渲染器。
 * 支持：标题、段落、粗体/斜体/删除线、行内代码、代码块、列表（可嵌套）、
 *      引用、表格、分割线、图片、链接、提示块（:::note 与 > [!NOTE]）。
 *
 * 用法：const { html, headings } = renderMarkdown(text)
 */

const escapeHtml = (s) =>
  String(s)
    .replace(/&(?!(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const escapeAttr = (s) => escapeHtml(s).replace(/'/g, '&#39;');

const ADMONITION_LABEL = {
  note: '注意',
  tip: '提示',
  important: '重要',
  warning: '警告',
  caution: '小心',
};

function slugify(text) {
  return String(text)
    .replace(/<[^>]+>/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[!-/:-@[-`{-~。，、：；！？（）【】《》""''·]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'section';
}

/* ------------------------------------------------------------------ inline */

const CODE_TOKEN = '\u0000C';
const ESCAPED_TOKEN = '\u0000E'; // 反斜杠转义：\* 等

function inline(text) {
  const stash = [];
  const keep = (html) => {
    stash.push(html);
    return `\u0000${stash.length - 1}\u0000`;
  };

  let out = String(text);

  // 1. 行内代码（在转义之前提取，内部内容整体转义）
  out = out.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (_, _t, code) =>
    keep(`<code>${escapeHtml(code.trim())}</code>`)
  );

  // 2. 反斜杠转义
  out = out.replace(/\\([\\`*_{}[\]()#+\-.!~|>])/g, (_, ch) =>
    keep(ESCAPED_TOKEN + escapeHtml(ch))
  );

  // 3. 整体转义
  out = escapeHtml(out);

  // 4. 图片（语法为 !\[alt\](src "title")）
  out = out.replace(
    /!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+&quot;([^&]*)&quot;)?\s*\)/g,
    (_, alt, src, title) =>
      `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"${
        title ? ` title="${escapeAttr(title)}"` : ''
      } loading="lazy" decoding="async">`
  );

  // 5. 链接
  out = out.replace(
    /\[([^\]]+)\]\(\s*([^\s)]+)(?:\s+&quot;([^&]*)&quot;)?\s*\)/g,
    (_, label, href, title) => {
      const external = /^https?:\/\//i.test(href);
      return `<a href="${escapeAttr(href)}"${
        title ? ` title="${escapeAttr(title)}"` : ''
      }${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
    }
  );

  // 6. 强调
  out = out
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^\\*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // 7. 还原暂存内容
  for (let pass = 0; pass < 2; pass++) {
    out = out.replace(/\u0000(\d+)\u0000/g, (_, n) => stash[Number(n)] ?? '');
  }
  out = out.replace(/\u0000E/g, '');

  // 8. 换行：行尾两个空格或普通换行都按硬换行处理（更适合中文书写）
  out = out.replace(/ {2,}\n/g, '<br>\n').replace(/\n/g, '<br>\n');

  return out;
}

/* ------------------------------------------------------------------- code */

function codeBlock(lang, code) {
  const language = (lang || '').trim().slice(0, 24);
  return `<div class="code-block">
<div class="code-block-head"><span class="code-lang">${
    language || 'text'
  }</span><button class="code-copy" type="button" aria-label="复制代码" data-copy>复制</button></div>
<pre><code${language ? ` class="language-${escapeAttr(language)}"` : ''}>${escapeHtml(
    code.replace(/\n$/, '')
  )}</code></pre>
</div>`;
}

/* ------------------------------------------------------------------ tables */

function splitRow(row) {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'));
}

const ALIGN_RE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function table(lines, start) {
  const header = splitRow(lines[start]);
  const aligns = splitRow(lines[start + 1]).map((c) => {
    const left = c.startsWith(':');
    const right = c.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return '';
  });
  let i = start + 2;
  const rows = [];
  while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
    rows.push(splitRow(lines[i]));
    i++;
  }
  const alignAttr = (n) => (aligns[n] ? ` style="text-align:${aligns[n]}"` : '');
  const head = header
    .map((c, n) => `<th${alignAttr(n)}>${inline(c)}</th>`)
    .join('');
  const body = rows
    .map(
      (r) =>
        `<tr>${header
          .map((_, n) => `<td${alignAttr(n)}>${inline(r[n] ?? '')}</td>`)
          .join('')}</tr>`
    )
    .join('');
  return {
    html: `<div class="table-wrapper"><table><thead><tr>${head}</tr></thead>${
      body ? `<tbody>${body}</tbody>` : ''
    }</table></div>`,
    next: i,
  };
}

/* ------------------------------------------------------------------- lists */

const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

function buildList(lines, start, headings) {
  const baseIndent = LIST_RE.exec(lines[start])[1].length;
  const ordered = /^\s*\d/.test(lines[start]);
  const items = [];
  let i = start;

  while (i < lines.length) {
    const m = LIST_RE.exec(lines[i]);
    if (!m) {
      if (lines[i].trim() === '') {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        const nm = j < lines.length ? LIST_RE.exec(lines[j]) : null;
        if (nm && nm[1].length >= baseIndent) {
          i = j;
          continue;
        }
      }
      break;
    }
    const indent = m[1].length;
    const isOrdered = /\d/.test(m[2]);
    if (indent < baseIndent) break;
    if (indent === baseIndent && isOrdered !== ordered) break;
    if (indent > baseIndent) {
      const nested = buildList(lines, i, headings);
      if (items.length) items[items.length - 1].children.push(nested.html);
      i = nested.next;
      continue;
    }
    items.push({ text: m[3], children: [] });
    i++;
  }

  const tag = ordered ? 'ol' : 'ul';
  const html =
    `<${tag}>` +
    items
      .map(
        (it) =>
          `<li>${inline(it.text)}${it.children.join('')}</li>`
      )
      .join('') +
    `</${tag}>`;
  return { html, next: i };
}

/* ------------------------------------------------------------------ blocks */

export function renderMarkdown(source) {
  const headings = [];
  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 空行
    if (line.trim() === '') {
      i++;
      continue;
    }

    // 围栏代码块
    const fence = /^(```+|~~~+)\s*([^\s`]*)\s*$/.exec(line);
    if (fence) {
      const marker = fence[1][0];
      const lang = fence[2];
      const body = [];
      i++;
      while (i < lines.length && !new RegExp(`^\\s*${marker}{3,}\\s*$`).test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      i++; // 跳过结束围栏
      out.push(codeBlock(lang, body.join('\n')));
      continue;
    }

    // 提示块 :::type
    const adm = /^:::+\s*([a-zA-Z]+)?\s*$/.exec(line);
    if (adm) {
      const type = (adm[1] || 'note').toLowerCase();
      const body = [];
      i++;
      while (i < lines.length && !/^:::+\s*$/.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      i++;
      const inner = renderMarkdown(body.join('\n'));
      headings.push(...inner.headings);
      out.push(
        `<div class="admonition admonition-${escapeAttr(type)}"><div class="admonition-title">${
          ADMONITION_LABEL[type] || type
        }</div><div class="admonition-body">${inner.html}</div></div>`
      );
      continue;
    }

    // 标题
    const heading = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (heading) {
      const depth = heading[1].length;
      const text = heading[2];
      const id = slugify(text);
      headings.push({ depth, id, text: text.replace(/[*_`~]/g, '') });
      out.push(`<h${depth} id="${escapeAttr(id)}">${inline(text)}</h${depth}>`);
      i++;
      continue;
    }

    // 分割线
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      out.push('<hr>');
      i++;
      continue;
    }

    // 表格
    if (line.includes('|') && i + 1 < lines.length && ALIGN_RE.test(lines[i + 1])) {
      const t = table(lines, i);
      out.push(t.html);
      i = t.next;
      continue;
    }

    // 引用
    if (/^\s*>/.test(line)) {
      const body = [];
      while (i < lines.length && (/^\s*>/.test(lines[i]) || (body.length && lines[i].trim() !== ''))) {
        body.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      // GitHub 风格提示块 > [!NOTE]
      const flag = /^\[!(\w+)\]\s*$/.exec(body[0] || '');
      if (flag) {
        const type = flag[1].toLowerCase();
        const inner = renderMarkdown(body.slice(1).join('\n'));
        headings.push(...inner.headings);
        out.push(
          `<div class="admonition admonition-${escapeAttr(type)}"><div class="admonition-title">${
            ADMONITION_LABEL[type] || type
          }</div><div class="admonition-body">${inner.html}</div></div>`
        );
      } else {
        const inner = renderMarkdown(body.join('\n'));
        headings.push(...inner.headings);
        out.push(`<blockquote>${inner.html}</blockquote>`);
      }
      continue;
    }

    // 列表
    if (LIST_RE.test(line)) {
      const l = buildList(lines, i, headings);
      out.push(l.html);
      i = l.next;
      continue;
    }

    // 原生 HTML 块（允许 <div align="center"> 之类的简单排版）
    if (/^\s*<\/?[a-zA-Z][\w-]*(\s[^>]*)?\/?>\s*$/.test(line)) {
      out.push(line);
      i++;
      continue;
    }

    // 段落
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,6}\s|```|~~~|:::|\s*>|\s*([-*+]|\d+[.)])\s|<\/?[a-zA-Z])/.test(lines[i]) &&
      !/^\s*([-*_])(\s*\1){2,}\s*$/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length) {
      out.push(`<p>${inline(para.join('\n'))}</p>`);
    }
  }

  return { html: out.join('\n'), headings };
}

export { escapeHtml, slugify };
