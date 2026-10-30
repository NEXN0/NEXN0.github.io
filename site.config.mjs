/**
 * 站点配置 —— 想改博客信息，基本只需要动这个文件。
 */
export const site = {
  // 部署地址（结尾不要带斜杠）。若使用 <用户名>.github.io 仓库，就是 https://<用户名>.github.io
  url: 'https://nexn0.github.io',

  title: "NEXN0's Blog",
  subtitle: '记录代码、笔记，以及偶尔浮现的想法。',
  author: 'NEXN0',
  bio: '记录代码、笔记，以及偶尔浮现的想法。',

  // 头像与横幅
  avatar: '/assets/avatar.svg',
  banner: '/assets/banner.svg',

  // 主题色（OKLCH 色相 0-360）：225 冷蓝 / 275 紫 / 160 青绿 / 30 橙
  hue: 225,
  // 默认主题：auto | light | dark
  theme: 'auto',

  // 社交链接（出现在侧栏与页脚）
  github: 'https://github.com/NEXN0',
  email: '2775745694@qq.com',

  nav: [
    { text: '主页', href: '/' },
    { text: '归档', href: '/archive/' },
    { text: '关于', href: '/about/' },
    { text: '友链', href: '/links/' },
  ],

  footer: {
    copyright: 'NEXN0',
    poweredBy: true,
  },

  /**
   * 首页「分类」卡片。slug 会用于 /categories/<slug>/ 地址，建议用英文。
   * 首页顶部的分类卡片按这里的顺序展示。
   */
  categories: [
    {
      slug: 'tech',
      name: '技术笔记',
      title: '把踩过的坑记下来',
      description: '前端、工具链、部署与那些一开始搞不明白、后来终于搞明白的东西。',
      cover: '/assets/covers/tech.svg',
    },
    {
      slug: 'essay',
      name: '随笔',
      title: '偶尔浮现的想法',
      description: '读书、生活与一些没什么用但挺有意思的碎碎念。',
      cover: '/assets/covers/essay.svg',
    },
  ],

  /** 首页底部的「小项目」 */
  projects: [
    {
      name: 'My Notes',
      tagline: '小项目 · 笔记工具',
      description: '基于 Firebase 的在线笔记站点，支持 Markdown 编辑与实时同步。',
      href: 'https://github.com/NEXN0/my-notes-website',
      cta: '查看源码',
      coverText: ['記', 'メモ'],
    },
  ],

  /** 友链页 */
  links: [
    {
      name: 'Fuwari',
      description: '本站视觉风格的灵感来源，一个简洁的 Astro 博客主题。',
      href: 'https://github.com/saicaca/fuwari',
      avatar: '/assets/links/fuwari.svg',
    },
    {
      name: 'Astro',
      description: '内容驱动的 Web 框架，默认输出零 JavaScript 的静态页面。',
      href: 'https://astro.build',
      avatar: '/assets/links/astro.svg',
    },
  ],

  /** 分页 / 列表 */
  homePostCount: 5,
};

export default site;
