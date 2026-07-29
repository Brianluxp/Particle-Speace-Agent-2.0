# 粒子空间代理 2.0 前端

## 本地启动与构建

在 `frontend` 目录执行：

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

运行测试和生产构建：

```powershell
pnpm test
pnpm build
```

## 演示 GLB 地址

`VITE_DEMO_GLB_URL` 用于给 mock 完成任务提供开发演示用的 GLB 地址。
未配置时，完成任务的 `modelUrl` 为 `null`，页面显示“模型文件暂不可用”。

示例：

```dotenv
VITE_DEMO_GLB_URL=https://example.com/demo.glb
```

## 替换真实后端时保持的接口

真实 API adapter 必须保持以下四个接口：

```ts
createProject(input: { name: string; inputType: InputType; file: File })
getTask(taskId: string)
retryTask(taskId: string)
getRecentProjects()
```

页面组件只依赖这些接口，不直接包含 mock 数据或任务推进逻辑。

## 后端与浏览器职责

后端负责异步 GPU 三维生成、任务状态维护和 GLB 文件地址返回。
浏览器只提交任务、查询状态和预览结果，不得直接连接三维推理服务。
