# 项目材料与执行环境

用于部署或排查“调查项目最新情况”“包括未提交内容”“根据当前材料隔离修改”。先核对目标项目已安装包的公开接口与有效执行器能力；配置和权限留在宿主，协调者知识只提供导航。

## 三个入口各自负责什么

| 入口 | 用途 | 部署时如何处理 |
| --- | --- | --- |
| 项目运行时 `knowledge/*.md` | 协调者理解项目、业务术语和派工入口 | 保留原文件与启动 wrapper；不把它用作 Worker 材料授权 |
| `getMaterialSettings()` / `configureMaterials()` | 可读来源、视图、读取者与输出目的地 | 使用 SDK/CLI 公开接口和 expectedRevision；不写内部状态 |
| 工作区与执行器配置 | Worker 在哪里执行、可用工具及准备能力 | 不从目录推断材料时效；`auto` 在 Git 仓库仍选提交 worktree |

`current` 指允许范围内的实时文件，含未提交、未跟踪及被 Git 忽略但获准读取的内容；它不意味着读取整个项目。`commit` 固定精确提交，`snapshot` 固定宿主冻结材料，两者不能偷偷刷新为当前文件。当前材料调查通过宿主引用读取，无需先换工作区。

## 首次配置

1. 读取项目规则、业务入口和现有材料设置，确定实际需要的文件/目录。根规则、进入目录后适用的子规则、技能文档必须可读；规则依赖的文档也要纳入允许范围。避免只给正文路径却让 Worker 无法读取验收规则。
2. 调用 `agent.materialCapabilities()`，核对材料合同与状态格式；查询实际执行器，受控读取必须具备 `boundedMaterialReadsVersion: 1`。版本号或 `inspect.mjs` 的安装提示不能证明能力已经开启。
3. 依据授权填写[只读材料样例](../assets/project-materials.example.json)。样例仅本项目、本地操作者、current、禁止准备与应用；它不是已授权配置。按真实项目替换路径和身份，尤其是飞书读取者与会话目的地，不能把本地 `operator` 当成其他渠道身份。
4. 先 `getMaterialSettings()`，再 `configureMaterials(settings, {expectedRevision: current.revision})`。保留已有条目；defaults 只用于之后的新工单，不修改旧工单绑定、原生会话或历史读取回执。
5. DSH 受控读取使用 `materialAccess: 'host-only'`、`permission: 'read-only'`、`enableAgentTools: true`，不启用 managed jobs。普通编码模式保持原生工具，不声称具有相同路径限制。运行前核对工单的实际有效配置，而非只看项目默认值。

CLI 的配置入口为 `materials status` 和 `materials set <配置文件> <当前修订>`；从项目已有 wrapper 调用。准备与快照使用 `materials snapshot <JSON文件>`、`materials prepare <工单ID> <JSON文件>`，检查或重试原准备使用 `materials prepare-status|prepare-retry <工单ID>`。本地应用使用 `materials apply-preview|apply|apply-recover <工单ID> <JSON文件>`，对应文件字段分别为 `{paths}`、`{plan,operationId}`、`{operationId,mode}`。字段与恢复 mode 取值仍以准确版本 help/类型为准。配置文件只保存操作者审阅过的声明，不能由模型传入任意根目录或命令。

allow/deny 使用明确相对文件或目录，不支持 glob、正则或 Gitignore 语义。ignored 内容同样受范围检查。符号链接、硬链接普通文件与非常规文件不作为受控材料读取；不要为迁就它们改宽权限。内置排除不是通用秘密识别，业务回执与凭据应由项目配置明确区分。额外项目入口默认关闭，单纯登记到本机 registry 不产生读取授权。

## 隔离修改、验证与采纳

用户授权修改且材料绑定允许准备时，Worker 可通过 `js_superagent_prepare_workspace` 引用宿主提供的 materialId、当前 provisionId 并说明原因；不能传路径、命令或新增权限。受理后当前回合进入 waiting，由宿主核对进程、输入、已有增量和交付后准备下一代环境。工单与 Assignment 继续沿用，切换后的原生会话记录 lineage；不能用失败 retry 伪造正常切换。

基于未提交内容修改选择冻结材料的 copy。导入基线与 Worker 增量分开，不能把用户原有修改算作 Worker 成果；dirty current 不能直接导入 worktree 或自动转成 PR。commit 工作继续用已有固定提交/worktree 能力。

本地交付先给可审阅增量，显式应用前核对源文件基线、目标保护和逐文件回执。冲突或未知应用结果先检查，不能覆盖用户新修改。longrun 拥有的成果仍由 longrun 按冻结合同核验、结算；不能从 superagent 直接回写。额外项目只读，单张工单只选择一个修改/交付目标。

验证与预览使用当前 generation、实际材料基线及可信 profile。host-only 调查不能自动运行 shell 检查；宿主验证命令的真实权限单独核对，不把只读 Worker 当成系统级沙箱。材料读取不授予发布、提交、合并或外发权限；所有含材料内容的输出都要符合目的地约束。

## 升级、恢复与验收

新材料合同使用 schema 15。先停止相关写者，按运行包公开升级流程备份和迁移，再恢复原 wrapper；知识同步与只读安装检查不迁移状态。旧包拒绝 schema 15，不能仅降级依赖回退。升级不为旧工单增添材料权限、不恢复失败、不重放消息、不启用长期任务。

对 current，报告前检查实际读过的文件和目录版本；有限补读仍不稳定时说明缺口。旧 call ID 返回历史回执，新观察使用新调用；不能拿重放回执声称读取了最新文件。commit/snapshot 恢复保持原身份。准备失败恢复原准备操作，已完成外部动作只核对补收；网络发送失败重试原 Outbox。因材料过期或撤权而撤回的消息保留原记录，不改来源和授权记录来强行补发；按当前授权和重新核对的上下文生成后续回复。

历史材料报告被宿主标记为过期时，只用明确保留的工单身份、观察时间和过期状态等元数据定位原工作，不把旧正文当作当前材料事实。新的调查按既有授权重新读取，并区分本次成功读取、未覆盖范围与历史记录；普通状态查询本身不授权重新调查。

用隔离虚构材料验收：当前文件变化可见、固定视图不变化、越界/撤权/目的地拒绝、copy 的导入基线与新增增量、重准备同工单同 Assignment、新 generation 拒绝旧回调、本地应用冲突以及冻结长期任务结算。之后按已有授权进行真实项目验证，记录实际观察窗口、允许范围、遗漏和输出来源；离线通过不等于飞书完整流程已通过。
