import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createProject } from "../services/projectApi";
import type { InputType } from "../types/task";

const inputOptions: Record<
  InputType,
  { label: string; formats: string; accept: string }
> = {
  cad: {
    label: "CAD 图纸生成 3D",
    formats: "支持 DWG、DXF、PDF、PNG",
    accept: ".dwg,.dxf,.pdf,.png",
  },
  image: {
    label: "产品图片生成 3D",
    formats: "支持 PNG、JPG、JPEG、WEBP",
    accept: ".png,.jpg,.jpeg,.webp",
  },
  model: {
    label: "导入现有 3D 模型",
    formats: "支持 FBX、OBJ、GLB",
    accept: ".fbx,.obj,.glb",
  },
};

function getInitialType(value: string | null): InputType {
  return value === "image" || value === "model" ? value : "cad";
}

export function CreateProjectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [inputType, setInputType] = useState<InputType>(() =>
    getInitialType(searchParams.get("type")),
  );
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const selectedOption = inputOptions[inputType];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setSubmitError("请选择要上传的文件");
      return;
    }

    if (!name.trim()) {
      setSubmitError("请输入项目名称");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const task = await createProject({
        name: name.trim(),
        inputType,
        file,
      });
      navigate(`/tasks/${task.id}`, { state: { initialTask: task } });
    } catch {
      setSubmitError("项目创建失败，请稍后重试");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="create-page">
      <Link className="back-link" to="/">
        <span aria-hidden="true">←</span>
        返回工作台
      </Link>

      <div className="create-layout">
        <section className="create-intro">
          <p className="section-index">NEW PROJECT / 04</p>
          <h2>创建 3D 生成项目</h2>
          <p>
            选择输入来源并上传文件。任务提交后，Agent
            将持续反馈解析与三维生成进度。
          </p>
          <ol className="create-steps" aria-label="创建流程">
            <li className="is-current">
              <span>01</span>
              <strong>准备输入</strong>
            </li>
            <li>
              <span>02</span>
              <strong>Agent 生成</strong>
            </li>
            <li>
              <span>03</span>
              <strong>预览模型</strong>
            </li>
          </ol>
        </section>

        <form className="project-form" onSubmit={handleSubmit}>
          <div className="form-heading">
            <div>
              <span>PROJECT PARAMETERS</span>
              <h3>项目参数</h3>
            </div>
            <span className="form-state">01 / 03</span>
          </div>

          <label className="field-label" htmlFor="project-name">
            项目名称
          </label>
          <input
            id="project-name"
            className="text-field"
            type="text"
            value={name}
            placeholder="例如：阀门执行器"
            onChange={(event) => setName(event.target.value)}
          />

          <label className="field-label" htmlFor="input-type">
            输入类型
          </label>
          <select
            id="input-type"
            className="select-field"
            value={inputType}
            onChange={(event) => {
              setInputType(event.target.value as InputType);
              setFile(null);
            }}
          >
            {Object.entries(inputOptions).map(([value, option]) => (
              <option key={value} value={value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="field-label" htmlFor="project-file">
            选择文件
          </label>
          <div className={`file-field${file ? " has-file" : ""}`}>
            <input
              key={inputType}
              id="project-file"
              type="file"
              accept={selectedOption.accept}
              aria-describedby="file-formats file-validation"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <span className="file-icon" aria-hidden="true">
              +
            </span>
            <strong>{file ? file.name : "点击选择或拖入文件"}</strong>
            <small id="file-formats">{selectedOption.formats}</small>
          </div>

          {!file ? (
            <p className="field-message" id="file-validation">
              请选择要上传的文件
            </p>
          ) : null}
          {submitError ? <p className="form-error">{submitError}</p> : null}

          <button
            className="submit-project"
            type="submit"
            disabled={!file || !name.trim() || isSubmitting}
          >
            {isSubmitting ? "正在创建项目…" : "创建并开始生成"}
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </div>
  );
}
