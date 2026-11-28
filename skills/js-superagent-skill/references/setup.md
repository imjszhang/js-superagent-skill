# 安装与配置

## 先识别，再安装

确认目标项目、Node、现有依赖、实际运行入口和服务。新部署默认复用本机兼容的全局组件；已有绑定优先，未迁移的已有服务继续使用项目本地组件。显式选择本地安装仍可用。组件共享不共享项目身份、配置、知识、权限、任务或状态。

先运行只读检查；`<skill>` 为技能目录，`<root>` 为项目绝对路径：

```sh
node <skill>/scripts/inspect.mjs --project <root>
node <skill>/scripts/components.mjs --project <root> inspect
```

检查只读清单，不导入依赖代码、不初始化运行时、不创建组件绑定。区分缺失、版本不兼容、绑定漂移与来源冲突；不要仅因旁边有源码目录或 PATH 中存在命令就判为可用。全局目录通过当前 npm 查询，不能写死 Homebrew、Node 版本管理器或系统路径。记录实际 Node、包根、版本及 CLI/SDK 入口；多个 Node/prefix 时核对使用的是哪一个。

接入协调者运行事实时，按[运行事实能力核验](context-facts.md)检查已连接 SDK 的公开 capability 和 longrun 同步结果。安装清单中的 `hostFacts: not-observed` 不表示已支持或已失败；不为诊断初始化运行时。版本与 exports 只证明安装布局，不能代替实际 capability。

安装前从 npm registry 查询候选包的 version、engines、peerDependencies、repository，选择兼容的准确版本，核对来源：`imjszhang/js-superagent`、`imjszhang/js-longrun`、`imjszhang/js-agent-runtime`；飞书 CLI 为 `larksuite/cli`。不要仅根据 latest 推断稳定性或最新预发布版，部分 alpha 使用单独的 dist-tag。

仅为目标所需且本机缺失的组件安装一次。以已核对的准确版本替换下方占位值，按需选取参数；已安装组件不得因接入另一个项目被隐式升级：

```sh
npm install -g js-superagent@<准确版本> js-longrun@<兼容版本>
# 仅当宿主需要执行适配或飞书连接时：
npm install -g js-agent-runtime@<准确版本> @larksuiteoapi/node-sdk@<兼容版本>
```

普通项目无需因此创建 package.json、锁文件或 node_modules。需要项目独立版本时，使用原包管理器精确安装并明确选择 local；不得覆盖已有 manifest 或额外创建另一种锁文件。已安装并兼容的组件无需反复安装。缺少全局安装权限时，不 sudo、不更改系统前缀；使用允许写入的用户级安装位置，或按项目已有约束采用本地安装。

首次部署在正式启动前保存组件绑定：

```sh
node <skill>/scripts/components.mjs --project <root> bind --source global
# 明确采用项目版本的例外：
node <skill>/scripts/components.mjs --project <root> bind --source local
```

绑定存放在 `~/.js-superagent-skill/projects/<真实项目路径的摘要>/components.json`，前台 CLI 和隔离测试可用 `JS_SUPERAGENT_SKILL_HOME` 指定根目录；当前受管服务不持久传递这个变量，使用非默认根目录时安装服务会明确拒绝，部署后台使用默认绑定根。使用工具生成与校验，不手工写路径编码或改记录制造一致。绑定保存准确 Node 路径/版本、组件包根/版本和清单摘要；后台不依赖交互 shell 的 PATH。已有绑定漂移或不可读时明确拒绝，不静默换到另一份包。绑定只选择程序，不初始化任务、迁移状态或授权执行。

新版绑定写入使用 SQLite 系统锁，进程退出或重启后自动释放，不以主机名或 PID 判断锁是否存活。`components.json.lock` 是持久的协议标记，不是正在运行的证明，不要删除；它同时阻止旧版目录锁写入器混入。升级后的绑定写入必须继续使用新版技能。遇到旧版遗留的 `.lock` 目录时仍保守拒绝，需核实原写入者，不自动清除未知目录。

全局安装的 js-longrun 可能仍解析到嵌套的另一份 superagent，飞书 SDK 也可能只装在项目内。必须从选定组件的实际位置核对依赖解析，不能分别看两个 `--version` 就认定同一组合。共享的可选 SDK 需要处于 superagent 可以解析的位置。

缺失 Node 时按宿主平台与现有管理器安装满足所有已选组件 engines 的版本；不要替换正在使用的系统默认 Node。飞书 CLI 已可用则复用；缺失时查官方安装说明和 engines 后，按准确版本安装 `@larksuite/cli`。模型 CLI 与 lark-cli 沿各自配置检测，不把它们的存在当作 SDK 导入成功。

历史已验证组合（2026-11-11）为 superagent 0.14.0-alpha.4、longrun 0.1.0-alpha.2、agent-runtime 0.2.2；它只作为历史基线。0.7.6 的运行事实组合为 superagent 0.15.0-alpha.16 与 longrun 0.2.0-alpha.1；0.7.7 增加 alpha.17 的精确包布局支持。准确兼容矩阵以 `scripts/compatibility.mjs` 为准；开发依赖的旧版本用于回归，不能当作新部署推荐。候选构建、正式发布、协议验证和目标部署分别验收。

## 共享组件与已有项目迁移

1. 读取原服务、Node、包位置、版本、wrapper/参数与运行意图，保存工单、任务、知识、权限和业务状态基线。已有服务使用本地包时，不因技能升级自动改为全局。
2. 保留宿主业务 wrapper。直接 `import 'js-longrun'` 等 SDK 的宿主必须先改用统一加载入口，示例如下；所有实际使用的公开子路径同样处理，不写死 dist 或 node_modules。不要依赖 NODE_PATH，也不通过安装一份全局 CLI 假装本地 SDK 已迁移。

   ```js
   import { importComponent } from '<技能相对路径>/scripts/components.mjs';
   const { plan, probe, run } = await importComponent(projectRoot, 'js-agent-runtime');
   ```

3. 先验证共享组合及宿主适配，再停止相关服务并证明包装/子进程实际退出，通过一致备份方式保存状态。旧部署从本地切换全局时，通过正式 uninstall/install 重建服务注册，保留环境、凭据引用、路由、定时参数及原状态目录。注册移除不删除业务状态。
4. 原服务注册移除后，以 `bind --source global --replace` 替换已有绑定；首次绑定省略 `--replace`。不要在旧服务仍运行或仍注册时重绑，不能绕过绑定漂移后直接启动。longrun watcher/定时器与 superagent 分别按各自管理入口恢复，原来停止的服务仍保持停止。
5. 核对同一项目身份、任务与工单状态、知识、服务入口、Node 和组件版本；验证无项目组件副本时仍可导入、知识检查、宿主查询及后台重启。成功后才移除原本地 js-* 依赖，保留其他业务依赖和锁文件。DSH 的执行路径、依赖修复与冻结会话单独审计，不顺带切换全局版本。

共享目录内的包更新会影响全部使用它的项目。更新前列出绑定到该目录的项目，核对所有服务注册与进程、停止所有受影响写者，再安装、核验和逐项目重绑/恢复；不能只停止当前项目就覆盖全局文件。版本检查可以拒绝漂移，但不能让仍运行的进程免于延迟加载被替换的文件。需要各项目同时使用不同版本时，采用分别保留的用户级安装位置和明确绑定；不要宣称本版会自动管理并行版本或自动协调所有服务升级。回退前还须检查升级后的业务写入，不能只降包或覆盖旧状态。

## 执行能力与账号

js-agent-runtime 没有同名 CLI；它导出 `plan`、`probe`、`run`。调用该库的宿主脚本与 job profile 由项目维护。先读取目标版本 README/类型与配置示例，plan/probe 验证通过后才运行授权工作。不要把依赖安装成功当作模型 CLI 或模型认证已可用。

superagent 的 Worker 可以直接使用其原生执行器。根据用户选择检查 Codex/DSH 等可执行文件与认证；仅安装实际需要的执行器。DSH 的具体配置经已安装 `harness doctor`/`executor` 帮助核对，不能猜 `init --driver dsh` 等选项。

DSH 的 Node 门槛单独核对，例如 `0.2.2-rc.5` 要求 Node >=24.9，不能由 superagent 自身的 Node >=22.13 推断可用。采用新 DSH 时读[运行维护](operations.md)中的“DSH 执行工具与依赖审计”，检查准确执行路径、适配版本、工具边界和旧会话。`0.7.7` 增加 alpha.17 包布局兼容；具体 DSH 候选的运行验收与发布状态由部署记录给出，不仅据此声明已就绪。

飞书连接还需在所选 superagent 能解析的位置安装可选 SDK；已验证 `@larksuiteoapi/node-sdk@1.76.0`，升级时核对 superagent 文档。CLI 的应用身份与 superagent 连接的应用/租户/机器人须匹配，不能把“CLI 已登录”当作机器人连接已配置。

配置飞书时，执行[部署、升级与恢复前的只读检查](feishu.md)：分别核对应用 bot 与用户 scope，用后台同应用的 bot 身份实际读取目标群主消息和话题历史。只检查 WebSocket、scope 清单或用户身份读取成功不足以完成接入。先核对历史失败、游标及可能积压，再恢复接收；真实 @、断线补收、原话题非 @ 跟进、回复与去重按同文档验收，不增加另一套权限配置或轮询进程。

凭据使用部署支持的环境变量、受保护文件或账号登录，不能复制另一个项目的 .env，也不在聊天或日志输出 token。账号授权链接交给用户完成，然后由 Agent 继续配置与验证。

## 初始化和后台

先检查是否已有配置、注册身份和状态。已有项目使用 setup/status/health；只有明确的新部署才运行 `init`。不要用 `init`、`project reinitialize` 或删除数据库来处理升级。

CLI 例子中的 `<root>` 都是目标项目绝对路径，使用组件绑定与知识包装入口：

```sh
node <skill>/scripts/project-agent.mjs --project <root> --help
node <skill>/scripts/project-agent.mjs --project <root> setup check
node <skill>/scripts/project-agent.mjs --project <root> service health
```

新工单需要隔离时显式选择 `--workspace auto`；默认 in-place 不能被描述成独立工作区。SDK `.init()` 可能创建或迁移状态，不用它做“无副作用的安装检查”。

需要调查当前项目含未提交文件时，按[项目材料与执行环境](materials.md)配置受控材料入口。`auto` 的 Git worktree 内容来自提交，不能用它证明源项目实时情况。本适配器支持 js-superagent 0.15.0-alpha.0、0.15.0-alpha.1、0.15.0-alpha.2、0.15.0-alpha.3、0.15.0-alpha.4、0.15.0-alpha.5、0.15.0-alpha.6、0.15.0-alpha.7、0.15.0-alpha.10、0.15.0-alpha.11、0.15.0-alpha.12、0.15.0-alpha.13、0.15.0-alpha.14、0.15.0-alpha.15、0.15.0-alpha.16、0.15.0-alpha.17 的材料包布局，材料合同使用 schema 15；部署前核对实际发布及公开 capability，不因技能升级自动替换上面的已部署组合。执行目录、材料来源、协调者知识分别验收。新增飞书群按[群接入检查](feishu.md)核对接收、准入、材料读取者与输出目的地，不能仅凭机器人已入群完成部署。

配置接口有 revision 参数时，先读当前设置再按版本更新。启用 managed jobs 需要宿主提供可信 profile/工具目录；单工单限制只能收紧项目能力。

superagent 与 longrun 各自管理自己的服务。支持 `service` 的 longrun 版本可安装 macOS 登录后台 watcher 与兜底定时器；旧版仍使用已部署的宿主入口。按[长期任务目录与后台](longrun-service.md)核对配置、正式入口与能力，保留宿主业务 wrapper、绝对可执行路径、环境和单实例归属。安装不启动，启动后台不启用 draft/disabled 任务。其他平台核对实际支持能力，不照搬 launchd。

## 协调者的项目知识

部署包含[项目知识接入](knowledge.md)：默认准备项目专属运行时目录下的 `knowledge/project.md`，将知识同步包装入口接入实际后台启动链路。启动或重启前读取目录里的 Markdown，仅用于协调者；不热加载，不改运行库。已有服务保留原安装参数和业务路由，文件与已保存内容检查通过后恢复原运行状态。技能升级本身不覆盖知识或重启服务。

## 验证安装结果

1. 对照组件绑定和适用的安装记录检查来源、版本与 Node；确认 longrun peer 和飞书 SDK 实际解析到已核对组合。
2. CLI help/version 和 SDK 导入；无业务副作用。
3. 已有后台的健康、执行器能力与连接状态；网络验证只做当前任务所需检查。
4. 核对知识加载与实际后台入口，分别报告连接健康和真实业务问答验收。
5. 隔离 trial 验证业务格式，再按用户授权进行真实执行/卡片测试。见运行维护文档的证据层级。
6. 使用宿主事实接入的组合按[运行事实验收](context-facts.md)检查无活跃工单的任务概览、在途执行与旧历史、同步故障和权限撤回；保留原业务状态与服务运行意图。

## 完成后带用户开始使用

按 [开始使用与交接](onboarding.md)完成交付：说明实际完成阶段、本项目能做什么、在哪里交代任务和查看结果；提供项目化的首用草稿与标明发送位置的自然语言指令。确认尚无任务时主动帮助用户选择第一项维护目标；已有明确目标与授权时，带着完成首次执行与成果核对，或到达需要用户处理的明确交接点。不要停在“依赖安装成功”或把未核验的环境说成已部署。
