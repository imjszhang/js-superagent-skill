# 维护与发布

[返回 README](../README.md)

## 版本管理

技能使用独立 SemVer，不跟随 js-superagent 或 js-longrun 的包版本。VERSION、package.json、package-lock.json 和 SKILL.md 的 metadata.version 必须一致，CHANGELOG.md 记录每次变化。

- PATCH：修正文档、诊断或兼容性，不改变使用合同。
- MINOR：新增操作流程或工具能力。
- MAJOR：不兼容的入口、安装格式或行为变化。0.x 阶段的不兼容变化提升 MINOR 并说明迁移要求。

更新时同步版本字段及 changelog，运行 `npm run check`，提交后创建带注释的 `v<版本>` 标签并同步。标签不移动；有修正就发布新版本。`RELEASE_TAG=v0.5.0 npm run check:version` 可校验标签对应关系。GitHub CI 检查每次提交和标签。此技能不是 npm 包，版本标记不执行 npm publish。

宿主安装记录单独放在宿主管理目录（例如 `skills/installations/js-superagent-skill.json`），不放入技能内容目录；记录包含 version、sourceTag、sourceCommit 和文件 SHA-256。升级前验证旧清单，遇到本地修改先合并，不能覆盖；随后按指定标签复制资源并重新生成原生入口。使用尚未发布的工作树候选时明确记录 candidate 状态、基线提交、改动摘要与文件哈希，sourceTag 留空，不声称来自不存在的标签。回退使用旧标签重新安装技能文件，不回滚业务状态库或运行包。安装技能的新版本不自动升级其管理的依赖。

## 仓库分层

```text
skills/js-superagent-skill/   可安装技能：SKILL.md、agents、references、scripts/inspect.mjs、assets、LICENSE
docs/                       架构与维护说明（不安装）
scripts/                    仓库开发与版本校验工具
test/                       仓库测试（不安装）
.github/                    CI（不安装）
README.md                    项目说明（不安装）
VERSION / CHANGELOG.md       版本及历史（不安装）
package.json / LICENSE       项目元数据与许可
```

安装只复制技能目录；版本随 SKILL.md 的 metadata.version 分发。仓库校验工具、测试、项目说明、变更历史和宿主安装清单都不属于技能运行内容。0.1.x 的仓库根技能目录迁到上述路径，旧安装副本中的 VERSION、CHANGELOG.md、INSTALLATION.json 应在验证未被修改后迁出或清理；安装清单保留在宿主管理目录。

README 和 docs 是仓库说明，不随技能安装。仅修改这些文件时无需重发技能版本；修改可安装目录时按上述规则更新版本、变更记录和宿主安装清单。

## 长期任务流程验收

0.3.0 增加 Project Agent 的设计、运行交接、定义变更和退役流程。技能内 `assets/task-brief.md` 是可填写的任务约定；两个 `.task.json` 是本地输入类型的起点，需要按项目改 ID、输入、时区和规则。它们不是已授权任务，也不会在安装时运行。

开发环境运行 `npm ci --ignore-scripts && npm run check`。开发依赖固定到公开 js-longrun/js-superagent 版本，用隔离目录检验示例创建、只读计划、状态控制、冻结定义和多任务隔离；这些依赖和测试不随技能安装。独立 Agent 场景评审见 [行为验证](behavioral-validation.md)。离线验证不能代替真实模型、飞书或后台验收。

宿主事实的维护合同在可安装的 [运行事实指引](../skills/js-superagent-skill/references/context-facts.md)。安装检查始终只读清单，`hostFacts` 报告缺失组件与尚未观察的能力/同步；不导入依赖或初始化 SDK。`hostFactsCompatibility` 只分类已取得的公开协议观察，不放宽 knowledge 的准确版本/schema 矩阵。测试覆盖缺失依赖、伪造导出和未来版本不误报支持、有效/未知 capability 区分，以及安装后相对文档链接。对候选运行包的发布、目标项目接入和真实消息验收分别留证。

0.4.0 新增首次使用与部署交接，维护源为技能内 `references/onboarding.md`，入口、安装、任务与运行维护流程引用同一份规则。安装指令要求显式加载该指引；复制技能文件本身不会自动触发引导。升级已有项目时沿用任务和进度，不重新初始化，也不升级运行组件。

0.5.0 增加协调者专属知识目录与启动包装入口。兼容工具固定验证 js-superagent 0.14.0-alpha.1：只读预演依赖该版本内部 PromptRegistry/SQLite，写入使用公开接口，服务通过公开 cliPath 安装。改变支持版本时重跑知识隔离、文件增删、冲突和启动回执测试。真实宿主知识与凭据不进入技能仓库。

0.6.0 增加材料部署与恢复指引。版本/schema 矩阵统一维护在可安装的 `scripts/compatibility.mjs`；安装检查只提示兼容布局，运行能力从公开 SDK 读取。开发依赖继续覆盖旧 alpha.1。使用 `JS_SUPERAGENT_CANDIDATE_PACKAGE=/绝对路径/候选包 npm test` 对新精确构建重复知识及材料配置测试；候选测试从该目录的 package.json 导出定位，不依赖技能仓库旁的源码。新包支持知识 schema 14/15，旧包只允许14；不在 wrapper 内迁移。

0.6.1 将准确兼容矩阵扩展到 js-superagent 0.15.0-alpha.1 / schema 14、15，保留 0.15.0-alpha.0 与 0.14.0-alpha.1–alpha.4。候选材料测试仅接受这两个 0.15 准确版本，未知补丁版本仍拒绝；分别对旧开发依赖及选定候选目录运行检查，兼容性结果不替代 npm 发布确认或项目授权。

0.6.2 增加 js-superagent 0.15.0-alpha.2 / schema 14、15 的准确兼容项，保留之前的矩阵。候选检查仍从指定包目录读取实际版本；发布前需对选定构建运行该检查。材料指引补充过期历史报告只作元数据定位、当前调查重新读取的边界，不以技能版本代替运行包实现或实际通道验收。

0.6.3 增加 js-superagent 0.15.0-alpha.3 / schema 14、15 的准确兼容项，保留全部旧版本映射。该运行包修复 Worker 启动时误撤回固定建单回执的问题；技能仅补充兼容与验收指引，不新增运行时字段或绕过材料检查。候选检查和干净消费者验收继续使用实际构建，真实通道另核对建单回执与最终材料报告。

0.6.4 增加 js-superagent 0.15.0-alpha.4 / schema 14、15，旧包布局继续支持，未知 alpha.5 拒绝。运行包从该版本开始拒绝默认材料绑定失败后的普通执行，技能不增加开关；候选消费者分别验证旧版默认材料可选与新版拒绝降级的实际行为。群接入验收同时核对来源准入、材料读取/输出授权、未提交内容及原群回复。升级材料设置前核对在途绑定；旧工单历史保留，不能通过重试悄悄采纳新设置。

0.6.5 增加 js-superagent 0.15.0-alpha.5 / schema 14、15，未知 alpha.6 继续拒绝，候选消费者保留 alpha.4/alpha.5 的材料拒绝合同。飞书维护以现有 lark-cli 的 bot scope、群和话题历史读取做实际 probe，不新增诊断状态库、调度器或权限配置。部署、升级与恢复都检查游标积压和原订阅；真实验收覆盖在线 @、断线补收、话题非 @ 跟进、原群回复及去重。旧版健康读取的写入行为明确标注，不能让诊断清除生产失败。上述实网验收需在目标部署按已有授权执行，离线版本测试不能替代。

0.7.0 将长期任务布局、独立机器运行目录、watch/tick 服务维护和安全切换汇总到可安装的 `references/longrun-service.md`。安装检查只读取配置与包声明，不执行依赖代码，不把导出存在推断成 API 兼容或健康。js-superagent 兼容矩阵增加准确的 0.15.0-alpha.10 / alpha.11 与 schema 14、15；不引入新观察 API，不更改已有 runtime 依赖。测试用候选包路径核验新组合，默认旧基线仍保留；真实飞书提交与系统定时器另在获授权部署验收。


0.7.2 增加 js-superagent 0.15.0-alpha.13 / schema 14、15 的准确兼容项，未知后续版本继续拒绝；开发依赖保留旧基线。新候选构建通过知识同步、独立包装入口和材料配置测试后才记录验证结果。运维说明区分未完整消费输入与预算拒绝、固定宿主故障 notice 与业务结果、原工单人工恢复与候选重评。不得扩大读取、消息接收或恢复权限；隔离故障注入不代表真实飞书已出现并送达故障通知。

0.7.3 仅增加 js-superagent 0.15.0-alpha.14 / schema 14、15 的准确包布局兼容，未知 alpha.15 继续拒绝。按准确候选安装包重复知识同步、独立包装入口与材料合同检查；保留旧开发依赖、knowledge、运行规则和配置，不因兼容清单更新改变已有项目。

0.7.3 旧开发依赖的完整检查为 30 项通过、2 项候选专用测试跳过；0.15.0-alpha.14 候选安装包的完整检查为 32 项全部通过。候选 tarball SHA-256 为 `f7cdfe544413b52976335f830d14f723c05402802688577e46a977efddac8f91`；这证明所测候选布局兼容，不代表 npm 已发布或目标项目已升级。

0.7.6 补齐运行事实接入与故障恢复边界，兼容矩阵精确增加 js-superagent `0.15.0-alpha.16` / schema 14、15，未知 alpha.17 仍拒绝。配套运行事实接入组合为 js-longrun `0.2.0-alpha.1`；先更新技能与知识包装入口再恢复新版本服务，避免准确版本检查阻断重启。公开 capability 与同步结果单独核对，不靠版本清单推断；协调失败回执只保证原请求和已保存记录保留，不宣称失败前未执行任何协调动作。

开发依赖继续固定 js-superagent `0.14.0-alpha.1` 与 js-longrun `0.1.0-alpha.2`，先运行默认 `npm run check`，再对已打包并解包的 alpha.16 使用 `JS_SUPERAGENT_CANDIDATE_PACKAGE=/绝对路径/候选包 npm run check`。该环境变量替换知识与材料测试使用的 superagent，长期任务样例仍验证旧 js-longrun 基线；新 longrun 组合需由包自身及隔离宿主接入检查另留证。候选检查通过不代表 npm 已发布、已有部署已升级或真实飞书卡片已送达。

0.7.6 验收（2026-11-27）：默认旧基线完整检查 32 项通过、2 项候选专用测试跳过；实际打包并解包的 js-superagent `0.15.0-alpha.16` 完整检查 34 项全部通过，包括知识隔离、启动包装、材料配置和拒绝合同。候选源码为 `9904a5512814e65747d3533cfa55ca74d9da4fe0`，构建状态干净，tarball SHA-256 为 `abf0b8dcb54e97b3baaa506ac55d7dc7f22a4cfa85fa454c63218a727ab5b4d8`。这份记录证明技能与该构建的兼容，不宣称 npm 已发布或真实飞书已验收。
