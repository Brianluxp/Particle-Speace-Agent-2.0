import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getTask, retryTask } from "../services/projectApi";
import type { GenerationTask, TaskStatus } from "../types/task";

const POLL_INTERVAL_MS = 1_000;
const activeStatuses: TaskStatus[] = ["queued", "parsing", "generating"];

const statusContent: Record<
  TaskStatus,
  { eyebrow: string; title: string; description: string }
> = {
  queued: {
    eyebrow: "QUEUE / 01",
    title: "任务已进入处理队列",
    description: "Agent 正在准备计算资源，请保持页面打开。",
  },
  parsing: {
    eyebrow: "PARSING / 02",
    title: "正在解析输入文件",
    description: "正在识别结构、轮廓与可用于三维生成的关键特征。",
  },
  generating: {
    eyebrow: "GENERATING / 03",
    title: "正在生成三维结构",
    description: "模型拓扑与表面细节正在构建，完成后即可进入预览。",
  },
  completed: {
    eyebrow: "COMPLETED / 04",
    title: "三维模型生成完成",
    description: "任务已经完成，可以进入模型预览并检查生成结果。",
  },
  failed: {
    eyebrow: "FAILED / ERROR",
    title: "任务生成失败",
    description: "本次任务未能完成。你可以查看原因并重新开始生成。",
  },
};

function isActiveStatus(status: TaskStatus) {
  return activeStatuses.includes(status);
}

export function TaskPage() {
  const { taskId } = useParams();
  const location = useLocation();
  const initialTask = (
    location.state as { initialTask?: GenerationTask } | null
  )?.initialTask;
  const [task, setTask] = useState<GenerationTask | null>(
    initialTask && initialTask.id === taskId ? initialTask : null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const schedulePoll = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!taskId) {
      setLoadError("任务地址无效");
      return;
    }
    const currentTaskId = taskId;

    let active = true;
    let requestInFlight = false;
    let timerId: number | undefined;

    async function loadTask() {
      timerId = undefined;
      if (!active || requestInFlight) {
        return;
      }

      requestInFlight = true;
      try {
        const nextTask = await getTask(currentTaskId);
        if (!active) {
          return;
        }
        setTask(nextTask);
        setLoadError(null);
        if (isActiveStatus(nextTask.status)) {
          schedule();
        }
      } catch {
        if (active) {
          setLoadError("任务加载失败，请返回工作台后重试");
        }
      } finally {
        requestInFlight = false;
      }
    }

    function schedule() {
      if (!active) {
        return;
      }
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
      timerId = window.setTimeout(loadTask, POLL_INTERVAL_MS);
    }

    schedulePoll.current = schedule;

    if (initialTask?.id === taskId) {
      if (isActiveStatus(initialTask.status)) {
        schedule();
      }
    } else {
      void loadTask();
    }

    return () => {
      active = false;
      schedulePoll.current = () => undefined;
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
    };
  }, [initialTask, taskId]);

  async function handleRetry() {
    if (!taskId || isRetrying) {
      return;
    }

    setIsRetrying(true);
    try {
      const retriedTask = await retryTask(taskId);
      setTask(retriedTask);
      setLoadError(null);
      schedulePoll.current();
    } catch {
      setLoadError("重新提交失败，请稍后再试");
    } finally {
      setIsRetrying(false);
    }
  }

  if (loadError && !task) {
    return (
      <section className="task-error-card">
        <p>{loadError}</p>
        <Link className="back-link" to="/">
          返回工作台
        </Link>
      </section>
    );
  }

  if (!task) {
    return (
      <section className="task-loading" aria-live="polite">
        正在获取任务状态…
      </section>
    );
  }

  const content = statusContent[task.status];
  const isActive = isActiveStatus(task.status);

  return (
    <div className="task-page">
      <div className="task-toolbar">
        <Link className="back-link" to="/">
          <span aria-hidden="true">←</span>
          返回工作台
        </Link>
        <span>任务 ID：{task.id}</span>
      </div>

      <section className={`task-panel task-${task.status}`}>
        <div className="task-copy">
          <p className="section-index">{content.eyebrow}</p>
          <h2>{content.title}</h2>
          <p>{content.description}</p>

          {task.status === "failed" ? (
            <div className="failure-box">
              <span>错误原因</span>
              <strong>{task.errorMessage ?? "未知错误"}</strong>
            </div>
          ) : (
            <div className="progress-block">
              <div className="progress-heading">
                <span>{task.stageLabel}</span>
                <strong>{task.progress}%</strong>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="任务进度"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={task.progress}
              >
                <span style={{ width: `${task.progress}%` }} />
              </div>
            </div>
          )}

          {loadError ? <p className="form-error">{loadError}</p> : null}

          {task.status === "completed" ? (
            <Link className="submit-project task-action" to={`/models/${task.id}`}>
              查看 3D 模型
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}

          {task.status === "failed" ? (
            <button
              className="submit-project task-action"
              type="button"
              disabled={isRetrying}
              onClick={handleRetry}
            >
              {isRetrying ? "正在重新提交…" : "重新尝试"}
              <span aria-hidden="true">↻</span>
            </button>
          ) : null}
        </div>

        <div className="task-visual" aria-hidden={!isActive}>
          <div className="visual-label">
            <span>AGENT PROCESS</span>
            <i />
          </div>
          <div className="process-object" aria-hidden="true">
            <span className="process-ring ring-outer" />
            <span className="process-ring ring-inner" />
            <strong>{task.progress}</strong>
          </div>
          {isActive ? (
            <p>正在生成预览，非最终模型</p>
          ) : (
            <p>{task.status === "completed" ? "生成任务已完成" : "生成流程已停止"}</p>
          )}
        </div>
      </section>
    </div>
  );
}
