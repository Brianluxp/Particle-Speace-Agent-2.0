import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import type { ModelViewerElement } from "@google/model-viewer";
import { getTask } from "../services/projectApi";
import type { GenerationTask } from "../types/task";

export function ModelPreviewPage() {
  const { taskId } = useParams();
  const previewRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelViewerElement>(null);
  const [task, setTask] = useState<GenerationTask | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modelFailed, setModelFailed] = useState(false);
  const handleModelError = useCallback(() => setModelFailed(true), []);
  const setViewerRef = useCallback(
    (viewer: ModelViewerElement | null) => {
      viewerRef.current?.removeEventListener("error", handleModelError);
      viewerRef.current = viewer;
      viewer?.addEventListener("error", handleModelError);
    },
    [handleModelError],
  );

  useEffect(() => {
    if (!taskId) {
      setLoadError("任务地址无效");
      return;
    }

    let active = true;

    getTask(taskId)
      .then((result) => {
        if (active) {
          setTask(result);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (active) {
          setLoadError("模型任务加载失败，请返回任务详情后重试");
        }
      });

    return () => {
      active = false;
    };
  }, [taskId]);

  async function handleFullscreen() {
    try {
      await previewRef.current?.requestFullscreen();
    } catch {
      setLoadError("浏览器无法进入全屏预览");
    }
  }

  if (!taskId) {
    return <Navigate to="/" replace />;
  }

  if (loadError && !task) {
    return (
      <section className="model-state-card">
        <span className="state-code">LOAD ERROR</span>
        <h2>无法读取模型任务</h2>
        <p>{loadError}</p>
        <Link className="secondary-action" to={`/tasks/${taskId}`}>
          返回任务详情
        </Link>
      </section>
    );
  }

  if (!task) {
    return (
      <section className="task-loading" aria-live="polite">
        正在读取模型信息…
      </section>
    );
  }

  if (task.status !== "completed") {
    return <Navigate to={`/tasks/${task.id}`} replace />;
  }

  if (!task.modelUrl) {
    return (
      <section className="model-state-card model-empty-state">
        <span className="state-symbol" aria-hidden="true">
          ◇
        </span>
        <span className="state-code">MODEL FILE / EMPTY</span>
        <h2>模型文件暂不可用</h2>
        <p>任务已经完成，但当前没有可供预览和下载的 GLB 文件。</p>
        <Link className="secondary-action" to={`/tasks/${task.id}`}>
          返回任务详情
        </Link>
      </section>
    );
  }

  return (
    <div className="model-preview-page">
      <div className="model-page-heading">
        <div>
          <p className="section-index">MODEL VIEWER / 05</p>
          <h2>3D 模型预览</h2>
          <p>旋转、缩放并检查 Agent 生成的模型结果</p>
        </div>
        <span>任务 ID：{task.id}</span>
      </div>

      <section className="model-workbench">
        <div className="model-toolbar">
          <Link className="back-link" to={`/tasks/${task.id}`}>
            <span aria-hidden="true">←</span>
            返回任务详情
          </Link>
          <div className="model-actions">
            <button type="button" onClick={handleFullscreen}>
              <span aria-hidden="true">⛶</span>
              全屏预览
            </button>
            <a href={task.modelUrl} download="particle-model.glb">
              <span aria-hidden="true">↓</span>
              下载模型
            </a>
          </div>
        </div>

        <div className="model-stage" ref={previewRef}>
          <div className="stage-readout">
            <span>GLB / REALTIME VIEW</span>
            <i aria-hidden="true" />
          </div>

          <model-viewer
            ref={setViewerRef}
            className={modelFailed ? "model-viewer is-failed" : "model-viewer"}
            src={task.modelUrl}
            camera-controls
            auto-rotate
            shadow-intensity="1"
            alt="粒子空间代理生成的 3D 模型"
          />

          {modelFailed ? (
            <div className="model-load-error" role="alert">
              <span aria-hidden="true">!</span>
              <h3>模型加载失败</h3>
              <p>无法显示当前模型，请返回任务详情后重试。</p>
            </div>
          ) : null}

          <div className="stage-help">
            <span>拖动旋转</span>
            <span>滚轮缩放</span>
          </div>
        </div>
      </section>
    </div>
  );
}
