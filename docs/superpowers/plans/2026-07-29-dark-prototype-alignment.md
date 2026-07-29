# Dark Prototype Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页、创建项目、任务详情和模型预览四个路由统一为“粒子空间”深色工业工作台，并按原型还原首页内容。

**Architecture:** 在 `App` 中建立所有路由共享的顶部栏和左侧导航，页面组件继续负责现有业务行为。首页读取现有 API adapter 数据，原型图片作为普通静态图片使用；深色视觉集中在全局样式中，不新增组件库或业务抽象。

**Tech Stack:** Vite、React、TypeScript、React Router、普通 CSS、Vitest、Testing Library、`@google/model-viewer`

---

### Task 1: Shared dark application shell

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: Write failing shell tests**

在 `frontend/src/App.test.tsx` 中验证新产品名、共享导航及当前路由：

```tsx
test("renders the Particle Space application shell", () => {
  render(
    <MemoryRouter initialEntries={["/projects/new"]}>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "粒子空间" })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "主导航" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "导入" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
corepack pnpm test -- src/App.test.tsx
```

Expected: FAIL，因为当前标题仍为“粒子空间代理 2.0”，且不存在“主导航”。

- [ ] **Step 3: Implement the shared shell**

在 `frontend/src/App.tsx` 中使用 `useLocation()` 计算活动导航，并保留原路由：

```tsx
const navItems = [
  { label: "工作台", to: "/", matches: (path: string) => path === "/" },
  {
    label: "导入",
    to: "/projects/new",
    matches: (path: string) => path.startsWith("/projects/new"),
  },
  {
    label: "任务",
    to: "/tasks/task-failed",
    matches: (path: string) => path.startsWith("/tasks/"),
  },
  {
    label: "模型",
    to: "/models/task-engine",
    matches: (path: string) => path.startsWith("/models/"),
  },
];

export function App() {
  const { pathname } = useLocation();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="product-link" to="/">
          <span className="product-mark" aria-hidden="true" />
          <h1>粒子空间</h1>
        </Link>
        <span className="workspace-label">项目工作台</span>
        <div className="topbar-status">
          <span>✓ 已保存</span>
          <span aria-label="通知">♧</span>
          <span aria-label="用户">●</span>
        </div>
      </header>
      <nav className="side-rail" aria-label="主导航">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            aria-current={item.matches(pathname) ? "page" : undefined}
          >
            <span aria-hidden="true" />
            <small>{item.label}</small>
          </Link>
        ))}
      </nav>
      <main className="page-content">
        <Routes>
          <Route path="/" element={<WorkspacePage />} />
          <Route path="/projects/new" element={<CreateProjectPage />} />
          <Route path="/tasks/:taskId" element={<TaskPage />} />
          <Route path="/models/:taskId" element={<ModelPreviewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
```

在 `frontend/src/styles.css` 顶部定义原型变量和布局：

```css
:root {
  --bg: #061321;
  --surface: #0a1a2a;
  --surface-2: #0d2134;
  --surface-3: #10273c;
  --line: rgba(157, 194, 221, .15);
  --muted: #7f98ad;
  --text: #dce8f4;
  --cyan: #1dcdd0;
  --blue: #1687ff;
  --amber: #ffac21;
  --green: #27d5a0;
}

body { background: var(--bg); color: var(--text); }
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template: 72px minmax(0, 1fr) / 68px minmax(0, 1fr);
}
.topbar { grid-column: 1 / -1; }
.side-rail { grid-row: 2; grid-column: 1; }
.page-content { grid-row: 2; grid-column: 2; }
```

- [ ] **Step 4: Run the shell tests and verify GREEN**

Run:

```powershell
corepack pnpm test -- src/App.test.tsx
```

Expected: App tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/App.tsx frontend/src/App.test.tsx frontend/src/styles.css
git commit -m "feat: add dark application shell"
```

### Task 2: Prototype-aligned workspace content and data

**Files:**
- Modify: `frontend/src/pages/WorkspacePage.tsx`
- Modify: `frontend/src/pages/WorkspacePage.test.tsx`
- Modify: `frontend/src/mocks/projects.ts`
- Copy: `Particle Agent 2.0/valve-actuator-viewport.png` to `frontend/public/valve-actuator-viewport.png`

- [ ] **Step 1: Write failing workspace tests**

补充原型内容、图片语义和最近项目状态断言：

```tsx
test("matches the prototype hero and visual content", () => {
  renderWorkspace();

  expect(
    screen.getByRole("heading", {
      name: "把图纸和图片，变成可运行的3D",
    }),
  ).toBeInTheDocument();
  expect(screen.getByAltText("阀门执行器三维模型")).toHaveAttribute(
    "src",
    "/valve-actuator-viewport.png",
  );
  expect(screen.getByText("AI结构识别")).toBeInTheDocument();
  expect(screen.getByText("运动关系")).toBeInTheDocument();
});

test("shows prototype recent project metadata", async () => {
  renderWorkspace();

  expect(await screen.findByText("动态效果生成中")).toBeInTheDocument();
  expect(screen.getByText("3D模型已生成")).toBeInTheDocument();
  expect(screen.getByText("等待参数确认")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run workspace tests and verify RED**

Run:

```powershell
corepack pnpm test -- src/pages/WorkspacePage.test.tsx
```

Expected: FAIL，因为当前首页没有原型标题、阀门图片和原型状态文案。

- [ ] **Step 3: Preserve failure task and align recent projects**

调整 `frontend/src/mocks/projects.ts`：

```ts
export const recentProjects: Project[] = [
  {
    id: "project-valve",
    name: "阀门执行器",
    inputType: "image",
    taskId: "task-valve",
    status: "generating",
    createdAt: "2026-07-28T12:48:00.000Z",
  },
  {
    id: "project-engine",
    name: "四冲程发动机",
    inputType: "cad",
    taskId: "task-engine",
    status: "completed",
    createdAt: "2026-07-27T18:20:00.000Z",
  },
  {
    id: "project-bmx",
    name: "BMX车架",
    inputType: "image",
    taskId: "task-bmx",
    status: "queued",
    createdAt: "2026-07-26T09:30:00.000Z",
  },
];
```

`initialTasks` 中继续保留 `task-failed`，并加入以下三个独立任务，使页面链接仍可访问真实任务状态：

```ts
{
  id: "task-valve",
  projectId: "project-valve",
  inputType: "image",
  status: "generating",
  progress: 68,
  stageLabel: "动态效果生成中",
  createdAt: "2026-07-28T12:48:00.000Z",
  errorMessage: null,
  modelUrl: null,
  thumbnailUrl: "/valve-actuator-viewport.png",
},
{
  id: "task-engine",
  projectId: "project-engine",
  inputType: "cad",
  status: "completed",
  progress: 100,
  stageLabel: "3D模型已生成",
  createdAt: "2026-07-27T18:20:00.000Z",
  errorMessage: null,
  modelUrl: import.meta.env.VITE_DEMO_GLB_URL ?? null,
  thumbnailUrl: null,
},
{
  id: "task-bmx",
  projectId: "project-bmx",
  inputType: "image",
  status: "queued",
  progress: 42,
  stageLabel: "等待参数确认",
  createdAt: "2026-07-26T09:30:00.000Z",
  errorMessage: null,
  modelUrl: null,
  thumbnailUrl: null,
},
```

- [ ] **Step 4: Rebuild the workspace layout**

将 `WorkspacePage` 调整为原型的介绍、输入方式、阀门图片和最近项目结构。图片必须是普通 `<img>`：

```tsx
<section className="page-intro">
  <div>
    <p className="eyebrow">✦ Agent 3D 制作工作台</p>
    <h2>把图纸和图片，变成可运行的3D</h2>
    <p>导入CAD图纸、产品图片或现有模型，Agent将引导完成解析、建模、动态效果与网页发布。</p>
  </div>
  <Link className="primary-action" to="/projects/new">＋ 创建新项目</Link>
</section>

<aside className="prototype-visual">
  <img src="/valve-actuator-viewport.png" alt="阀门执行器三维模型" />
  <span>AI结构识别</span>
  <span>运动关系</span>
</aside>
```

最近项目状态显示继续由 API 返回状态映射，不在 JSX 中写死项目数组。

- [ ] **Step 5: Copy the prototype image**

Run:

```powershell
New-Item -ItemType Directory -Force frontend/public
Copy-Item -LiteralPath "Particle Agent 2.0/valve-actuator-viewport.png" -Destination "frontend/public/valve-actuator-viewport.png"
```

Expected: 图片存在于 `frontend/public`，没有复制为 `.glb`。

- [ ] **Step 6: Run workspace and service tests**

Run:

```powershell
corepack pnpm test -- src/pages/WorkspacePage.test.tsx src/services/projectApi.test.ts
```

Expected: Workspace 与 API tests PASS。

- [ ] **Step 7: Commit**

```powershell
git add frontend/public/valve-actuator-viewport.png frontend/src/pages/WorkspacePage.tsx frontend/src/pages/WorkspacePage.test.tsx frontend/src/mocks/projects.ts
git commit -m "feat: align workspace with dark prototype"
```

### Task 3: Apply dark styling to all functional pages

**Files:**
- Modify: `frontend/src/styles.css`
- Test: `frontend/src/pages/CreateProjectPage.test.tsx`
- Test: `frontend/src/pages/TaskPage.test.tsx`
- Test: `frontend/src/pages/ModelPreviewPage.test.tsx`

- [ ] **Step 1: Add shared dark-theme assertions**

在各页面现有行为测试中保留业务断言，并在 App shell 测试中通过四个路由表驱动验证活动导航：

```tsx
test.each([
  ["/", "工作台"],
  ["/projects/new", "导入"],
  ["/tasks/task-failed", "任务"],
  ["/models/task-engine", "模型"],
])("marks %s in the shared navigation", (route, label) => {
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: label })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
```

- [ ] **Step 2: Run the navigation tests**

Run:

```powershell
corepack pnpm test -- src/App.test.tsx
```

Expected: PASS after Task 1; the table protects all four shared-shell states.

- [ ] **Step 3: Replace remaining light surfaces with theme variables**

在 `frontend/src/styles.css` 中对现有类做定向替换：

```css
.create-layout,
.task-panel,
.model-workbench,
.model-state-card,
.task-loading,
.task-error-card {
  border-color: var(--line);
  color: var(--text);
  background: var(--surface);
  box-shadow: 0 18px 50px rgba(0, 0, 0, .2);
}

.project-form,
.task-copy,
.model-toolbar {
  color: var(--text);
  background: var(--surface);
}

.text-field,
.select-field,
.file-field {
  border-color: var(--line);
  color: var(--text);
  background: var(--surface-2);
}

.model-stage,
.task-visual {
  background:
    radial-gradient(circle at 50% 45%, rgba(29, 205, 208, .12), transparent 34%),
    var(--bg);
}
```

同时调整标题、说明、边框、禁用按钮、失败提示和空状态文字，使其在深色背景上具备可读性；不改变组件业务逻辑。

- [ ] **Step 4: Run all page tests**

Run:

```powershell
corepack pnpm test -- src/pages/CreateProjectPage.test.tsx src/pages/TaskPage.test.tsx src/pages/ModelPreviewPage.test.tsx
```

Expected: 创建、轮询、重试、完成跳转、viewer、空状态和重定向 tests PASS。

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/App.test.tsx frontend/src/styles.css
git commit -m "style: unify functional pages with dark theme"
```

### Task 4: Final verification

**Files:**
- Modify only if verification reveals an issue caused by Tasks 1-3.

- [ ] **Step 1: Run all tests**

Run:

```powershell
corepack pnpm test -- --run
```

Expected: 全部测试 PASS。

- [ ] **Step 2: Run the production build**

Run:

```powershell
corepack pnpm build
```

Expected: TypeScript 和 Vite production build 成功。

- [ ] **Step 3: Start the local server**

Run:

```powershell
corepack pnpm dev -- --host 127.0.0.1
```

Expected: Vite 输出本地 URL。

- [ ] **Step 4: Check all four routes in the browser**

检查：

```text
/
/projects/new?type=cad
/tasks/task-failed
/models/task-engine
```

Expected: 四个路由均使用深色顶部栏、侧栏和背景；首页与原型布局一致；页面无水平溢出；任务失败可重试；模型页能显示 viewer 或明确中文空状态。

- [ ] **Step 5: Stop the development server and inspect Git**

Run:

```powershell
git status --short
git diff --check
```

Expected: 仅有本计划涉及的文件，无空白错误，`prds/` 不在 Git 状态中。
