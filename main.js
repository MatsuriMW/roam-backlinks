const { Plugin, PluginSettingTab, MarkdownRenderer, Component, Notice, setIcon, Keymap, resolveSubpath, MarkdownView, Modal, Setting, getLinkpath, moment, Platform, debounce } = require("obsidian");

// ---------- 界面语言：跟随 Obsidian（中文显示中文，其余显示英文） ----------
const LANG = (() => {
  try {
    const o = require("obsidian");
    const l = (typeof o.getLanguage === "function" ? o.getLanguage() : moment.locale()) || "en";
    return /^zh/i.test(l) ? "zh" : "en";
  } catch (e) { return "en"; }
})();
const MOD = Platform && Platform.isMacOS ? "⌘" : "Ctrl+";
const SHIFT = Platform && Platform.isMacOS ? "⇧" : "Shift+";
const monthName = (mo) => moment().locale("en").month(mo - 1).format("MMMM");

const STRINGS = {
  en: {
    cmdToggleCase: "Toggle case-sensitive unlinked mentions for this note (writes a property)",
    caseOff: "Unlinked mentions: case-insensitive",
    caseOn: "Unlinked mentions: case-sensitive",
    cmdGoto: "Jump to backlinks of the current note",
    linkChanged: "This passage has changed in its note, so nothing was modified. Reopen this note to refresh the backlinks and try again.",
    linked: "Linked ✓",
    internalsChanged: "Roam Backlinks: this Obsidian version changed the backlinks pane internals, so some features are turned off. Details are in the developer console.",
    linkedTip: "Converted to a link. The panel refreshes when you leave or reopen this note.",
    collapse: "Collapse",
    jumpTip: `Open in its note (${MOD}click: new tab)`,
    editHint: `${MOD}Enter / ${MOD}S save · Esc cancel · ${MOD}B bold · ${MOD}I italic · ${MOD}E code · ${MOD}${SHIFT}H highlight`,
    cancel: "Cancel",
    save: "Save",
    sourceChanged: "The note was changed elsewhere and this passage can't be found",
    savedTo: (n) => `Saved to ${n}`,
    notSaved: (m) => `Not saved: ${m}`,
    showMoreLines: (n) => `Show ${n} more lines`,
    collapseChildren: "Collapse children",
    expandChildren: (n) => `Expand ${n} children`,
    moreItems: (n) => `… ${n} more`,
    lineChanged: "This line has changed in its note",
    notToggled: (m) => `Couldn't toggle the task: ${m}`,
    pdfInclude: "Include backlinks (linked mentions)",
    pdfIncludeDesc: (n) => `Append the passages in ${n} notes that link here`,
    pdfNoBacklinks: "No notes link to this one",
    pdfBacklinksFailed: "Couldn't add the backlinks to the PDF; only the note was exported",
    pdfLayout: "Layout",
    pdfPretty: "Refined typography",
    pdfPrettyDesc: "Off: export exactly as the reading view looks",
    followObsidian: "Same as Obsidian",
    bodyFont: "Body font",
    headFont: "Heading font",
    headFontDesc: "Empty: same as the body",
    fontSize: "Font size",
    sizes: { small: "Small", medium: "Medium", large: "Large" },
    accent: "Accent color",
    accentDesc: "Heading rules, links, list markers, quotes, table headers",
    printFmLinks: (keys) => `Links here from the ${keys.join(", ")} property`,
    printHeading: (n) => `Linked mentions (${n})`,
    whyMutual: "mutual",
    whyProp: (keys) => `property: ${keys.join("/")}`,
    whyCount: (n) => `${n} mentions`,
    secPages: (n) => `Pages · ${n}`,
    secJournals: (n) => `Daily notes · ${n}`,
    monthHead: (y, mo, n) => `${monthName(mo)} ${y} · ${n}`,
    yearHead: (y, n) => `${y} · ${n}`,
    monthOnly: (mo) => monthName(mo),
    yearCollapseTip: "Click to collapse this year",
    yearExpandTip: "Click to expand this year",
    cooccur: "Co-mentions",
    group: "Group",
    clear: "Clear",
    filterPlaceholder: "Filter backlinks…",
    names: "Names",
    nameTip: (isFile, linked, unlinked) => `${isFile ? "File name" : "Alias"} · ${linked} linked · ${unlinked} unlinked\nClick: only this name · Shift-click: exclude it`,
    chipTip: (count, s) => `Mentioned together ${count}× · strength ${s} · Click: only with it · Shift-click: exclude it`,
    openTip: `Click: open · ${MOD}click: new tab · Shift-click: stack in the right sidebar`,
    jumpRowTip: `Click: jump · ${MOD}click: new tab · Shift-click: stack in the right sidebar`,
    stackClose: "Close",
    stackCloseOthers: "Close other notes in the sidebar",
    stackCloseAll: "Close all notes in the sidebar",
    stackCollapse: "Collapse",
    stackCollapseOthers: "Collapse others",
    stackCollapseAll: "Collapse all",
    stackExpand: "Expand",
    stackExpandAll: "Expand all",
    stackOpenInMain: "Open in main area",
    noGroups: "No co-mentioned pages to group by",
    other: "Other",
    clusterOn: "Showing only this cluster · click to cancel",
    clusterOff: "Show only this cluster (the backlinks below follow)",
    refTip: (n) => `Referenced ${n} times · click to see where`,
    words: "Words",
    wordsBtnTip: "Word stats for this note: frequent words and word pairs in its backlinks (remembered per note)",
    cmdWords: "Toggle word stats for the current note",
    wordsOn: "Word stats on for this note",
    wordsOff: "Word stats off for this note",
    wordsHead: (n, ready) => `In ${n} backlinks${ready ? " · ranked by distinctiveness" : " · counting the vault…"}`,
    wordsPairs: "Pairs",
    wordsNone: "Not enough text in the backlinks",
    wordTip: (count, s) => `In ${count} backlinks · distinctiveness ${s} · Click: only blocks with it`,
    pairTip: (c, a, b) => `Together in ${c} backlinks (${a} and ${b} on their own) · Click: only blocks with both`,
  },
  zh: {
    cmdToggleCase: "切换：「提到当前文件名」区分大小写（写进当前笔记属性）",
    caseOff: "提到当前文件名：不区分大小写",
    caseOn: "提到当前文件名：区分大小写",
    cmdGoto: "跳到当前笔记的反向链接",
    linkChanged: "这一处原文已经变了，没有改动。重新打开这一页、刷新反链后再试",
    linked: "已链接 ✓",
    internalsChanged: "Roam Backlinks：这一版 Obsidian 改了反链面板的内部结构，部分功能先关掉了，详情在开发者控制台",
    linkedTip: "已转为链接；离开或重新打开这一页后刷新",
    collapse: "收起",
    jumpTip: `跳到原文（${MOD}点 = 新标签）`,
    editHint: `${MOD}↩/${MOD}S 保存 · Esc 取消 · ${MOD}B 粗 ${MOD}I 斜 ${MOD}E 码 ${MOD}${SHIFT}H 高亮`,
    cancel: "取消",
    save: "保存",
    sourceChanged: "原文在别处被改过，找不到这一段",
    savedTo: (n) => `已保存到 ${n}`,
    notSaved: (m) => `没保存：${m}`,
    showMoreLines: (n) => `展开其余 ${n} 行`,
    collapseChildren: "收起子块",
    expandChildren: (n) => `展开 ${n} 个子块`,
    moreItems: (n) => `… 还有 ${n} 项`,
    lineChanged: "原文这一行已经变了",
    notToggled: (m) => `没勾上：${m}`,
    pdfInclude: "包含反链（链接到当前文件）",
    pdfIncludeDesc: (n) => `正文后面接上 ${n} 篇笔记里引用这一页的内容`,
    pdfNoBacklinks: "没有笔记链接到这一页",
    pdfBacklinksFailed: "反链没能加进 PDF，只导出了正文",
    pdfLayout: "排版",
    pdfPretty: "精致排版",
    pdfPrettyDesc: "关掉 = 和阅读视图一样，原样导出",
    followObsidian: "跟随 Obsidian",
    bodyFont: "正文字体",
    headFont: "标题字体",
    headFontDesc: "不选 = 和正文一样",
    fontSize: "字号",
    sizes: { small: "小", medium: "中", large: "大" },
    accent: "强调色",
    accentDesc: "标题装饰线、链接、列表符号、引用块、表头",
    printFmLinks: (keys) => `属性·${keys.join("/")} 链接到这里`,
    printHeading: (n) => `链接到当前文件（${n}）`,
    whyMutual: "互链",
    whyProp: (keys) => `属性·${keys.join("/")}`,
    whyCount: (n) => `提到 ${n} 次`,
    secPages: (n) => `页面 · ${n}`,
    secJournals: (n) => `日记 · ${n}`,
    monthHead: (y, mo, n) => `${y} 年 ${mo} 月 · ${n}`,
    yearHead: (y, n) => `${y} 年 · ${n} 条`,
    monthOnly: (mo) => `${mo} 月`,
    yearCollapseTip: "点=折叠这一年",
    yearExpandTip: "点=展开这一年",
    cooccur: "共现筛选",
    group: "分组",
    clear: "清除",
    filterPlaceholder: "筛选反链文字…",
    names: "名字",
    nameTip: (isFile, linked, unlinked) => `${isFile ? "文件名" : "别名"} · 链接 ${linked} 条 · 提到 ${unlinked} 条\n点=只看用这个名字的 · Shift 点=排除`,
    chipTip: (count, s) => `共现 ${count} 次 · 紧密度 ${s} · 点=只看含它 · Shift点=排除`,
    openTip: `点=打开 · ${MOD}点=新标签 · Shift点=右侧栏叠放`,
    jumpRowTip: `点=跳转 · ${MOD}点=新标签 · Shift点=右侧栏叠放`,
    stackClose: "关闭",
    stackCloseOthers: "关闭侧边栏里的其他笔记",
    stackCloseAll: "关闭侧边栏里的全部笔记",
    stackCollapse: "折叠",
    stackCollapseOthers: "折叠其他",
    stackCollapseAll: "全部折叠",
    stackExpand: "展开",
    stackExpandAll: "全部展开",
    stackOpenInMain: "在主区打开",
    noGroups: "没有可分组的共现页",
    other: "其它",
    clusterOn: "正在只看这簇 · 点=取消",
    clusterOff: "只看这簇（下面的反链也跟着收成这一簇）",
    refTip: (n) => `这一块被引用 ${n} 次 · 点开看谁引用`,
    words: "词频",
    wordsBtnTip: "这一页的词频：反链里的高频词和一起出现的词对（按页记住开关）",
    cmdWords: "开关当前页的词频",
    wordsOn: "这一页开了词频",
    wordsOff: "这一页关了词频",
    wordsHead: (n, ready) => `${n} 条反链${ready ? " · 按特征度排" : " · 正在统计全库…"}`,
    wordsPairs: "词对",
    wordsNone: "反链里的文字太少，统计不出来",
    wordTip: (count, s) => `出现在 ${count} 条反链里 · 特征度 ${s} · 点=只看含它的`,
    pairTip: (c, a, b) => `同时出现在 ${c} 条反链里（各自 ${a}、${b} 条）· 点=只看两词都有的`,
  },
};
const t = (key, ...args) => {
  const v = (STRINGS[LANG] && STRINGS[LANG][key]) ?? STRINGS.en[key];
  return typeof v === "function" ? v(...args) : v;
};

// ---------- 设置 ----------
// 下面每一项都能在设置页里改；括号里是原来写死在这里的常量名，方便对照注释
const DEFAULTS = {
  // 排序：页面按关系紧密度在前（互相链接 > 属性里链过来 > 正文提到次数），日记按日期从新到旧在后，最近 N 个月按月分段、更早的按年折叠
  customSort: true,
  recentMonths: 12,
  // 日记怎么认：留空 = 读 Obsidian 核心插件「日记」的文件夹和日期格式
  journalFolder: "",
  journalFormat: "",
  // 「链接到当前文件」默认展开，「提到当前文件」（未链接提及）默认折叠
  backlinkCollapsed: false,
  unlinkedCollapsed: true,
  // 这些文件夹里的笔记，正文底部不显示反链（每行一个）
  hideFolders: "",
  // 块：面包屑、面包屑带标题层级、命中标题时显示整节、按 Markdown 渲染、按子块结构折叠（一级子块最多列几个）、其余块超过几行先折叠
  showBreadcrumbs: true,
  crumbHeadings: true,
  headingSection: true,
  renderMarkdown: true,
  foldChildren: true,
  childLimit: 6,
  foldLines: 8,
  // 编辑：就地编辑、选中文字后输入成对符号 = 包裹、「转为链接」后不刷新面板
  inlineEdit: true,
  pairWrap: true,
  freezeAfterLink: true,
  // 筛选：共现筛选（默认展开、按紧密度排）、分组（最多几簇）、正文底部的文字筛选框、名字筛选、区分大小写用的属性名
  showCooccur: true,
  cooccurOpen: true,
  rankByStrength: true,
  groupBacklinks: true,
  groupMax: 8,
  textFilter: true,
  nameFilter: true,
  caseProperty: "case-sensitive",
  // 词频：工具栏放「词频」按钮，按页开关（开过的页记在 wordStatsPages 里），不是每页常驻
  wordStats: true,
  wordStatsPages: [],
  // 导航：Shift 点在右侧栏叠放（列表块用 Bullet / Zoom 插件聚焦进去）、块引用计数
  shiftStack: true,
  stackZoom: true,
  blockRefcount: true,
  // 单独列出的文件夹（比如 AI 维护的 wiki 层）：不进反链列表、不参与共现和分组，改在工具栏下方列成一行入口
  separateFolder: "",
  separateLabel: "",
  // 反链片段的字体（没装就回落到正文字体）
  snippetFont: "Lyon Text",
  // 导出 PDF：在自带的导出对话框里加「包含反链」和「排版」
  pdfBacklinksEnabled: true,
  pdfStyle: true,
  // 导出对话框里上次选的值
  pdfBacklinks: false,
  pdfPretty: true,
  pdfFont: "",
  pdfHeadFont: "",
  pdfSize: "medium",
  pdfAccent: "#3a6ea5",
};
let S = Object.assign({}, DEFAULTS);
const EXTRA_CONTEXT = true;
const folderPrefix = (f) => { f = String(f || "").trim().replace(/^\/+|\/+$/g, ""); return f ? f + "/" : ""; };
const hideFolders = () => String(S.hideFolders || "").split(/[\n,]/).map(folderPrefix).filter(Boolean);
const sepFolder = () => folderPrefix(S.separateFolder);
const caseKeys = () => [...new Set([String(S.caseProperty || "").trim() || "case-sensitive", "case-sensitive"])];

// ---------- 词频：用自带的 Intl.Segmenter 分词（中英文都能分），去掉停用词 ----------
const STOP_WORDS = new Set((
  "一个 一些 一下 一点 一种 一样 一直 一起 一次 没有 我们 你们 他们 她们 它们 自己 这个 那个 这些 那些 这样 那样 这么 那么 这种 那种 这里 那里 哪里 什么 怎么 怎样 为什么 " +
  "因为 所以 但是 如果 然后 还是 已经 可以 就是 不是 还有 只是 而且 或者 不过 虽然 因此 于是 并且 然而 其实 应该 可能 需要 觉得 知道 现在 时候 之后 以后 之前 以前 " +
  "今天 明天 昨天 非常 比较 很多 不要 不会 不能 有点 有些 出来 起来 进行 通过 关于 对于 以及 等等 东西 事情 问题 方面 情况 部分 所有 每个 直接 主要 之类 感觉 " +
  "比如 的话 都是 也是 就是 而是 只有 之间 一般 其他 别人 更加 特别 目前 当时 同时 甚至 本身 另外 一定 完全 确实 真的 好像 这次 还会 还能 能够 或许 也许 大概 左右 如何 是否 为了 其中 这是 那是 就会 都有 有的 一件 一条 一样 这一 那一 " +
  "the and for are but not you all any can had her was one our out has have this that with from they will would there their what when which been were into than then them " +
  "these those some such just also more most other only over very about after before because could should while where your its get got like how why who todo doing done later " +
  "now failed canceled cancelled waiting paused scheduled deadline https http www com tok true false null suspended toreview 的是 不错 穿的"
).split(" "));
const CJK_RE = /[㐀-鿿]/;
let segmenter = null;
// 自带分词的词典不认识的专名（品牌、人名、术语）会被拆成单字，所以先用库里的页面名和别名做最长匹配，剩下的再分词
let wordDict = new Set();
const DICT_MAX = 8;
function setWordDict(names) {
  wordDict = new Set();
  for (const n of names) { const w = String(n || "").trim().toLowerCase(); if (w.length >= 2 && w.length <= DICT_MAX && CJK_RE.test(w) && !/\s/.test(w)) wordDict.add(w); }
}
// 双链交给共现筛选，这里去掉；标签、网址、代码、块 ID、属性（key:: value）也去掉，剩下的分词
function wordsOf(text) {
  if (!segmenter) { try { segmenter = new Intl.Segmenter("zh", { granularity: "word" }); } catch (e) { return []; } }
  let s = String(text || "")
    .replace(/!?\[\[[^\]]*\]\]/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/(^|\s)#[^\s#]+/g, " ")
    .replace(/\^[\w-]+/g, " ")
    .replace(/\[?[\w\u3400-\u9fff-]+::[^\]\n]*\]?/g, " ")
    .toLowerCase();
  const out = [];
  if (wordDict.size) {
    let rest = "";
    for (let i = 0; i < s.length;) {
      let hit = "";
      if (CJK_RE.test(s[i])) for (let L = Math.min(DICT_MAX, s.length - i); L >= 2 && !hit; L--) if (wordDict.has(s.substr(i, L))) hit = s.substr(i, L);
      if (hit) { if (!STOP_WORDS.has(hit)) out.push(hit); rest += " "; i += hit.length; } else rest += s[i++];
    }
    s = rest;
  }
  for (const seg of segmenter.segment(s)) {
    const w = seg.segment;
    if (!seg.isWordLike || /^[\d.,:%_-]+[a-z]{0,3}$/.test(w) || STOP_WORDS.has(w)) continue;
    if (CJK_RE.test(w) ? w.length < 2 : w.length < 3) continue;
    out.push(w);
  }
  return out;
}
// 词对：每条反链算一篇，c = 两个词同时出现的条数。按局部互信息 c·log2(c·D / (cA·cB)) 排，
// 比只看 c 更能挑出「真的常一起说」的组合，而不是两个各自都很常见的词；只留 c ≥ 2
function wordPairs(docs, words, limit) {
  const df = new Map(words.map((w) => [w, 0]));
  for (const d of docs) for (const w of d) if (df.has(w)) df.set(w, df.get(w) + 1);
  const pairs = [];
  for (let i = 0; i < words.length; i++) for (let j = i + 1; j < words.length; j++) {
    const a = words[i], b = words[j];
    if (a.includes(b) || b.includes(a)) continue;
    let c = 0;
    for (const d of docs) if (d.has(a) && d.has(b)) c++;
    if (c < 2) continue;
    const lmi = c * Math.log2((c * docs.length) / (df.get(a) * df.get(b)));
    if (lmi > 0) pairs.push({ a, b, c, ca: df.get(a), cb: df.get(b), lmi });
  }
  return pairs.sort((x, y) => y.lmi - x.lmi).slice(0, limit);
}

// 字体候选：[英文名, 中文名, CSS 字体栈]。打开对话框时用画布量字宽，只列出本机装了的（按栈里第一个字体判断）
const PDF_FONTS = [
  ["Georgia", "Georgia", "Georgia, serif"],
  ["Charter", "Charter", "Charter, \"Bitstream Charter\", serif"],
  ["Iowan Old Style", "Iowan Old Style", "\"Iowan Old Style\", serif"],
  ["Palatino", "Palatino", "Palatino, \"Palatino Linotype\", serif"],
  ["Times New Roman", "Times New Roman", "\"Times New Roman\", Times, serif"],
  ["Lyon Text", "Lyon Text", "\"Lyon Text\", serif"],
  ["Helvetica Neue", "Helvetica Neue", "\"Helvetica Neue\", Helvetica, Arial, sans-serif"],
  ["Inter", "Inter", "Inter, sans-serif"],
  ["Avenir Next", "Avenir Next", "\"Avenir Next\", Avenir, sans-serif"],
  ["Segoe UI", "Segoe UI", "\"Segoe UI\", sans-serif"],
  ["Songti SC", "宋体", '"Songti SC", "STSong", serif'],
  ["Source Han Serif", "思源宋体", '"Source Han Serif SC", "Noto Serif CJK SC", "Noto Serif SC", serif'],
  ["LXGW WenKai", "霞鹜文楷", '"LXGW WenKai", "LXGW WenKai GB", serif'],
  ["Kaiti SC", "楷体", '"Kaiti SC", "STKaiti", serif'],
  ["FZShuSong", "方正书宋", '"FZShuSong-Z01", "FZShuSong-Z01S", serif'],
  ["PingFang SC", "苹方", '"PingFang SC", sans-serif'],
  ["Source Han Sans", "思源黑体", '"Source Han Sans SC", "Noto Sans CJK SC", "Noto Sans SC", sans-serif'],
  ["Hiragino Sans GB", "冬青黑体", '"Hiragino Sans GB", sans-serif'],
  ["Georgia + Songti", "Georgia + 宋体", 'Georgia, "Songti SC", serif'],
  ["Charter + Songti", "Charter + 宋体", 'Charter, "Songti SC", serif'],
  ["Charter + PingFang", "Charter + 苹方", 'Charter, "PingFang SC", serif'],
];
const PDF_SIZES = { small: "13px", medium: "14.5px", large: "16px" };

// 反链里就地编辑（✎）时：选中文字后输入成对符号 = 包起来，不替换（中文、英文输入法都一样）。
// 选中「文字」输入 [ → [文字]，再输入 [ → [[文字]]；中文输入法下 【 也一样，【文字】 再输入 【 → [[文字]]
const PAIRS = { "(": ")", "[": "]", "{": "}", "<": ">", '"': '"', "'": "'", "`": "`",
  "（": "）", "【": "】", "「": "」", "『": "』", "《": "》", "〈": "〉", "“": "”", "‘": "’" };
const CLOSE_TO_OPEN = {};
for (const o in PAIRS) if (o !== PAIRS[o]) CLOSE_TO_OPEN[PAIRS[o]] = o;

// ---------- 跳到某一行：稳定地停在视口正中，并选中这一行的文字（Hover Outline、第二大脑里有同一份） ----------
//   · 编辑模式：选中行内文字（不含缩进、列表符号、复选框、#、行尾 ^块ID）；高度是边滚边量的，对中后再量几次，偏了就补
//   · 阅读模式：先滚到附近让它渲染出来，再按段落 / 列表项（data-line）找到对应元素，对中后用浏览器选区选中
//   · 靠近文首文末滚不动的时候，停在能到的最近位置
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const LINE_PREFIX_RE = /^\s*(?:>\s*)*(?:(?:[-*+]|\d+[.)])\s+)?(?:\[.\]\s+)?(?:#{1,6}\s+)?/;

async function centerOn(sc, measure) {
  for (let i = 0; i < 10; i++) {
    await nextFrame();
    await nextFrame();
    const m = measure();
    if (!m) return;
    const s = sc.getBoundingClientRect();
    const delta = m.top + m.height / 2 - (s.top + s.height / 2);
    if (Math.abs(delta) < 2) return;
    const before = sc.scrollTop;
    sc.scrollTop = before + delta;
    if (Math.abs(sc.scrollTop - before) < 1) return;   // 到顶 / 到底了
  }
}

// 阅读模式里第 line 行对应的元素：列表项按 data-line（相对段落开头），其余取段落本身；顶上文件名那一栏也挂在第 0 行、但只占 0 行，跳过
function previewElAt(renderer, line) {
  const sec = (renderer.sections || []).find((s) => s.start && s.end && s.lines !== 0 && s.start.line <= line && line <= s.end.line);
  if (!sec || !sec.el || !sec.el.isConnected || !sec.el.firstElementChild) return null;
  // 「- - 文字」这种一行套几层的，每层都是这一行，取最里面那层（外层自己没有文字）
  const lis = sec.el.querySelectorAll(`li[data-line="${line - sec.start.line}"]`);
  return lis.length ? lis[lis.length - 1] : sec.el.firstElementChild;
}

// 元素自己的文字（列表项不含子列表）
function ownRange(el) {
  const range = document.createRange();
  if (el.tagName === "LI") {
    range.setStart(el, 0);
    const sub = [...el.children].find((c) => /^(UL|OL)$/.test(c.tagName) || c.classList.contains("list-children"));
    if (sub) range.setEndBefore(sub);
    else range.setEnd(el, el.childNodes.length);
  } else range.selectNodeContents(el);
  return range;
}

async function revealLine(view, line, select = true) {
  if (!view || !view.getMode) return;
  if (view.getMode() === "source") {
    const ed = view.editor;
    const cm = ed && ed.cm;
    if (!cm) return;
    line = Math.max(0, Math.min(line, ed.lastLine()));
    const text = ed.getLine(line);
    if (select) {
      const from = text.match(LINE_PREFIX_RE)[0].length;
      const to = Math.max(from, text.replace(/\s+\^[\w-]+\s*$/, "").replace(/\s+$/, "").length);
      ed.setSelection({ line, ch: from }, { line, ch: to });
    } else ed.setCursor({ line, ch: text.length });
    ed.focus();
    const pos = cm.state.doc.line(line + 1).from;
    cm.dispatch({ effects: cm.constructor.scrollIntoView(pos, { y: "center" }) });
    await centerOn(cm.scrollDOM, () => {
      const b = cm.lineBlockAt(pos);
      return { top: cm.documentTop + b.top, height: b.height };
    });
    return;
  }
  const pm = view.previewMode;
  const rd = pm && pm.renderer;
  const sc = rd && rd.previewEl;
  if (!sc) return;
  pm.applyScroll(line);
  let el = null;
  for (let i = 0; i < 12 && !el; i++) { await wait(i ? 80 : 30); el = previewElAt(rd, line); }
  if (!el) return;
  await centerOn(sc, () => {
    const cur = previewElAt(rd, line);
    return cur ? ownRange(cur).getBoundingClientRect() : null;
  });
  if (!select) return;
  const target = previewElAt(rd, line);
  if (!target) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(ownRange(target));
}


// ---------- 设置页 ----------
// [key, 类型, 英文名, 英文说明, 中文名, 中文说明]；类型：toggle / number / text / textarea / heading
const SETTING_ROWS = [
  ["", "heading", "Blocks", "", "块", ""],
  ["showBreadcrumbs", "toggle", "Breadcrumbs", "Show the path above each block. Click a level to expand the context to it, Cmd/Ctrl-click to open the note there, Shift-click to open it in the right sidebar.", "面包屑", "命中块上方显示它所在的路径。点某一级 = 就地展开到那一级，⌘ 点 = 跳到原文，Shift 点 = 在右侧栏打开"],
  ["crumbHeadings", "toggle", "Headings in breadcrumbs", "Include the headings a block sits under.", "面包屑带标题层级", "面包屑里带上命中块所在的各级标题"],
  ["headingSection", "toggle", "Show whole sections", "When the link is in a heading, show the entire section under it.", "命中标题时显示整节", "链接写在标题里时，把这个标题下的整节一起显示"],
  ["renderMarkdown", "toggle", "Render Markdown", "Render blocks like the reading view instead of showing raw source.", "按 Markdown 渲染", "反链片段像阅读视图一样渲染，而不是显示源码"],
  ["foldChildren", "toggle", "Fold by child blocks", "List items show their first-level children; deeper children fold behind “…”.", "按子块结构折叠", "列表项列出一级子块，更深的子块收在「…」里"],
  ["childLimit", "number", "Children shown before “… N more”", "", "一级子块最多列几个", "超过的收成「… 还有 N 项」"],
  ["foldLines", "number", "Fold other blocks after this many lines", "0 = never fold.", "其余块超过几行先折叠", "0 = 不折叠"],
  ["snippetFont", "text", "Block font", "Font for backlink blocks. Falls back to the text font if it isn't installed. Empty = text font.", "反链片段字体", "没装这个字体时回落到正文字体；留空 = 正文字体"],

  ["", "heading", "Editing", "", "编辑", ""],
  ["inlineEdit", "toggle", "Edit in place", "Click a block to edit its source and write it back to the note, like in Logseq and Roam Research.", "就地编辑", "点一下块就地编辑源码并写回原笔记，和 Logseq、Roam Research 一样"],
  ["pairWrap", "toggle", "Wrap selection with paired symbols", "With text selected, typing ( [ \" etc. wraps it instead of replacing it; [ twice makes a [[link]].", "成对符号包裹选中文字", "选中文字后输入 ( [ \" 等符号会把它包起来；连按两次 [ 变成 [[双链]]"],
  ["freezeAfterLink", "toggle", "Keep position after “Link”", "Linking an unlinked mention doesn't refresh or re-sort the panel, so you keep your place.", "「转为链接」后不刷新", "把未链接提及转成链接后，面板不刷新、不重排，阅读位置不变"],

  ["", "heading", "Sorting", "", "排序", ""],
  ["customSort", "toggle", "Sort by relationship", "Pages first, ranked by mutual links, then links from properties, then mention count; daily notes after, newest first, grouped by month and year.", "按关系排序", "页面在前，按互相链接 > 属性里链过来 > 提到次数排；日记在后，从新到旧，按月 / 按年分段"],
  ["recentMonths", "number", "Recent months shown month by month", "Older daily notes fold by year.", "最近几个月按月分段", "更早的日记按年折叠"],
  ["journalFolder", "text", "Daily notes folder", "Leave both empty to use the core Daily notes settings.", "日记文件夹", "和下一项都留空 = 用核心插件「日记」的设置"],
  ["journalFormat", "text", "Daily note date format", "Moment.js format, e.g. YYYY-MM-DD.", "日记日期格式", "Moment.js 格式，比如 YYYY-MM-DD"],
  ["backlinkCollapsed", "toggle", "Collapse linked mentions", "", "默认折叠「链接到当前文件」", ""],
  ["unlinkedCollapsed", "toggle", "Collapse unlinked mentions", "", "默认折叠「提到当前文件」", ""],
  ["hideFolders", "textarea", "Hide in-note backlinks in these folders", "One folder per line. The backlinks at the bottom of notes in these folders are hidden.", "这些文件夹不显示正文底部的反链", "每行一个文件夹"],

  ["", "heading", "Filtering", "", "筛选", ""],
  ["showCooccur", "toggle", "Co-mention filter", "List the other pages mentioned alongside this one. Click to show only blocks with it, Shift-click to exclude it.", "共现筛选", "列出和当前页一起出现的其它页面。点 = 只看含它的，Shift 点 = 排除"],
  ["cooccurOpen", "toggle", "Expand the co-mention filter by default", "", "共现筛选默认展开", ""],
  ["rankByStrength", "toggle", "Rank co-mentions by strength", "Rare, specific pages rank above pages that appear everywhere.", "共现按紧密度排序", "专属的页面排在到处出现的高频页前面"],
  ["groupBacklinks", "toggle", "Group button", "Cluster backlinks by their strongest co-mentioned pages.", "分组按钮", "按最紧密的共现页把反链聚成簇"],
  ["groupMax", "number", "Maximum clusters", "", "最多分几簇", ""],
  ["wordStats", "toggle", "Word stats button", "A “Words” button in the toolbar. Turn it on for a note to see the frequent words and word pairs in its backlinks; each note remembers its own switch.", "词频按钮", "工具栏里放一个「词频」按钮。对某一页打开后，列出它反链里的高频词和一起出现的词对；每页单独记住开关"],
  ["textFilter", "toggle", "Text filter under notes", "Add a filter box to the backlinks at the bottom of notes (the sidebar panel has its own).", "正文底部的文字筛选框", "给正文底部那份反链加一个筛选框（侧栏面板自带搜索）"],
  ["nameFilter", "toggle", "Filter by name", "When a note has aliases, filter backlinks by the name they use.", "名字筛选", "当前页有别名时，可以按用的是哪个名字筛选"],
  ["caseProperty", "text", "Case-sensitivity property", "Set this property to true in a note to show only unlinked mentions that match its name exactly. “case-sensitive” always works too.", "区分大小写的属性名", "笔记属性里把它设为 true，「提到当前文件」只显示大小写完全一致的写法。case-sensitive 也一直有效"],

  ["", "heading", "Navigation", "", "导航", ""],
  ["shiftStack", "toggle", "Shift-click stacks in the right sidebar", "Shift-click a link, block or title to open it below the previous one in the right sidebar.", "Shift 点在右侧栏叠放", "Shift 点链接、块或标题，在右侧栏往下叠放一页"],
  ["stackZoom", "toggle", "Zoom into stacked list blocks", "Uses the Zoom or Bullet plugin when installed.", "叠放的列表块聚焦进去", "装了 Zoom 或 Bullet 插件时生效"],
  ["blockRefcount", "toggle", "Block reference counts", "Show how many times a block with a ^id is referenced.", "块引用计数", "带 ^id 的块显示被引用了几次"],
  ["separateFolder", "text", "Separate folder", "Notes in this folder are listed as a row of links above the backlinks instead of in the list, e.g. an AI-maintained wiki. Empty = off.", "单独列出的文件夹", "这个文件夹里的笔记不进反链列表，改在上方列成一行入口（比如 AI 维护的 wiki）。留空 = 不用"],
  ["separateLabel", "text", "Label for the separate folder", "Empty = the folder name.", "单独列出的文件夹的标签", "留空 = 文件夹名"],

  ["", "heading", "Export to PDF", "", "导出 PDF", ""],
  ["pdfBacklinksEnabled", "toggle", "Backlinks in PDF export", "Add “Include backlinks” to Obsidian's Export to PDF dialog: every passage that links here is appended, grouped by note, with breadcrumbs.", "导出 PDF 带反链", "在自带的「导出为 PDF」对话框里加「包含反链」：引用这一页的每一处都接在正文后面，按来源笔记分组，带面包屑"],
  ["pdfStyle", "toggle", "Layout options in PDF export", "Add refined typography, fonts, font size and accent color to the dialog. Only affects the exported PDF.", "导出 PDF 的排版选项", "对话框里加精致排版、字体、字号和强调色，只作用于导出的 PDF"],
];

class BacklinkSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const el = this.containerEl;
    el.empty();
    const zh = LANG === "zh";
    for (const [key, type, enName, enDesc, zhName, zhDesc] of SETTING_ROWS) {
      const name = zh ? zhName : enName, desc = zh ? zhDesc : enDesc;
      if (type === "heading") { new Setting(el).setName(name).setHeading(); continue; }
      const row = new Setting(el).setName(name);
      if (desc) row.setDesc(desc);
      const save = (v) => { S[key] = v; this.plugin.saveSettings(); };
      if (type === "toggle") row.addToggle((c) => c.setValue(!!S[key]).onChange(save));
      else if (type === "number") row.addText((c) => {
        c.inputEl.type = "number";
        c.inputEl.min = "0";
        c.setValue(String(S[key])).onChange((v) => { const n = parseInt(v, 10); save(isNaN(n) || n < 0 ? DEFAULTS[key] : n); });
      });
      else if (type === "textarea") row.addTextArea((c) => c.setValue(String(S[key] || "")).onChange(save));
      else row.addText((c) => c.setPlaceholder(String(DEFAULTS[key] || "")).setValue(String(S[key] || "")).onChange(save));
    }
  }
}


// 给一个 textarea 装上「成对符号包裹」。不管字符是直接输入还是输入法上屏，都是事后看：
// 「选中的文字被换成了一个成对符号」就改成包裹（走 execCommand，⌘Z 能撤销）
function watchPairWrap(ta) {
  const doc = ta.ownerDocument || document;
  let snap = null, composing = false;
  const takeSnap = () => { snap = { value: ta.value, s: ta.selectionStart, e: ta.selectionEnd, back: ta.selectionDirection === "backward" }; };
  const snapNow = (e) => { if (!composing && !(e && e.isComposing)) takeSnap(); };
  const wrapIfReplaced = (o) => {
    takeSnap();
    if (!o || o.s === o.e || !ta.isConnected) return;
    const v = ta.value;
    if (v.length !== o.value.length - (o.e - o.s) + 1) return;
    if (v.slice(0, o.s) !== o.value.slice(0, o.s) || v.slice(o.s + 1) !== o.value.slice(o.e)) return;
    const ch = v.charAt(o.s), open = PAIRS[ch] ? ch : CLOSE_TO_OPEN[ch];
    if (!open) return;
    const text = o.value.slice(o.s, o.e), before = o.value.charAt(o.s - 1), after = o.value.charAt(o.e);
    let from = o.s, to = o.s + 1, ins, a;
    if ((open === "[" || open === "【") && o.s > 0 && ((before === "[" && after === "]") || (before === "【" && after === "】"))) {
      from = o.s - 1; to = o.s + 2; ins = "[[" + text + "]]"; a = o.s + 1;   // 第二次按：[文字] / 【文字】 → [[文字]]
    } else {
      ins = open + text + PAIRS[open]; a = o.s + open.length;
    }
    ta.setSelectionRange(from, to);
    doc.execCommand("insertText", false, ins);
    ta.setSelectionRange(a, a + text.length, o.back ? "backward" : "forward");
    takeSnap();
  };
  // 「改动前」的快照：选区变了、按键前、输入前都记一次（WebKit 和 Chromium 触发的事件不完全一样）
  const onSel = () => { if (!ta.isConnected) doc.removeEventListener("selectionchange", onSel); else if (doc.activeElement === ta) snapNow(); };
  doc.addEventListener("selectionchange", onSel);
  ta.addEventListener("keydown", snapNow);
  ta.addEventListener("beforeinput", snapNow);
  ta.addEventListener("compositionstart", () => { takeSnap(); composing = true; });
  // 放到下一个时刻做：输入事件还在分发时调 execCommand 会被忽略
  ta.addEventListener("input", (e) => { if (composing || e.isComposing) return; const o = snap; setTimeout(() => wrapIfReplaced(o), 0); });
  ta.addEventListener("compositionend", () => { composing = false; const o = snap; setTimeout(() => wrapIfReplaced(o), 0); });
  takeSnap();
}

// ---------- 右侧栏叠放（emacs-logseq-inspired-outline 里有同样的一份，改一边要同步改另一边） ----------
// 两个插件都装时只跑一份：先加载的那个把自己的 id 登记在 workspace.sidebarStackOwner，侧边栏菜单、折叠展开由它管；
// 它停用时让出来、发 sidebar-stack-released，另一个接手。两边打开新页都用 stackLeaf 这条规则，所以叠成同一列。彼此不调用对方的函数
const STACK_OWNER = "sidebarStackOwner", STACK_RELEASED = "sidebar-stack-released", STACK_COLLAPSED = "sidebar-stack-collapsed";

// 右侧栏里打开的笔记，从上到下：能按扩展名打开文件的视图（Markdown、PDF、画布……）和空白标签都算，反链、大纲、各插件的面板不算。
// 侧边栏里没激活的标签是延迟视图，leaf.view 只是占位，类型要读 getViewState()
function sidebarNotes(app) {
  const ws = app.workspace, types = new Set(["empty", ...Object.values(app.viewRegistry.typeByExtension || {})]);
  const notes = [];
  ws.iterateAllLeaves((leaf) => { if (leaf.getRoot() === ws.rightSplit && types.has(leaf.getViewState().type)) notes.push(leaf); });
  return notes;
}

// 叠放的新页放哪：接在右侧栏最下面那篇笔记的下面（往下切出新的一组）；右侧栏里还没有笔记，就开在最上面那组的新标签里。
// 不记状态，只看右侧栏现在的样子，所以重启 Obsidian 之后也接得上
function stackLeaf(app) {
  const ws = app.workspace, last = sidebarNotes(app).pop(), top = ws.rightSplit.children[0];
  if (ws.rightSplit.collapsed) ws.rightSplit.expand();
  let leaf = null;
  if (last) try { leaf = ws.createLeafBySplit(last, "horizontal", false); } catch (e) {}
  if (!leaf && top) try { leaf = ws.createLeafInParent(top, 0); } catch (e) {}
  return leaf || ws.getRightLeaf(true);   // 手机上侧边栏是抽屉，切分不了
}

// 折叠 = 这一页所在的那组标签只留标签页头：类名加在组上，styles.css 里两个插件写的是同一条
const stackGroup = (leaf) => leaf.parent?.containerEl;
const isStackCollapsed = (leaf) => !!stackGroup(leaf)?.hasClass(STACK_COLLAPSED);
const setStackCollapsed = (leaf, on) => stackGroup(leaf)?.toggleClass(STACK_COLLAPSED, on);

// 右侧栏笔记的菜单（标签页头右键 / 视图右上角「⋯」），和 Logseq 侧边栏每一页的菜单一样，有几页时才出「其他 / 全部」。
// 自带的「关闭其他标签页」只在主区有、只管同一组，叠放出来的每一页各占一组，所以另做。固定了的标签不关；全关之后没笔记了就收起侧边栏
function addStackMenu(app, menu, leaf, text) {
  const notes = sidebarNotes(app);
  if (!notes.includes(leaf)) return;
  const add = (section, key, icon, run) => menu.addItem((item) => item.setSection(section).setTitle(text(key)).setIcon(icon).onClick(run));
  const others = notes.filter((l) => l !== leaf), multi = notes.length > 1, collapsed = isStackCollapsed(leaf);
  if (!menu.items.some((it) => it.section === "close")) add("close", "stackClose", "lucide-x", () => leaf.detach());   // 「⋯」菜单里没有自带的「关闭」
  if (multi) {
    add("close", "stackCloseOthers", "lucide-x", () => others.forEach((l) => { if (!l.pinned) l.detach(); }));
    add("close", "stackCloseAll", "lucide-x", () => {
      notes.forEach((l) => { if (!l.pinned) l.detach(); });
      if (!sidebarNotes(app).length) app.workspace.rightSplit.collapse();
    });
  }
  if (!collapsed) add("pane", "stackCollapse", "lucide-chevrons-down-up", () => setStackCollapsed(leaf, true));
  if (multi) {
    // 和这一页在同一组里的不折：折了就把这一页也折了
    add("pane", "stackCollapseOthers", "lucide-chevrons-down-up", () => others.forEach((l) => { if (l.parent !== leaf.parent) setStackCollapsed(l, true); }));
    add("pane", "stackCollapseAll", "lucide-chevrons-down-up", () => notes.forEach((l) => setStackCollapsed(l, true)));
  }
  if (collapsed) add("pane", "stackExpand", "lucide-chevrons-up-down", () => setStackCollapsed(leaf, false));
  if (multi) add("pane", "stackExpandAll", "lucide-chevrons-up-down", () => notes.forEach((l) => setStackCollapsed(l, false)));
  if (leaf.getViewState().state?.file) add("open", "stackOpenInMain", "lucide-arrow-up-right", () => openInMain(app, leaf));
}

// 在主区打开（Logseq 的 Open as page）：侧边栏里这一页留着，主区最近用的那个标签换成它；那个标签固定了就在它旁边开新标签
async function openInMain(app, leaf) {
  const ws = app.workspace, main = ws.getMostRecentLeaf(ws.rootSplit);
  const target = main.pinned ? ws.createLeafInParent(main.parent, main.parent.children.indexOf(main) + 1) : main;
  const { type, state } = leaf.getViewState();
  await target.setViewState({ type, state, active: true });
  ws.setActiveLeaf(target, { focus: true });
}

module.exports = class RoamBacklinks extends Plugin {
  async onload() {
    S = this.settings = Object.assign({}, DEFAULTS, await this.loadData());
    this.addSettingTab(new BacklinkSettingTab(this.app, this));
    this.shapeMiss = new Set();
    // 卸载时摘掉加在笔记视图、反链条目上的类（Component.unload 倒着跑 register 的回调，这一条最先登记、最后执行）
    this.register(() => this.app.workspace.iterateAllLeaves((leaf) => {
      const root = leaf.view && leaf.view.containerEl;
      if (!root) return;
      root.removeClass("no-backlinks", "rb-inline-backlinks");
      root.querySelectorAll(".bd-hidden, .bd-before-cont, .bd-title-row").forEach((el) => el.removeClass("bd-hidden", "bd-before-cont", "bd-title-row"));
    }));
    // 挂在面板对象上的补丁，还原函数记在这里（见 undoOn），卸载时后打的先还原
    this.undoList = [];
    this.undoKeys = new WeakMap();
    this.register(() => {
      for (const u of this.undoList.splice(0).reverse()) {
        try { u.fn(); } catch (e) { console.error("[roam-backlinks] undo", e); }
      }
    });
    this.applySnippetFont();
    this.register(() => document.body.style.removeProperty("--roam-backlinks-snippet-font"));
    this.patchPdfExport();
    this.listenAllWindows("click", (e) => this.onTitleRowClick(e));
    this.listenAllWindows("click", (e) => this.onMatchClick(e));
    // 每个面板只设置一次，之后你在该面板里手动切换的选项会保留
    this.applied = new WeakSet();
    this.openInit = new WeakSet();
    this.backlinkDoms = new WeakSet();   // 只改反链面板，不影响全局搜索（要在 onLayoutReady 之前建好：重载插件时它会立刻执行）
    const apply = () => {
      this.applyAll();
      setTimeout(() => this.applyAll(), 50);
      setTimeout(() => this.applyAll(), 600);   // 反链是异步算出来的，晚一点再补一次
      this.sweepSoon();   // 关掉的面板：回收它的命中组件和登记的还原
    };
    this.registerEvent(this.app.workspace.on("layout-change", apply));
    this.registerEvent(this.app.workspace.on("active-leaf-change", apply));
    this.registerEvent(this.app.workspace.on("file-open", apply));
    // 重新打开同一页 = 刷新：解冻并重新读取反链
    this.registerEvent(this.app.workspace.on("file-open", (f) => { if (f && S.freezeAfterLink) this.thawFor(f.path); }));

    // 每条命中渲染 Markdown 用的 Component（挂在插件下面），命中被丢掉后由 sweepStale 卸载
    this.matchComps = new Set();
    this.sweepSoon = debounce(() => this.sweepStale(), 1000, true);

    // 全库扫一遍 ^id 块引用建索引，之后按文件增量更新（设置里关掉时不建）
    this.app.workspace.onLayoutReady(() => { if (S.blockRefcount) this.buildBlockIndex(); });
    this.registerEvent(this.app.metadataCache.on("deleted", (f) => { if (this.blockCounts) this.removeFile(f.path); }));
    this.registerEvent(this.app.vault.on("rename", (f, oldPath) => { if (this.blockCounts) this.renameInIndex(f, oldPath); }));
    // 开了词频的页改名 / 移动：开关跟着走
    this.registerEvent(this.app.vault.on("rename", (f, oldPath) => {
      const i = (S.wordStatsPages || []).indexOf(oldPath);
      if (i >= 0) { S.wordStatsPages[i] = f.path; this.saveSettings(); }
    }));

    // 所有「某篇的元数据变了」都在这一处处理
    this.caseSig = new Map();
    this.registerEvent(this.app.metadataCache.on("changed", (f) => {
      this.clearRelationCache();
      if (this.blockCounts) this.indexFile(f);
      // 当前笔记属性变了（开 / 关大小写敏感、改别名）：重画反链
      const sig = this.caseSignature(f);
      if (this.caseSig.has(f.path) && this.caseSig.get(f.path) !== sig) { this.caseSig.set(f.path, sig); this.rerenderAll(); this.applyAll(); }
    }));
    // 关联紧密度用到的「每页被引用总数」缓存，库有变动就重算
    this.registerEvent(this.app.metadataCache.on("resolved", () => this.clearRelationCache()));
    this.addCommand({
      id: "toggle-case-sensitive",
      name: t("cmdToggleCase"),
      checkCallback: (checking) => {
        const f = this.app.workspace.getActiveFile();
        if (!f || f.extension !== "md") return false;
        if (!checking) this.app.fileManager.processFrontMatter(f, (fm) => {
          const on = caseKeys().some((k) => fm[k] === true || fm[k] === "true");
          for (const k of caseKeys()) delete fm[k];
          if (!on) fm[caseKeys()[0]] = true;
          new Notice(on ? t("caseOff") : t("caseOn"));
        });
        return true;
      },
    });
    // 让这个属性在属性面板里是个勾选框
    try { const tm = this.app.metadataTypeManager; if (tm && typeof tm.setType === "function") tm.setType(caseKeys()[0], "checkbox"); } catch (e) {}

    // 跳到当前笔记的反向链接（去设置里给它绑快捷键）
    // 右侧栏叠放的菜单和折叠：没人管就接过来；装了同一份代码的另一个插件（emacs-logseq-inspired-outline）停用时也接过来
    this.registerEvent(this.app.workspace.on(STACK_RELEASED, () => this.claimSidebarStack()));
    this.claimSidebarStack();

    this.addCommand({
      id: "goto-backlinks",
      name: t("cmdGoto"),
      callback: () => this.gotoBacklinks(),
    });
    this.addCommand({
      id: "toggle-word-stats",
      name: t("cmdWords"),
      checkCallback: (checking) => {
        const f = this.app.workspace.getActiveFile();
        if (!S.wordStats || !f || f.extension !== "md") return false;
        if (!checking) this.toggleWordStats(f.path);
        return true;
      },
    });

    // 放在最后：布局已就绪时（比如重载插件）它会立刻执行，上面的初始化得先做完
    this.app.workspace.onLayoutReady(apply);
  }

  // Component.unload 先卸子组件、再跑 register 登记的还原，最后才调 onunload，所以「正在卸载」要在这里最先标上，
  // 免得还原途中触发的 changed / 回收又去改面板
  unload() {
    this.unloaded = true;
    super.unload();
  }

  onunload() {
    // 各处补丁都已经由各自登记的还原撤掉了，这里只把反链条目按原生的 render 重画一遍
    if (this.origRender) this.rerenderAll();
  }

  // 给某个面板对象（反链组件 / 结果列表）打了补丁：在这里登记它的还原。
  // 带 key 的同一个对象只登记一次；记号放在插件实例这边，插件重载后新实例会重新登记（面板对象重载前后是同一个）
  undoOn(owner, fn, key) {
    if (key) {
      let keys = this.undoKeys.get(owner);
      if (!keys) this.undoKeys.set(owner, (keys = new Set()));
      if (keys.has(key)) return;
      keys.add(key);
    }
    this.undoList.push({ owner, fn });
  }

  // 每个窗口（含弹出的小窗口）的 document 上挂一个捕获阶段的监听；窗口关掉就摘，插件卸载时全摘
  listenAllWindows(type, handler) {
    const attached = new Map();
    const add = (win) => {
      if (!win || !win.document || attached.has(win)) return;
      win.document.addEventListener(type, handler, true);
      attached.set(win, () => win.document.removeEventListener(type, handler, true));
    };
    add(window);
    this.app.workspace.iterateAllLeaves((leaf) => add(leaf.view && leaf.view.containerEl && leaf.view.containerEl.win));
    this.registerEvent(this.app.workspace.on("window-open", (_w, win) => add(win)));
    this.registerEvent(this.app.workspace.on("window-close", (_w, win) => { const off = attached.get(win); if (off) { off(); attached.delete(win); } }));
    this.register(() => { for (const off of attached.values()) off(); attached.clear(); });
  }

  // Obsidian 改了内部结构、对不上时：这个功能跳过，控制台记一次、只弹一次提示，其它功能照常
  shapeOk(feature, ok, what) {
    if (ok) return true;
    if (!this.shapeMiss.has(feature)) {
      this.shapeMiss.add(feature);
      console.warn(`[roam-backlinks] ${feature}: Obsidian's internal ${what} has changed, skipping this feature`);
      if (this.shapeMiss.size === 1) new Notice(t("internalsChanged"));
    }
    return false;
  }

  applyAll() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!view) return;
      // 日记等文件夹：整个视图挂 no-backlinks
      if (view.getViewType && view.getViewType() === "markdown" && view.containerEl) {
        const path = view.file ? view.file.path : "";
        view.containerEl.toggleClass("no-backlinks", hideFolders().some((f) => path.startsWith(f)));
        // 编辑视图里正文底部有反链：挂个类，styles.css 据此把「滚过末尾」的空白挪到反链下面（用类代替 CSS 父选择器）
        view.containerEl.toggleClass("rb-inline-backlinks", !!view.containerEl.querySelector(".markdown-source-view .cm-sizer > .embedded-backlinks"));
      }
      // view.backlink：侧边栏反向链接面板；view.backlinks：笔记底部的反向链接
      for (const component of [view.backlink, view.backlinks]) {
        if (!component) continue;
        const kids = component.backlinkDom && component.backlinkDom.vChildren && component.backlinkDom.vChildren._children;
        if (!this.shapeOk("pane", Array.isArray(kids), "backlinks pane")) continue;
        component.__bdEmbedded = component === view.backlinks;
        component.__bdTarget = view.file || component.file || null;
        component.__bdTargetPath = component.__bdTarget ? component.__bdTarget.path : "";
        component.__bdCaseNames = this.caseNames(component.__bdTarget);
        if (component.__bdTarget) this.caseSig.set(component.__bdTargetPath, this.caseSignature(component.__bdTarget));
        if (!component.__bd) component.__bd = { include: new Set(), exclude: new Set(), text: "", open: S.cooccurOpen, group: false, groupCollapsed: new Set() };
        component.__bd.nameInc = component.__bd.nameInc || new Set();
        component.__bd.nameExc = component.__bd.nameExc || new Set();
        component.__bd.words = component.__bd.words || new Set();
        component.__bdNames = this.targetNames(component.__bdTarget);
        // 插件加载后第一次碰到这个面板：按默认值设一次「共现筛选」展开（之后你手动开关的会保留）
        if (!this.openInit.has(component)) { component.__bd.open = S.cooccurOpen; this.openInit.add(component); }
        // 换了当前文件就重置筛选（Roam 是按页筛选）
        if (component.__bdPrevTarget !== component.__bdTargetPath) {
          // 离开了冻结时的那一页：解冻（Obsidian 换页时自己会整体重算）
          if (component.__bdFrozen) this.thaw(component, false);
          component.__bd.include.clear(); component.__bd.exclude.clear(); component.__bd.text = "";
          component.__bd.nameInc.clear(); component.__bd.nameExc.clear(); component.__bd.words.clear();
          if (component.__bdInput) component.__bdInput.value = "";
          component.__bdPrevTarget = component.__bdTargetPath;
        }
        for (const dom of [component.backlinkDom, component.unlinkedDom]) if (dom) { this.backlinkDoms.add(dom); dom.__bdComponent = component; this.hookChanged(dom); if (S.customSort) this.hookSort(dom); }
        if (!this.matchProto) this.patchMatchRender(component);
        if (!this.applied.has(component)) {
          if (typeof component.setExtraContext === "function") component.setExtraContext(EXTRA_CONTEXT);
          this.setCollapsed(component);
          this.applied.add(component);
        } else if (!component.__bdCollapseDone) {
          this.setCollapsed(component);   // 第一次时 DOM 可能还没画出来
        }
        if (S.showCooccur || S.textFilter || S.wordStats) {
          const rootEl = component.__bdEmbedded
            ? view.containerEl && view.containerEl.querySelector(".embedded-backlinks")
            : (view.containerEl && view.containerEl.querySelector(".backlink-pane")) || view.containerEl;
          if (rootEl) { this.setupToolbar(component, rootEl); this.refresh(component); }
        }
      }
    });
  }

  setCollapsed(c) {
    let ok = false;
    try {
      if (typeof c.setUnlinkedCollapsed === "function") { c.setUnlinkedCollapsed(S.unlinkedCollapsed, false); ok = true; }
      else if ("unlinkedCollapsed" in c) { c.unlinkedCollapsed = S.unlinkedCollapsed; ok = true; }
      if (typeof c.setBacklinkCollapsed === "function") c.setBacklinkCollapsed(S.backlinkCollapsed, false);
    } catch (e) { ok = false; }
    if (!ok) ok = this.domCollapse(c);
    if (ok) c.__bdCollapseDone = true;
  }

  // 兜底：找到「提到当前文件 / Unlinked mentions」标题，没折叠就点一下
  domCollapse(c) {
    const root = c.containerEl || c.el;
    if (!root) return false;
    const heads = root.querySelectorAll(".tree-item-self, .backlink-pane > div");
    for (const h of heads) {
      const t = (h.textContent || "").trim();
      if (!/^(提到当前文件|未链接|Unlinked mentions)/i.test(t)) continue;
      const item = h.closest(".tree-item") || h.parentElement;
      const collapsed = (item && item.classList.contains("is-collapsed")) || h.classList.contains("is-collapsed");
      if (S.unlinkedCollapsed !== collapsed) h.click();
      return true;
    }
    return false;
  }

  // 反链里每一条命中（search-result-file-match）的类没有导出，只能从现成的实例上拿原型
  patchMatchRender(component) {
    let match = null, seen = false;
    for (const dom of [component.backlinkDom, component.unlinkedDom]) {
      for (const fileDom of (dom && dom.vChildren && dom.vChildren._children) || []) {
        const m = fileDom.vChildren && fileDom.vChildren._children && fileDom.vChildren._children[0];
        if (m) seen = true;
        if (m && typeof m.render === "function" && "start" in m && "cache" in m && m.el) { match = m; break; }
      }
      if (match) break;
    }
    // 有命中却认不出它的形状：Obsidian 改了这个内部类，命中处渲染、面包屑、就地编辑这些都不做
    if (!match) { if (seen) this.shapeOk("render", false, "search result match"); return; }
    const proto = Object.getPrototypeOf(match);
    if (proto.__bdAncestors) { this.matchProto = proto; return; }
    const plugin = this;
    const orig = proto.render;
    proto.render = function (...args) {
      orig.apply(this, args);
      try {
        const fileDom = this.parentDom;
        if (fileDom && plugin.backlinkDoms.has(fileDom.parentDom)) plugin.decorate(this);
      } catch (e) { console.error("[roam-backlinks] render", e); }
    };
    proto.__bdAncestors = true;
    this.matchProto = proto;
    this.origRender = orig;
    this.register(() => { proto.render = orig; delete proto.__bdAncestors; });
    this.rerenderAll();
  }

  dropMatchComp(m) {
    if (m.__bdComp) this.removeChild(m.__bdComp);   // removeChild 会顺带 unload
    m.__bdComp = null;
    this.matchComps.delete(m);
  }

  // 面板重算、换页、关掉以后，旧的命中对象就没人用了（虚拟滚动只是把它的 el 摘下来，对象还在 vChildren 里，不算丢）。
  // 不在任何反链面板 vChildren 里的命中，卸载它的 Component，免得里面嵌入、链接预览注册的事件一直挂着。
  // 已经关掉的面板，它的补丁不用再还原：把登记的还原一并丢掉，不留着那些对象的引用
  sweepStale() {
    if (this.unloaded) return;
    const live = new Set(), owners = new Set();
    this.eachComponent((c) => {
      owners.add(c);
      for (const dom of [c.backlinkDom, c.unlinkedDom]) { if (dom) owners.add(dom); this.eachMatch(dom, (m) => live.add(m)); }
    });
    for (const m of [...this.matchComps]) if (!live.has(m)) this.dropMatchComp(m);
    this.undoList = this.undoList.filter((u) => owners.has(u.owner));
  }

  clearRelationCache() { this._df = null; this._udf = null; this._tags = null; }

  rerenderAll() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!view) return;
      for (const component of [view.backlink, view.backlinks]) {
        if (!component) continue;
        for (const dom of [component.backlinkDom, component.unlinkedDom]) {
          for (const fileDom of (dom && dom.vChildren && dom.vChildren._children) || []) {
            if (typeof fileDom.renderContentMatches === "function") fileDom.renderContentMatches();
          }
        }
      }
    });
  }

  // 找命中所在的列表项和它的全部母块。返回 { item, chain }，chain 从最外层往里
  listContext(m) {
    const items = m.cache && m.cache.listItems;
    if (!items || !items.length) return null;
    const lineStart = (it) => it.position.start.offset - it.position.start.col;
    // 列表项的 position 只包自己那几行，不含子块；取包住命中开头的最深那个
    let item = null;
    for (const it of items) {
      if (lineStart(it) > m.start) break;
      if (m.start <= it.position.end.offset) item = it;
    }
    if (!item) return null;
    // 「- 3. xxx」这种圆点后面紧跟编号的行，Obsidian 会在同一行解析出两个列表项，内层那个的 parent 就是这一行自己。
    // 所以同一行只取最外层（第一个）那项，并且往上找时碰到走过的行就停，免得绕圈
    const byLine = new Map();
    for (const it of items) if (!byLine.has(it.position.start.line)) byLine.set(it.position.start.line, it);
    const chain = [];   // 从直接母块往上
    const seen = new Set([item.position.start.line]);
    const from = byLine.get(item.position.start.line) || item;   // 从这一行最外层那项开始往上找
    for (let p = from.parent; p >= 0 && byLine.has(p) && !seen.has(p) && chain.length < 100; p = byLine.get(p).parent) {
      seen.add(p);
      chain.push(byLine.get(p));
    }
    chain.reverse();    // 最外层在前
    return { item, items, chain, lineStart };
  }

  // 这一条实际显示（也是就地编辑）的源码范围：列表项 = 自己 + 全部子块；标题行 = 整节；其余 = Obsidian 给的范围
  displayRange(m, ctx) {
    const c = m.content;
    let start = m.start, end = m.end, heading = null;
    if (ctx) {
      if (m.start === ctx.lineStart(ctx.item)) end = Math.max(m.end, ctx.item.position.end.offset);
    } else if (S.headingSection) {
      const hs = (m.cache && m.cache.headings) || [];
      const i = hs.findIndex((h) => h.position.start.offset === m.start);
      if (i >= 0) {
        heading = hs[i];
        const next = hs.slice(i + 1).find((h) => h.level <= heading.level);
        end = Math.max(m.end, next ? next.position.start.offset : c.length);
      }
    }
    while (end > start && /\s/.test(c[end - 1])) end--;
    return { start, end, heading };
  }

  // 点面包屑展开到的那一级（m.__bdRoot = 那一级母块 / 标题的行号）：显示它连同全部子块，也就是命中块和它并列的兄弟块一起。
  // 返回 { ctx, range }，ctx 换成以那一级为「命中项」的上下文，面包屑随之少掉这一级；原文变了对不上就退回默认显示
  expandedView(m, ctx) {
    const line = m.__bdRoot, c = m.content;
    if (line == null) return null;
    const trim = (start, end) => { while (end > start && /\s/.test(c[end - 1])) end--; return end; };
    const i = ctx ? ctx.chain.findIndex((it) => it.position.start.line === line) : -1;
    if (i >= 0) {
      const root = ctx.chain[i], start = ctx.lineStart(root);
      return {
        ctx: { item: root, items: ctx.items, chain: ctx.chain.slice(0, i), lineStart: ctx.lineStart },
        range: { start, end: trim(start, this.subtreeEnd(ctx.items, root)), heading: null },
      };
    }
    const hs = (m.cache && m.cache.headings) || [];
    const h = hs.find((x) => x.position.start.line === line);
    if (h && h.position.start.offset <= m.start) {
      const next = hs.slice(hs.indexOf(h) + 1).find((x) => x.level <= h.level);
      const start = h.position.start.offset;
      return { ctx: null, range: { start, end: trim(start, next ? next.position.start.offset : c.length), heading: h } };
    }
    m.__bdRoot = null;
    return null;
  }

  // 列表项连同全部子块的结尾（列表项的 position 不含子块，要把后面挂在它下面的项都算上）
  subtreeEnd(items, root) {
    const rootLine = root.position.start.line;
    const byLine = new Map();
    for (const it of items) if (!byLine.has(it.position.start.line)) byLine.set(it.position.start.line, it);
    const under = (it) => {
      const seen = new Set();
      for (let p = it.parent; p >= 0 && !seen.has(p); p = byLine.has(p) ? byLine.get(p).parent : -1) {
        if (p === rootLine) return true;
        seen.add(p);
      }
      return false;
    };
    let end = root.position.end.offset;
    for (let i = items.indexOf(root) + 1; i < items.length; i++) {
      const it = items[i];
      // 「- 1. xxx」同一行解析出的内层项（parent 是负数）：这一行已经算进来了，跟着算
      const sameLine = byLine.get(it.position.start.line) !== it;
      if (!sameLine && it.position.start.line !== rootLine && !under(it)) break;
      end = Math.max(end, it.position.end.offset);
    }
    return end;
  }

  // 展开 / 收起到某一级后，这一条和同一篇里排在后面的都重画：被展开范围包进去的后续命中会并进来，收起后再分出去
  expandTo(m, line) {
    m.__bdRoot = line;
    if (line != null) m.__bdExpanded = true;   // 展开上下文就是为了看全，不再按行数折叠
    const sibs = (m.parentDom && m.parentDom.vChildren && m.parentDom.vChildren._children) || [];
    const at = sibs.indexOf(m);
    m.render();
    if (at >= 0) for (const s of sibs.slice(at + 1)) s.render();
  }

  // Roam 式面包屑：所在的各级标题 + 各级母块，从外到内。每项 { line, text }
  breadcrumbs(m, ctx, range) {
    const content = m.content, crumbs = [];
    const blockStart = ctx ? ctx.lineStart(ctx.chain[0] || ctx.item) : range.start;
    if (S.crumbHeadings) {
      const stack = [];
      for (const h of (m.cache && m.cache.headings) || []) {
        if (h.position.start.offset >= blockStart) break;
        while (stack.length && stack[stack.length - 1].level >= h.level) stack.pop();
        stack.push(h);
      }
      // 命中的本身是标题：同级或更低级的前一个标题不是它的上级
      if (range.heading) while (stack.length && stack[stack.length - 1].level >= range.heading.level) stack.pop();
      for (const h of stack) crumbs.push({ line: h.position.start.line, text: h.heading });
    }
    if (ctx) {
      for (const it of ctx.chain) {
        const first = content.substring(ctx.lineStart(it), it.position.end.offset).split("\n")[0];
        crumbs.push({ line: it.position.start.line, text: first.replace(/^\s*([-*+]|\d+[.)])\s+(\[.\]\s+)?/, "") });
      }
    }
    return crumbs;
  }

  // 同一个文件里排在前面、而且没被藏起来的那一条
  prevShown(m) {
    const sibs = (m.parentDom && m.parentDom.vChildren && m.parentDom.vChildren._children) || [];
    // 首次渲染时这一条可能还没挂进 vChildren（indexOf = -1），那时已有的兄弟都排在它前面
    let at = sibs.indexOf(m);
    if (at < 0) at = sibs.length;
    for (let i = at - 1; i >= 0; i--) if (sibs[i].__bdRange && !sibs[i].__bdDup) return sibs[i];
    return null;
  }

  // 这篇笔记开了大小写敏感 → 返回允许的写法（文件名 + 别名）；没开返回 null
  // 当前页的所有名字：文件名 + 别名（和「区分大小写」开关无关），按不分大小写去重
  targetNames(file) {
    if (!file) return [];
    const fm = (this.app.metadataCache.getFileCache(file) || {}).frontmatter || {};
    const al = fm.aliases == null ? (fm.alias == null ? [] : fm.alias) : fm.aliases;
    const list = (Array.isArray(al) ? al : String(al).split(",")).map((x) => String(x).trim()).filter(Boolean);
    const out = [];
    for (const n of [file.basename, ...list]) if (!out.some((x) => x.toLowerCase() === n.toLowerCase())) out.push(n);
    return out;
  }

  // 这一条命中用到了当前页的哪些名字（链接看显示出来的那个名字，纯文字看文字本身）
  formsOf(component, m) {
    const names = component.__bdNames || [];
    const sig = names.join("\u0001");
    if (m.__bdForms && m.__bdFormsSig === sig) return m.__bdForms;
    const out = new Set();
    const low = names.map((n) => [n, n.toLowerCase()]);
    for (const p of m.matches || []) {
      const raw = (m.content || "").substring(p[0], p[1]);
      let shown = raw, isLink = false, mm;
      if ((mm = raw.match(/^!?\[\[([^\]|]*)(?:\|([^\]]*))?\]\]$/))) { isLink = true; shown = (mm[2] && mm[2].trim()) || mm[1].split(/[#^]/)[0].split("/").pop().trim(); }
      else if ((mm = raw.match(/^!?\[([^\]]*)\]\([^)]*\)$/))) { isLink = true; shown = mm[1].trim(); }
      const l = shown.toLowerCase();
      let hit = low.find((x) => x[1] === l);
      // 显示文字不是任何一个名字（比如 [[资金成本|那个概念]]）：链接按目标算文件名；纯文字找包含的名字
      if (!hit) hit = isLink ? low[0] : low.find((x) => l.includes(x[1]));
      if (hit) out.add(hit[0]);
    }
    m.__bdForms = out;
    m.__bdFormsSig = sig;
    return out;
  }

  caseNames(file) {
    if (!file) return null;
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = (cache && cache.frontmatter) || {};
    if (!caseKeys().some((k) => fm[k] === true || fm[k] === "true")) return null;
    const al = fm.aliases == null ? (fm.alias == null ? [] : fm.alias) : fm.aliases;
    const list = Array.isArray(al) ? al : String(al).split(",");
    return new Set([file.basename, ...list.map((x) => String(x).trim()).filter(Boolean)]);
  }
  caseSignature(file) {
    const n = this.caseNames(file);
    return n ? [...n].join("\u0001") : "";
  }
  // 「提到当前文件名」的一条命中，大小写对不上 → 不显示
  caseMiss(m, fd) {
    if (!fd || !fd.separateMatches || typeof m.content !== "string") return false;
    const comp = fd.parentDom && fd.parentDom.__bdComponent;
    const names = comp && comp.__bdCaseNames;
    if (!names || !m.matches || !m.matches.length) return false;
    return m.matches.every((p) => !names.has(m.content.substring(p[0], p[1])));
  }

  // 命中落在哪一块：列表项按它自己那一行算（不含子块），其余按 Obsidian 给的范围开头算
  blockKey(m, ctx) {
    return ctx ? "li:" + ctx.item.position.start.line : "p:" + m.start;
  }

  // 这一条要不要并进上一条。
  // 「链接当前文件」（Roam）：母块已经作为引用显示了，它子块里的引用不再单独列一条。
  // 「提到当前文件」：同一个列表项自己的文字里出现几次关键词只显示一次；子块里再出现的，子块另算一条。
  isDup(m, prev, fd) {
    if (!prev) return false;
    if (fd && fd.separateMatches) return prev.__bdBlockKey === m.__bdBlockKey;
    return m.start >= prev.__bdRange.start && m.start < prev.__bdRange.end;
  }

  decorate(m) {
    const content = m.content;
    if (typeof content !== "string") return;
    let ctx = this.listContext(m);
    let range = this.displayRange(m, ctx);
    m.__bdBlockKey = this.blockKey(m, ctx);
    m.__bdHitLine = ctx ? ctx.item.position.start.line : null;   // 展开到上一级后，原来的命中块要一路展开着
    const ex = this.expandedView(m, ctx);
    if (ex) ({ ctx, range } = ex);
    m.__bdRange = range;
    const prev = this.prevShown(m);
    const miss = this.caseMiss(m, m.parentDom);
    m.__bdDup = miss || this.isDup(m, prev, m.parentDom);
    m.el.toggleClass("bd-dup", m.__bdDup);
    if (m.__bdDup) {
      for (const n of Array.from(m.el.childNodes)) n.remove();
      if (miss) { const c = m.parentDom && m.parentDom.parentDom && m.parentDom.parentDom.__bdComponent; if (c && c.__bd) this.refresh(c); }
      return;
    }
    const crumbs = S.showBreadcrumbs ? this.breadcrumbs(m, ctx, range) : [];
    // 和上一条的路径完全相同就不再重复显示面包屑，接在上一条下面
    const key = crumbs.map((c) => c.line).join(",");
    const expanded = m.__bdRoot != null;
    const cont = !!(prev && crumbs.length && prev.__bdCrumbKey === key && !expanded);
    m.__bdCrumbKey = key;
    m.el.toggleClass("bd-cont", cont);
    // 上一条接着这一条显示时，去掉它下面的分隔线（用类代替 CSS 父选择器）
    if (prev && prev.el) prev.el.toggleClass("bd-before-cont", cont);
    const crumbEl = (crumbs.length && !cont) || expanded ? this.renderCrumbs(m, crumbs) : null;
    if (S.renderMarkdown) this.renderMarkdown(m, ctx, range, crumbEl);
    else if (crumbEl) m.el.insertBefore(crumbEl, m.el.firstChild);
    if (S.inlineEdit) this.addEditButton(m, ctx);
    if (S.blockRefcount) this.addRefBadges(m, range);
    this.shrinkTitleHitArea(m.parentDom);
    const dom = m.parentDom && m.parentDom.parentDom;
    const comp = dom && dom.__bdComponent;
    if (comp && comp.__bd) {
      m.el.toggleClass("bd-hidden", !this.matchVisible(comp, m));
      this.refresh(comp);
    }
    if (S.freezeAfterLink && comp && dom === comp.unlinkedDom && this.canFreeze(comp)) this.takeOverLinkButton(m, comp);
  }

  // ---------- 「转为链接」之后不刷新 ----------

  eachComponent(fn) {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const v = leaf.view;
      for (const c of [v && v.backlink, v && v.backlinks]) if (c) fn(c);
    });
  }

  // 冻结：把 Obsidian 反链面板的两个更新队列换成空的，文件改动、元数据变化都不再触发重算和重排
  canFreeze(c) {
    const q = (x) => x && typeof x.add === "function";
    return this.shapeOk("freeze", (c.__bdFrozen || (q(c.backlinkQueue) && q(c.unlinkedQueue))) && typeof c.recomputeBacklink === "function" && typeof c.recomputeUnlinked === "function", "backlinks update queue");
  }
  freeze(c) {
    if (c.__bdFrozen) return;
    this.undoOn(c, () => this.thaw(c, true), "freeze");
    const dummy = { add() {}, remove() {}, runnable: { isCancelled: () => true, cancel() {} } };
    c.__bdQueues = { b: c.backlinkQueue, u: c.unlinkedQueue, dummy };
    c.backlinkQueue = dummy;
    c.unlinkedQueue = dummy;
    c.__bdEdits = new Map();     // 文件路径 → [{ at, delta }]：冻结期间在这篇里已经改过的地方（按原来的位置记）
    c.__bdLinked = new Set();    // 「文件路径:位置」：已经转成链接的提及
    c.__bdFrozen = true;
  }

  // 解冻；recompute 为真时立刻重新读取（重新打开同一页时用）
  thaw(c, recompute) {
    if (!c.__bdFrozen) return;
    const q = c.__bdQueues;
    c.__bdFrozen = false;
    c.__bdQueues = c.__bdEdits = c.__bdLinked = null;
    if (c.backlinkQueue === q.dummy) c.backlinkQueue = q.b;
    if (c.unlinkedQueue === q.dummy) c.unlinkedQueue = q.u;
    if (!recompute) return;
    const f = c.file || c.__bdTarget;
    try { c.recomputeBacklink(f); c.recomputeUnlinked(f); } catch (e) { console.error("[roam-backlinks] thaw", e); }
  }

  thawFor(path) {
    this.eachComponent((c) => { if (c.__bdFrozen && c.__bdTargetPath === path) this.thaw(c, true); });
  }

  // 把 Obsidian 的「转为链接」按钮换成自己的：改完原文不删这一行、不重算面板
  takeOverLinkButton(m, comp) {
    const btn = m.el.querySelector(".search-result-file-match-replace-button");
    const file = m.parentDom && m.parentDom.file;
    const range = m.matches && m.matches[0];
    if (!btn || !file || !range || typeof m.content !== "string") return;
    const nb = btn.cloneNode(true);   // 克隆不带原来的点击事件
    btn.replaceWith(nb);
    if (comp.__bdLinked && comp.__bdLinked.has(file.path + ":" + range[0])) this.markLinked(nb);
    nb.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!nb.hasClass("bd-linked")) this.linkMention(comp, m, file, range, nb);
    });
  }

  async linkMention(comp, m, file, range, btn) {
    const target = comp.__bdTarget;
    if (!target) return;
    this.freeze(comp);
    const text = m.content.slice(range[0], range[1]);
    const edits = comp.__bdEdits.get(file.path) || [];
    const at = range[0] + edits.reduce((s, x) => s + (x.at < range[0] ? x.delta : 0), 0);
    const link = this.app.fileManager.generateMarkdownLink(target, file.path, "", text);
    let ok = false;
    await this.app.vault.process(file, (data) => {
      if (data.slice(at, at + text.length) !== text) return data;   // 原文在这期间被改过：不动
      ok = true;
      return data.slice(0, at) + link + data.slice(at + text.length);
    });
    if (!ok) { new Notice(t("linkChanged")); return; }
    edits.push({ at: range[0], delta: link.length - text.length });
    comp.__bdEdits.set(file.path, edits);
    comp.__bdLinked.add(file.path + ":" + range[0]);
    this.markLinked(btn);
  }

  markLinked(btn) {
    btn.addClass("bd-linked");
    btn.setText(t("linked"));
    btn.setAttribute("aria-label", t("linkedTip"));
  }

  renderCrumbs(m, crumbs) {
    const el = createDiv({ cls: "bd-crumbs" });
    // 面包屑行里点空白处什么也不做（不进编辑、不跳转）
    el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); });
    // 点 = 展开到这一级（连同它下面并列的子块一起显示，可以一级级往外点）· ⌘点 = 跳到原文 · Shift 点 = 在右侧栏打开
    crumbs.forEach((c, i) => {
      if (i) el.createSpan({ cls: "bd-crumb-sep", text: "›" });
      const span = el.createSpan({ cls: "bd-crumb" });   // 不加悬停提示
      this.inlineText(span, c.text);
      span.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (S.shiftStack && e.shiftKey) this.openStackedFile(m.parentDom.file, c.line);
        else if (e.metaKey || e.ctrlKey) this.openAt(m.parentDom.file, c.line, false);
        else this.expandTo(m, c.line);
      });
    });
    if (m.__bdRoot != null) {
      const back = el.createSpan({ cls: "bd-crumb-reset", text: t("collapse") });
      back.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        m.__bdExpanded = false;
        this.expandTo(m, null);
      });
    }
    return el;
  }

  // 面包屑里的一行文字：去掉 Markdown 记号，双链只留显示文字（样式上仍像链接）
  inlineText(el, text) {
    const t = text.replace(/\s\^[\w-]+\s*$/, "").replace(/(\*\*|__|==|~~)/g, "").trim();
    const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[([^\]]*)\]\([^)]*\)|#[^\s#,.;:!?，。；：！？、]+/g;
    let last = 0, mt;
    while ((mt = re.exec(t))) {
      if (mt.index > last) el.appendText(t.substring(last, mt.index));
      const shown = mt[2] || (mt[1] ? mt[1].split("#")[0] : null) || mt[3] || mt[0];
      el.createSpan({ cls: mt[0][0] === "#" ? "bd-crumb-tag" : "bd-crumb-link", text: shown });
      last = re.lastIndex;
    }
    if (last < t.length) el.appendText(t.substring(last));
  }

  // 跳到原文：打开后那一行停在正中、选中它的文字（上方内容不够时停在能到的最近位置）
  async openAt(file, line, newLeaf) {
    if (!file) return;
    const leaf = this.app.workspace.getLeaf(newLeaf);
    await leaf.openFile(file, { active: true, eState: { line } });
    if (line == null || line < 0) return;
    await wait(60);
    await revealLine(leaf.view, line);
  }
  // 反链条目命中的那一行（链接所在行）；拿不到就用这一块的首行
  hitLine(m) {
    const l = this.offsetToLine(m, m.start);
    return l >= 0 ? l : this.offsetToLine(m, (m.__bdRange || {}).start);
  }

  // 文件标题行：只有标题文字（和折叠小三角）能点开文件，行里其他地方是空白，点了什么也不做
  // 只给行打个记号；点击由 onTitleRowClick 在 document 上统一接（插件卸载时监听跟着摘掉，行上不留处理器）
  shrinkTitleHitArea(fileDom) {
    const row = fileDom && fileDom.selfEl;
    if (!row) return;
    row.__bdFileDom = fileDom;
    row.addClass("bd-title-row");
  }
  onTitleRowClick(e) {
    const t = e.target;
    const row = t && t.closest && t.closest(".bd-title-row");
    const fileDom = row && row.__bdFileDom;
    if (!fileDom) return;
    if (t.closest(".tree-item-inner, .collapse-icon")) {
      if (S.shiftStack && e.shiftKey && t.closest(".tree-item-inner")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.openStackedFile(fileDom.file, -1);
      }
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();   // 捕获阶段拦下，原来「点整行打开文件」的处理器收不到
  }

  // ---------- 就地编辑 ----------
  // 可编辑的范围：命中的列表项连同子块（不含母块）；标题行 = 整节；其余就是命中所在的段落 / 整行
  editRange(m, ctx) {
    const c = m.content;
    let start, end;
    if (m.__bdRoot != null && m.__bdRange) {
      // 展开到上一级时，编辑的就是显示出来的整块
      start = m.__bdRange.start; end = m.__bdRange.end;
    } else if (ctx) {
      start = ctx.lineStart(ctx.item);
      end = Math.max(m.end, ctx.item.position.end.offset);
      if (m.start !== start) end = ctx.item.position.end.offset;   // 没开「更多上下文」：只编辑这一项自己
    } else if (m.__bdRange) {
      start = m.__bdRange.start; end = m.__bdRange.end;
    } else {
      start = m.start; end = m.end;
    }
    while (start > 0 && c.charCodeAt(start - 1) !== 10) start--;
    while (end < c.length && c.charCodeAt(end) !== 10) end++;
    while (end > start && /\s/.test(c[end - 1])) end--;
    const indent = c.substring(start, end).match(/^[ \t]*/)[0];
    return { start, end, indent, text: c.substring(start, end) };
  }

  // 点条目任意位置 = 编辑；右上角 ↗ 或 ⌘/Ctrl+点 = 跳到原文（原来的行为）
  addEditButton(m, ctx) {
    const file = m.parentDom && m.parentDom.file;
    if (!file || file.extension !== "md") return;
    m.__bdCtx = ctx;
    const btn = createDiv({ cls: "bd-jump-btn clickable-icon", attr: { "aria-label": t("jumpTip") } });
    setIcon(btn, "lucide-arrow-up-right");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.openAt(file, this.hitLine(m), Keymap.isModEvent(e));
    });
    m.el.appendChild(btn);
    m.el.addClass("bd-click-edit");
    m.el.__bdMatch = m;   // 点击由 onMatchClick 在 document 上统一接
  }

  // 捕获阶段先拦下，preventDefault 后原来的「跳到原文」处理器会自己跳过
  onMatchClick(e) {
    const t = e.target;
    const el = t && t.closest && t.closest(".bd-click-edit");
    const m = el && el.__bdMatch;
    const file = m && m.parentDom && m.parentDom.file;
    if (!file || m.el !== el) return;
    // Shift 点空白处 = 把这一块的原文在右侧栏叠放一页（点链接/按钮等交给它们自己的处理器）
    if (S.shiftStack && e.button === 0 && e.shiftKey && !e.metaKey && !e.ctrlKey) {
      if (t.closest(".bd-jump-btn, .bd-expand, .bd-ctl, .search-result-hover-button, .search-result-file-match-replace-button, .bd-crumbs a, .bd-crumb, .bd-md a, .bd-md input, .bd-refcount")) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      this.openStackedFile(file, this.offsetToLine(m, (m.__bdRange || {}).start));
      return;
    }
    if (m.el.hasClass("bd-editing")) return;
    // ⌘ 点空白处 = 跳到原文（新标签），居中并选中命中的那一行；链接、面包屑等交给它们自己的处理器
    if (e.button === 0 && (e.metaKey || e.ctrlKey)) {
      if (t.closest(".bd-jump-btn, .bd-expand, .bd-ctl, .search-result-hover-button, .search-result-file-match-replace-button, .bd-crumbs, .bd-md a, .bd-md input, .bd-refcount")) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      this.openAt(file, this.hitLine(m), Keymap.isModEvent(e));
      return;
    }
    if (!S.inlineEdit) return;
    if (e.button !== 0) return;
    // 链接、标签、复选框、面包屑、「链接」按钮各有各的处理，不进编辑
    if (t.closest(".bd-jump-btn, .bd-expand, .bd-ctl, .search-result-hover-button, .search-result-file-match-replace-button, .bd-crumbs, .bd-md a, .bd-md input")) return;
    e.preventDefault();
    const sel = (e.view || window).getSelection();
    if (sel && !sel.isCollapsed && m.el.contains(sel.anchorNode)) return;   // 在选文字，不进编辑
    this.startEdit(m, m.__bdCtx);
  }

  startEdit(m, ctx) {
    const file = m.parentDom.file;
    const range = this.editRange(m, ctx);
    const ind = range.indent;
    // 去掉整体缩进再给你编辑，保存时加回去
    const shown = range.text.split("\n").map((l) => (l.startsWith(ind) ? l.slice(ind.length) : l)).join("\n");

    const keep = new Set([m.showMoreBeforeEl, m.showMoreAfterEl]);
    for (const n of Array.from(m.el.childNodes)) if (!keep.has(n)) n.remove();
    m.__bdToken = (m.__bdToken || 0) + 1;   // 作废还没画完的渲染
    m.el.addClass("bd-editing");
    const wrap = m.el.createDiv({ cls: "bd-edit" });
    const ta = wrap.createEl("textarea", { cls: "bd-edit-input" });
    ta.value = shown;
    ta.spellcheck = false;
    if (S.pairWrap) watchPairWrap(ta);
    const bar = wrap.createDiv({ cls: "bd-edit-bar" });
    bar.createSpan({ cls: "bd-edit-hint", text: t("editHint") });
    const cancelBtn = bar.createEl("button", { text: t("cancel") });
    const saveBtn = bar.createEl("button", { cls: "mod-cta", text: t("save") });

    const scroll = m.parentDom.parentDom && m.parentDom.parentDom.infinityScroll;
    const grow = () => {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + 2 + "px";
      if (scroll) scroll.invalidate(m);
    };
    // 编辑框里的点击、按键都不要冒泡到结果条目（否则会跳走或触发面板快捷键）
    for (const type of ["click", "mousedown", "mouseup", "dblclick", "contextmenu", "keydown", "keyup", "keypress"]) {
      wrap.addEventListener(type, (e) => { e.stopPropagation(); if (type === "click" && e.target !== ta) e.preventDefault(); });
    }
    // 结果条目上的 click 处理器挂在 m.el 上，会看 defaultPrevented；编辑框的 click 已经被 stopPropagation 挡住了
    const doc = m.el.ownerDocument || document;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      doc.removeEventListener("mousedown", onOutside, true);
      m.el.removeClass("bd-editing");
      m.render();
    };
    // 编辑中点了框外任何地方：没改过就取消，改过就自动保存（保存失败会留在编辑状态）
    const onOutside = (e) => {
      if (!m.el.isConnected) { doc.removeEventListener("mousedown", onOutside, true); return; }
      if (saving || m.el.contains(e.target)) return;
      if (ta.value === shown) finish();
      else save();
    };
    let saving = false;
    setTimeout(() => { if (!done) doc.addEventListener("mousedown", onOutside, true); }, 0);
    const save = async () => {
      saveBtn.disabled = cancelBtn.disabled = true;
      saving = true;
      const next = ta.value.replace(/\s+$/, "").split("\n").map((l) => (l.length ? ind + l : l)).join("\n");
      try {
        let changed = false;
        await this.app.vault.process(file, (data) => {
          let at = -1;
          if (data.substring(range.start, range.end) === range.text) at = range.start;
          else {
            const first = data.indexOf(range.text);
            if (first >= 0 && data.indexOf(range.text, first + 1) < 0) at = first;
          }
          if (at < 0) throw new Error(t("sourceChanged"));
          changed = next !== range.text;
          return data.substring(0, at) + next + data.substring(at + range.text.length);
        });
        if (changed) {
          // 反链稍后会按新内容自动刷新；先把本条的内容就地更新
          m.content = m.content.substring(0, range.start) + next + m.content.substring(range.end);
          const delta = next.length - range.text.length;
          if (m.end >= range.end) m.end += delta;
          else m.end = Math.min(m.end, range.start + next.length);
          m.matches = (m.matches || []).filter(([a, b]) => b <= range.start || a >= range.end).map(([a, b]) => (a >= range.end ? [a + delta, b + delta] : [a, b]));
          const cache = this.app.metadataCache.getFileCache(file);
          if (cache) m.cache = cache;
          new Notice(t("savedTo", file.basename));
        }
        finish();
      } catch (e) {
        console.error("[roam-backlinks] save", e);
        new Notice(t("notSaved", e.message), 6000);
        saveBtn.disabled = cancelBtn.disabled = false;
        saving = false;
      }
    };
    saveBtn.addEventListener("click", (e) => { e.preventDefault(); save(); });
    cancelBtn.addEventListener("click", (e) => { e.preventDefault(); finish(); });
    const toggleWrap = (mark) => {
      const v = ta.value, a = ta.selectionStart, b = ta.selectionEnd, ml = mark.length, sel = v.substring(a, b);
      if (sel.length >= ml * 2 && sel.startsWith(mark) && sel.endsWith(mark)) {
        // 选区两端就是记号：去掉（再按一次取消）
        const inner = sel.slice(ml, -ml);
        ta.value = v.substring(0, a) + inner + v.substring(b);
        ta.selectionStart = a; ta.selectionEnd = a + inner.length;
      } else if (v.substring(a - ml, a) === mark && v.substring(b, b + ml) === mark) {
        // 记号在选区外侧：也当作取消
        ta.value = v.substring(0, a - ml) + sel + v.substring(b + ml);
        ta.selectionStart = a - ml; ta.selectionEnd = b - ml + sel.length;
      } else {
        ta.value = v.substring(0, a) + mark + sel + mark + v.substring(b);
        ta.selectionStart = a + ml; ta.selectionEnd = a + ml + sel.length;
      }
      grow();
    };
    ta.addEventListener("keydown", (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "Enter") { e.preventDefault(); save(); }
      else if (mod && (e.key === "s" || e.key === "S")) { e.preventDefault(); save(); }
      else if (mod && !e.shiftKey && (e.key === "b" || e.key === "B")) { e.preventDefault(); toggleWrap("**"); }
      else if (mod && !e.shiftKey && (e.key === "i" || e.key === "I")) { e.preventDefault(); toggleWrap("*"); }
      else if (mod && e.shiftKey && (e.key === "h" || e.key === "H")) { e.preventDefault(); toggleWrap("=="); }
      else if (mod && (e.key === "e" || e.key === "E")) { e.preventDefault(); toggleWrap("`"); }
      else if (e.key === "Escape") { e.preventDefault(); finish(); }
      else if (e.key === "Tab") {
        // Tab / ⇧Tab 调整所选行的缩进
        e.preventDefault();
        const v = ta.value, a = ta.selectionStart, b = ta.selectionEnd;
        const ls = v.lastIndexOf("\n", a - 1) + 1;
        const block = v.substring(ls, b);
        const out = e.shiftKey ? block.replace(/^\t/gm, "") : block.replace(/^/gm, "\t");
        ta.value = v.substring(0, ls) + out + v.substring(b);
        const d = out.length - block.length;
        ta.selectionStart = Math.max(ls, a + (e.shiftKey ? (block.startsWith("\t") ? -1 : 0) : 1));
        ta.selectionEnd = b + d;
        grow();
      }
    });
    ta.addEventListener("input", grow);
    // 长行会折行：面板宽度变了（拖侧栏、开关限制行宽）就重新算高度；编辑框移出页面后自动停掉
    if (typeof ResizeObserver === "function") {
      let lastW = 0;
      const ro = new ResizeObserver(() => {
        if (!ta.isConnected) { ro.disconnect(); return; }
        if (ta.clientWidth !== lastW) { lastW = ta.clientWidth; grow(); }
      });
      ro.observe(ta);
    }
    grow();
    ta.focus();
  }

  // 把一段以某个缩进开头的多行文本整体挪到新的层级
  reindent(text, oldIndent, depth) {
    const pad = "\t".repeat(depth);
    return text.split("\n").map((l) => pad + (l.startsWith(oldIndent) ? l.slice(oldIndent.length) : l.replace(/^[ \t]+/, ""))).join("\n");
  }

  // 命中块本身（连同子块 / 整节）按 Markdown 渲染；母块不再画成列表，改在上方的面包屑里
  renderMarkdown(m, ctx, range, crumbEl) {
    const content = m.content;
    let lines, folded = 0, foldable = false, line0 = -1, tree = null;
    m.__bdLineMap = null;
    if (ctx && (m.__bdRoot != null || m.start === ctx.lineStart(ctx.item))) {
      const indent = content.substring(ctx.lineStart(ctx.item), ctx.item.position.start.offset);
      tree = S.foldChildren ? this.foldedList(m, ctx, range) : null;
      lines = this.reindent(tree ? tree.text : content.substring(range.start, range.end), indent, 0).split("\n");
      line0 = ctx.item.position.start.line;
      if (tree) m.__bdLineMap = tree.map;
    } else if (ctx) {
      // 没开「更多上下文」时只截了一行里的一段
      let t = content.substring(m.start, m.end).trim().replace(/\n[ \t]*/g, " ");
      if (!/^([-*+]|\d+[.)])\s/.test(t)) t = "- " + t;
      lines = [t];
    } else {
      let s = range.start;
      while (s < range.end && /\s/.test(content[s])) s++;
      lines = content.substring(s, range.end).split("\n");
      if (s === 0 || content[s - 1] === "\n") line0 = content.substring(0, s).split("\n").length - 1;
    }
    // 子块太长先折叠（列表块已经按子块结构折叠了，不再按行数）
    if (!tree && S.foldLines > 0 && lines.length > S.foldLines + 1) {
      foldable = true;
      if (!m.__bdExpanded) {
        folded = lines.length - S.foldLines;
        lines = lines.slice(0, S.foldLines);
      }
    }
    const md = lines.join("\n");
    m.__bdLine0 = line0;   // 渲染结果第 0 行对应原文的行号（复选框写回用），-1 = 对不上

    // 保留原来的「更多上下文」悬浮按钮和「提到当前文件」的「链接」按钮，其余换成渲染结果
    const keep = new Set([m.showMoreBeforeEl, m.showMoreAfterEl]);
    for (const n of Array.from(m.el.childNodes)) {
      if (keep.has(n) || (n.classList && n.classList.contains("search-result-file-match-replace-button"))) continue;
      n.remove();
    }
    const box = createDiv({ cls: "bd-md markdown-rendered" });
    m.el.insertBefore(box, m.el.firstChild);
    if (crumbEl) m.el.insertBefore(crumbEl, box);
    if (foldable) {
      const tog = createDiv({ cls: "bd-expand", text: folded ? t("showMoreLines", folded) : t("collapse") });
      tog.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        m.__bdExpanded = !!folded;
        m.render();
      });
      box.after(tog);
    }

    this.dropMatchComp(m);
    const comp = (m.__bdComp = this.addChild(new Component()));
    this.matchComps.add(m);
    this.sweepSoon();
    const token = (m.__bdToken = (m.__bdToken || 0) + 1);
    const sourcePath = m.parentDom && m.parentDom.file ? m.parentDom.file.path : "";
    MarkdownRenderer.render(this.app, md, box, sourcePath, comp).then(() => {
      if (m.__bdToken !== token) return;
      if (tree) this.bindFoldMarks(m, box, tree.marks);
      this.afterRender(m, box, sourcePath);
      const scroll = m.parentDom && m.parentDom.parentDom && m.parentDom.parentDom.infinityScroll;
      if (scroll) scroll.invalidate(m);
    }).catch((e) => console.error("[roam-backlinks] markdown", e));
  }

  // 命中列表项按子块结构挑出要显示的行：自己 + 一级子块（最多 S.childLimit 个，其余收成「…」）；
  // 有子块的一级子块默认只显示自己那几行，行尾挂「…」，点开后它的子块照同样的规则显示。
  // 返回 { text, map, marks }：text 是挑出来的原文行，map[i] = 第 i 行对应的原文行号（-1 = 补出来的「…」行），marks 是要绑定点击的标记，顺序和渲染结果里一致
  foldedList(m, ctx, range) {
    const c = m.content, all = c.split("\n");
    const root = ctx.item, rootLine = root.position.start.line;
    const lastLine = this.offsetToLine(m, range.end);
    const byLine = new Map();
    for (const it of ctx.items) if (!byLine.has(it.position.start.line)) byLine.set(it.position.start.line, it);
    const nodes = [...byLine.values()].filter((it) => it.position.start.line >= rootLine && it.position.start.line <= lastLine)
      .sort((a, b) => a.position.start.line - b.position.start.line);
    const kidsOf = new Map();
    for (const it of nodes) {
      if (it === byLine.get(rootLine) || it.parent < 0) continue;
      if (!kidsOf.has(it.parent)) kidsOf.set(it.parent, []);
      kidsOf.get(it.parent).push(it);
    }
    const lineOf = (it) => it.position.start.line;

    // 一定要露出来的行：子块里链接当前页的地方（母块显示了，它们就不再单独列一条），展开到上一级时原来的命中块
    const need = new Set(), open = new Set();
    const ownerOf = (l) => { let o = null; for (const it of nodes) { if (lineOf(it) > l) break; o = it; } return o; };
    const reveal = (l, self) => {
      const o = ownerOf(l);
      if (!o || lineOf(o) === rootLine) return;
      if (self) open.add(lineOf(o));
      for (let it = o, n = 0; it && lineOf(it) !== rootLine && n < 100; it = byLine.get(it.parent), n++) {
        need.add(lineOf(it));
        if (it !== o) open.add(lineOf(it));
      }
    };
    const comp = m.parentDom && m.parentDom.parentDom && m.parentDom.parentDom.__bdComponent;
    const target = comp && comp.__bdTarget;
    const src = m.parentDom && m.parentDom.file ? m.parentDom.file.path : "";
    if (target && m.cache) {
      for (const l of (m.cache.links || []).concat(m.cache.embeds || [])) {
        const p = l.position;
        if (!p || p.start.offset < range.start || p.start.offset >= range.end) continue;
        const lp = (l.link || "").split("#")[0].split("|")[0].trim();
        const dest = lp && this.app.metadataCache.getFirstLinkpathDest(lp, src);
        if (dest && dest.path === target.path) reveal(p.start.line, false);
      }
    }
    if (m.__bdRoot != null && m.__bdHitLine != null) reveal(m.__bdHitLine, true);

    const fold = (m.__bdFold = m.__bdFold || new Map());   // 手动点过的：行号 → 展开与否
    const more = (m.__bdMore = m.__bdMore || new Set());   // 点过「…」露出全部子块的母块
    const text = [], map = [], marks = [];
    const mark = (cls, label, extra) => `<span class="bd-ctl ${cls}"${extra || ""}>${label}</span>`;
    const walk = (it, depth) => {
      if (depth > 100) return;
      const L = lineOf(it), kids = kidsOf.get(L) || [];
      const isOpen = L === rootLine || (fold.has(L) ? fold.get(L) : open.has(L));
      // 自己的行：到第一个子块之前；没有子块就到下一个块之前；去掉末尾空行
      const next = kids.length ? lineOf(kids[0]) : (nodes.find((x) => lineOf(x) > L) ? lineOf(nodes.find((x) => lineOf(x) > L)) : lastLine + 1);
      let last = Math.min(next - 1, lastLine);
      while (last > L && !all[last].trim()) last--;
      const own = [];
      for (let l = L; l <= last; l++) own.push(l);
      if (kids.length && L !== rootLine) {
        // 「…」挂在自己最后一行末尾（行尾的 ^块ID 之前）；自己那几行里有代码块 / 公式 / 表格时挂在第一行
        const at = own.slice(1).some((l) => /^\s*(```|~~~|\$\$|\|)/.test(all[l])) ? L : last;
        marks.push({ kind: "fold", line: L, open: isOpen });
        const tag = isOpen ? mark("bd-fold-mark is-open", t("collapse"), ` aria-label="${t("collapseChildren")}"`) : mark("bd-fold-mark", "…", ` aria-label="${t("expandChildren", kids.length)}"`);
        for (const l of own) {
          text.push(l === at ? all[l].replace(/(\s+\^[\w-]+)?\s*$/, (t) => " " + tag + t) : all[l]);
          map.push(l);
        }
      } else for (const l of own) { text.push(all[l]); map.push(l); }
      if (!kids.length || !isOpen) return;
      let n = kids.length;
      if (!more.has(L) && n > S.childLimit) {
        let lastNeed = -1;
        kids.forEach((k, i) => { if (need.has(lineOf(k))) lastNeed = i; });
        n = Math.max(S.childLimit, lastNeed + 1);
      }
      for (const k of kids.slice(0, n)) walk(k, depth + 1);
      if (n < kids.length) {
        const pre = all[lineOf(kids[n])].match(/^(\s*)([-*+]|\d+[.)])\s/);
        marks.push({ kind: "more", line: L });
        text.push((pre ? pre[1] + pre[2] : "-") + " " + mark("bd-more-mark", t("moreItems", kids.length - n)));
        map.push(-1);
      }
    };
    walk(byLine.get(rootLine) || root, 0);
    return { text: text.join("\n"), map, marks };
  }

  // 给渲染结果里的「…」接上点击：折叠的子块展开 / 收起，「还有 N 项」露出其余子块
  bindFoldMarks(m, box, marks) {
    const els = box.querySelectorAll(".bd-fold-mark, .bd-more-mark");
    els.forEach((el, i) => {
      const mk = marks[i];
      if (!mk) return;
      const li = el.closest("li");
      if (mk.kind === "more") {
        if (li) li.addClass("bd-more-li");
      } else if (li) li.toggleClass("bd-folded", !mk.open);
      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (mk.kind === "more") m.__bdMore.add(mk.line);
        else m.__bdFold.set(mk.line, !mk.open);
        m.render();
      });
    });
  }

  afterRender(m, box, sourcePath) {
    // 像 Roam 一样：点链接 = 去那一页（⌘点 = 新标签），悬停 = 预览；点其他地方 = 编辑（↗ 跳原文）
    const hoverParent = (m.__bdHover = m.__bdHover || { hoverPopover: null });
    box.querySelectorAll("a").forEach((a) => {
      if (a.hasClass("internal-link")) {
        const target = a.getAttribute("data-href") || a.getAttribute("href") || "";
        a.removeAttribute("href");
        a.removeAttribute("target");
        a.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (S.shiftStack && e.shiftKey) this.openStackedLink(target, sourcePath);
          else this.app.workspace.openLinkText(target, sourcePath, Keymap.isModEvent(e));
        });
        a.addEventListener("mouseover", (e) => {
          this.app.workspace.trigger("hover-link", { event: e, source: "search", hoverParent, targetEl: a, linktext: target, sourcePath });
        });
      } else if (a.hasClass("tag")) {
        const tag = a.getAttribute("href") || a.textContent || "";
        a.removeAttribute("href");
        a.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const search = this.app.internalPlugins && this.app.internalPlugins.getPluginById("global-search");
          if (search && search.instance) search.instance.openGlobalSearch("tag:" + tag);
        });
      } else {
        // 外部链接照常在浏览器打开，只是别让它冒泡成「编辑」或「跳原文」
        a.addEventListener("click", (e) => e.stopPropagation());
      }
    });
    // 复选框可以直接勾（写回原文那一行）；行号对不上时禁用
    box.querySelectorAll("input.task-list-item-checkbox").forEach((cb) => {
      const holder = cb.closest("[data-line]");
      const rel = parseInt(cb.getAttribute("data-line") || (holder && holder.getAttribute("data-line")), 10);
      // 按子块结构折叠时渲染的行和原文不连续，按对照表找原文行号
      const src = m.__bdLineMap ? (m.__bdLineMap[rel] ?? -1) : m.__bdLine0 < 0 ? -1 : m.__bdLine0 + rel;
      if (src < 0 || isNaN(rel)) { cb.disabled = true; return; }
      cb.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleTask(m.parentDom.file, src);
      });
    });
    box.querySelectorAll("input:not(.task-list-item-checkbox)").forEach((i) => { i.disabled = true; });

    // 高亮命中：双链按目标文件比对，其余按文字比对
    const mc = this.app.metadataCache;
    const hitFiles = new Set();
    const hitTexts = [];
    for (const [s, e] of m.matches || []) {
      const raw = m.content.substring(s, e);
      const lk = raw.match(/^\[\[([^\]|#^]*)/) || raw.match(/^\[[^\]]*\]\(([^)#\s]*)/);
      if (lk) {
        const f = mc.getFirstLinkpathDest(decodeURIComponent(lk[1]).trim(), sourcePath);
        if (f) hitFiles.add(f.path);
      } else if (raw.trim()) hitTexts.push(raw);
    }
    if (hitFiles.size) {
      box.querySelectorAll("a.internal-link").forEach((a) => {
        const href = (a.getAttribute("data-href") || "").split(/[#|]/)[0];
        const f = mc.getFirstLinkpathDest(href, sourcePath);
        if (f && hitFiles.has(f.path)) a.addClass("search-result-file-matched-text");
      });
    }
    if (hitTexts.length) this.highlightText(box, hitTexts);
  }

  async toggleTask(file, line) {
    try {
      await this.app.vault.process(file, (data) => {
        const ls = data.split("\n");
        const mt = ls[line] !== undefined && ls[line].match(/^(\s*(?:[-*+]|\d+[.)])\s+\[)(.)(\])/);
        if (!mt) throw new Error(t("lineChanged"));
        ls[line] = mt[1] + (mt[2] === " " ? "x" : " ") + mt[3] + ls[line].slice(mt[0].length);
        return ls.join("\n");
      });
    } catch (e) {
      new Notice(t("notToggled", e.message), 5000);
    }
  }

  highlightText(root, texts) {
    const lower = texts.map((t) => t.toLowerCase());
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      let text = node.nodeValue, cur = node;
      for (;;) {
        const low = text.toLowerCase();
        let best = -1, len = 0;
        lower.forEach((t) => { const i = low.indexOf(t); if (i >= 0 && (best < 0 || i < best)) { best = i; len = t.length; } });
        if (best < 0) break;
        const hit = cur.splitText(best);
        const rest = hit.splitText(len);
        const span = createSpan({ cls: "search-result-file-matched-text", text: hit.nodeValue });
        hit.replaceWith(span);
        cur = rest; text = rest.nodeValue;
      }
    }
  }

  // ---------- 导出 PDF 时带上「链接到当前文件」 ----------

  // 自带的导出对话框是内部类，拿不到；在 MarkdownView.printToPdf 新建并打开它的那一刻接住这个实例
  patchPdfExport() {
    const proto = MarkdownView && MarkdownView.prototype;
    if (!proto || typeof proto.printToPdf !== "function" || !Modal) return;
    const plugin = this, orig = proto.printToPdf;
    proto.printToPdf = function (...args) {
      const origOpen = Modal.prototype.open;
      Modal.prototype.open = function (...a) {
        Modal.prototype.open = origOpen;
        try { plugin.enhancePdfModal(this); } catch (e) { console.error("[roam-backlinks] pdf modal", e); }
        return origOpen.apply(this, a);
      };
      try { return orig.apply(this, args); } finally { Modal.prototype.open = origOpen; }
    };
    this.register(() => { proto.printToPdf = orig; });
  }

  enhancePdfModal(modal) {
    if (typeof modal.print !== "function" || !modal.file) return;   // 不是导出 PDF 的对话框
    if (!S.pdfBacklinksEnabled && !S.pdfStyle) return;
    modal.__bdBacklinks = !!(S.pdfBacklinksEnabled && this.settings.pdfBacklinks);
    if (S.pdfBacklinksEnabled) {
      const count = this.collectBacklinkFiles(modal.file).length;
      new Setting(modal.contentEl)
        .setName(t("pdfInclude"))
        .setDesc(count ? t("pdfIncludeDesc", count) : t("pdfNoBacklinks"))
        .addToggle((tg) => tg.setValue(modal.__bdBacklinks).setDisabled(!count).onChange((v) => {
          modal.__bdBacklinks = v;
          this.settings.pdfBacklinks = v;
          this.saveData(this.settings);
        }));
    }
    const styled = S.pdfStyle;
    if (styled) this.addPdfStyleSettings(modal);
    const origPrint = modal.print;
    const plugin = this;
    modal.print = async function (el, comp, includeName) {
      if (styled) plugin.applyPdfStyle(el);
      const body = await origPrint.call(this, el, comp, includeName);
      if (this.__bdBacklinks) {
        try { await plugin.appendPrintBacklinks(body || el, this.file, comp); }
        catch (e) { console.error("[roam-backlinks] pdf backlinks", e); new Notice(t("pdfBacklinksFailed")); }
      }
      return body;
    };
  }

  addPdfStyleSettings(modal) {
    const st = this.settings, save = () => this.saveData(st);
    const el = modal.contentEl;
    new Setting(el).setName(t("pdfLayout")).setHeading();
    const rows = [];
    new Setting(el)
      .setName(t("pdfPretty"))
      .setDesc(t("pdfPrettyDesc"))
      .addToggle((t) => t.setValue(st.pdfPretty).onChange((v) => { st.pdfPretty = v; save(); rows.forEach((r) => r.settingEl.toggle(v)); }));
    const fonts = this.availablePdfFonts();
    const fontDropdown = (key) => (d) => {
      d.addOption("", t("followObsidian"));
      for (const [en, zh, stack] of fonts) d.addOption(stack, LANG === "zh" ? zh : en);
      if (st[key] && !fonts.some((f) => f[2] === st[key])) st[key] = "";   // 之前选的字体已经不在了
      d.setValue(st[key]).onChange((v) => { st[key] = v; save(); });
    };
    rows.push(new Setting(el).setName(t("bodyFont")).addDropdown(fontDropdown("pdfFont")));
    rows.push(new Setting(el).setName(t("headFont")).setDesc(t("headFontDesc")).addDropdown(fontDropdown("pdfHeadFont")));
    rows.push(new Setting(el).setName(t("fontSize")).addDropdown((d) => {
      for (const k in PDF_SIZES) d.addOption(k, `${t("sizes")[k]} (${PDF_SIZES[k]})`);
      d.setValue(st.pdfSize).onChange((v) => { st.pdfSize = v; save(); });
    }));
    rows.push(new Setting(el).setName(t("accent")).setDesc(t("accentDesc")).addColorPicker((c) =>
      c.setValue(st.pdfAccent).onChange((v) => { st.pdfAccent = v; save(); })));
    rows.forEach((r) => r.settingEl.toggle(st.pdfPretty));
  }

  // 本机装了哪些候选字体：同一段文字，用「这个字体, 兜底字体」和只用兜底字体各量一次宽度，不一样就是装了
  availablePdfFonts() {
    if (this._pdfFonts) return this._pdfFonts;
    const ctx = document.createElement("canvas").getContext("2d");
    const sample = "永和九年岁在癸丑 The quick brown fox 0123";
    const width = (font) => { ctx.font = "40px " + font; return ctx.measureText(sample).width; };
    const has = (family) => ["monospace", "serif", "sans-serif"].some((fb) => width(`${family}, ${fb}`) !== width(fb));
    this._pdfFonts = PDF_FONTS.filter((f) => has(f[2].split(",")[0].trim()));
    return this._pdfFonts;
  }

  // 导出窗口里的 .print 容器：挂上样式和变量（只影响这次导出的 PDF）
  applyPdfStyle(el) {
    const st = this.settings;
    if (!st.pdfPretty) return;
    // 样式在 styles.css 里（都挂在 .print.bd-pdf 下面），这里只加类和变量
    el.classList.add("bd-pdf");
    el.style.setProperty("--bd-accent", st.pdfAccent || "#3a6ea5");
    el.style.setProperty("--bd-size", PDF_SIZES[st.pdfSize] || PDF_SIZES.medium);
    if (st.pdfFont) el.style.setProperty("--bd-font", st.pdfFont);
    if (st.pdfHeadFont) el.style.setProperty("--bd-head-font", st.pdfHeadFont);
  }

  // 链接到 target 的笔记，按反链面板的顺序
  collectBacklinkFiles(target) {
    const rl = this.app.metadataCache.resolvedLinks || {};
    const files = [];
    for (const src in rl) {
      if (src === target.path || !rl[src][target.path]) continue;
      if (sepFolder() && src.startsWith(sepFolder())) continue;
      const f = this.app.vault.getAbstractFileByPath(src);
      if (f && f.extension === "md") files.push(f);
    }
    const rel = new Map();
    const relOf = (f) => { if (!rel.has(f.path)) rel.set(f.path, this.relation(f, target.path)); return rel.get(f.path); };
    return files.sort((a, b) => {
      const da = this.journalDate(a), db = this.journalDate(b);
      if (!da !== !db) return da ? 1 : -1;
      if (da) return db.key - da.key;
      return relOf(b).score - relOf(a).score || a.basename.localeCompare(b.basename, LANG);
    });
  }

  // 一篇笔记里指向 target 的每一处引用所在的块：{ start, end, indent, crumbs }，按位置排好、去掉被别的块包住的
  backlinkBlocks(content, cache, src, target) {
    const mc = this.app.metadataCache;
    const hits = [...(cache.links || []), ...(cache.embeds || [])]
      .filter((l) => { const d = mc.getFirstLinkpathDest(getLinkpath(l.link), src.path); return d && d.path === target.path; })
      .map((l) => l.position.start.offset)
      .sort((a, b) => a - b);
    const items = cache.listItems || [];
    const lineStart = (it) => it.position.start.offset - it.position.start.col;
    const byLine = new Map();
    for (const it of items) if (!byLine.has(it.position.start.line)) byLine.set(it.position.start.line, it);
    const firstLine = (it) => content.substring(it.position.start.offset, it.position.end.offset).split("\n")[0]
      .replace(/^\s*([-*+]|\d+[.)])\s+(\[.\]\s+)?/, "");
    const blocks = [];
    for (const off of hits) {
      let item = null;
      for (const it of items) { if (lineStart(it) > off) break; if (off <= it.position.end.offset) item = it; }
      let b;
      if (item) {
        item = byLine.get(item.position.start.line) || item;
        // 子块：紧跟在后面、祖先里有它的列表项
        const inTree = new Set([item.position.start.line]);
        let end = item.position.end.offset;
        for (const it of items) {
          if (it.position.start.line <= item.position.start.line) continue;
          if (!inTree.has(it.parent)) break;
          inTree.add(it.position.start.line);
          end = Math.max(end, it.position.end.offset);
        }
        const crumbs = [], seen = new Set([item.position.start.line]);
        for (let p = item.parent; p >= 0 && byLine.has(p) && !seen.has(p); p = byLine.get(p).parent) { seen.add(p); crumbs.unshift(firstLine(byLine.get(p))); }
        const start = lineStart(item);
        b = { start, end, indent: content.substring(start, item.position.start.offset), crumbs };
      } else {
        const secs = cache.sections || [];
        const sec = secs.find((x) => x.position.start.offset <= off && off <= x.position.end.offset);
        if (!sec) continue;
        let end = sec.position.end.offset;
        if (sec.type === "heading") {
          // 标题行：连同整节
          const h = (cache.headings || []).find((x) => x.position.start.offset === sec.position.start.offset);
          const next = h && (cache.headings || []).find((x) => x.position.start.offset > h.position.start.offset && x.level <= h.level);
          end = next ? next.position.start.offset : content.length;
        }
        b = { start: sec.position.start.offset, end, indent: "", crumbs: [] };
      }
      if (sec0(cache, b.start)) b.crumbs.unshift(...sec0(cache, b.start));
      const last = blocks[blocks.length - 1];
      if (last && b.start >= last.start && b.end <= last.end) continue;   // 已经包在上一块里
      blocks.push(b);
    }
    return blocks;
    // 块所在的标题层级（面包屑最前面）
    function sec0(cache, at) {
      if (!S.crumbHeadings) return null;
      const stack = [];
      for (const h of cache.headings || []) {
        if (h.position.start.offset >= at) break;
        while (stack.length && stack[stack.length - 1].level >= h.level) stack.pop();
        stack.push(h);
      }
      return stack.length ? stack.map((h) => h.heading) : null;
    }
  }

  async appendPrintBacklinks(el, target, comp) {
    const files = this.collectBacklinkFiles(target);
    if (!files.length) return;
    const plain = (t) => t.replace(/\s\^[\w-]+\s*$/, "").replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2").replace(/\[\[([^\]]+)\]\]/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/(\*\*|__|==|~~)/g, "").trim();
    const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const parts = [];
    for (const f of files) {
      const cache = this.app.metadataCache.getFileCache(f);
      if (!cache) continue;
      const content = await this.app.vault.cachedRead(f);
      const blocks = this.backlinkBlocks(content, cache, f, target);
      const fmKeys = this.relation(f, target.path).fmKeys;
      if (!blocks.length && !fmKeys.length) continue;
      parts.push(`### [[${f.path.replace(/\.md$/, "")}|${f.basename}]]`);
      if (fmKeys.length) parts.push(`<div class="bd-print-crumbs">${esc(t("printFmLinks", fmKeys))}</div>`);
      for (const b of blocks) {
        if (b.crumbs.length) parts.push(`<div class="bd-print-crumbs">${esc(b.crumbs.map(plain).join(" › "))}</div>`);
        const text = this.reindent(content.substring(b.start, b.end), b.indent, 0)
          .split("\n").map((l) => l.replace(/\s\^[\w-]+\s*$/, "")).join("\n").replace(/\s+$/, "");
        parts.push(text);
      }
    }
    if (!parts.length) return;
    const n = files.length;
    const md = "## " + t("printHeading", n) + "\n\n" + parts.join("\n\n");
    const box = el.createDiv({ cls: "bd-print-backlinks markdown-preview-view markdown-rendered" });
    box.createEl("hr");
    await MarkdownRenderer.render(this.app, md, box, target.path, comp);
    await new Promise((r) => setTimeout(r, 300));   // 等嵌入、图片之类的后处理
    box.querySelectorAll("a.internal-link").forEach((a) => a.removeAttribute("href"));
  }

  // ---------- 排序：页面按关系紧密度，日记按日期并按月 / 年分段 ----------
  // 日记：设置里填了文件夹 / 日期格式就用它，没填就读核心插件「日记」的设置
  journalConfig() {
    let folder = String(S.journalFolder || "").trim(), format = String(S.journalFormat || "").trim();
    if (!folder && !format) {
      try {
        const dn = this.app.internalPlugins && this.app.internalPlugins.getPluginById("daily-notes");
        const o = dn && dn.instance && dn.instance.options;
        if (o) { folder = o.folder || ""; format = o.format || ""; }
      } catch (e) { /* 没有日记插件 */ }
    }
    return { folder: folder.replace(/^\/+|\/+$/g, ""), format: format || "YYYY-MM-DD" };
  }
  journalDate(file) {
    if (!file || file.extension !== "md") return null;
    const { folder, format } = this.journalConfig();
    const path = file.path.replace(/\.md$/, "");
    if (folder && !path.startsWith(folder + "/")) return null;
    // 日期格式里带 / 的（比如 YYYY/MM/YYYY-MM-DD）按文件夹下的相对路径解析，否则按文件名
    const name = format.includes("/") ? (folder ? path.slice(folder.length + 1) : path) : file.basename;
    const d = moment(name, format, true);
    if (!d.isValid()) return null;
    const y = d.year(), mo = d.month() + 1;
    return { y, mo, key: y * 10000 + mo * 100 + d.date() };
  }

  // 页面 src 和当前页 target 的关系紧密度，以及显示用的理由
  relation(srcFile, target) {
    const rl = this.app.metadataCache.resolvedLinks || {};
    const n = (rl[srcFile.path] && rl[srcFile.path][target]) || 0;
    const mutual = !!(rl[target] && rl[target][srcFile.path]);
    const fmKeys = [];
    const cache = this.app.metadataCache.getFileCache(srcFile);
    for (const l of (cache && cache.frontmatterLinks) || []) {
      const lp = (l.link || "").split("#")[0].split("|")[0].trim();
      const dest = lp && this.app.metadataCache.getFirstLinkpathDest(lp, srcFile.path);
      if (dest && dest.path === target) { const k = String(l.key || "").split(".")[0]; if (k && !fmKeys.includes(k)) fmKeys.push(k); }
    }
    const score = (mutual ? 1000 : 0) + (fmKeys.length ? 500 : 0) + n;
    const why = [];
    if (mutual) why.push(t("whyMutual"));
    if (fmKeys.length) why.push(t("whyProp", fmKeys));
    if (n > 1) why.push(t("whyCount", n));
    return { score, why, fmKeys };
  }

  // 给结果列表换上自己的比较函数（原生 onChange 只是按 sortOrder 排 vChildren 再刷新滚动）
  hookSort(dom) {
    if (dom.__bdSorted) return;
    const v = dom.vChildren;
    if (!this.shapeOk("sort", v && typeof v.sort === "function" && typeof v.hasChildren === "function" && dom.emptyStateEl
      && dom.infinityScroll && typeof dom.infinityScroll.queueCompute === "function", "backlinks result list")) return;
    dom.__bdSorted = true;
    this.undoOn(dom, () => {
      delete dom.onChange; delete dom.__bdSorted; delete dom.__bdSortChanged;
      this.eachFileDom(dom, (fd) => { fd.el.querySelectorAll(":scope > .bd-heads").forEach((x) => x.remove()); fd.el.removeClass("bd-year-fold", "bd-year-hidden"); });
      try { dom.onChange(); } catch (e) { /* 面板已关 */ }
    });
    const plugin = this;
    dom.onChange = function () {
      const c = this.__bdComponent;
      const target = (c && c.__bdTargetPath) || "";
      const rel = new Map();
      const relOf = (f) => { let r = rel.get(f.path); if (!r) { r = plugin.relation(f, target); rel.set(f.path, r); } return r; };
      this.vChildren.sort((a, b) => {
        const da = plugin.journalDate(a.file), db = plugin.journalDate(b.file);
        if (!da !== !db) return da ? 1 : -1;               // 页面在前，日记在后
        if (da) return db.key - da.key;                    // 日记：日期从新到旧
        return relOf(b.file).score - relOf(a.file).score || a.file.basename.localeCompare(b.file.basename, LANG);
      });
      if (this.vChildren.hasChildren() || this.working) this.emptyStateEl.detach(); else this.el.appendChild(this.emptyStateEl);
      plugin.markSections(this, relOf);
      this.infinityScroll.queueCompute();
    };
    dom.__bdSortChanged = debounce(() => dom.onChange(), 0);
    dom.onChange();
  }

  // 在条目上方挂分段标题：「页面 · N」「日记 · N」「2026 年 9 月 · N」「2024 年 · N（点开）」
  markSections(dom, relOf) {
    const c = dom.__bdComponent;
    const st = c && c.__bd;
    const open = (st && (st.yearOpen || (st.yearOpen = new Set()))) || new Set();
    const now = new Date();
    const cutoff = (now.getFullYear() * 12 + now.getMonth()) - (S.recentMonths - 1);   // 最近 12 个月（含本月）
    const kids = dom.vChildren._children || [];
    const info = kids.map((fd) => {
      const d = this.journalDate(fd.file);
      if (!d) return { fd, kind: "page" };
      const recent = d.y * 12 + (d.mo - 1) >= cutoff;
      return { fd, kind: "journal", d, bucket: recent ? `m${d.y}-${d.mo}` : `y${d.y}`, recent };
    });
    const count = (pred) => info.filter(pred).length;
    const pages = count((x) => x.kind === "page"), journals = count((x) => x.kind === "journal");
    let prevKind = null, prevBucket = null;
    for (const x of info) {
      const heads = [];
      if (x.kind !== prevKind) heads.push({ cls: "bd-head-sec", text: x.kind === "page" ? t("secPages", pages) : t("secJournals", journals) });
      let fold = false, hidden = false;
      if (x.kind === "journal") {
        const yearOpen = open.has(x.d.y);
        if (x.bucket !== prevBucket) {
          const n = count((y) => y.bucket === x.bucket);
          if (x.recent) heads.push({ cls: "bd-head-month", text: t("monthHead", x.d.y, x.d.mo, n) });
          else heads.push({ cls: "bd-head-year", text: t("yearHead", x.d.y, n), year: x.d.y, open: yearOpen });
          if (!x.recent && !yearOpen) fold = true;
        } else if (!x.recent && !yearOpen) hidden = true;
        if (!x.recent && yearOpen && x.d.mo !== (prevMonth(x))) heads.push({ cls: "bd-head-month", text: t("monthOnly", x.d.mo) });
      }
      this.renderHeads(dom, x.fd, heads, x.kind === "page" ? relOf(x.fd.file).why : null);
      x.fd.el.toggleClass("bd-year-fold", fold);
      x.fd.el.toggleClass("bd-year-hidden", hidden);
      prevKind = x.kind;
      prevBucket = x.bucket || null;
    }
    // 展开的旧年份里按月再分一层：上一条是同一年同一月就不重复
    function prevMonth(x) {
      const i = info.indexOf(x), p = info[i - 1];
      return p && p.kind === "journal" && p.d.y === x.d.y ? p.d.mo : -1;
    }
  }

  renderHeads(dom, fd, heads, why) {
    fd.el.querySelectorAll(":scope > .bd-heads").forEach((el) => el.remove());
    const title = fd.selfEl;
    title.querySelectorAll(".bd-why").forEach((el) => el.remove());
    if (why && why.length) {
      const w = title.createSpan({ cls: "bd-why", text: why.join(" · ") });
      const inner = title.querySelector(".tree-item-inner");
      if (inner) inner.after(w);
    }
    if (!heads.length) return;
    const box = createDiv({ cls: "bd-heads" });
    for (const h of heads) {
      const el = box.createDiv({ cls: "bd-head " + h.cls, text: h.text });
      if (h.year != null) {
        el.addClass("is-clickable");
        el.toggleClass("is-open", !!h.open);
        el.setAttribute("aria-label", h.open ? t("yearCollapseTip") : t("yearExpandTip"));
        el.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const st = dom.__bdComponent && dom.__bdComponent.__bd;
          if (!st) return;
          const set = st.yearOpen || (st.yearOpen = new Set());
          if (set.has(h.year)) set.delete(h.year); else set.add(h.year);
          dom.onChange();
          if (dom.infinityScroll.invalidateAll) dom.infinityScroll.invalidateAll();
        });
      }
    }
    fd.el.insertBefore(box, fd.el.firstChild);
  }

  // ---------- 共现页面筛选 / 就地文字筛选 ----------
  eachFileDom(dom, cb) {
    for (const fd of (dom && dom.vChildren && dom.vChildren._children) || []) cb(fd);
  }
  eachMatch(dom, cb) {
    this.eachFileDom(dom, (fd) => {
      for (const m of (fd.vChildren && fd.vChildren._children) || []) cb(m, fd);
    });
  }

  // 结果列表每次加/删结果都会调 changed()；包一层，顺便刷新共现统计
  hookChanged(dom) {
    if (dom.__bdHooked || !this.shapeOk("refresh", typeof dom.changed === "function", "result list refresh")) return;
    dom.__bdHooked = true;
    const plugin = this, orig = dom.changed;
    const wrapped = dom.changed = function (...args) {
      // 换了排序时走自己的（原生的 changed 在构造时就绑死了原生 onChange，会按文件名重排、冲掉自定义排序）
      const r = this.__bdSortChanged ? this.__bdSortChanged() : orig.apply(this, args);
      const c = this.__bdComponent;
      if (!plugin.unloaded && c && c.__bd) plugin.refresh(c);
      if (!plugin.unloaded) plugin.sweepSoon();
      return r;
    };
    this.undoOn(dom, () => { if (dom.changed === wrapped) dom.changed = orig; delete dom.__bdHooked; });
  }

  // 反链是懒渲染的：文件条目滚进视口才生成命中条目（vChildren）。共现统计、分组、按文件隐藏都要覆盖全部，
  // 所以没渲染的文件直接用它的原始命中位置（fd.result.content），按 Obsidian 同样的规则切范围、合并
  fileMatches(fd) {
    const kids = (fd.vChildren && fd.vChildren._children) || [];
    if (fd.rendered && kids.length) return kids.filter((m) => !m.__bdDup && typeof m.content === "string");
    return this.virtualMatches(fd);
  }
  virtualMatches(fd) {
    const content = fd.content, file = fd.file;
    const vcomp = fd.parentDom && fd.parentDom.__bdComponent;
    const caseSig = vcomp && vcomp.__bdCaseNames ? [...vcomp.__bdCaseNames].join("\u0001") : "";
    if (fd.__bdVirt && fd.__bdVirt.content === content && fd.__bdVirt.caseSig === caseSig) return fd.__bdVirt.list;
    const list = [];
    const pos = ((fd.result && fd.result.content) || []).slice().sort((a, b) => a[0] - b[0]);
    const cache = file && this.app.metadataCache.getFileCache(file);
    if (typeof content === "string" && cache && pos.length) {
      let i = 0, prev = null;
      while (i < pos.length) {
        let [s, e] = fd.extraContext && typeof fd.getMatchExtraPositions === "function" ? fd.getMatchExtraPositions(content, pos[i], cache) : pos[i];
        let h = i + 1;
        if (!fd.separateMatches) while (h < pos.length) { const q = pos[h]; if (q[0] >= e) break; if (q[1] > e) { e = q[1]; h++; break; } h++; }
        const m = { parentDom: fd, content, cache, start: s, end: e, matches: pos.slice(i, h), __bdVirtual: true };
        const vctx = this.listContext(m);
        m.__bdRange = this.displayRange(m, vctx);
        m.__bdBlockKey = this.blockKey(m, vctx);
        // 和 decorate 一样的合并规则
        if (!this.caseMiss(m, fd) && !this.isDup(m, prev, fd)) { list.push(m); prev = m; }
        i = h;
      }
    }
    fd.__bdVirt = { content, list, caseSig };
    return list;
  }

  // 命中块显示范围内一起出现的其它页面/标签。返回 Map(key -> 显示名)，已排除当前页
  matchPages(m, targetPath) {
    const out = new Map();
    if (!m || !m.cache || typeof m.content !== "string") return out;
    let range = m.__bdRange;
    if (!range) { const ctx = this.listContext(m); range = this.displayRange(m, ctx); }
    const s = range.start, e = range.end;
    const inRange = (p) => p && p.start.offset >= s && p.start.offset < e;
    const src = m.parentDom && m.parentDom.file ? m.parentDom.file.path : "";
    for (const l of (m.cache.links || []).concat(m.cache.embeds || [])) {
      if (!inRange(l.position)) continue;
      const lp = (l.link || "").split("#")[0].split("|")[0].trim();
      if (!lp) continue;   // 同文件的块/标题引用，不算共现
      const dest = this.app.metadataCache.getFirstLinkpathDest(lp, src);
      if (dest) {
        if (dest.path === targetPath || (dest.extension && dest.extension !== "md")) continue;
        out.set("f:" + dest.path, dest.basename);
      } else out.set("l:" + lp, lp);
    }
    for (const t of (m.cache.tags || [])) {
      if (!inRange(t.position)) continue;
      out.set("t:" + t.tag, t.tag);
    }
    return out;
  }

  matchText(m) {
    let range = m.__bdRange;
    if (!range) { const ctx = this.listContext(m); range = this.displayRange(m, ctx); }
    return (m.content || "").substring(range.start, range.end).toLowerCase();
  }

  matchVisible(component, m) {
    const st = component.__bd;
    if (!st) return true;
    if (S.nameFilter && ((st.nameInc && st.nameInc.size) || (st.nameExc && st.nameExc.size))) {
      const forms = this.formsOf(component, m);
      if (st.nameInc.size && ![...forms].some((f) => st.nameInc.has(f))) return false;
      for (const f of forms) if (st.nameExc.has(f)) return false;
    }
    if (st.text && !this.matchText(m).includes(st.text)) return false;
    if (st.words && st.words.size) { const txt = this.matchText(m); for (const w of st.words) if (!txt.includes(w)) return false; }
    if (st.include.size || st.exclude.size) {
      const pages = this.matchPages(m, component.__bdTargetPath);
      for (const k of st.include) if (!pages.has(k)) return false;
      for (const k of st.exclude) if (pages.has(k)) return false;
    }
    return true;
  }

  applyFilter(component) {
    const st = component.__bd;
    if (!st) return;
    const active = !!(st.text || st.include.size || st.exclude.size || (st.nameInc && st.nameInc.size) || (st.nameExc && st.nameExc.size) || (st.words && st.words.size));
    for (const dom of [component.backlinkDom, component.unlinkedDom]) {
      if (!dom) continue;
      this.eachFileDom(dom, (fd) => {
        if (this.isWiki(fd)) {
          const it = fd.selfEl && (fd.selfEl.closest(".tree-item") || fd.selfEl);
          if (it) it.addClass("bd-hidden");
          return;
        }
        let anyVisible = false;
        for (const m of (fd.vChildren && fd.vChildren._children) || []) {
          if (!m.el || m.__bdDup) continue;
          const vis = this.matchVisible(component, m);
          m.el.toggleClass("bd-hidden", !vis);
          if (vis) anyVisible = true;
        }
        // 还没渲染的文件：按原始命中判断整个文件要不要藏
        if (!(fd.rendered && fd.vChildren && fd.vChildren._children.length)) anyVisible = this.virtualMatches(fd).some((m) => this.matchVisible(component, m));
        const item = fd.selfEl && (fd.selfEl.closest(".tree-item") || fd.selfEl);
        // 开了大小写敏感：「提到当前文件名」里一条都对不上的文件整个藏起来
        if (item) item.toggleClass("bd-hidden", !anyVisible && (active || !!(fd.separateMatches && component.__bdCaseNames)));
      });
    }
  }

  refresh(component) {
    clearTimeout(component.__bdTimer);
    component.__bdTimer = setTimeout(() => this.refreshNow(component), 120);
  }
  refreshNow(component) {
    if (!component.__bd) return;
    try {
      const data = (S.showCooccur || S.groupBacklinks) ? this.collectCooccur(component) : null;
      if (sepFolder()) this.renderWikiLinks(component);
      if (S.nameFilter) this.refreshNameChips(component);
      if (S.showCooccur) this.refreshChips(component, data);
      if (S.groupBacklinks) this.renderGroups(component, data);
      if (S.wordStats) this.refreshWords(component);
      this.applyFilter(component);
    } catch (e) { console.error("[roam-backlinks] filter", e); }
  }

  // 扫一遍反链命中，得到每个共现页的次数，以及每条命中带哪些共现页（分组复用）
  collectCooccur(component) {
    const counts = new Map();
    const items = [];
    this.eachFileDom(component.backlinkDom, (fd) => { if (this.isWiki(fd)) return; for (const m of this.fileMatches(fd)) {
      const pages = this.matchPages(m, component.__bdTargetPath);
      for (const [k, label] of pages) {
        const e = counts.get(k) || { label, count: 0 };
        e.count++; counts.set(k, e);
      }
      items.push({ m, pages });
    } });
    return { counts, items };
  }

  // 每页被引用总数（idf 的分母），从 resolvedLinks 反向汇总，缓存
  pageDf(path) {
    if (!this._df) {
      this._df = new Map();
      const rl = this.app.metadataCache.resolvedLinks || {};
      for (const src in rl) { const t = rl[src]; for (const tgt in t) this._df.set(tgt, (this._df.get(tgt) || 0) + t[tgt]); }
    }
    return this._df.get(path) || 0;
  }
  keyDf(key) {
    if (key[0] === "t") { if (!this._tags) this._tags = (this.app.metadataCache.getTags && this.app.metadataCache.getTags()) || {}; return this._tags[key.slice(2)] || 0; }
    if (key[0] === "f") return this.pageDf(key.slice(2));
    if (!this._udf) {
      this._udf = new Map();
      const ul = this.app.metadataCache.unresolvedLinks || {};
      for (const src in ul) { const t = ul[src]; for (const tgt in t) this._udf.set(tgt, (this._udf.get(tgt) || 0) + t[tgt]); }
    }
    return this._udf.get(key.slice(2)) || 0;
  }
  // 关联紧密度 = 共现次数 × log(1 + 总笔记数 / 该页被引用总数)：稀有而专属的共现分高，无处不在的高频页被压低
  strength(key, co, N) {
    return co * Math.log(1 + N / Math.max(1, this.keyDf(key)));
  }

  setupToolbar(component, rootEl) {
    this.undoOn(component, () => component.__bdToolbar && component.__bdToolbar.remove(), "toolbar");
    let bar = component.__bdToolbar;
    if (bar && bar.isConnected) return;
    if (bar) bar.remove();
    bar = createDiv({ cls: "bd-toolbar" });
    const row = bar.createDiv({ cls: "bd-toolbar-row" });
    if (S.showCooccur) {
      const toggle = row.createEl("button", { cls: "bd-filter-toggle", text: t("cooccur") });
      toggle.addEventListener("click", (e) => { e.preventDefault(); component.__bd.open = !component.__bd.open; this.refreshNow(component); });
      component.__bdToggle = toggle;
    }
    if (S.groupBacklinks) {
      const gb = row.createEl("button", { cls: "bd-group-toggle", text: t("group") });
      gb.addEventListener("click", (e) => { e.preventDefault(); component.__bd.group = !component.__bd.group; gb.toggleClass("is-active", component.__bd.group); this.refreshNow(component); });
      component.__bdGroupBtn = gb;
    }
    if (S.wordStats) {
      const wb = row.createEl("button", { cls: "bd-words-toggle", text: t("words"), attr: { "aria-label": t("wordsBtnTip") } });
      wb.addEventListener("click", (e) => { e.preventDefault(); this.toggleWordStats(component.__bdTargetPath); });
      component.__bdWordsBtn = wb;
    }
    const clear = row.createEl("button", { cls: "bd-filter-clear", text: t("clear") });
    clear.addEventListener("click", (e) => {
      e.preventDefault();
      component.__bd.include.clear(); component.__bd.exclude.clear(); component.__bd.text = "";
      if (component.__bd.nameInc) { component.__bd.nameInc.clear(); component.__bd.nameExc.clear(); }
      if (component.__bd.words) component.__bd.words.clear();
      if (component.__bdInput) component.__bdInput.value = "";
      this.refreshNow(component);
    });
    component.__bdClear = clear;
    if (S.textFilter && component.__bdEmbedded) {
      const input = row.createEl("input", { cls: "bd-filter-input", attr: { type: "text", placeholder: t("filterPlaceholder") } });
      input.value = component.__bd.text || "";
      input.addEventListener("input", () => { component.__bd.text = input.value.trim().toLowerCase(); this.applyFilter(component); this.updateClear(component); });
      input.addEventListener("keydown", (e) => e.stopPropagation());
      component.__bdInput = input;
    }
    component.__bdNameBar = bar.createDiv({ cls: "bd-names" });
    component.__bdWiki = bar.createDiv({ cls: "bd-wiki" });
    component.__bdChips = bar.createDiv({ cls: "bd-chips" });
    component.__bdWords = bar.createDiv({ cls: "bd-words" });
    component.__bdGroups = bar.createDiv({ cls: "bd-groups" });
    rootEl.insertBefore(bar, rootEl.firstChild);
    component.__bdToolbar = bar;
  }

  // 名字按钮：只有当前页有别名时才出现。次数分「链接 / 提到」两列统计（「提到当前文件名」折叠时 Obsidian 不算它，次数为 0）
  refreshNameChips(component) {
    const bar = component.__bdNameBar;
    if (!bar) return;
    const names = component.__bdNames || [];
    const st = component.__bd;
    bar.empty();
    bar.toggle(names.length > 1);
    if (names.length < 2) return;
    const counts = new Map(names.map((n) => [n, { linked: 0, unlinked: 0 }]));
    for (const [dom, key] of [[component.backlinkDom, "linked"], [component.unlinkedDom, "unlinked"]]) {
      this.eachFileDom(dom, (fd) => { if (this.isWiki(fd)) return; for (const m of this.fileMatches(fd)) for (const f of this.formsOf(component, m)) counts.get(f) && counts.get(f)[key]++; });
    }
    bar.createSpan({ cls: "bd-names-label", text: t("names") });
    names.forEach((n, i) => {
      const c = counts.get(n);
      const chip = bar.createSpan({ cls: "bd-chip bd-name-chip" });
      chip.toggleClass("bd-chip-inc", st.nameInc.has(n));
      chip.toggleClass("bd-chip-exc", st.nameExc.has(n));
      chip.createSpan({ cls: "bd-chip-name", text: n });
      chip.createSpan({ cls: "bd-chip-count", text: String(c.linked + c.unlinked) });
      chip.setAttribute("aria-label", t("nameTip", i === 0, c.linked, c.unlinked));
      chip.addEventListener("click", (e) => {
        e.preventDefault();
        if (e.shiftKey) { if (st.nameExc.has(n)) st.nameExc.delete(n); else { st.nameExc.add(n); st.nameInc.delete(n); } }
        else { if (st.nameInc.has(n)) st.nameInc.delete(n); else { st.nameInc.add(n); st.nameExc.delete(n); } }
        this.refreshNow(component);
      });
    });
  }

  refreshChips(component, data) {
    const chips = component.__bdChips;
    if (!chips) return;
    const st = component.__bd;
    const counts = (data && data.counts) || this.collectCooccur(component).counts;
    // 已选中的即使当前计数为 0 也保留，方便取消
    for (const k of st.include) if (!counts.has(k)) counts.set(k, { label: this.keyLabel(k), count: 0 });
    for (const k of st.exclude) if (!counts.has(k)) counts.set(k, { label: this.keyLabel(k), count: 0 });
    const N = this.app.vault.getMarkdownFiles().length;
    const entries = Array.from(counts.entries());
    if (S.rankByStrength) entries.sort((a, b) => this.strength(b[0], b[1].count, N) - this.strength(a[0], a[1].count, N) || b[1].count - a[1].count || a[1].label.localeCompare(b[1].label));
    else entries.sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label));
    const active = st.include.size + st.exclude.size;
    if (component.__bdToggle) component.__bdToggle.setText(active ? `${t("cooccur")} · ${active}` : (entries.length ? `${t("cooccur")} · ${entries.length}` : t("cooccur")));
    this.updateClear(component);
    chips.toggle(st.open && entries.length > 0);
    chips.empty();
    if (!st.open) return;
    for (const [k, info] of entries) {
      const chip = chips.createSpan({ cls: "bd-chip" });
      chip.toggleClass("bd-chip-inc", st.include.has(k));
      chip.toggleClass("bd-chip-exc", st.exclude.has(k));
      chip.createSpan({ cls: "bd-chip-name", text: info.label });
      chip.createSpan({ cls: "bd-chip-count", text: String(info.count) });
      chip.setAttribute("aria-label", t("chipTip", info.count, this.strength(k, info.count, N).toFixed(1)));
      chip.addEventListener("click", (e) => { e.preventDefault(); this.onChipClick(component, k, e.shiftKey); });
    }
  }

  isWiki(fd) {
    return !!(sepFolder() && fd && fd.file && fd.file.path.startsWith(sepFolder()));
  }

  // ---------- 词频（按页开关） ----------
  wordStatsOn(path) {
    return !!path && (S.wordStatsPages || []).includes(path);
  }
  toggleWordStats(path) {
    if (!path) return;
    const on = !this.wordStatsOn(path);
    S.wordStatsPages = (S.wordStatsPages || []).filter((p) => p !== path);
    if (on) S.wordStatsPages.push(path);
    this.saveSettings();
    new Notice(on ? t("wordsOn") : t("wordsOff"));
    this.eachComponent((c) => { if (c.__bdTargetPath === path) { if (!on && c.__bd) c.__bd.words.clear(); this.refreshNow(c); } });
  }
  // 全库每个词出现在几篇笔记里（特征度的 idf）。第一次有页面打开词频时在后台算一遍，分批让出主线程；算好前先按次数排
  // 分词词典：库里所有页面名 + 别名，换库内容后下次打开词频时重建
  ensureWordDict() {
    const files = this.app.vault.getMarkdownFiles();
    if (this._wordDictN === files.length) return;
    const names = [];
    for (const f of files) {
      names.push(f.basename);
      const fm = (this.app.metadataCache.getFileCache(f) || {}).frontmatter;
      const al = fm && (fm.aliases || fm.alias);
      if (al) names.push(...(Array.isArray(al) ? al : String(al).split(",")));
    }
    setWordDict(names);
    this._wordDictN = files.length;
  }
  wordBg() {
    if (this._wordBg || this._wordBgBusy) return this._wordBg;
    this._wordBgBusy = true;
    (async () => {
      const df = new Map();
      const files = this.app.vault.getMarkdownFiles();
      for (let i = 0; i < files.length; i++) {
        if (this.unloaded) return;
        try { for (const w of new Set(wordsOf(await this.app.vault.cachedRead(files[i])))) df.set(w, (df.get(w) || 0) + 1); } catch (e) {}
        if (i % 40 === 39) await wait(0);
      }
      this._wordBg = { df, N: files.length };
      this._wordBgBusy = false;
      this.eachComponent((c) => { if (this.wordStatsOn(c.__bdTargetPath)) this.refreshNow(c); });
    })();
    return null;
  }
  refreshWords(component) {
    const box = component.__bdWords, st = component.__bd;
    const on = this.wordStatsOn(component.__bdTargetPath);
    if (component.__bdWordsBtn) component.__bdWordsBtn.toggleClass("is-active", on);
    if (!box) return;
    box.empty();
    box.toggle(on);
    if (!on) return;
    this.ensureWordDict();
    // 每条反链一篇；当前页自己的名字（含别名）不算
    const own = new Set();
    for (const n of component.__bdNames || []) { own.add(n.toLowerCase()); for (const w of wordsOf(n)) own.add(w); }
    const docs = [];
    this.eachFileDom(component.backlinkDom, (fd) => { if (this.isWiki(fd)) return; for (const m of this.fileMatches(fd)) docs.push(new Set(wordsOf(this.matchText(m)).filter((w) => !own.has(w)))); });
    const count = new Map();
    for (const d of docs) for (const w of d) count.set(w, (count.get(w) || 0) + 1);
    const bg = this.wordBg();
    const score = (w, c) => bg ? c * Math.log(1 + bg.N / Math.max(1, bg.df.get(w) || 1)) : c;
    // 只出现一次的词不进榜（反链少于 5 条时放宽）
    const minC = docs.length < 5 ? 1 : 2;
    const ranked = [...count].filter(([, c]) => c >= minC).map(([w, c]) => ({ w, c, s: score(w, c) })).sort((a, b) => b.s - a.s || b.c - a.c);
    box.createDiv({ cls: "bd-words-head", text: t("wordsHead", docs.length, !!bg) });
    if (!ranked.length) { box.createDiv({ cls: "bd-words-head", text: t("wordsNone") }); return; }
    const chips = box.createDiv({ cls: "bd-chips" });
    for (const { w, c, s } of ranked.slice(0, 30)) {
      const chip = chips.createSpan({ cls: "bd-chip" });
      chip.toggleClass("bd-chip-inc", st.words.has(w));
      chip.createSpan({ cls: "bd-chip-name", text: w });
      chip.createSpan({ cls: "bd-chip-count", text: String(c) });
      chip.setAttribute("aria-label", t("wordTip", c, s.toFixed(1)));
      chip.addEventListener("click", (e) => { e.preventDefault(); if (st.words.has(w)) st.words.delete(w); else st.words.add(w); this.refreshNow(component); });
    }
    const pairs = wordPairs(docs, ranked.slice(0, 40).map((r) => r.w), 12);
    if (!pairs.length) return;
    const row = box.createDiv({ cls: "bd-chips" });
    row.createSpan({ cls: "bd-names-label", text: t("wordsPairs") });
    for (const p of pairs) {
      const chip = row.createSpan({ cls: "bd-chip" });
      chip.toggleClass("bd-chip-inc", st.words.size === 2 && st.words.has(p.a) && st.words.has(p.b));
      chip.createSpan({ cls: "bd-chip-name", text: `${p.a} · ${p.b}` });
      chip.createSpan({ cls: "bd-chip-count", text: String(p.c) });
      chip.setAttribute("aria-label", t("pairTip", p.c, p.ca, p.cb));
      chip.addEventListener("click", (e) => {
        e.preventDefault();
        const same = st.words.size === 2 && st.words.has(p.a) && st.words.has(p.b);
        st.words.clear();
        if (!same) { st.words.add(p.a); st.words.add(p.b); }
        this.refreshNow(component);
      });
    }
  }

  // 链到当前页的 wiki 页，列成一行入口：点=打开，⌘点=新标签，Shift点=右侧栏叠放
  renderWikiLinks(component) {
    const box = component.__bdWiki;
    if (!box) return;
    box.empty();
    const files = [];
    this.eachFileDom(component.backlinkDom, (fd) => { if (this.isWiki(fd)) files.push(fd.file); });
    box.toggle(files.length > 0);
    if (!files.length) return;
    box.createSpan({ cls: "bd-wiki-label", text: S.separateLabel || sepFolder().replace(/\/$/, "") });
    for (const f of files) {
      const a = box.createEl("a", { cls: "bd-wiki-link", text: f.basename, attr: { "aria-label": t("openTip") } });
      a.addEventListener("click", (e) => {
        e.preventDefault();
        if (S.shiftStack && e.shiftKey) this.openStackedFile(f, 0);
        else this.app.workspace.getLeaf(Keymap.isModEvent(e)).openFile(f);
      });
      a.addEventListener("mouseover", (e) => this.app.workspace.trigger("hover-link", { event: e, source: "search", hoverParent: box, targetEl: a, linktext: f.path, sourcePath: component.__bdTargetPath || "" }));
    }
  }

  updateClear(component) {
    const st = component.__bd, btn = component.__bdClear;
    if (!st || !btn) return;
    const on = !!(st.include.size || st.exclude.size || st.text || (st.nameInc && st.nameInc.size) || (st.nameExc && st.nameExc.size) || (st.words && st.words.size));
    btn.toggleClass("is-idle", !on);
    btn.disabled = !on;
  }

  keyLabel(k) {
    const body = k.slice(2);
    if (k[0] === "f") { const parts = body.split("/"); return parts[parts.length - 1].replace(/\.md$/, ""); }
    return body;
  }

  onChipClick(component, key, shift) {
    const st = component.__bd;
    if (shift) {
      if (st.exclude.has(key)) st.exclude.delete(key);
      else { st.exclude.add(key); st.include.delete(key); }
    } else {
      if (st.include.has(key)) st.include.delete(key);
      else { st.include.add(key); st.exclude.delete(key); }
    }
    this.refreshNow(component);
  }

  // 「分组」：按最紧密的几个共现页把反链聚成簇（一条命中若含多个共现页会出现在多个簇里），其余归「其它」
  renderGroups(component, data) {
    const box = component.__bdGroups;
    if (!box) return;
    const st = component.__bd;
    box.toggle(!!st.group);
    box.empty();
    if (!st.group) return;
    if (!data) data = this.collectCooccur(component);
    const N = this.app.vault.getMarkdownFiles().length;
    const scored = Array.from(data.counts.entries()).sort((a, b) => this.strength(b[0], b[1].count, N) - this.strength(a[0], a[1].count, N) || b[1].count - a[1].count);
    const top = scored.slice(0, S.groupMax);
    const topSet = new Set(top.map((x) => x[0]));
    const groups = new Map(); for (const [k] of top) groups.set(k, []);
    const other = [];
    for (const it of data.items) {
      let hit = false;
      for (const k of it.pages.keys()) if (topSet.has(k)) { groups.get(k).push(it); hit = true; }
      if (!hit) other.push(it);
    }
    if (!top.length && !other.length) { box.createDiv({ cls: "bd-group-empty", text: t("noGroups") }); return; }
    for (const [k, info] of top) this.renderGroup(component, box, k, info.label, groups.get(k), topSet);
    if (other.length) this.renderGroup(component, box, "__other", t("other"), other, topSet);
  }

  // 「只看这簇」：普通簇 = 只含这个共现页；「其它」= 排除所有做了簇的共现页。再点一次取消
  clusterActive(st, key, topSet) {
    if (key === "__other") return st.include.size === 0 && st.exclude.size === topSet.size && [...topSet].every((k) => st.exclude.has(k));
    return st.include.size === 1 && st.include.has(key) && st.exclude.size === 0;
  }
  onlyCluster(component, key, topSet) {
    const st = component.__bd;
    const on = this.clusterActive(st, key, topSet);
    st.include.clear(); st.exclude.clear();
    if (!on) {
      if (key === "__other") for (const k of topSet) st.exclude.add(k);
      else st.include.add(key);
    }
    this.refreshNow(component);
  }

  renderGroup(component, box, key, label, items, topSet) {
    const st = component.__bd;
    const collapsed = st.groupCollapsed && st.groupCollapsed.has(key);
    const sec = box.createDiv({ cls: "bd-group" });
    const head = sec.createDiv({ cls: "bd-group-head" });
    head.toggleClass("is-collapsed", !!collapsed);
    const tw = head.createSpan({ cls: "bd-group-twist" });
    setIcon(tw, "right-triangle");
    head.createSpan({ cls: "bd-group-name", text: label });
    const cnt = head.createSpan({ cls: "bd-group-count", text: String(items.length) });
    const only = this.clusterActive(st, key, topSet || new Set());
    cnt.toggleClass("is-active", only);
    cnt.setAttribute("aria-label", only ? t("clusterOn") : t("clusterOff"));
    cnt.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();   // 不触发标题的折叠
      this.onlyCluster(component, key, topSet || new Set());
    });
    const list = sec.createDiv({ cls: "bd-group-list" });
    list.toggle(!collapsed);
    head.addEventListener("click", (e) => {
      e.preventDefault();
      const s = st.groupCollapsed || (st.groupCollapsed = new Set());
      const now = !head.hasClass("is-collapsed");
      head.toggleClass("is-collapsed", now);
      list.toggle(!now);
      if (now) s.add(key); else s.delete(key);
    });
    for (const it of items) {
      const m = it.m;
      const file = m.parentDom && m.parentDom.file;
      const line = this.offsetToLine(m, (m.__bdRange || {}).start);
      const row = list.createDiv({ cls: "bd-group-item", attr: { "aria-label": t("jumpRowTip") } });
      if (file) row.createSpan({ cls: "bd-group-file", text: file.basename });
      row.createSpan({ cls: "bd-group-snip", text: this.snippetText(m) });
      row.addEventListener("click", (e) => {
        e.preventDefault();
        if (S.shiftStack && e.shiftKey) this.openStackedFile(file, line);
        else this.openAt(file, line, Keymap.isModEvent(e));
      });
    }
  }

  // 一条命中的一行摘要：取显示范围里第一行有内容的，去掉列表记号/双链括号/强调号
  snippetText(m) {
    let r = m.__bdRange;
    if (!r) { const ctx = this.listContext(m); r = this.displayRange(m, ctx); }
    const raw = (m.content || "").substring(r.start, r.end);
    let line = raw.split("\n").map((s) => s.trim()).find(Boolean) || "";
    line = line
      .replace(/^(#+\s+|>\s*)/, "")
      .replace(/^([-*+]|\d+[.)])\s+(\[.\]\s+)?/, "")
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (s, a, b) => b || a.split("#")[0])
      .replace(/\[([^\]]*)\]\([^)]*\)/g, (s, a) => a)
      .replace(/[*_=~`#]+/g, "")
      .replace(/\s\^[\w-]+\s*$/, "")
      .trim();
    return line.slice(0, 100);
  }

  // ---------- 块引用计数 ----------
  buildBlockIndex() {
    this.blockCounts = new Map();   // "path#^id" -> 次数
    this.blockSrc = new Map();      // 源文件 -> 它贡献的 key 列表
    for (const f of this.app.vault.getMarkdownFiles()) this.indexFile(f);
  }
  removeFile(path) {
    if (!this.blockCounts) return;
    const prev = this.blockSrc.get(path);
    if (prev) for (const k of prev) { const n = (this.blockCounts.get(k) || 0) - 1; if (n <= 0) this.blockCounts.delete(k); else this.blockCounts.set(k, n); }
    this.blockSrc.delete(path);
  }
  indexFile(f) {
    if (!this.blockCounts) return;
    this.removeFile(f.path);
    const c = this.app.metadataCache.getFileCache(f);
    const keys = [];
    if (c) for (const l of (c.links || []).concat(c.embeds || [])) {
      const mm = /^([^#|]*)#\^([\w-]+)/.exec(l.link || "");
      if (!mm) continue;
      const lp = mm[1].trim();
      const dest = lp ? this.app.metadataCache.getFirstLinkpathDest(lp, f.path) : f;
      if (dest) keys.push(dest.path + "#^" + mm[2]);
    }
    this.blockSrc.set(f.path, keys);
    for (const k of keys) this.blockCounts.set(k, (this.blockCounts.get(k) || 0) + 1);
  }
  // 改名 / 移动：只重算这篇自己、引用过它的块的那些篇，以及原来有指向新名字的悬空链接的那些篇，不再全库重建。
  // 改文件夹名时逐个处理里面的笔记（Obsidian 之后还会为每篇单独发 rename，重复处理一次也没关系）
  renameInIndex(file, oldPath) {
    if (!this.blockCounts) return;
    const pairs = [];
    const walk = (af, old) => {
      if (af.children) for (const ch of af.children) walk(ch, old + "/" + ch.name);
      else if (af.extension === "md") pairs.push([af, old]);
    };
    walk(file, oldPath);
    if (!pairs.length) return;
    const redo = new Set();
    const unresolved = this.app.metadataCache.unresolvedLinks || {};
    for (const [f, old] of pairs) {
      const prefix = old + "#^", names = [f.basename, f.path.replace(/\.md$/, "")];
      for (const [src, keys] of this.blockSrc) if (src !== old && keys.some((k) => k.startsWith(prefix))) redo.add(src);
      for (const src in unresolved) if (names.some((n) => unresolved[src][n])) redo.add(src);
      this.removeFile(old);
      redo.add(f.path);
    }
    for (const p of redo) {
      const f = this.app.vault.getAbstractFileByPath(p);
      if (f && f.extension === "md") this.indexFile(f);
    }
  }
  addRefBadges(m, range) {
    if (!this.blockCounts) return;
    const file = m.parentDom && m.parentDom.file;
    const blocks = m.cache && m.cache.blocks;
    if (!file || !blocks) return;
    const found = [];
    for (const id in blocks) {
      const b = blocks[id];
      if (!b.position) continue;
      const off = b.position.start.offset;
      if (off >= range.start && off < range.end) {
        const n = this.blockCounts.get(file.path + "#^" + id) || 0;
        if (n > 0) found.push([id, n]);
      }
    }
    if (!found.length) return;
    const wrap = m.el.createDiv({ cls: "bd-refcounts" });
    for (const [id, n] of found) {
      const badge = wrap.createSpan({ cls: "bd-refcount", attr: { "aria-label": t("refTip", n) } });
      setIcon(badge, "lucide-corner-down-left");
      badge.createSpan({ cls: "bd-refcount-n", text: String(n) });
      badge.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); this.openSearch('"#^' + id + '"'); });
    }
  }
  openSearch(query) {
    const s = this.app.internalPlugins && this.app.internalPlugins.getPluginById("global-search");
    if (s && s.instance) s.instance.openGlobalSearch(query);
  }

  // 跳到反向链接：优先滚到正文底部那份并聚焦筛选框；没有就唤出侧栏反链面板
  async gotoBacklinks() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const find = () => {
      const r = view && view.containerEl && view.containerEl.querySelector(".embedded-backlinks");
      return r && r.offsetParent !== null ? r : null;
    };
    let root = find();
    // 阅读视图是边滚边渲染的：长笔记要滚到底，正文底部那份反链才会画出来（以前找不到就退去开侧栏面板了）
    if (!root && view && view.getMode && view.getMode() === "preview" && !view.containerEl.hasClass("no-backlinks")) {
      const opt = this.app.internalPlugins.getPluginById("backlink");
      const sc = view.previewMode.renderer && view.previewMode.renderer.previewEl;
      if (sc && opt && opt.enabled && opt.instance.options.backlinkInDocument) {
        for (let i = 0; i < 10 && !root; i++) { sc.scrollTop = sc.scrollHeight; await wait(100); root = find(); }
        if (root) await wait(150);   // 等反链条目填进来，高度稳定一点再算居中
      }
    }
    if (root) {
      // 放到视口正中：面板比一屏矮就整个居中，比一屏高就把面板顶部（标题和筛选框）放到正中
      const sc = root.closest(".cm-scroller, .markdown-preview-view");
      if (sc) {
        const r = root.getBoundingClientRect(), s = sc.getBoundingClientRect();
        const mid = r.height < s.height ? r.top + r.height / 2 : r.top + 24;
        sc.scrollTo({ top: sc.scrollTop + mid - (s.top + s.height / 2), behavior: "smooth" });
      } else root.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => { const f = root.querySelector(".bd-filter-input"); if (f) f.focus({ preventScroll: true }); }, 150);   // 聚焦不能带滚动，会打断上面的居中
      return;
    }
    const leaves = this.app.workspace.getLeavesOfType("backlink");
    if (leaves.length) {
      this.app.workspace.revealLeaf(leaves[0]);
      setTimeout(() => { const f = leaves[0].view.containerEl.querySelector(".search-input-container input"); if (f) f.focus(); }, 150);
      return;
    }
    if (this.app.commands && this.app.commands.executeCommandById) this.app.commands.executeCommandById("backlink:open");
  }

  // ---------- Shift 点：右侧栏叠放 ----------
  offsetToLine(m, off) {
    if (off == null || typeof m.content !== "string") return -1;
    return m.content.substring(0, off).split("\n").length - 1;
  }
  // 接管右侧栏叠放的菜单和折叠（两个插件都装时只跑一份，见 STACK_OWNER）
  claimSidebarStack() {
    const ws = this.app.workspace;
    if (this.stackReleased || ws[STACK_OWNER]) return;
    ws[STACK_OWNER] = this.manifest.id;
    const c = this.addChild(new Component());
    c.registerEvent(ws.on("leaf-menu", (menu, leaf) => addStackMenu(this.app, menu, leaf, t)));
    // 折叠了的页：点它的标签页头、或者它被激活，就展开
    c.registerEvent(ws.on("active-leaf-change", (leaf) => { if (leaf && isStackCollapsed(leaf)) setStackCollapsed(leaf, false); }));
    c.registerDomEvent(document, "click", (e) => {
      const group = e.target.closest?.(`.workspace-tabs.${STACK_COLLAPSED}`);
      if (group && e.target.closest(".workspace-tab-header-container")) group.removeClass(STACK_COLLAPSED);
    });
    c.register(() => {   // 停用时让出来，另一个插件接手（自己正在卸载，别再接回来）
      delete ws[STACK_OWNER];
      this.stackReleased = true;
      ws.trigger(STACK_RELEASED);
    });
  }
  async openStackedFile(file, line) {
    if (!file) return;
    const ws = this.app.workspace;
    const leaf = stackLeaf(this.app);
    // 用实时预览打开：Zoom 是编辑器命令，阅读视图里用不了
    await leaf.setViewState({ type: "markdown", state: { file: file.path, mode: "source", source: false }, active: true });
    ws.revealLeaf(leaf);
    if (line < 0) return;
    ws.setActiveLeaf(leaf, { focus: true });
    const editor = leaf.view && leaf.view.editor;
    if (!editor) return;
    await new Promise((r) => setTimeout(r, 60));   // 等编辑器把文档解析完
    editor.setCursor({ line, ch: 0 });
    const cache = this.app.metadataCache.getFileCache(file);
    const isList = !!(cache && cache.listItems && cache.listItems.some((it) => it.position.start.line === line));
    const cmds = (this.app.commands && this.app.commands.commands) || {};
    const zoomId = ["bullet:zoom-in", "obsidian-zoom:zoom-in"].find((id) => cmds[id]);
    if (S.stackZoom && isList && zoomId && this.app.commands.executeCommandById(zoomId)) return;
    // 不是列表块、或没装 Bullet / Zoom：把这一行滚到顶格
    const cm = editor.cm;
    if (cm && cm.constructor && cm.constructor.scrollIntoView) {
      cm.dispatch({ effects: cm.constructor.scrollIntoView(editor.posToOffset({ line, ch: 0 }), { y: "start" }) });
    } else editor.scrollIntoView({ from: { line, ch: 0 }, to: { line, ch: 0 } }, true);
  }
  openStackedLink(linktext, sourcePath) {
    const hash = linktext.indexOf("#");
    const path = (hash < 0 ? linktext : linktext.slice(0, hash)).trim();
    const subpath = hash < 0 ? "" : linktext.slice(hash);
    const dest = this.app.metadataCache.getFirstLinkpathDest(path || "", sourcePath);
    if (!dest) return;
    let line = -1;
    if (subpath) {
      const c = this.app.metadataCache.getFileCache(dest);
      const r = c && resolveSubpath(c, subpath);
      if (r) { const p = (r.block && r.block.position) || (r.current && r.current.position); if (p) line = p.start.line; }
    }
    this.openStackedFile(dest, line);
  }

  // ---------- 设置 ----------
  async saveSettings() {
    await this.saveData(this.settings);
    this.applySnippetFont();
    if (S.blockRefcount && !this.blockCounts) this.buildBlockIndex();
    clearTimeout(this._redraw);
    this._redraw = setTimeout(() => { this.rerenderAll(); this.applyAll(); }, 300);
  }
  // 反链片段字体：挂成 body 上的 CSS 变量，styles.css 里用
  applySnippetFont() {
    const f = String(S.snippetFont || "").trim();
    if (f) document.body.style.setProperty("--roam-backlinks-snippet-font", /[,"']/.test(f) ? f : `"${f}"`);
    else document.body.style.removeProperty("--roam-backlinks-snippet-font");
  }
};
