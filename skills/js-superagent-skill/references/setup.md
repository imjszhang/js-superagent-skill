# 安装与配置

## 先识别，再安装

确认目标项目、包管理器和已有锁文件。检查 Node、现有依赖、项目运行入口和服务；不要仅因存在旁边源码目录就把它当作已安装包。`inspect.mjs` 只报告安装事实，不能证明账号或后台健康。

已验证组合（2026-11-10）：Node >=22.13；js-superagent 0.14.0-alpha.1；js-longrun 0.1.0-alpha.2；js-agent-runtime 0.2.2；lark-cli 来自官方 `@larksuite/cli`，当时为 1.0.99。superagent alpha.0 存在单工单禁用 managed jobs 与 DSH 配置不一致的问题，不用于新的完整部署。

安装前从 npm registry 查询候选包的 version、engines、peerDependencies、repository，选择兼容的准确版本，核对来源：`imjszhang/js-superagent`、`imjszhang/js-longrun`、`imjszhang/js-agent-runtime`；飞书 CLI 为 `larksuite/cli`。不要仅根据 latest 推断稳定性，首发 alpha 也可能被 npm 标为 latest。

对 npm 项目，已验证组合的安装示例：

```sh
npm install --save-exact js-superagent@0.14.0-alpha.1 js-longrun@0.1.0-alpha.2 js-agent-runtime@0.2.2
```

实际由 Agent 执行安装并检查退出状态、package.json 和锁文件。按项目现有包管理器使用对应准确版本命令，不额外生成另一种锁文件。已安装并兼容的组件无需反复安装。没有 package.json 时，确认此目录确为用户指定项目后创建最小清单，不覆盖已有工程。

缺失 Node 时按宿主平台与现有管理器安装满足 engines 的版本；不要替换正在使用的系统默认 Node。需要机器级权限而无法继续时，只请求对应步骤。

飞书 CLI 若已可用则复用；缺失时先查官方安装说明及 engines，再按准确版本安装，例如 npm 管理环境下 `npm install -g @larksuite/cli@<已核对版本>`。若项目不允许全局安装，安装到项目并以项目本地 bin 调用。不要 sudo、改全局前缀或绕过权限来强行安装。

## 执行能力与账号

js-agent-runtime 没有同名 CLI；它导出 `plan`、`probe`、`run`。调用该库的宿主脚本与 job profile 由项目维护。先读取目标版本 README/类型与配置示例，plan/probe 验证通过后才运行授权工作。不要把依赖安装成功当作模型 CLI 或模型认证已可用。

superagent 的 Worker 可以直接使用其原生执行器。根据用户选择检查 Codex/DSH 等可执行文件与认证；仅安装实际需要的执行器。DSH 的具体配置经已安装 `harness doctor`/`executor` 帮助核对，不能猜 `init --driver dsh` 等选项。

飞书连接还需宿主安装可选 SDK；已验证 `@larksuiteoapi/node-sdk@1.76.0`，升级时核对 superagent 文档。CLI 的应用身份与 superagent 连接的应用/租户/机器人须匹配，不能把“CLI 已登录”当作机器人连接已配置。

凭据使用部署支持的环境变量、受保护文件或账号登录，不能复制另一个项目的 .env，也不在聊天或日志输出 token。账号授权链接交给用户完成，然后由 Agent 继续配置与验证。

## 初始化和后台

先检查是否已有配置、注册身份和状态。已有项目使用 setup/status/health；只有明确的新部署才运行 `init`。不要用 `init`、`project reinitialize` 或删除数据库来处理升级。

CLI 例子中的 `<root>` 都是目标项目绝对路径；从项目根目录执行，优先本地 bin：

```sh
./node_modules/.bin/js-superagent --project <root> --help
./node_modules/.bin/js-superagent --project <root> setup check
./node_modules/.bin/js-superagent --project <root> service health
```

新工单需要隔离时显式选择 `--workspace auto`；默认 in-place 不能被描述成独立工作区。SDK `.init()` 可能创建或迁移状态，不用它做“无副作用的安装检查”。

配置接口有 revision 参数时，先读当前设置再按版本更新。启用 managed jobs 需要宿主提供可信 profile/工具目录；单工单限制只能收紧项目能力。

当前 service install 是 macOS 登录后台服务入口；其他平台核对实际支持能力，使用宿主认可的进程管理器，不照搬 launchd。longrun 本身不安装系统定时器。用户授权持续运行后，配置一个生产 watcher 与一个兜底定时任务，保留宿主业务 wrapper 路径；验证绝对可执行路径、PATH、凭据加载和单实例归属。

## 协调者的项目知识

部署包含[项目知识接入](knowledge.md)：默认准备项目专属运行时目录下的 `knowledge/project.md`，将知识同步包装入口接入实际后台启动链路。启动或重启前读取目录里的 Markdown，仅用于协调者；不热加载，不改运行库。已有服务保留原安装参数和业务路由，文件与已保存内容检查通过后恢复原运行状态。技能升级本身不覆盖知识或重启服务。

## 验证安装结果

1. 对照锁文件检查安装来源与版本；确认 longrun peer 使用同一份 superagent。
2. CLI help/version 和 SDK 导入；无业务副作用。
3. 已有后台的健康、执行器能力与连接状态；网络验证只做当前任务所需检查。
4. 核对知识加载与实际后台入口，分别报告连接健康和真实业务问答验收。
5. 隔离 trial 验证业务格式，再按用户授权进行真实执行/卡片测试。见运行维护文档的证据层级。

## 完成后带用户开始使用

按 [开始使用与交接](onboarding.md)完成交付：说明实际完成阶段，根据项目资料与已有任务推荐下一步，并给出可直接发送的自然语言指令。确认尚无任务时主动帮助用户选择第一项维护目标；已有明确目标与授权时，继续完成该目标后再交接。不要停在“依赖安装成功”或把未核验的环境说成已部署。
