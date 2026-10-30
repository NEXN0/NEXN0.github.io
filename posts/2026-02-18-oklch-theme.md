---
title: 用 OKLCH 设计一套能自动适配的主题色
published: 2026-02-18
description: 只用一个 hue 变量，就让整站配色从冷蓝切到暖橙，并且保持对比度——这是 OKLCH 带来的便利。
category: tech
tags: [CSS, 设计, 颜色]
---

传统上给站点换主题色，要维护一整套色板：主色、悬停色、按下色、浅背景、深背景……每换一个颜色，就意味着重新挑十几次色值。

用 OKLCH 之后，这件事可以退化成**一个数字**。

## OKLCH 是什么

OKLCH 是 CSS Color Level 4 引入的感知均匀色彩空间，三个字母分别对应：

- `L` — Lightness 感知亮度，0 到 1
- `C` — Chroma 彩度，0 是灰
- `H` — Hue 色相角，0 到 360

关键在「感知均匀」：同样 `L` 的两个颜色，在肉眼看来就是一样亮。这一点 HSL 做不到——HSL 里 `l=50%` 的黄色看起来远比蓝色亮。

```css
:root {
  --primary: oklch(0.7 0.14 var(--hue));
  --page-bg:  oklch(0.95 0.01 var(--hue));
}
```

## 一个变量带来的联动

把色相单独抽成变量，其余全部由它推导：

```css
:root {
  --hue: 225;
  --primary: oklch(0.7 0.14 var(--hue));       /* 主色 */
  --btn-bg: oklch(0.95 0.025 var(--hue));      /* 按钮底色 */
  --btn-bg-hover: oklch(0.9 0.05 var(--hue));  /* 悬停 */
  --text: oklch(0.25 0.02 var(--hue));         /* 正文 */
}

html.dark {
  --primary: oklch(0.75 0.14 var(--hue));
  --page-bg: oklch(0.16 0.014 var(--hue));
}
```

深色模式不是简单地「反色」，而是把亮度整体搬迁到另一条曲线上，同时略微降低彩度，避免刺眼。

| 角色 | 浅色 | 深色 |
| --- | --- | --- |
| 主色 | `L .70 C .14` | `L .75 C .14` |
| 页面背景 | `L .95 C .01` | `L .16 C .014` |
| 卡片背景 | `#fff` | `L .23 C .015` |
| 正文 | `L .25 C .02` | `L .95 C .01` |

## 顺带做成的取色器

既然颜色只由 `--hue` 决定，那么一个色相滑块就等于「主题编辑器」。站点右上角的设置面板里那个彩虹条，做的就是这么一件事：

```js
range.addEventListener('input', () => {
  document.documentElement.style.setProperty('--hue', range.value);
  localStorage.setItem('hue', range.value);
});
```

:::tip
如果要做品牌色，建议把 `--hue` 固定在 15° 的区间内挑选，比如 210–240 之间的冷蓝、250–280 之间的紫。跨度过大会让某些色相的彩度显得不够。
:::

## 一个坑

`oklch()` 里的 `var()` 在早期 Safari 上有解析问题，稳妥的做法是给一个回退：

```css
@supports not (color: oklch(0.7 0.14 225)) {
  :root { --primary: #4f7cff; }
}
```

现在主流浏览器都已经支持得很好了，但如果你有兼容性要求，这行代码值得加上。

## 参考

- [OKLCH Color Picker](https://oklch.com/) — 可以直接拖动的可视化工具
- [CSS Color Level 4](https://www.w3.org/TR/css-color-4/) — 规范原文
