# js-superagent-skill

让 Coding Agent 帮你在项目中搭建和维护持续任务系统：安装依赖、配置执行能力、设计长期任务、接入飞书审核，并检查任务是否真正完成与结算。

例如，你可以让项目每天发现一批候选，把需要判断的内容发到飞书卡片，提交决定后继续处理并记录结果。也可以设计无需逐项审核的定期报告。具体业务规则由你的项目定义，技能负责把需求接到可运行、可检查的任务流程上。

这是供 Codex、Claude Code 等 Agent 使用的操作技能。它把 [js-superagent](https://github.com/imjszhang/js-superagent)、[js-longrun](https://github.com/imjszhang/js-longrun)、[js-agent-runtime](https://github.com/imjszhang/js-agent-runtime) 与 [lark-cli](https://github.com/larksuite/cli) 的安装和协作方法组织成一套工作指引。持续执行由部署后的服务承担；本技能不维护另一套后台服务或任务状态库。

## 可以用它做什么

- **搭建环境**：检查已有配置，安装缺失且兼容的依赖，接入执行器与飞书账号。
- **设计任务**：明确输入、成果、执行频率、额度、人工审核和完成条件，选择普通工单或长期任务。
- **接入人工审核**：配置飞书卡片，核对答案保存、任务继续执行与业务结算的完整过程。
- **维护运行**：查看进度，定位卡住的工单、回调或结算，恢复运行并保留历史状态。
- **升级部署**：核对组件兼容性、安装版本和现有配置，验证升级后的运行结果。

按任务需要选择组件：普通工单可以只用 js-superagent；持续任务再接入 js-longrun；需要额外执行适配或飞书交互时，再配置相应能力。

## 开始使用

先将本仓库的 `skills/js-superagent-skill/` 目录复制到目标项目的技能发现目录：

| 使用环境 | 安装位置 |
|---|---|
| Codex | `<项目>/.agents/skills/js-superagent-skill/` |
| Claude Code | `<项目>/.claude/skills/js-superagent-skill/` |
| 已有集中技能管理的项目 | 安装到项目维护源，再用该项目的生成器生成 Agent 入口 |

保留整个目录及相对路径，只为所用客户端配置一个同名入口。可安装内容的入口是 [SKILL.md](skills/js-superagent-skill/SKILL.md)；仓库根目录的开发与版本管理文件无需复制。

随后在目标项目中告诉 Agent：

> 使用 js-superagent-skill，帮我安装并接入持续任务系统。先检查已有环境，复用兼容配置，再补齐缺失依赖。

或从一个具体需求开始：

> 使用 js-superagent-skill，帮我设计一个每周收集资料并生成报告的长期任务。先把输入、输出、审核方式和完成条件落实到项目文件。

已有部署时：

> 使用 js-superagent-skill，检查当前任务运行情况，确认飞书卡片提交后能否自动结算，保留已有工单与审核状态。

Agent 会按需要实际安装依赖、配置并验证；账号登录或验证需要你本人完成时，会交接对应步骤。仅复制技能文件不会自动安装运行包或启动任务，部署后的启动、发送和发布按你的任务授权执行。

## 关联项目与分工

| 项目 | 作用 | 与本技能的关系 |
|---|---|---|
| [js-superagent](https://github.com/imjszhang/js-superagent) | 持久工单、协调者与 Worker、会话、子任务及人工输入 | 任务执行与协作基础，本技能帮助安装、配置和维护 |
| [js-longrun](https://github.com/imjszhang/js-longrun) | 长期任务定义、回合、额度、审核核验与业务结算 | 在 superagent 之上组织持续任务；业务规则仍由宿主项目提供 |
| [js-agent-runtime](https://github.com/imjszhang/js-agent-runtime) | 规划、探测并调用具体 Agent 的执行接口 | 宿主需要执行适配或受管子任务时使用；不是每个 Worker 的必经层 |
| [lark-cli](https://github.com/larksuite/cli) | 飞书配置、授权、查询与诊断 | 帮助操作者接入和排查飞书；日常发卡与回调使用 superagent 通道 |
| [dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) | DeepSeek 发布的 super-agent 研究原型 | js-superagent 的上游参考，提供工单、主动协作和减少人工注意力消耗等设计背景 |

这些组件按项目需要组合，不是固定的顺序流水线。你与 Coding Agent 通过本技能完成部署和维护；部署后由 superagent 执行工单，longrun 管理长期任务的推进与结算，飞书承接需要人的判断。

本项目独立维护，不是 DeepSeek 或飞书的官方产品。组件仍在演进，当前验证基线见[安装与配置](skills/js-superagent-skill/references/setup.md)；实际接入以目标项目和所选版本的能力为准。

## 文档

- [技能入口](skills/js-superagent-skill/SKILL.md)：按当前意图选择操作流程。
- [安装与配置](skills/js-superagent-skill/references/setup.md)：依赖、执行器、账号与后台部署。
- [任务设计](skills/js-superagent-skill/references/tasks.md)：从需求到工单、长期任务与业务适配。
- [运行维护](skills/js-superagent-skill/references/operations.md)：检查、恢复、升级与验收。
- [飞书接入](skills/js-superagent-skill/references/feishu.md)：卡片、授权、回调与排障。
- [变更记录](CHANGELOG.md)：版本变化与迁移说明。

## 开发与验证

在本仓库运行：

```sh
npm run check
```

检查版本一致性、脚本语法和测试，包括技能目录独立复制后的可用性。

只读检查目标项目的依赖安装情况：

```sh
node skills/js-superagent-skill/scripts/inspect.mjs --project /absolute/target/project
```

该工具只读取依赖元数据和工具版本，不读取凭据或初始化服务。安装检查通过不代表后台、账号、卡片回调和业务结算均已验收。

## 版本管理

技能使用独立 SemVer，不跟随 js-superagent 或 js-longrun 的包版本。VERSION、package.json 和 SKILL.md 的 metadata.version 必须一致，CHANGELOG.md 记录每次变化。

- PATCH：修正文档、诊断或兼容性，不改变使用合同。
- MINOR：新增操作流程或工具能力。
- MAJOR：不兼容的入口、安装格式或行为变化。0.x 阶段的不兼容变化提升 MINOR 并说明迁移要求。

更新时修改三处版本及 changelog，运行 `npm run check`，提交后创建带注释的 `v<版本>` 标签并同步。标签不移动；有修正就发布新版本。`RELEASE_TAG=v0.2.1 npm run check:version` 可校验标签对应关系。GitHub CI 检查每次提交和标签。此技能不是 npm 包，版本标记不执行 npm publish。

宿主安装记录单独放在宿主管理目录（例如 `skills/installations/js-superagent-skill.json`），不放入技能内容目录；记录包含 version、sourceTag、sourceCommit 和文件 SHA-256。升级前验证旧清单，遇到本地修改先合并，不能覆盖；随后按指定标签复制资源并重新生成原生入口。回退使用旧标签重新安装技能文件，不回滚业务状态库或运行包。安装技能的新版本不自动升级其管理的依赖。

## 仓库分层

```text
skills/js-superagent-skill/   可安装技能：SKILL.md、agents、references、scripts/inspect.mjs、LICENSE
scripts/                     仓库开发与版本校验工具
test/                       仓库测试（不安装）
.github/                     CI（不安装）
README.md                    项目说明（不安装）
VERSION / CHANGELOG.md       版本及历史（不安装）
package.json / LICENSE       项目元数据与许可
```

安装只复制技能目录；版本随 SKILL.md 的 metadata.version 分发。仓库校验工具、测试、项目说明、变更历史和宿主安装清单都不属于技能运行内容。0.1.x 的仓库根技能目录迁到上述路径，旧安装副本中的 VERSION、CHANGELOG.md、INSTALLATION.json 应在验证未被修改后迁出或清理；安装清单保留在宿主管理目录。

## 许可证

[MIT](LICENSE)
