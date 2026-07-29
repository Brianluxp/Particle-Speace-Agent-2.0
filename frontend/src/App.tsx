import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { CreateProjectPage } from "./pages/CreateProjectPage";
import { ModelPreviewPage } from "./pages/ModelPreviewPage";
import { TaskPage } from "./pages/TaskPage";
import { WorkspacePage } from "./pages/WorkspacePage";

const navItems = [
  {
    label: "工作台",
    to: "/",
    icon: "grid",
    matches: (path: string) => path === "/",
  },
  {
    label: "导入",
    to: "/projects/new",
    icon: "upload",
    matches: (path: string) => path.startsWith("/projects/new"),
  },
  {
    label: "任务",
    to: "/tasks/task-failed",
    icon: "tool",
    matches: (path: string) => path.startsWith("/tasks/"),
  },
  {
    label: "模型",
    to: "/models/task-engine",
    icon: "cube",
    matches: (path: string) => path.startsWith("/models/"),
  },
] as const;

function NavIcon({ icon }: { icon: (typeof navItems)[number]["icon"] }) {
  if (icon === "grid") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </svg>
    );
  }

  if (icon === "upload") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 20h14V8l-5-5H5zM14 3v5h5M12 17V10M9 13l3-3 3 3" />
      </svg>
    );
  }

  if (icon === "tool") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5l-3 3-3-3z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" />
    </svg>
  );
}

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
          <span className="saved-status">✓ 已保存</span>
          <span className="status-icon" aria-label="通知">♧</span>
          <span className="user-status" aria-label="用户" />
        </div>
      </header>

      <nav className="side-rail" aria-label="主导航">
        <div className="side-rail-main">
          {navItems.map((item) => (
            <Link
              className="rail-link"
              key={item.label}
              to={item.to}
              aria-current={item.matches(pathname) ? "page" : undefined}
            >
              <NavIcon icon={item.icon} />
              <small>{item.label}</small>
            </Link>
          ))}
        </div>
        <div className="side-rail-footer" aria-hidden="true">
          <span>↶</span>
          <span>?</span>
        </div>
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
