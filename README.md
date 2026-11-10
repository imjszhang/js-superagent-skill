# js-superagent-skill

项目操作者技能：主动安装缺失依赖，接入 js-superagent / js-longrun / js-agent-runtime / lark-cli，设计任务、维护运行和验证人工审核与结算。版本 0.1.0，MIT；这是技能项目，不是另一个后台服务或 npm runtime。

入口为 [SKILL.md](SKILL.md)。依赖安装属于技能被用户要求接入项目时的动作；安装技能文件本身不安装运行包、启动模型或发送消息。

## 安装

通用项目：将 SKILL.md、agents/、references/、scripts/ 复制到目标 Agent 的项目技能目录 `js-superagent-skill/`，保持相对资源路径。只选所需发现目录，避免在同一个客户端重复安装同名技能。

采用集中技能目录的宿主：安装完整资源到 `skills/js-superagent-skill/`，登记宿主 catalog 后通过宿主生成器更新原生入口。不要用跨仓库绝对路径或软链接代替可移植的安装副本。

独立项目是上游维护源；宿主安装副本可以随宿主提交以支持其他机器使用。更新时对比安装清单与本地修改，复制明确版本后重新生成入口，不覆盖宿主自行修改的文件。宿主业务规则与生产状态不回写到此仓库。

## 验证

```sh
npm run check
node scripts/inspect.mjs --project /absolute/target/project
```

inspect 仅读取依赖元数据和工具版本，不读取 .env、不初始化 SQLite、不检查账号、不启动服务。检查成功不代表已完成接入。

references 中的版本组合是 2026-11-10 已验证基线；实际安装先核对 registry、engines、peer 和目标项目约束。需要账号授权时，用户在官方页面完成，Agent 继续余下操作。
