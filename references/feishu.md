# 飞书接入与诊断

先检查 `lark-cli --version`。缺失时按 setup 文档安装官方 `@larksuite/cli`。相关 lark-shared/lark-im 技能在目标环境可用时读取其当前用法；否则查已安装 CLI 的 help/schema 与官方文档，不依赖其他电脑上的绝对技能路径。

## 身份与授权

- 查询/操作明确选 `--as bot` 或 `--as user`；两者权限不同，不以切换身份绕过缺失权限。
- CLI 配置与 js-superagent 飞书通道配置相互独立。核对是否同应用、租户和目标机器人；不要打印 appSecret/accessToken。
- 可用 `lark-cli auth status --json --verify` 核验登录。未配置应用时先看 `config init --help`；仅用户授权创建新应用配置时使用 `config init --new`，不要覆盖已有应用。
- bot 缺 scope 需要应用后台配置，用户 auth login 不会修复 bot 权限。用户身份按实际所需 scope/domain 走 auth login，避免默认请求全部权限。
- 授权 URL 原样提供，并用 `lark-cli auth qrcode --help` 确认参数后生成二维码；不要求用户把密码、token 或验证码发到聊天中。授权完成后继续执行核验，不把“已打开页面”当作成功。

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
