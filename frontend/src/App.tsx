import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { CreateProjectPage } from "./pages/CreateProjectPage";
import { EditorPage } from "./pages/EditorPage";
import { ModelPreviewPage } from "./pages/ModelPreviewPage";
import { TaskPage } from "./pages/TaskPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { getRecentProjects } from "./services/projectApi";
import {
  resolveNavigationTargets,
  type NavigationTargets,
} from "./services/navigationTargets";

type IconName =
  | "grid"
  | "upload"
  | "tool"
  | "cube"
  | "folder"
  | "bell"
  | "history"
  | "help"
  | "user";

interface NavItem {
  label: string;
  icon: IconName;
  to?: string;
  contextualRoute?: "tasks" | "models";
  matches: (path: string, hash: string) => boolean;
}

const navItems: NavItem[] = [
  {
    label: "工作台",
    to: "/",
    icon: "grid",
    matches: (path: string, hash: string) => path === "/" && !hash,
  },
  {
    label: "导入",
    to: "/projects/new",
    icon: "upload",
    matches: (path: string) => path.startsWith("/projects/new"),
  },
  {
    label: "任务",
    contextualRoute: "models",
    icon: "tool",
    matches: (path: string) => path.startsWith("/tasks/"),
  },
  {
    label: "模型",
    contextualRoute: "models",
    icon: "cube",
    matches: (path: string) => path.startsWith("/models/"),
  },
  {
    label: "项目",
    to: "/#recent-projects",
    icon: "folder",
    matches: (_path: string, hash: string) => hash === "#recent-projects",
  },
];

const iconPaths: Record<IconName, string[]> = {
  grid: [
    "M4 3.25h5A1.75 1.75 0 0 1 10.75 5v5A1.75 1.75 0 0 1 9 11.75H4A1.75 1.75 0 0 1 2.25 10V5A1.75 1.75 0 0 1 4 3.25Zm11 0h5A1.75 1.75 0 0 1 21.75 5v5A1.75 1.75 0 0 1 20 11.75h-5A1.75 1.75 0 0 1 13.25 10V5A1.75 1.75 0 0 1 15 3.25ZM4 13.25h5A1.75 1.75 0 0 1 10.75 15v5A1.75 1.75 0 0 1 9 21.75H4A1.75 1.75 0 0 1 2.25 20v-5A1.75 1.75 0 0 1 4 13.25Zm11 0h5A1.75 1.75 0 0 1 21.75 15v5A1.75 1.75 0 0 1 20 21.75h-5A1.75 1.75 0 0 1 13.25 20v-5A1.75 1.75 0 0 1 15 13.25Z",
  ],
  upload: [
    "M14 2.25H6A2.75 2.75 0 0 0 3.25 5v14A2.75 2.75 0 0 0 6 21.75h12A2.75 2.75 0 0 0 20.75 19V9Z",
    "M14 2.25V9h6.75M12 18V11m0 0-3 3m3-3 3 3",
  ],
  tool: [
    "M21.17 5.18a.75.75 0 0 0-1.22-.24l-3.62 3.62-1.9-.38-.38-1.9 3.62-3.62a.75.75 0 0 0-.24-1.22 6.25 6.25 0 0 0-7.96 7.72L2.7 15.92a2.75 2.75 0 0 0 3.89 3.89l6.76-6.76a6.25 6.25 0 0 0 7.82-7.87Z",
  ],
  cube: [
    "m12 2.32 8.5 4.77v9.82L12 21.68l-8.5-4.77V7.09Zm0 1.72L5.32 7.79 12 11.54l6.68-3.75Zm-7 5.04v6.95l6.25 3.51v-6.95Zm7.75 10.46L19 16.03V9.08l-6.25 3.51Z",
  ],
  folder: [
    "M3.75 4.25h5.44l2 2H20A2.75 2.75 0 0 1 22.75 9v9A2.75 2.75 0 0 1 20 20.75H4A2.75 2.75 0 0 1 1.25 18V7A2.75 2.75 0 0 1 4 4.25Z",
  ],
  bell: [
    "M12 2.25A6.75 6.75 0 0 0 5.25 9v3.88l-1.79 3.13A1.75 1.75 0 0 0 4.98 18.63h14.04a1.75 1.75 0 0 0 1.52-2.62l-1.79-3.13V9A6.75 6.75 0 0 0 12 2.25ZM9.48 20.13a2.75 2.75 0 0 0 5.04 0Z",
  ],
  history: [
    "M12 3.25a8.75 8.75 0 1 1-8.24 5.8.75.75 0 1 1 1.41.5A7.25 7.25 0 1 0 12 4.75H7.81l1.47 1.47a.75.75 0 0 1-1.06 1.06L5.47 4.53a.75.75 0 0 1 0-1.06L8.22.72a.75.75 0 0 1 1.06 1.06L7.81 3.25Zm0 3.5a.75.75 0 0 1 .75.75v4.19l2.78 1.6a.75.75 0 1 1-.75 1.3l-3.16-1.83a.75.75 0 0 1-.37-.65V7.5a.75.75 0 0 1 .75-.75Z",
  ],
  help: [
    "M12 1.25A10.75 10.75 0 1 0 22.75 12 10.76 10.76 0 0 0 12 1.25Zm0 19.5A8.75 8.75 0 1 1 20.75 12 8.76 8.76 0 0 0 12 20.75Zm0-4.5a1.13 1.13 0 1 0 0 2.25 1.13 1.13 0 0 0 0-2.25Zm.13-10.5a4 4 0 0 0-3.86 3 .75.75 0 0 0 1.45.39 2.5 2.5 0 1 1 3.03 3.08 2 2 0 0 0-1.5 1.94v.34a.75.75 0 0 0 1.5 0v-.34a.5.5 0 0 1 .38-.49 4 4 0 0 0-1-7.92Z",
  ],
  user: [
    "M12 1.25A10.75 10.75 0 1 0 22.75 12 10.76 10.76 0 0 0 12 1.25Zm0 4a3.75 3.75 0 1 1-3.75 3.75A3.75 3.75 0 0 1 12 5.25Zm0 15.5a8.7 8.7 0 0 1-6.56-2.97 7.76 7.76 0 0 1 13.12 0A8.7 8.7 0 0 1 12 20.75Z",
  ],
};

function AppIcon({ icon }: { icon: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {iconPaths[icon].map((path) => <path d={path} key={path} />)}
    </svg>
  );
}

function ProductLogo() {
  return (
    <svg className="product-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="m16 2.5 11 6.2v14.6l-11 6.2-11-6.2V8.7Z" />
      <path d="m5 8.7 11 6.2 11-6.2M16 14.9v14.6" />
    </svg>
  );
}

export function App() {
  const { pathname, hash } = useLocation();
  const [openPanel, setOpenPanel] = useState<"help" | "notifications" | null>(
    null,
  );
  const [navigationTargets, setNavigationTargets] = useState<NavigationTargets>(
    () => resolveNavigationTargets([], pathname),
  );

  useEffect(() => {
    let active = true;

    getRecentProjects()
      .then((projects) => {
        if (active) {
          setNavigationTargets(resolveNavigationTargets(projects, pathname));
        }
      })
      .catch(() => {
        if (active) {
          setNavigationTargets(resolveNavigationTargets([], pathname));
        }
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!hash) {
      return;
    }

    document
      .getElementById(hash.slice(1))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash, pathname]);

  const isEditorRoute = /^\/editor\/[^/]+$/.test(pathname);

  if (isEditorRoute) {
    return (
      <Routes>
        <Route path="/editor/:taskId" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="product-link" to="/">
          <ProductLogo />
          <h1>Particle Space 2.0</h1>
        </Link>
        <span className="workspace-label">项目工作台</span>
        <div className="topbar-status">
          <span className="saved-status">✓ 已保存</span>
          <button
            className="icon-button"
            type="button"
            aria-label="通知"
            aria-expanded={openPanel === "notifications"}
            onClick={() => setOpenPanel(
              openPanel === "notifications" ? null : "notifications",
            )}
          >
            <AppIcon icon="bell" />
          </button>
          <button
            className="icon-button user-status"
            type="button"
            aria-label="账号功能暂未开放"
            title="账号功能暂未开放"
            disabled
          >
            <AppIcon icon="user" />
          </button>
          {openPanel === "notifications" ? (
            <section
              className="shell-popover notification-popover"
              role="dialog"
              aria-label="通知"
            >
              <strong>通知</strong>
              <p>暂无通知</p>
            </section>
          ) : null}
        </div>
      </header>

      <nav className="side-rail" aria-label="主导航">
        <div className="side-rail-main">
          {navItems.map((item) => {
            const destination = item.contextualRoute
              ? item.contextualRoute === "tasks"
                ? `/tasks/${navigationTargets.taskId}`
                : `/editor/${navigationTargets.editorTaskId}`
              : item.to;

            if (!destination) {
              return null;
            }

            return (
              <Link
                className="rail-link"
                key={item.label}
                to={destination}
                aria-current={item.matches(pathname, hash) ? "page" : undefined}
              >
                <AppIcon icon={item.icon} />
                <small>{item.label}</small>
              </Link>
            );
          })}
        </div>
        <div className="side-rail-footer">
          <button
            type="button"
            aria-label="历史版本暂未开放"
            title="历史版本暂未开放"
            disabled
          >
            <AppIcon icon="history" />
          </button>
          <button
            type="button"
            aria-label="帮助"
            aria-expanded={openPanel === "help"}
            onClick={() => setOpenPanel(openPanel === "help" ? null : "help")}
          >
            <AppIcon icon="help" />
          </button>
        </div>
        {openPanel === "help" ? (
          <section
            className="shell-popover help-popover"
            role="dialog"
            aria-label="使用帮助"
          >
            <div className="popover-heading">
              <strong>使用帮助</strong>
              <button
                type="button"
                aria-label="关闭帮助"
                onClick={() => setOpenPanel(null)}
              >
                ×
              </button>
            </div>
            <ol>
              <li>创建项目并选择 CAD、图片或现有模型。</li>
              <li>在任务详情查看解析与生成进度。</li>
              <li>任务完成后进入模型预览并下载 GLB。</li>
            </ol>
            <small>当前使用 mock API，尚未接入真实三维生成服务。</small>
          </section>
        ) : null}
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
