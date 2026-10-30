#!/usr/bin/env node
/**
 * 新建一篇文章：
 *   npm run new -- "文章标题" [slug]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const title = process.argv[2];

if (!title) {
  console.error('用法：npm run new -- "文章标题" [slug]');
  process.exit(1);
}

const date = new Date();
const pad = (n) => String(n).padStart(2, '0');
const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

let slug = process.argv[3];
if (!slug) {
  slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/[\u4e00-\u9fa5]/g, '')
    .replace(/^-|-$/g, '');
  if (!slug) slug = `post-${date.getTime().toString(36)}`;
}

const file = path.join(ROOT, 'posts', `${day}-${slug}.md`);
if (fs.existsSync(file)) {
  console.error(`文件已存在：${path.relative(ROOT, file)}`);
  process.exit(1);
}

fs.writeFileSync(
  file,
  `---
title: ${title}
published: ${day}
description: 一句话说明这篇文章讲了什么。
category: tech
tags: [标签一, 标签二]
---

正文从这里开始。
`,
  'utf8'
);

console.log(`✓ 已创建 ${path.relative(ROOT, file)}`);
console.log('  写完运行 npm run dev 预览。');
