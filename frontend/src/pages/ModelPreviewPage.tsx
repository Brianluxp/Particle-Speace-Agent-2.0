import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import type { ModelViewerElement } from "@google/model-viewer";
import { getTask } from "../services/projectApi";
import { DEFAULT_MODEL_URL } from "../mocks/projects";
import type { GenerationTask } from "../types/task";

const FALLBACK_MODEL_URL = import.meta.env.VITE_DEMO_GLB_URL ?? DEFAULT_MODEL_URL;

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
    let timer: number | undefined;

    const pollTask = async () => {
      try {
        const result = await getTask(taskId);
        if (!active) return;
        setTask(result);
        setLoadError(null);
        if (result.status !== "completed" && result.status !== "failed") {
          timer = window.setTimeout(pollTask, 800);
        }
      } catch {
        if (active) {
          setLoadError("模型任务加载失败，请返回任务详情后重试");
        }
      }
    };

    pollTask();

    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [taskId]);

  async function handleFullscreen() {
    try {
      await previewRef.current?.requestFullscreen();
    } catch {
      setLoadError("浏览器无法进入全屏预览");
    }
  }

  const modelUrl = task?.modelUrl ?? FALLBACK_MODEL_URL;
  const isModelAsset = (url: string) => /\.(glb|gltf)$/i.test(url);
  const initialThumbnail =
    task?.thumbnailUrl ??
    (modelUrl && !isModelAsset(modelUrl) ? modelUrl : null) ??
    "/valve-actuator-viewport.svg";
  const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnail);
  useEffect(() => {
    setThumbnailUrl(initialThumbnail);
  }, [initialThumbnail]);
  const handleThumbnailError = useCallback(() => {
    setThumbnailUrl("/valve-actuator-viewport.svg");
  }, []);

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
    return (
      <section className="task-loading" aria-live="polite">
        模型生成中（{task.progress ?? 0}%）· {task.stageLabel ?? "请稍候"}
      </section>
    );
  }

  const finalModelUrl = task.modelUrl ?? FALLBACK_MODEL_URL;

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
            <a href={finalModelUrl} download="particle-model.glb">
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
            src={finalModelUrl}
            camera-controls
            auto-rotate
            shadow-intensity="1"
            alt="粒子空间代理生成的 3D 模型"
          >
            <img
              slot="poster"
              src={thumbnailUrl}
              alt="模型预览占位"
              onError={handleThumbnailError}
            />
          </model-viewer>

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
