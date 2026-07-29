import { Link, Navigate, Route, Routes } from "react-router-dom";
import { CreateProjectPage } from "./pages/CreateProjectPage";
import { ModelPreviewPage } from "./pages/ModelPreviewPage";
import { TaskPage } from "./pages/TaskPage";
import { WorkspacePage } from "./pages/WorkspacePage";

export function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="product-link" to="/">
          <span className="product-mark" aria-hidden="true" />
          <h1>粒子空间代理 2.0</h1>
        </Link>
        <Link className="workspace-link" to="/">项目工作台</Link>
      </header>

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
