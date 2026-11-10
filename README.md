# js-superagent-skill

项目操作者技能：主动安装缺失依赖，接入 js-superagent / js-longrun / js-agent-runtime / lark-cli，设计任务、维护运行和验证人工审核与结算。版本 0.2.1，MIT；这是技能项目，不是另一个后台服务或 npm runtime。

入口为 [SKILL.md](skills/js-superagent-skill/SKILL.md)。依赖安装属于技能被用户要求接入项目时的动作；安装技能文件本身不安装运行包、启动模型或发送消息。

## 安装

通用项目：将 `skills/js-superagent-skill/` 的内容完整复制到目标 Agent 的项目技能目录 `js-superagent-skill/`，保持相对资源路径。只选所需发现目录，避免在同一个客户端重复安装同名技能。

采用集中技能目录的宿主：安装完整资源到 `skills/js-superagent-skill/`，登记宿主 catalog 后通过宿主生成器更新原生入口。不要用跨仓库绝对路径或软链接代替可移植的安装副本。

独立项目是上游维护源；宿主安装副本可以随宿主提交以支持其他机器使用。更新时对比安装清单与本地修改，复制明确版本后重新生成入口，不覆盖宿主自行修改的文件。宿主业务规则与生产状态不回写到此仓库。

## 验证

```sh
npm run check
node skills/js-superagent-skill/scripts/inspect.mjs --project /absolute/target/project
```

inspect 仅读取依赖元数据和工具版本，不读取 .env、不初始化 SQLite、不检查账号、不启动服务。检查成功不代表已完成接入。

references 中的版本组合是 2026-11-10 已验证基线；实际安装先核对 registry、engines、peer 和目标项目约束。需要账号授权时，用户在官方页面完成，Agent 继续余下操作。

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
