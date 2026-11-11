# 维护与发布

[返回 README](../README.md)

## 版本管理

技能使用独立 SemVer，不跟随 js-superagent 或 js-longrun 的包版本。VERSION、package.json、package-lock.json 和 SKILL.md 的 metadata.version 必须一致，CHANGELOG.md 记录每次变化。

- PATCH：修正文档、诊断或兼容性，不改变使用合同。
- MINOR：新增操作流程或工具能力。
- MAJOR：不兼容的入口、安装格式或行为变化。0.x 阶段的不兼容变化提升 MINOR 并说明迁移要求。

更新时同步版本字段及 changelog，运行 `npm run check`，提交后创建带注释的 `v<版本>` 标签并同步。标签不移动；有修正就发布新版本。`RELEASE_TAG=v0.5.0 npm run check:version` 可校验标签对应关系。GitHub CI 检查每次提交和标签。此技能不是 npm 包，版本标记不执行 npm publish。

宿主安装记录单独放在宿主管理目录（例如 `skills/installations/js-superagent-skill.json`），不放入技能内容目录；记录包含 version、sourceTag、sourceCommit 和文件 SHA-256。升级前验证旧清单，遇到本地修改先合并，不能覆盖；随后按指定标签复制资源并重新生成原生入口。回退使用旧标签重新安装技能文件，不回滚业务状态库或运行包。安装技能的新版本不自动升级其管理的依赖。

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

0.4.0 新增首次使用与部署交接，维护源为技能内 `references/onboarding.md`，入口、安装、任务与运行维护流程引用同一份规则。安装指令要求显式加载该指引；复制技能文件本身不会自动触发引导。升级已有项目时沿用任务和进度，不重新初始化，也不升级运行组件。

0.5.0 增加协调者专属知识目录与启动包装入口。兼容工具固定验证 js-superagent 0.14.0-alpha.1：只读预演依赖该版本内部 PromptRegistry/SQLite，写入使用公开接口，服务通过公开 cliPath 安装。改变支持版本时重跑知识隔离、文件增删、冲突和启动回执测试。真实宿主知识与凭据不进入技能仓库。

0.6.0 增加材料部署与恢复指引。版本/schema 矩阵统一维护在可安装的 `scripts/compatibility.mjs`；安装检查只提示兼容布局，运行能力从公开 SDK 读取。开发依赖继续覆盖旧 alpha.1。使用 `JS_SUPERAGENT_CANDIDATE_PACKAGE=/绝对路径/候选包 npm test` 对新精确构建重复知识及材料配置测试；候选测试从该目录的 package.json 导出定位，不依赖技能仓库旁的源码。新包支持知识 schema 14/15，旧包只允许14；不在 wrapper 内迁移。

0.6.1 将准确兼容矩阵扩展到 js-superagent 0.15.0-alpha.1 / schema 14、15，保留 0.15.0-alpha.0 与 0.14.0-alpha.1–alpha.4。候选材料测试仅接受这两个 0.15 准确版本，未知补丁版本仍拒绝；分别对旧开发依赖及选定候选目录运行检查，兼容性结果不替代 npm 发布确认或项目授权。

0.6.2 增加 js-superagent 0.15.0-alpha.2 / schema 14、15 的准确兼容项，保留之前的矩阵。候选检查仍从指定包目录读取实际版本；发布前需对选定构建运行该检查。材料指引补充过期历史报告只作元数据定位、当前调查重新读取的边界，不以技能版本代替运行包实现或实际通道验收。
