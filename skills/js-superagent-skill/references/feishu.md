# 飞书接入与诊断

先检查 `lark-cli --version`。缺失时按 setup 文档安装官方 `@larksuite/cli`。相关 lark-shared/lark-im 技能在目标环境可用时读取其当前用法；否则查已安装 CLI 的 help/schema 与官方文档，不依赖其他电脑上的绝对技能路径。

## 身份与授权

- 查询/操作明确选 `--as bot` 或 `--as user`；两者权限不同，不以切换身份绕过缺失权限。
- CLI 配置与 js-superagent 飞书通道配置相互独立。核对是否同应用、租户和目标机器人；不要打印 appSecret/accessToken。
- 可用 `lark-cli auth status --json --verify` 核验登录。未配置应用时先看 `config init --help`；仅用户授权创建新应用配置时使用 `config init --new`，不要覆盖已有应用。
- bot 缺 scope 需要应用后台配置，用户 auth login 不会修复 bot 权限。用户身份按实际所需 scope/domain 走 auth login，避免默认请求全部权限。
- 授权 URL 原样提供，并用 `lark-cli auth qrcode --help` 确认参数后生成二维码；不要求用户把密码、token 或验证码发到聊天中。授权完成后继续执行核验，不把“已打开页面”当作成功。

## 部署、升级与恢复前的只读检查

已配置飞书的项目每次部署、升级或恢复都检查以下链路。WebSocket 已连接、收到一次 @ 或能发回复，均不能证明机器人能够读取群历史并补收离线消息。

1. 核对 CLI profile 与后台实际使用的应用、租户、机器人及目标群。`auth status` 和当前 CLI 的 `auth scopes --json` 可返回用户/tokenType=user 权限，不用作 bot 授权证明。按[查询租户授权状态](https://open.feishu.cn/document/application-v6/scope/list.md)，先看 `lark-cli api --help`，再调用 `lark-cli api GET /open-apis/application/v6/scopes --as bot`；该接口使用租户身份且无需额外 scope。检查所需权限的 `grant_status: 1`，并核对实际响应的 `scope_type`；若客户端以 `type`/`tokenType` 展示同一身份事实，也须核对，必须明确匹配 `tenant` 应用身份。字段未提供时，须结合下一步同一应用的 bot 实际 API 成功共同验证，不能把同名 user grants 算作 bot 权限。群历史在基础读取权限（如 `im:message:readonly`）之外还要求 bot 的 `im:message.group_msg`，见[历史消息 API](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/list)。缺少时在飞书应用后台添加该应用身份权限、发布并完成所需审核，再核对有效 grant；用户 `auth login`、切换 `--as user` 或只申请审核已配置权限不能替代缺失权限的配置与发布。
2. 用同一应用的 bot 身份对已配置群做实际历史读取，再对该群真实返回的话题 ID 做话题读取。先查当前 CLI help；下面的少量读取不会接单、运行 Worker 或改变运行库游标。`--dry-run` 只检查请求形状，不能代替实际 API 成功。返回空列表时，核对已知消息与时间范围，不能据此证明机器人看得到待补收消息。

   ```sh
   lark-cli im +chat-messages-list --help
   lark-cli im +chat-messages-list --chat-id <已配置群ID> --as bot --page-size 1 --no-reactions
   lark-cli im +threads-messages-list --help
   lark-cli im +threads-messages-list --thread <该群返回的话题ID> --as bot --page-size 1 --no-reactions
   ```

   群主消息与话题回复分别核对，不用已知消息详情接口的成功代替历史列表权限。一页 probe 只证明该页可读；检查 `has_more`/`page_token` 或 CLI 的分页完整性提示，在已限定区间继续分页才能核对积压，不把分页未完当成空历史。原生 API 如需排障，仅在核对已安装 help/官方文档后使用 `GET /open-apis/im/v1/messages` 的 `container_id_type=chat` 或 `thread`；不要猜不存在的 `im messages list` 命令，也不要为读取附加反应/下载资源等无关权限。
3. 读取受管服务已有心跳、source 错误、最后成功时间、历史游标和活跃/订阅话题范围。记录失败开始时间、可能积压的区间和原消息 ID。权限恢复可能让既有轮询接收积压消息并触发原授权工作；先检查这些消息与当前准入，再在用户授权范围内恢复。不能清空游标、重置 since、删除失败记录或手动注入消息来掩盖漏收。
4. 诊断保持只读：使用已安装版本公开的状态读取和 `service health` 心跳；必要时只读查看现有状态快照。不要为了检查临时创建 SDK runtime 并调用 `.init()`、`runNext()`、同步/轮询或 `request-status`。`0.15.0-alpha.4` 及之前的 `businessHealth()` 会刷新健康记录，不能当成无副作用诊断；`0.15.0-alpha.5` 的 `health` 读取持久观察，按 `business.at` 及来源的 `live`/`history` 分项核对时间和错误，`service health` 用 `business.observedAt` 标识观察时间。快照可能滞后或尚不存在，须与真实 API 和服务时间线分别报告，不能用一次本地检查清除生产告警。

## 群接入检查

机器人入群不等于项目开始接收该群。先核对真实群 ID、机器人应用和发送者在该应用下的身份，再通过公开配置入口登记群接收范围与发送者准入；仅 @ 模式不自动授权所有群成员或其他机器人发起工作。

涉及项目材料时，同时按[材料配置](materials.md)核对读取者和输出目的地。操作员私聊的 `feishu/operator` 与普通群的 `feishu/<chatId>` 是不同目的地；同一个人有读取权，不等于结果可发给整个群。只为获授权的具体群及所需材料补齐目的地，不自动扩大文件范围、其他群或额外项目。材料配置变化可能使已有绑定失效，先检查在途工作，再按 revision 更新；不回写旧绑定或重放旧消息。

真实验收使用已授权的人类身份通过 lark-cli 发 @ 消息，发送后读取消息的 `mentions` 确认实际点名了目标机器人；普通文本中的名字不算 @。核对原消息对应的建单结果、工单实际材料绑定、观察记录和群内最终回复。验证 current 时，把报告中的实际内容/哈希与源项目当前未提交文件比较，不能仅凭存在 worktree、工单 completed 或回复送达认定读到了当前材料。

若已选定材料却没有绑定或没有材料观察，先查授权/版本及执行记录；在旧运行包上可能已降级到普通 worktree 执行，不能将此报告当作 current 验收。js-superagent 0.15.0-alpha.4 起选定材料绑定失败会拒绝接单执行；保留原失败及回执，修复后按既有恢复入口和用户授权继续，不另发重复请求掩盖失败。既有 `reevaluate` 恢复要求已配置语义 assessor；仅使用飞书直接接单的部署需先配置 assessor，本版没有新增无 assessor 的自动恢复路径。未配置默认材料且未显式选定材料的普通任务仍沿原方式执行。

## 真实群消息与补收验收

部署或修复历史读取后，先完成上面的 bot API 检查，再在已授权的具体群和测试范围内验证以下场景。测试内容明确只读、可核对且不承载真实发布任务；继续沿用已有授权，缺少发送或停机授权时只做读取并说明未验收项。断线场景只暂停目标受管服务，记录原状态并在验收后恢复；不抢占生产 WebSocket、不新建事件消费者或另造轮询器。

| 场景 | 必须核对的事实 |
|---|---|
| 在线真实 @ | 人类消息的实际 mentions 指向该机器人；原消息对应的准入、工单和同群回复可串联。@ 是候选入口，是否建单仍由既有领域与意图规则决定。 |
| 断线期间的群主消息 | 服务离线后发送授权测试 @；恢复后由已有历史轮询补收同一消息，核对源游标推进、原 trigger 和唯一工单，不能靠重发或 SDK 注入“补验”。 |
| 最近发现、尚未订阅话题中的首次 @ | 在配置群近期发现、尚无工单订阅的话题内验证首次 @ 的历史补收，不能只检查已有工单话题。同一未订阅话题里的普通非 @ 消息仍不得因此获得新建单授权。 |
| 活跃/已订阅话题的非 @ 补充 | 分别在有活跃工单及仍有订阅的话题中发送授权补充，核对它到达原工单或进入原有领域处理；群的 mentions 模式不能吞掉原话题跟进，也不能把无订阅普通群聊扩成新授权。是否执行或回复沿用原状态和准入。 |
| 结果与去重 | 核对原群话题的实际回复，以及 WebSocket 与历史轮询重叠后的单一 trigger、工单/输入和通知身份；继续等既有补收经过该区间，不能仅看第一次回复就声称去重已通过。 |

群主消息的游标前进不证明旧话题的新回复已经读取；话题轮询范围来自现有活跃/订阅关系，不从全群所有话题生成新工作。分页未结束、单个话题读取失败或权限拒绝时，记录未完成范围，不能把部分成功写成全部健康。验收保留消息 ID、话题 ID、trigger、原工单、游标/错误前后状态及送达回执；涉及 current 材料时继续保留真实观察与源文件哈希。历史工单、会话与业务文件保持原样，不为清告警重建状态。

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
