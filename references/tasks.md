# 任务设计与创建

先把目标写成项目任务说明：输入来源、可写成果路径、完成条件、是否逐项审核、触发/间隔、限额、执行与审核超时，以及失败后的处理。无法从项目推断的关键事项才询问用户；通用默认值应注明假设。

## 选择执行形式

- 一次性成果：superagent 普通工单，不强行引入回合和额度。
- 基于提供的本地输入的定期报告：longrun `change-report@1`，不逐项审核。
- 基于提供的本地输入的候选建议：`review-items@1`，逐项采纳/拒绝/稍后及理由，支持重新审核。
- 搜索、外部采集或特殊业务结构：需要项目实现业务适配器/可信子任务。内置类型只处理冻结的本地输入，不能把“在 prompt 里要求联网”当作已经支持采集型任务。

当前内置类型不是任意插件加载系统。自定义类型/宿主路由先核对公开接口，把业务实现留在项目；不能把宿主规则硬编码到独立包或技能。

## 使用原有入口

已有 wrapper 注入业务路由时继续使用它，例如项目 npm longrun 脚本。裸 `js-longrun tick/watch` 只发现其通用任务，不能替代宿主 wrapper 管理兼容业务。

新通用项目的 CLI 示例（先核对安装版本的 help）：

```sh
./node_modules/.bin/js-longrun --project <root> types
./node_modules/.bin/js-longrun --project <root> design weekly-report --type change-report@1
./node_modules/.bin/js-longrun --project <root> create weekly-report --type change-report@1 --goal '总结提供的本地资料变化'
./node_modules/.bin/js-longrun --project <root> validate weekly-report
./node_modules/.bin/js-longrun --project <root> plan weekly-report
```

create 仅创建 draft；按生成结构编辑 task.json 的输入路径及 task.md，再 validate/plan。先读现有同 ID 状态，重复请求不重复创建。先准备真实任务文件，不把计划输出描述成执行结果。

`trial --result <fixture.json>` 是隔离离线夹具验证，不调用模型、不发卡，也不能算真实验收。

用户授权启动后才 enable/round。`enable` 只记录允许运行，不立即派工；`round` 检查到期、额度及活动回合。`watch` 只收集，不开新回合；`tick` 默认收集/检查，显式 `LONGRUN_OPEN_ROUNDS=1` 才打开符合条件的回合。

## 审核与结算

冻结输入 → 工单工作区结果 → 宿主审核快照 → 结构化决定 → 原 Worker 续作 → longrun 核验 → 正式成果。工单 ready/completed 不等于业务 settled。

回合可复用上轮记忆但保持独立身份、冻结定义和结算记录。冷却和额度控制是否允许开下一轮；不得为测试绕过生产门控。重新审核应使用既有 rereview 入口，保留原决定、原证据及来源回合；不要手改 pending/later 状态制造入口。

任务“稍后”如何再触发、定时报告如何处理无变化，必须来自任务类型与配置，而不是技能推断。测试数据使用隔离账本和明显测试标记，不操作真实候选。
