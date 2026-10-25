# Roam Backlinks

Edit your backlinks in place, block by block, the way Logseq and Roam Research do it.

Obsidian's backlinks panel shows a line or two of plain text around each link. If you have used Logseq or Roam Research, you miss the real thing: the whole block, its children, where it sits in the note, and the ability to fix it right there. This plugin brings that experience to Obsidian's own backlinks panel and the backlinks at the bottom of notes.

[中文说明](#中文说明)

## The core: backlinks you can read and edit like in Logseq and Roam Research

- **Whole blocks, not snippets.** A linked list item is shown with all its children; a linked heading with its whole section. A child that links here again is folded into its parent instead of being listed twice.
- **Breadcrumbs.** A grey line above each block shows its path: the headings and parent blocks it sits under. Click a level to expand the context in place, one level at a time, until you see the whole section. `Cmd/Ctrl`-click opens the note at that line; `Shift`-click opens it in the right sidebar.
- **Edit in place.** Click anywhere in a block to edit its Markdown and write it back to the note, without leaving the page you are on. `Cmd/Ctrl+Enter` or `Cmd/Ctrl+S` saves, `Esc` cancels, clicking outside saves if you changed something. Bold, italic, code and highlight shortcuts work, `Tab` / `Shift+Tab` indent, and typing `(` `[` `"` with text selected wraps it (press `[` twice for a `[[link]]`).
- **Rendered Markdown.** Lists, bold, links and tasks render as in reading view. Links are clickable and show hover previews; checkboxes can be ticked and are written back.
- **Folding like Logseq.** First-level children are listed; deeper children fold behind a `…` you can click open. Long lists collapse into `… N more`. Anything that links to the current note is always revealed.
- **Block reference counts.** Blocks with a `^id` show how many times they are referenced.
- **Shift-click to stack.** Links, blocks, breadcrumbs and note titles open stacked in the right sidebar, so you can compare several pages side by side. List blocks zoom in with the [Zoom](https://github.com/vslinko/obsidian-zoom) plugin when installed.

## Finding your way through many backlinks

- **Sorted by relationship.** Pages come first, ranked by how close they are to the current note: mutual links, then links from properties, then the number of mentions. Each page shows why it ranks there.
- **Daily notes grouped by date.** Daily notes come after pages, newest first. The last 12 months are grouped by month, older ones fold by year. Folder and date format are read from the core Daily notes plugin, or set your own.
- **Co-mention filter (like Roam).** See which other pages are mentioned alongside this one, ranked so that specific pages beat ones that appear everywhere. Click to show only blocks with a page, `Shift`-click to exclude it.
- **Group.** Cluster the backlinks by their strongest co-mentioned pages to scan the themes at a glance.
- **Word stats, per note.** Turn on “Words” for a note to see the frequent words in its backlinks, ranked by how specific they are to this note (count × vault-wide rarity), and the word pairs that tend to appear together. Click a word or pair to show only those blocks. It stays off unless you turn it on for that note. Words come from the browser's own segmenter, with your note names and aliases as an extra dictionary, so Chinese and other languages without spaces work too. Everything is computed on your device; the first time you turn it on, the vault-wide counts are built in the background (a few seconds for thousands of notes), and words are ranked by count until then.
- **Filter by name.** When a note has aliases, see which name each backlink uses and filter by it.
- **Text filter** for the backlinks at the bottom of notes.
- **Unlinked mentions that don't jump.** Clicking “Link” converts the mention without refreshing or re-sorting the panel, so you keep your place. Optional case-sensitive matching per note through a property.

## Export to PDF with backlinks

Obsidian's own *Export to PDF* dialog gains two groups of options:

- **Include backlinks.** Every passage that links to the note is appended after it, grouped by source note in the same order as the panel, each with its breadcrumb path. A concept note exports together with everything your vault says about it.
- **Layout.** Refined typography, body and heading fonts (only the ones installed on your machine are listed), font size and accent color. Only the exported PDF is affected.

## How it compares

Several plugins improve backlinks, and they are worth a look: Better Backlinks, Context Trees, Better Search Views and Auto-expand backlinks show more context or build a separate view. This plugin focuses on making Obsidian's own panel *work* like Logseq and Roam Research: whole blocks you can expand by breadcrumb and edit in place, plus the sorting, filtering and PDF export that make a large vault manageable.

## Settings

Every feature can be turned off in **Settings → Roam Backlinks**: blocks, editing, sorting, filtering, word stats, navigation and PDF export. You can also choose the font for backlink blocks (Lyon Text by default, falling back to your text font), folders whose in-note backlinks are hidden, and a folder to list separately (for example an AI-maintained wiki).

## Commands

- **Jump to backlinks of the current note** (no default hotkey): scrolls to the backlinks at the bottom of the note and focuses the filter box, or reveals the sidebar panel.
- **Toggle case-sensitive unlinked mentions for this note**: writes the property to the current note.
- **Toggle word stats for the current note**.

## Installation

**From Community plugins** (once approved): search for “Roam Backlinks”.

**Manually:** download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/MatsuriMW/roam-backlinks/releases/latest) into `<your vault>/.obsidian/plugins/roam-backlinks/`, then enable the plugin.

**With BRAT:** add `MatsuriMW/roam-backlinks`.

## Notes

- The plugin changes the built-in backlinks panel and Export to PDF dialog at runtime. It does not modify Obsidian's files; disabling the plugin restores everything. Because it builds on Obsidian's internal views, a future Obsidian update may require a plugin update. If an update changes those internals, the affected features turn themselves off with a notice (details in the developer console) and the rest keep working.
- Editing writes only the block you edited. If the note changed elsewhere in the meantime and the block can no longer be found, nothing is written and you are told.
- The interface follows Obsidian's language: Chinese for Chinese, English otherwise.
- Tested on desktop. It should work on mobile, but that is less tested; PDF export is desktop only, as in Obsidian.

## License

[MIT](LICENSE) © MatsuriMW

---

<a id="中文说明"></a>

## 中文说明

在 Obsidian 里获得**和 Logseq、Roam Research 一致的反链编辑体验**。

Obsidian 自带的反链面板只给链接前后一两行纯文本。用过 Logseq 或 Roam Research 的人会想念真正的反链：整块内容、它的子块、它在原文里的位置，以及就地改掉它的能力。这个插件把这套体验带进 Obsidian 自己的反链面板和正文底部的反链。

**核心：像 Logseq、Roam Research 一样看反链、改反链**

- **以块为单位**：命中的列表项连同全部子块一起显示，命中的标题显示整节；母块已经显示过的引用，子块里不再重复列一条。
- **面包屑**：每块上方一行灰字，列出它所在的标题和各级母块。点某一级就地展开上下文，可以一级级点到最外层；⌘ 点跳到原文那一行，Shift 点在右侧栏打开。
- **就地编辑**：点块里任意位置，就地编辑这一块的 Markdown 并写回原笔记，不用离开当前页面。⌘↩ / ⌘S 保存，Esc 取消，点框外改过就自动保存；支持加粗、斜体、行内代码、高亮快捷键，Tab 调缩进，选中文字输入成对符号会包裹（连按两次 [ 变成 [[双链]]）。
- **按 Markdown 渲染**：链接可点、可悬停预览，复选框可以直接勾。
- **像 Logseq 一样折叠子块**、**块引用计数**、**Shift 点在右侧栏叠放**（装了 Zoom 插件时列表块会聚焦进去）。

**反链多了也找得到**

- 页面按关系紧密度排在前（互链 > 属性里链过来 > 提到次数），日记在后按日期从新到旧，最近 12 个月按月分段，更早的按年折叠。日记的文件夹和日期格式读核心插件「日记」的设置，也可以自己填。
- 共现筛选（Roam 式）、分组、按别名筛选、正文底部的文字筛选框。
- **按页开的词频**：对某一页点「词频」，列出它反链里的特征词（次数 × 全库稀有度）和常一起出现的词对，点一下只看含它们的块。默认不开，每页单独记住。分词用系统自带的分词器，再拿库里的页面名和别名当词典补专名。全部在本机算：第一次打开时在后台把全库统计一遍（几千篇的库几秒钟），算好前先按次数排。也可以用命令「开关当前页的词频」。
- 「转为链接」后面板不刷新、不重排，阅读位置不变；可以按笔记设置区分大小写。

**导出 PDF 带上反链**：自带的「导出为 PDF」对话框里多出「包含反链」和「排版」（精致排版、字体、字号、强调色）。一篇概念页能连同库里所有提到它的地方一起导出。

所有功能都能在设置里单独开关。界面语言跟随 Obsidian：中文界面显示中文，其余显示英文。

插件在运行时改动自带的反链面板和「导出为 PDF」对话框，不改 Obsidian 本身的文件，停用即还原。Obsidian 更新如果改了这些内部结构，对不上的功能会自动关掉并提示一次（详情在开发者控制台），其余功能照常。

安装：社区插件市场搜索「Roam Backlinks」（审核通过后）；或者从 [最新 Release](https://github.com/MatsuriMW/roam-backlinks/releases/latest) 下载 `main.js`、`manifest.json`、`styles.css` 放进 `<库>/.obsidian/plugins/roam-backlinks/`；或者用 BRAT 添加 `MatsuriMW/roam-backlinks`。
