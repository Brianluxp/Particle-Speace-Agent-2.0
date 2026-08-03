# Particle Space 2.0 Default Model Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bundle a converted GLB default model, rename the product header, and make the task and model rail entries always open the current or most recent usable target with a default fallback.

**Architecture:** Keep model selection outside page components. The Mock API owns mutable task/project snapshots and a hidden default completed task; a pure selector converts recent projects plus the current route into navigation targets; `App` loads recent projects and falls back immediately to the hidden task.

**Tech Stack:** Vite, React 19, TypeScript, React Router, Vitest, Testing Library, `@google/model-viewer`, FBX2glTF 0.9.7-p1.

---

## File map

- Create `frontend/public/models/default.glb`: converted web-preview asset.
- Create `frontend/src/services/navigationTargets.ts`: pure route selection.
- Create `frontend/src/services/navigationTargets.test.ts`: selector tests.
- Modify `frontend/src/mocks/projects.ts`: default task constants and task.
- Modify `frontend/src/services/projectApi.ts`: mutable recent projects and local GLB fallback.
- Modify `frontend/src/services/projectApi.test.ts`: adapter tests.
- Modify `frontend/src/App.tsx`: product name and navigation loading.
- Modify `frontend/src/App.test.tsx`: shell behavior tests.
- Modify `frontend/README.md`: bundled fallback documentation.

### Task 1: Convert and validate the default model

**Files:**
- Source: `D:/cadabra_tools003/AgentPro/Particle-AI-Agent/prds/Futuristic_Trike_High-Poly_2-(FBX 7.4 binary mit Animation).fbx`
- Create: `frontend/public/models/default.glb`

- [ ] **Step 1: Install the converter outside the repository**

```powershell
$converterRoot = Join-Path $env:TEMP "particle-fbx2gltf-0.9.7-p1"
New-Item -ItemType Directory -Force -Path $converterRoot
npm install --prefix $converterRoot fbx2gltf@0.9.7-p1
```

Expected: `$converterRoot/node_modules/fbx2gltf` exists. Do not change `frontend/package.json`.

- [ ] **Step 2: Convert to binary GLB**

```powershell
$sourceFbx = "D:\cadabra_tools003\AgentPro\Particle-AI-Agent\prds\Futuristic_Trike_High-Poly_2-(FBX 7.4 binary mit Animation).fbx"
$targetDir = "D:\cadabra_tools003\AgentPro\Particle-AI-Agent-2.0\Particle-Speace-Agent-2.0\frontend\public\models"
$targetGlb = Join-Path $targetDir "default.glb"
New-Item -ItemType Directory -Force -Path $targetDir
$converterModule = Join-Path $converterRoot "node_modules\fbx2gltf"
node -e "const convert=require(process.argv[1]); convert(process.argv[2],process.argv[3],['--binary','--compute-normals','missing']).then(console.log).catch(error=>{console.error(error);process.exit(1)})" $converterModule $sourceFbx $targetGlb
```

Expected: `frontend/public/models/default.glb` exists and is non-empty.

- [ ] **Step 3: Validate the GLB header and size**

```powershell
$glb = Get-Item "frontend\public\models\default.glb"
$stream = [System.IO.File]::OpenRead($glb.FullName)
$header = New-Object byte[] 4
$null = $stream.Read($header, 0, 4)
$stream.Dispose()
[pscustomobject]@{
  LengthBytes = $glb.Length
  LengthMB = [math]::Round($glb.Length / 1MB, 2)
  Magic = [System.Text.Encoding]::ASCII.GetString($header)
}
```

Expected: `Magic` is `glTF` and `LengthBytes` is greater than zero.

- [ ] **Step 4: Commit the asset**

```powershell
git add frontend/public/models/default.glb
git commit -m "feat: add bundled default GLB model"
```

### Task 2: Synchronize Mock projects and add the hidden default task

**Files:**
- Modify: `frontend/src/mocks/projects.ts`
- Modify: `frontend/src/services/projectApi.ts`
- Test: `frontend/src/services/projectApi.test.ts`

- [ ] **Step 1: Write failing adapter tests**

Add these cases:

```ts
test("uses the bundled GLB when no demo URL is configured", async () => {
  const task = await createProject({
    name: "默认模型测试",
    inputType: "image",
    file: new File(["image"], "model.png"),
  });
  await getTask(task.id);
  await getTask(task.id);
  const completed = await getTask(task.id);
  expect(completed.modelUrl).toBe(
    import.meta.env.VITE_DEMO_GLB_URL ?? DEFAULT_MODEL_URL,
  );
});

test("adds a new project first and synchronizes its status", async () => {
  const task = await createProject({
    name: "新建项目",
    inputType: "cad",
    file: new File(["cad"], "part.dxf"),
  });
  expect((await getRecentProjects())[0]).toMatchObject({
    name: "新建项目",
    taskId: task.id,
    status: "queued",
  });
  await getTask(task.id);
  expect((await getRecentProjects())[0].status).toBe("parsing");
  await retryTask(task.id);
  expect((await getRecentProjects())[0].status).toBe("queued");
});
```

- [ ] **Step 2: Verify tests fail**

```powershell
npm run test -- --run src/services/projectApi.test.ts
```

Expected: FAIL because `DEFAULT_MODEL_URL` and project synchronization are absent.

- [ ] **Step 3: Add exact default constants and task**

In `projects.ts` export:

```ts
export const DEFAULT_MODEL_TASK_ID = "task-default-model";
export const DEFAULT_MODEL_URL = "/models/default.glb";
```

Append a completed task with `id: DEFAULT_MODEL_TASK_ID`, `progress: 100`, `stageLabel: "默认模型已就绪"`, and `modelUrl: DEFAULT_MODEL_URL`. Do not add it to `recentProjects`.

- [ ] **Step 4: Implement mutable project snapshots**

In `projectApi.ts` use:

```ts
const projects = structuredClone(recentProjects);
const demoModelUrl = import.meta.env.VITE_DEMO_GLB_URL ?? DEFAULT_MODEL_URL;

function syncProjectStatus(task: GenerationTask): void {
  const project = projects.find((item) => item.taskId === task.id);
  if (project) project.status = task.status;
}
```

`createProject` must `unshift` a project containing the submitted name. `getTask` and `retryTask` must call `syncProjectStatus`. `getRecentProjects` must return:

```ts
return structuredClone(projects).sort(
  (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
);
```

- [ ] **Step 5: Verify adapter tests pass**

```powershell
npm run test -- --run src/services/projectApi.test.ts
```

Expected: all adapter tests pass.

- [ ] **Step 6: Commit adapter changes**

```powershell
git add frontend/src/mocks/projects.ts frontend/src/services/projectApi.ts frontend/src/services/projectApi.test.ts
git commit -m "feat: synchronize mock projects with generation tasks"
```

### Task 3: Add a pure navigation selector

**Files:**
- Create: `frontend/src/services/navigationTargets.ts`
- Test: `frontend/src/services/navigationTargets.test.ts`

- [ ] **Step 1: Write failing selector tests**

Use deliberately unsorted project dates and assert:

```ts
expect(resolveNavigationTargets(projects, "/tasks/task-current")).toEqual({
  taskId: "task-current",
  modelTaskId: "task-completed-newest",
});

expect(resolveNavigationTargets(projects, "/models/task-model-current")).toEqual({
  taskId: "task-model-current",
  modelTaskId: "task-model-current",
});

expect(resolveNavigationTargets([], "/")).toEqual({
  taskId: DEFAULT_MODEL_TASK_ID,
  modelTaskId: DEFAULT_MODEL_TASK_ID,
});
```

- [ ] **Step 2: Verify selector tests fail**

```powershell
npm run test -- --run src/services/navigationTargets.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the selector**

```ts
export interface NavigationTargets {
  taskId: string;
  modelTaskId: string;
}

export function resolveNavigationTargets(
  projects: Project[],
  pathname: string,
): NavigationTargets {
  const currentMatch = pathname.match(/^\/(tasks|models)\/([^/]+)$/);
  const sorted = [...projects].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
  const latestTaskId = sorted[0]?.taskId ?? DEFAULT_MODEL_TASK_ID;
  const latestModelTaskId =
    sorted.find((project) => project.status === "completed")?.taskId ??
    DEFAULT_MODEL_TASK_ID;
  return {
    taskId: currentMatch?.[2] ?? latestTaskId,
    modelTaskId:
      currentMatch?.[1] === "models" ? currentMatch[2] : latestModelTaskId,
  };
}
```

- [ ] **Step 4: Verify selector tests pass**

```powershell
npm run test -- --run src/services/navigationTargets.test.ts
```

Expected: all selector tests pass.

- [ ] **Step 5: Commit selector**

```powershell
git add frontend/src/services/navigationTargets.ts frontend/src/services/navigationTargets.test.ts
git commit -m "feat: resolve recent task and model navigation"
```

### Task 4: Enable shell navigation and rename the product

**Files:**
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/App.test.tsx`

- [ ] **Step 1: Replace disabled-entry tests with failing link tests**

Mock `getRecentProjects` and assert:

```ts
expect(await screen.findByRole("link", { name: "任务" })).toHaveAttribute(
  "href", "/tasks/task-new",
);
expect(screen.getByRole("link", { name: "模型" })).toHaveAttribute(
  "href", "/models/task-model",
);
```

Add a rejection case asserting both links use `DEFAULT_MODEL_TASK_ID`, and change the heading assertion to `Particle Space 2.0`.

- [ ] **Step 2: Verify App tests fail**

```powershell
npm run test -- --run src/App.test.tsx
```

Expected: FAIL because the shell still disables both links and displays the old name.

- [ ] **Step 3: Load recent targets without blocking first render**

Initialize with the default task and refresh on pathname changes:

```ts
const [navigationTargets, setNavigationTargets] = useState<NavigationTargets>({
  taskId: DEFAULT_MODEL_TASK_ID,
  modelTaskId: DEFAULT_MODEL_TASK_ID,
});

useEffect(() => {
  let active = true;
  getRecentProjects()
    .then((projects) => {
      if (active) setNavigationTargets(resolveNavigationTargets(projects, pathname));
    })
    .catch(() => {
      if (active) setNavigationTargets(resolveNavigationTargets([], pathname));
    });
  return () => { active = false; };
}, [pathname]);
```

Change the heading to `Particle Space 2.0`. Resolve task and model destinations from `navigationTargets` so both entries always render as links.

- [ ] **Step 4: Verify App tests pass**

```powershell
npm run test -- --run src/App.test.tsx
```

Expected: all App tests pass with no unhandled rejection.

- [ ] **Step 5: Commit shell changes**

```powershell
git add frontend/src/App.tsx frontend/src/App.test.tsx
git commit -m "feat: enable recent task and model navigation"
```

### Task 5: Document and verify the completed implementation

**Files:**
- Modify: `frontend/README.md`

- [ ] **Step 1: Document the fallback precisely**

Add:

```md
`VITE_DEMO_GLB_URL` 用于覆盖 Mock 任务完成后的演示模型地址。未配置时，Mock completed 任务使用仓库内置的 `/models/default.glb`。内置模型仅用于前端 1.0 演示，不代表真实三维生成服务已经接入。
```

- [ ] **Step 2: Run model-preview tests**

```powershell
npm run test -- --run src/pages/ModelPreviewPage.test.tsx
```

Expected: viewer URL, missing URL, redirect, fullscreen, and load-error cases pass.

- [ ] **Step 3: Run all tests and build**

```powershell
npm run test -- --run
npm run build
```

Expected: all tests pass and the production build succeeds. The existing bundle-size warning is acceptable.

- [ ] **Step 4: Verify scope**

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors and no unrelated files.

- [ ] **Step 5: Commit documentation**

```powershell
git add frontend/README.md
git commit -m "docs: explain bundled demo model fallback"
```

- [ ] **Step 6: Report limitations**

Report source and GLB sizes, GLB header validation, detected animation status, test/build results, and explicitly state that no real 3D generation service was connected.
