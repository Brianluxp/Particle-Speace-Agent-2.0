# Particle Space 2.0 默认模型与导航设计

## 目标

将应用顶部品牌名从“粒子空间”改为 `Particle Space 2.0`，并让侧边栏“任务”和“模型”入口在工作台首页始终可用。

- “任务”打开最近创建项目对应的任务详情。
- “模型”打开最近完成的模型预览。
- 没有最近项目或最近完成模型时，使用仓库内置的默认 GLB 模型。
- 保留现有 Mock API 边界和模型异常空状态。

## 范围

本次包含：

- 一次性将用户提供并确认可分发的 FBX 转换为 GLB。
- 将转换结果作为前端内置默认模型。
- 调整顶部品牌文案。
- 调整任务和模型侧边栏入口的目标选择逻辑。
- 让 Mock 最近项目随创建任务和任务状态变化保持同步。
- 添加相应测试并运行完整测试和生产构建。

本次不包含：

- 浏览器直接加载 FBX。
- 在浏览器运行 FBX 转换。
- 引入 Three.js、react-three-fiber 或新的 UI 组件库。
- 接入真实三维生成服务、数据库或持久化存储。
- 新增任务列表页或模型列表页。

## 默认模型资产

源文件为：

`D:\cadabra_tools003\AgentPro\Particle-AI-Agent\prds\Futuristic_Trike_High-Poly_2-(FBX 7.4 binary mit Animation).fbx`

用户已确认允许将该模型转换后随前端代码上传并分发。源文件约 7.87 MB，是 FBX 7.4 二进制文件。静态扫描识别到几何体、模型节点和材质，但没有验证到动画栈、骨骼、动画曲线或嵌入纹理，因此不能预先保证动画和材质能完整转换。

使用本地临时的 `FBX2glTF` 命令行工具完成一次性转换。转换工具不加入仓库，原始 FBX 不复制进前端。输出文件固定为：

`frontend/public/models/default.glb`

转换后检查：

- 文件存在且非空。
- GLB 结构可以被验证工具读取。
- `<model-viewer>` 可以加载。
- 模型朝向、缩放和取景合理。
- 材质没有明显丢失或全黑。
- 若存在动画，记录动画是否保留；动画不存在不阻止静态默认预览交付。
- 记录转换后文件大小，避免明显不合理的体积增长。

## 导航行为

顶部产品名称显示为 `Particle Space 2.0`，“项目工作台”继续使用中文。

侧边栏入口不再依赖当前 URL 中是否存在 `taskId` 才可点击。

### 任务入口

1. 当前位于 `/tasks/:taskId` 或 `/models/:taskId` 时，优先使用当前 `taskId`。
2. 首页或创建项目页没有当前任务上下文时，使用最近项目中 `createdAt` 最新的 `taskId`。
3. 最近项目为空时，使用隐藏的默认模型任务。

入口目标始终为 `/tasks/:taskId`。

### 模型入口

1. 当前位于 `/models/:taskId` 时，继续使用当前 `taskId`。
2. 其他路由使用最近项目中 `createdAt` 最新的 completed 任务。
3. 没有最近完成任务时，使用隐藏的默认模型任务。

入口目标始终为 `/models/:taskId`。应用外壳不得为了选择目标而调用有状态推进副作用的 `getTask()`。当前任务刚完成时，用户先通过任务页已有的“查看 3D 模型”按钮进入该模型；进入模型页后，侧边栏模型入口保持当前 `taskId`。非完成任务仍不得绕过 `ModelPreviewPage` 的状态保护。

## 默认任务

Mock 数据中增加一个 ID 固定为 `task-default-model` 的隐藏 completed 任务：

- `status`: `completed`
- `progress`: `100`
- `modelUrl`: `/models/default.glb`
- `stageLabel`: `默认模型已就绪`

该任务不加入“最近项目”列表，因此不会伪装成用户创建的项目。它只作为没有可用最近数据时的导航兜底。

## Mock 数据同步

`projectApi` 继续暴露既有四个接口：

- `createProject`
- `getTask`
- `retryTask`
- `getRecentProjects`

Mock adapter 内部维护可变的项目快照：

- `createProject` 创建任务的同时增加项目记录。
- `getTask` 推进任务状态后，同步对应项目的状态。
- `retryTask` 将任务和对应项目状态同步回 queued。
- `getRecentProjects` 返回按 `createdAt` 倒序排列的克隆数据。

页面不直接修改 Mock 数据，也不新增页面级 `setTimeout` 业务逻辑。

## 模型地址规则

- 隐藏默认任务始终使用 `/models/default.glb`。
- 普通 Mock completed 任务优先使用 `VITE_DEMO_GLB_URL`。
- 未配置 `VITE_DEMO_GLB_URL` 时，普通 Mock completed 任务使用 `/models/default.glb`。
- 直接访问一个 completed 但 `modelUrl` 明确为 `null` 的异常任务时，继续显示“模型文件暂不可用”，不静默掩盖异常数据。
- 模型加载失败时继续显示现有中文错误状态。

## 状态加载与错误处理

应用外壳加载最近项目时，任务和模型入口先使用隐藏默认任务，因此首次渲染也可以点击。最近项目请求成功后再替换为计算出的最近目标。

若 `getRecentProjects` 失败：

- 不阻断页面渲染。
- 两个入口继续使用隐藏默认任务。
- 不在页面组件内伪造最近项目数据。

## 测试与验收

新增或调整测试覆盖：

- 顶部显示 `Particle Space 2.0`。
- 首页任务入口跳转最近创建任务。
- 首页模型入口跳转最近 completed 模型。
- 当前任务上下文优先于最近项目。
- 没有最近项目时，两个入口均可使用默认任务。
- 创建项目后出现在最近项目首位。
- 任务推进和失败重试会同步项目状态。
- 默认任务的模型地址为 `/models/default.glb`。
- `<model-viewer>` 使用默认 GLB 的 `src`。
- 已有无 `modelUrl` 空状态和非 completed 重定向测试继续通过。

最终运行：

```powershell
npm run test -- --run
npm run build
```

验收不代表真实三维生成服务已经接入。FBX 到 GLB 的一次性默认资产转换，也不代表浏览器或当前 Mock adapter 具备通用模型转换能力。
