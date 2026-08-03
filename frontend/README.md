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

`VITE_DEMO_GLB_URL` 用于覆盖 Mock 任务完成后的演示模型地址。未配置时，Mock completed 任务使用仓库内置的 `/models/default.glb`。内置模型仅用于前端 1.0 演示，不代表真实三维生成服务已经接入。

示例：

```dotenv
VITE_DEMO_GLB_URL=https://modelviewer.dev/shared-assets/models/Astronaut.glb
```

仓库中的 `.env.example` 提供相同示例。复制为 `.env.local` 后重启开发服务器即可生效；`.env.local` 只用于本机并已被 Git 忽略。

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
