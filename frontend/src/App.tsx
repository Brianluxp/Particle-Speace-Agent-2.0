import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import { CreateProjectPage } from "./pages/CreateProjectPage";
import { TaskPage } from "./pages/TaskPage";
import { WorkspacePage } from "./pages/WorkspacePage";

function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="placeholder-card">
      <span>第 1 阶段</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}


function ModelPage() {
  const { taskId } = useParams();
  return (
    <PagePlaceholder
      title="模型预览"
      description={`任务 ID：${taskId ?? "未知"}。Model Viewer 已完成基础注册。`}
    />
  );
}

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
          <Route path="/models/:taskId" element={<ModelPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
