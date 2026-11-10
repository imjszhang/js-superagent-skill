# 维护与发布

[返回 README](../README.md)

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
