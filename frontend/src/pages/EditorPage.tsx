import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AgentGuidePanel } from "../components/editor/AgentGuidePanel";
import { AnimationTimeline } from "../components/editor/AnimationTimeline";
import { EditorViewport } from "../components/editor/EditorViewport";
import { SceneInspector } from "../components/editor/SceneInspector";
import { getEditorDefinition } from "../mocks/editorMockData";
import { loadEditorDraft, saveEditorDraft } from "../services/editorDraftStore";
import { getTask } from "../services/projectApi";
import type { EditorDraft, RotationAxis } from "../types/editor";
import type { GenerationTask } from "../types/task";

function LoadedEditor({ task }: { task: GenerationTask }) {
  const definition = useMemo(() => getEditorDefinition(task.id), [task.id]);
  const [draft, setDraft] = useState(() => loadEditorDraft(task.id, definition));
  const [saveMessage] = useState<string | null>("演示草稿已保存");
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [hasEmbeddedAnimation, setHasEmbeddedAnimation] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function updateDraft(change: (current: EditorDraft) => EditorDraft) {
    setDraft((current) => {
      const next = change(current);
      saveEditorDraft(task.id, next);
      return next;
    });
  }

  const handleAxisChange = (axis: RotationAxis) => {
    updateDraft((current) => ({ ...current, rotationAxis: axis }));
  };

  const handleContinue = () => {
    const steps = definition.steps;
    const currentIdx = steps.findIndex((s) => s.id === draft.activeStepId);
    const nextIdx = Math.min(steps.length - 1, currentIdx + 1);
    updateDraft((current) => ({ ...current, activeStepId: steps[nextIdx].id }));
  };

  const handleMessage = (msg: string) => {
    updateDraft((current) => ({
      ...current,
      messages: [...current.messages, msg],
    }));
    setNoticeMessage("需求已记录，真实 Agent 服务尚未接入");
  };

  const handleUnavailableAction = (label: string) => {
    setNoticeMessage(label);
  };

  const handleSelectNode = (nodeId: string) => {
    updateDraft((current) => ({ ...current, selectedNodeId: nodeId }));
  };

  const handleToggleExpanded = (nodeId: string) => {
    updateDraft((current) => {
      const isExpanded = current.expandedNodeIds.includes(nodeId);
      return {
        ...current,
        expandedNodeIds: isExpanded
          ? current.expandedNodeIds.filter((id) => id !== nodeId)
          : [...current.expandedNodeIds, nodeId],
      };
    });
  };

  const handleToggleHidden = (nodeId: string) => {
    updateDraft((current) => {
      const isHidden = current.hiddenNodeIds.includes(nodeId);
      return {
        ...current,
        hiddenNodeIds: isHidden
          ? current.hiddenNodeIds.filter((id) => id !== nodeId)
          : [...current.hiddenNodeIds, nodeId],
      };
    });
    setNoticeMessage("演示状态，未修改模型文件");
  };

  const handleToggleLocked = (nodeId: string) => {
    updateDraft((current) => {
      const isLocked = current.lockedNodeIds.includes(nodeId);
      return {
        ...current,
        lockedNodeIds: isLocked
          ? current.lockedNodeIds.filter((id) => id !== nodeId)
          : [...current.lockedNodeIds, nodeId],
      };
    });
    setNoticeMessage("演示状态，未修改模型文件");
  };

  return (
    <div className="editor-shell">
      <header className="editor-topbar">
        <div className="topbar-left">
          <span className="brand-logo">PARTICLE SPACE</span>
          <h1>{definition.projectName}</h1>
          <span className="source-tag">{definition.sourceLabel}</span>
        </div>

        <div className="topbar-status-area" role="status">
          {saveMessage ? (
            <div className="save-status">
              <span>{saveMessage}</span>
              <small>仅保存在当前浏览器，未写入模型文件</small>
            </div>
          ) : null}
          {noticeMessage ? <div className="notice-banner">{noticeMessage}</div> : null}
        </div>

        <div className="topbar-right-actions">
          <Link className="topbar-link" to={`/tasks/${task.id}`}>
            返回任务
          </Link>
          <Link className="topbar-link preview-link" to={`/models/${task.id}`}>
            预览
          </Link>
          <button
            type="button"
            className="topbar-btn publish-btn"
            onClick={() => setNoticeMessage("真实发布服务尚未接入")}
          >
            发布
          </button>
        </div>
      </header>

      <nav className="editor-rail" aria-label="编辑器导航">
        <div className="rail-main-links">
          <Link className="editor-rail-item" to="/" title="工作台">
            <span className="rail-icon">⊞</span>
            <small>工作台</small>
          </Link>
          <Link className="editor-rail-item" to="/projects/new" title="导入">
            <span className="rail-icon">⇪</span>
            <small>导入</small>
          </Link>
          <Link
            className="editor-rail-item active"
            to={`/editor/${task.id}`}
            title="AI制作"
            aria-current="page"
          >
            <span className="rail-icon">🛠</span>
            <small>AI制作</small>
          </Link>
          <Link
            className="editor-rail-item"
            to={`/models/${task.id}`}
            title="模型"
          >
            <span className="rail-icon">🧊</span>
            <small>模型</small>
          </Link>
          <Link className="editor-rail-item" to="/#recent-projects" title="项目">
            <span className="rail-icon">📁</span>
            <small>项目</small>
          </Link>
        </div>

        <div className="rail-footer-links">
          <button
            type="button"
            className="editor-rail-item"
            aria-label="历史版本暂未开放"
            title="历史版本暂未开放"
            disabled
          >
            <span className="rail-icon">🕒</span>
          </button>
          <button
            type="button"
            className="editor-rail-item"
            aria-label="帮助"
            title="帮助"
            aria-expanded={showHelp}
            onClick={() => setShowHelp(!showHelp)}
          >
            <span className="rail-icon">?</span>
          </button>
        </div>

        {showHelp ? (
          <section className="editor-help-popover" role="dialog" aria-label="帮助">
            <h4>编辑器演示说明</h4>
            <p>1. 中央为真实 GLB 模型视口，支持全屏与视口截图。</p>
            <p>2. 对象大纲树、属性面板与 Agent 引导面板均为浏览器演示操作。</p>
            <p>3. 任何编辑草稿仅在本地保存，未写回 GLB 模型文件。</p>
          </section>
        ) : null}
      </nav>

      <AgentGuidePanel
        definition={definition}
        draft={draft}
        onAxisChange={handleAxisChange}
        onContinue={handleContinue}
        onMessage={handleMessage}
        onUnavailableAction={handleUnavailableAction}
      />

      <main className="editor-main">
        <EditorViewport
          modelUrl={task.modelUrl!}
          isTimelinePlaying={isTimelinePlaying}
          onAnimationAvailability={setHasEmbeddedAnimation}
          onNotice={setNoticeMessage}
        />
        <AnimationTimeline
          tracks={definition.tracks}
          seconds={draft.timelineSeconds}
          hasEmbeddedAnimation={hasEmbeddedAnimation}
          onSecondsChange={(secs) =>
            updateDraft((current) => ({ ...current, timelineSeconds: secs }))
          }
          onPlayingChange={setIsTimelinePlaying}
        />
      </main>

      <SceneInspector
        definition={definition}
        draft={draft}
        onSelect={handleSelectNode}
        onToggleExpanded={handleToggleExpanded}
        onToggleHidden={handleToggleHidden}
        onToggleLocked={handleToggleLocked}
      />
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
