import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecentProjects } from "../services/projectApi";
import type { InputType, Project, TaskStatus } from "../types/task";

const inputOptions: Array<{
  type: InputType;
  title: string;
  support: string;
  recommended?: boolean;
}> = [
  {
    type: "cad",
    title: "CAD 图纸生成 3D",
    support: "支持DWG、DXF、PDF、PNG",
    recommended: true,
  },
  {
    type: "image",
    title: "产品图片生成3D",
    support: "支持单图矩阵图片",
  },
  {
    type: "model",
    title: "导入现有3D模型",
    support: "支持FBX、OBJ、GLB",
  },
];

const inputTypeLabels: Record<InputType, string> = {
  cad: "CAD图纸",
  image: "产品图片",
  model: "3D模型",
};

const statusPresentation: Record<
  TaskStatus,
  { label: string; progress: number }
> = {
  queued: { label: "等待参数确认", progress: 42 },
  parsing: { label: "结构解析中", progress: 56 },
  generating: { label: "动态效果生成中", progress: 68 },
  completed: { label: "3D模型已生成", progress: 100 },
  failed: { label: "生成失败", progress: 0 },
};

function InputIcon({ type }: { type: InputType }) {
  if (type === "cad") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M10 7h20l8 8v26H10z" />
        <path d="M30 7v9h8M16 24h16M16 30h10M16 36h7" />
      </svg>
    );
  }

  if (type === "image") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="7" y="9" width="34" height="30" rx="2" />
        <circle cx="18" cy="19" r="4" />
        <path d="m10 35 10-10 7 7 5-5 7 8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="m24 5 17 9-17 9L7 14zM7 14v19l17 10 17-10V14M24 23v20" />
    </svg>
  );
}

function formatProjectTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();

  const time = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  if (sameDay(date, today)) {
    return `今天 ${time}`;
  }
  if (sameDay(date, yesterday)) {
    return `昨天 ${time}`;
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function WorkspacePage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let active = true;

    getRecentProjects().then((result) => {
      if (active) {
        setProjects(result);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="workspace-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">✦ Agent 3D 制作工作台</p>
          <h2>把图纸和图片，变成可运行的3D</h2>
          <p>
            导入CAD图纸、产品图片或现有模型，Agent将引导完成解析、建模、动态效果与网页发布。
          </p>
        </div>
        <Link className="primary-action" to="/projects/new">
          <span aria-hidden="true">＋</span>
          创建新项目
        </Link>
      </section>

      <div className="home-grid">
        <section className="quick-start" aria-labelledby="input-heading">
          <div className="panel-heading">
            <h2 id="input-heading">从什么开始？</h2>
            <p>选择一种输入方式，后续步骤均由Agent引导完成</p>
          </div>

          <div className="input-list">
            {inputOptions.map((option) => (
              <Link
                className={`input-card input-${option.type}`}
                key={option.type}
                to={`/projects/new?type=${option.type}`}
              >
                <span className="input-icon">
                  <InputIcon type={option.type} />
                </span>
                <span className="input-arrow" aria-hidden="true">→</span>
                <span className="input-card-body">
                  <span className="input-title-row">
                    <strong>{option.title}</strong>
                    {option.recommended ? (
                      <span className="recommended-badge">推荐</span>
                    ) : null}
                  </span>
                  <small>{option.support}</small>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="prototype-visual" aria-label="阀门执行器模型识别预览">
          <img
            src="/valve-actuator-viewport.png"
            alt="阀门执行器三维模型"
          />
          <span className="visual-tag visual-tag-structure">AI结构识别</span>
          <span className="visual-tag visual-tag-motion">运动关系</span>
        </aside>
      </div>

      <section
        className="recent-panel"
        id="recent-projects"
        aria-labelledby="recent-heading"
      >
        <div className="recent-panel-heading">
          <div>
            <h2 id="recent-heading">最近项目</h2>
            <p>继续上次的制作细节</p>
          </div>
          <button type="button">
            查看全部 <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="project-list">
          {projects.map((project) => {
            const presentation = statusPresentation[project.status];

            return (
              <Link
                className="project-row"
                key={project.id}
                to={`/tasks/${project.taskId}`}
              >
                <span className={`project-symbol symbol-${project.inputType}`}>
                  <InputIcon type={project.inputType} />
                </span>
                <span className="project-identity">
                  <strong>{project.name}</strong>
                  <small>{inputTypeLabels[project.inputType]}</small>
                </span>
                <span className={`project-status status-${project.status}`}>
                  <i aria-hidden="true" />
                  {presentation.label}
                </span>
                <span className="project-progress" aria-hidden="true">
                  <i style={{ width: `${presentation.progress}%` }} />
                </span>
                <time dateTime={project.createdAt}>
                  {formatProjectTime(project.createdAt)}
                </time>
                <span className="project-arrow" aria-hidden="true">→</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
