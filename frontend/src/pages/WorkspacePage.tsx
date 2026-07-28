import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecentProjects } from "../services/projectApi";
import type { InputType, Project, TaskStatus } from "../types/task";

const inputOptions: Array<{
  type: InputType;
  title: string;
  support: string;
  code: string;
  recommended?: boolean;
}> = [
  {
    type: "cad",
    title: "CAD 图纸生成 3D",
    support: "支持 DWG、DXF、PDF、PNG",
    code: "DWG / DXF",
    recommended: true,
  },
  {
    type: "image",
    title: "产品图片生成 3D",
    support: "支持单图或多视角图片",
    code: "IMG / MULTI",
  },
  {
    type: "model",
    title: "导入现有 3D 模型",
    support: "支持 FBX、OBJ、GLB",
    code: "FBX / GLB",
  },
];

const inputTypeLabels: Record<InputType, string> = {
  cad: "CAD 图纸",
  image: "产品图片",
  model: "3D 模型",
};

const statusLabels: Record<TaskStatus, string> = {
  queued: "等待处理",
  parsing: "结构解析中",
  generating: "3D 生成中",
  completed: "3D 模型已生成",
  failed: "生成失败",
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
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
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
      <section className="workspace-hero">
        <div className="hero-copy">
          <p className="eyebrow">AGENT 3D STUDIO / 01</p>
          <h2>Agent 3D 制作工作台</h2>
          <p className="hero-tagline">把图纸和图片，变成可运行的 3D</p>
          <p className="hero-description">
            导入 CAD 图纸、产品图片或现有模型，Agent
            将引导完成解析、建模、动态效果与网页发布。
          </p>
          <Link className="primary-action" to="/projects/new">
            创建新项目
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <aside className="hero-system" aria-label="Agent 能力">
          <div className="system-head">
            <span>AGENT PIPELINE</span>
            <i aria-hidden="true" />
          </div>
          <div className="system-orbit" aria-hidden="true">
            <span className="orbit-core">3D</span>
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
          </div>
          <div className="system-metrics">
            <div>
              <span>01</span>
              <strong>AI 结构识别</strong>
            </div>
            <div>
              <span>02</span>
              <strong>运动关系</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="workspace-section" aria-labelledby="input-heading">
        <div className="section-heading">
          <div>
            <p className="section-index">01 / INPUT</p>
            <h2 id="input-heading">从什么开始？</h2>
            <p>选择一种输入方式，后续步骤均由 Agent 引导完成</p>
          </div>
          <span className="section-rule" aria-hidden="true" />
        </div>

        <div className="input-grid">
          {inputOptions.map((option) => (
            <Link
              className="input-card"
              key={option.type}
              to={`/projects/new?type=${option.type}`}
            >
              <div className="input-card-top">
                <span className="input-icon">
                  <InputIcon type={option.type} />
                </span>
                <span className="input-code">{option.code}</span>
              </div>
              <div className="input-card-body">
                <div className="input-title-row">
                  <h3>{option.title}</h3>
                  {option.recommended ? (
                    <span className="recommended-badge">推荐</span>
                  ) : null}
                </div>
                <p>{option.support}</p>
              </div>
              <span className="card-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="workspace-section recent-section" aria-labelledby="recent-heading">
        <div className="section-heading recent-heading">
          <div>
            <p className="section-index">02 / RECENT</p>
            <h2 id="recent-heading">最近项目</h2>
            <p>继续上次的制作进度</p>
          </div>
          <span className="project-count">{projects.length} 个项目</span>
        </div>

        <div className="project-list">
          {projects.map((project, index) => (
            <Link
              className="project-row"
              key={project.id}
              to={`/tasks/${project.taskId}`}
            >
              <span className="project-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={`project-symbol symbol-${project.inputType}`}>
                <InputIcon type={project.inputType} />
              </span>
              <span className="project-identity">
                <strong>{project.name}</strong>
                <small>{inputTypeLabels[project.inputType]}</small>
              </span>
              <span className={`project-status status-${project.status}`}>
                <i aria-hidden="true" />
                {statusLabels[project.status]}
              </span>
              <time dateTime={project.createdAt}>
                {formatProjectTime(project.createdAt)}
              </time>
              <span className="project-arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
