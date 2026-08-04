import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getEditorDefinition } from "../mocks/editorMockData";
import { loadEditorDraft } from "../services/editorDraftStore";
import { getTask } from "../services/projectApi";
import type { GenerationTask } from "../types/task";

function LoadedEditor({ task }: { task: GenerationTask }) {
  const definition = useMemo(() => getEditorDefinition(task.id), [task.id]);
  const [draft] = useState(() => loadEditorDraft(task.id, definition));

  return (
    <div className="editor-shell">
      <header className="editor-topbar">
        <h1>{definition.projectName}</h1>
      </header>
      <nav className="editor-rail" aria-label="编辑器导航">
        <span />
      </nav>
      <aside className="editor-guide">Agent 引导</aside>
      <main className="editor-main">
        <model-viewer src={task.modelUrl!} camera-controls alt="3D 模型" />
      </main>
      <aside className="editor-inspector">场景与属性</aside>
    </div>
  );
}

export function EditorPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<GenerationTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setError("无法读取编辑器任务");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getTask(taskId)
      .then((data) => {
        if (active) {
          setTask(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("无法读取编辑器任务");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [taskId]);

  if (loading) {
    return <div data-testid="editor-route-loading">正在加载编辑器</div>;
  }

  if (error || !task) {
    return (
      <div className="editor-error-state">
        <p>{error ?? "无法读取编辑器任务"}</p>
        <Link to="/">返回首页</Link>
      </div>
    );
  }

  if (task.status !== "completed") {
    return <Navigate to={`/tasks/${task.id}`} replace />;
  }

  if (!task.modelUrl) {
    return (
      <div className="editor-empty-state">
        <p>模型文件暂不可用</p>
        <Link to={`/tasks/${task.id}`}>返回任务详情</Link>
      </div>
    );
  }

  return <LoadedEditor task={task} />;
}
