# 飞书接入与诊断

先检查 `lark-cli --version`。缺失时按 setup 文档安装官方 `@larksuite/cli`。相关 lark-shared/lark-im 技能在目标环境可用时读取其当前用法；否则查已安装 CLI 的 help/schema 与官方文档，不依赖其他电脑上的绝对技能路径。

## 身份与授权

- 查询/操作明确选 `--as bot` 或 `--as user`；两者权限不同，不以切换身份绕过缺失权限。
- CLI 配置与 js-superagent 飞书通道配置相互独立。核对是否同应用、租户和目标机器人；不要打印 appSecret/accessToken。
- 可用 `lark-cli auth status --json --verify` 核验登录。未配置应用时先看 `config init --help`；仅用户授权创建新应用配置时使用 `config init --new`，不要覆盖已有应用。
- bot 缺 scope 需要应用后台配置，用户 auth login 不会修复 bot 权限。用户身份按实际所需 scope/domain 走 auth login，避免默认请求全部权限。
- 授权 URL 原样提供，并用 `lark-cli auth qrcode --help` 确认参数后生成二维码；不要求用户把密码、token 或验证码发到聊天中。授权完成后继续执行核验，不把“已打开页面”当作成功。

## 群接入检查

机器人入群不等于项目开始接收该群。先核对真实群 ID、机器人应用和发送者在该应用下的身份，再通过公开配置入口登记群接收范围与发送者准入；仅 @ 模式不自动授权所有群成员或其他机器人发起工作。

涉及项目材料时，同时按[材料配置](materials.md)核对读取者和输出目的地。操作员私聊的 `feishu/operator` 与普通群的 `feishu/<chatId>` 是不同目的地；同一个人有读取权，不等于结果可发给整个群。只为获授权的具体群及所需材料补齐目的地，不自动扩大文件范围、其他群或额外项目。材料配置变化可能使已有绑定失效，先检查在途工作，再按 revision 更新；不回写旧绑定或重放旧消息。

真实验收使用已授权的人类身份通过 lark-cli 发 @ 消息，发送后读取消息的 `mentions` 确认实际点名了目标机器人；普通文本中的名字不算 @。核对原消息对应的建单结果、工单实际材料绑定、观察记录和群内最终回复。验证 current 时，把报告中的实际内容/哈希与源项目当前未提交文件比较，不能仅凭存在 worktree、工单 completed 或回复送达认定读到了当前材料。

若已选定材料却没有绑定或没有材料观察，先查授权/版本及执行记录；在旧运行包上可能已降级到普通 worktree 执行，不能将此报告当作 current 验收。js-superagent 0.15.0-alpha.4 起选定材料绑定失败会拒绝接单执行；保留原失败及回执，修复后按既有恢复入口和用户授权继续，不另发重复请求掩盖失败。既有 `reevaluate` 恢复要求已配置语义 assessor；仅使用飞书直接接单的部署需先配置 assessor，本版没有新增无 assessor 的自动恢复路径。未配置默认材料且未显式选定材料的普通任务仍沿原方式执行。

## 卡片路径

日常卡片由 js-superagent 的 operator channel 创建，并由同一服务接收 `card.action.trigger`。不要额外开启竞争的事件消费连接。回调配置未启用时，即使 WebSocket 健康也可能收不到卡片动作；检查飞书开发者后台对应回调配置。

已知消息 ID 后先看帮助，再读取：

```sh
lark-cli im +messages-mget --help
lark-cli im +messages-mget --message-ids <message-id> --as bot --no-reactions
```

核对真实卡片是否包含决定、必填理由和提交按钮。答案的 ticket/attention 绑定、来源和记录次数由 superagent 查询；API 成功通常为 `ok:true` 或进程退出码 0，不要要求不存在的顶层 `code:0`。

当前已验证 CLI 可以查询、发送、回复、更新卡片和消费事件，但没有代用户提交已有审核表单的接口。真实验收需要用户或受支持的真实 UI 操作；SDK 注入和文本回复是不同测试，不能伪装为 feishu-card。若用户要求代操作，先核对当前官方能力，缺失时说明准确限制。

需要手动发测试消息时先确认会话、身份和测试范围，复用明确授权；只读排障不包含发送授权。写请求模糊失败后先核对是否已送达，使用幂等机制，不能盲目重发。避免修改原生产卡片来做试验。

lark-cli 文件参数通常要求 cwd 下相对路径；输入 JSON 优先结构化参数或 stdin。发送/修改卡片时遵循当前官方卡片 schema 和相应 lark-im 技能流程，不猜 card JSON。
