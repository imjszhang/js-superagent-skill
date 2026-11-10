# README 配图生成记录

2026-11-10，使用内置 `image_gen` 生图工具生成。图片根据公开 README 与架构说明的 Mermaid 关系绘制；内容为通用说明，不包含使用者项目、账号、消息或运行数据。

## 资产与用途

- `assets/project-agent-hero-v1.png`：README 顶部主视觉，突出 Project Agent 与长期任务维护；与下方两张图使用统一的米白、青绿和暖金配色及纸张层叠插画。
- `assets/project-agent-workflow-v1.png`：长期任务工作循环，供 README 使用。
- `assets/project-agent-architecture-v1.png`：项目组件分工，供 README 与架构说明共用。

图片属于仓库展示资料，不随可安装技能分发；技能版本保持 0.3.0。原始 Mermaid 保留为可编辑说明。修改流程语义时同时更新图文，不直接复用已经不符实现的配图。

生成后核对了文字、箭头方向、人工审核与核验顺序，以及组件职责，并在 850 px 页面宽度下检查了可读性。图片是概念信息图，不是产品界面截图或运行证据。

## 顶部主视觉提示词

```text
Use case: ads-marketing.
Asset type: GitHub README top hero banner for js-superagent-skill.
Primary request: Create one polished, inviting editorial hero illustration that makes the message immediately clear: give your PROJECT a Project Agent to maintain ongoing tasks over time.

Canvas: wide landscape, 2:1 aspect ratio, high resolution. Designed to remain readable at 850 px wide. Warm off-white paper background (#FAF6EE), deep nearly-black ink (#0C2529), muted teal (#317D73), pale sage (#DCEBDD), and warm amber/gold (#E7AF4B). Match a companion set of warm off-white, teal and amber infographics, with soft layered paper-cut depth, fine outlines, quiet shadows, subtle paper texture and extremely restrained pale foliage at the bottom edges. Clean, warm, thoughtful documentation illustration.

Composition: a spacious editorial split, slightly more than half of the width for text on the left, a single cohesive conceptual project illustration on the right. Comfortable safe margins. Strong headline hierarchy, no boxes around the headline, no crowded process chart, no thin unreadable text.
Text, verbatim, with correct Simplified Chinese and clear Latin lettering:
Small eyebrow: "js-superagent-skill"
Huge two-line headline:
"给你的项目"
"配一个 Project Agent"
Make the words "Project Agent" teal with a restrained amber brush underline, keeping the entire headline highly legible and not overlapped by art.
Medium supporting line: "长期任务，持续维护。"
Small but clearly readable bottom line under the supporting line: "按计划推进 · 接着上次做 · 需要你时交接"

Right illustration: a substantial warm golden project folder containing neatly layered documents on a small sage base. Nestled around it are three small meaningful paper objects: a teal desk calendar, a tidy stack of work records with a bookmark, and a warm amber human-decision checklist card. A single elegant, gentle teal curved path connects these objects around the project folder, suggesting continued work and accumulation, with a few subtle directional arrowheads and sequential document layers; no infinity symbol. The project folder, not any robot, is the main character. An abstract small teal layered-paper emblem may sit on the folder without any lettering. Human-decision card uses simple tick/wait symbols, no real app screenshot. Keep ample white space; illustration must feel like the same soft paper-cut family as a project workflow infographic.

Semantic constraints: visual metaphor for configured periodic work and saved history. Do not suggest unlimited operation, automatic publishing, guaranteed results, or that the skill itself is a background service. No giant robot, personal assistant avatar, chat bubbles, fake interface, glowing circuits, neon, detailed server architecture, logos of external platforms, or component-name soup. No real project names except the exact public product name above; no user identities, IDs, paths, account data or private business content. Use only the four text elements specified, no additional labels. Typography must be accurate, crisp, balanced and readable at README width.
```

## 长期任务图提示词

```text
Use case: infographic-diagram.
Create a polished editorial infographic for the Chinese GitHub README of js-superagent-skill. It replaces a plain five-step Mermaid cycle, for ordinary readers. Landscape 16:9, high resolution, designed to remain readable at 850 px display width.
Visual direction: restrained premium software documentation illustration; warm off-white canvas, deep ink typography, teal for automated work and muted amber for human judgment. Crisp custom flat illustrations with subtle paper depth, spacious margins, consistent fine connector strokes. Not a screenshot, not a generic stock diagram, no robot mascots, no neon, no fake UI.
Title exactly: "长期任务，持续推进"
Subtitle exactly: "每次工作，都接着项目已有的记录"
Five clear numbered stages, arranged along a generous clockwise loop with unambiguous arrowheads, not a cramped straight line. Top row stages 01, 02, 03 left to right; bottom row 04 at right, 05 at left; arrow from 03 down to 04, 04 left to 05, 05 around outside back to 01.
Verbatim stage labels and concise captions:
01 "按计划开始" / "读取资料与历史"
02 "整理结果" / "形成建议与依据"
03 "你来决定" / "飞书：采用 / 拒绝 / 稍后"
04 "继续并核验" / "完成工作，检查结果"
05 "保存与积累" / "成果、决定与任务记忆"
Use small meaningful illustrations: calendar + document, organized note cards, human decision card, checklist, archive folder. The human decision card is an abstract conceptual card, not an actual Feishu screenshot, no brand logo. Stage 03 visually distinguished in amber. Stage 04 must appear AFTER human decision and BEFORE saved results.
Center of loop: a modest project-folder illustration with exact label "你的项目". Return arrow label exactly "到期且满足限制后，进入下一轮".
Small legible footer exactly: "示意流程 · 无需人工审核的任务可直接进入核验"
Typography: exceptionally clean Simplified Chinese sans-serif, all supplied labels spelled verbatim, large labels and short captions, no extra text or invented business details. No project names, user identities, IDs, real data, privacy-sensitive information. Preserve semantic order above; no approval-to-saved shortcut.
```

## 架构图提示词

```text
Use case: infographic-diagram.
Create a premium editorial architecture illustration for the Chinese GitHub README of js-superagent-skill. It visually translates an existing project architecture graph for ordinary readers while keeping component ownership correct. Landscape 16:9, high resolution, readable at 850 px width.
Visual direction: restrained software documentation editorial illustration with a warm off-white canvas, deep ink text, teal system modules, muted amber human participation, crisp flat icons with very subtle paper depth, generous whitespace and an elegant grid. No robot mascots, neon, busy server racks, invented logos or fake application screenshots.
Title exactly: "给项目配一个 Project Agent"
Subtitle exactly: "项目保留规则与历史，组件负责推进工作"
Three clearly separated layers:
TOP a slim operator strip with exact texts "你 + Coding Agent + Skill" and "设计 · 接入 · 部署 · 维护". A dashed arrow labeled "配置与维护" goes into the project area below. This strip must sit OUTSIDE the project's persistent execution container. Skill is not a background worker.
MIDDLE one large soft-bordered rounded project container titled "你的项目". Inside, create three main modules left to right:
- "项目规则与资料" with a folder/documents icon
- "js-longrun" with caption "长期任务 · 节奏 · 核验"
- "js-superagent" with caption "工单 · 协调 · 执行"
Required arrows: rules -> js-longrun; js-longrun -> js-superagent labeled "提交工作"; js-superagent -> js-longrun labeled "结果返回" on a separate clean return connector.
Below longrun INSIDE project: a clear archive block labeled "成果与任务历史" with arrow FROM longrun TO archive labeled "核验后保存".
Below superagent INSIDE project: one slim supporting execution block labeled "执行工具" with exact secondary text "按需接入 js-agent-runtime"; arrow FROM superagent to this block. It denotes optional execution adapters, never a required layer for all execution.
BOTTOM outside project container: an amber human decision card labeled "你 · 飞书审核"; bidirectional connector ONLY to js-superagent labeled "卡片与回答". This is a conceptual decision illustration, no real identity, no actual Feishu branding.
Tiny separate text note at bottom exactly: "lark-cli：飞书配置、授权与诊断"
All exact component names must be correctly spelled. Project container represents ownership, NOT a new cloud product. No claim of unlimited autonomy, zero setup, or automatic publishing. Large readable Chinese labels, restrained arrows with no crossings, keep layout uncluttered; use supplied text only.
```

