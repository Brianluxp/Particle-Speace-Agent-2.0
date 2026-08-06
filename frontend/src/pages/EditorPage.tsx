import {
  ArrowCounterClockwise,
  ArrowsOutCardinal,
  Bell,
  Camera,
  CaretDown,
  CaretRight,
  Check,
  CheckCircle,
  CornersOut,
  Cube,
  CursorClick,
  Eye,
  EyeSlash,
  File,
  FolderSimple,
  GearSix,
  Hand,
  ImageSquare,
  Lock,
  MagnifyingGlass,
  PaperPlaneTilt,
  Pause,
  Play,
  Question,
  Selection,
  SidebarSimple,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Sparkle,
  SquaresFour,
  TreeStructure,
  UserCircle,
  Wrench,
  X,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEditorDefinition } from "../mocks/editorMockData";
import { getTask } from "../services/projectApi";
import type { EditorDefinition, EditorDraft } from "../types/editor";
import type { GenerationTask } from "../types/task";

type RailPanel =
  | "agent"
  | "search"
  | "tools"
  | "model"
  | "files"
  | "tree"
  | "history"
  | "help";

const railItems: Array<{ id: RailPanel; label: string; Icon: ComponentType<{ size?: number }> }> = [
  { id: "agent", label: "Agent 引导", Icon: SidebarSimple },
  { id: "search", label: "搜索", Icon: MagnifyingGlass },
  { id: "tools", label: "编辑工具", Icon: Wrench },
  { id: "model", label: "模型", Icon: Cube },
  { id: "files", label: "项目文件", Icon: FolderSimple },
  { id: "tree", label: "流程结构", Icon: TreeStructure },
  { id: "history", label: "历史记录", Icon: ArrowCounterClockwise },
  { id: "help", label: "帮助", Icon: Question },
];

const RAIL_PLACEHOLDER_PANELS: ReadonlySet<RailPanel> = new Set([
  "search",
  "files",
  "tree",
  "history",
  "help",
]);

type TreeItem = {
  name: string;
  depth: number;
};

const toolButtons = [
  { label: "选择", icon: CursorClick },
  { label: "移动", icon: ArrowsOutCardinal },
  { label: "旋转", icon: ArrowCounterClockwise },
  { label: "拖拽视图", icon: Hand },
  { label: "框选", icon: Selection },
  { label: "适合视图", icon: CornersOut },
  { label: "截图", icon: Camera },
  { label: "聚焦对象", icon: MagnifyingGlass },
  { label: "视图设置", icon: GearSix },
] as const;

function EditorViewport({
  modelUrl,
  thumbnailUrl,
  selectedPart,
  hiddenParts,
  activeTool,
  onSelectPart,
  onToggleVisibility,
}: {
  modelUrl: string;
  thumbnailUrl?: string | null;
  selectedPart: string;
  hiddenParts: string[];
  activeTool: string;
  onSelectPart: (name: string) => void;
  onToggleVisibility: (name: string) => void;
}) {
  const fallbackUrl = modelUrl || thumbnailUrl || "/valve-actuator-viewport.png";
  return (
    <section className="editor-viewport" aria-label="三维编辑视图">
      <div className="viewport-toolbar" aria-label="视图工具栏">
        {toolButtons.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            className={activeTool === label ? "is-active" : ""}
            onClick={() => onSelectPart(label)}
          >
            <Icon size={19} />
          </button>
        ))}
      </div>
      <div className="view-cube" aria-label="当前视角：前">
        <Cube size={44} weight="duotone" />
        <span>前</span>
      </div>
      <img
        className={`editor-model-image ${hiddenParts.includes(selectedPart) ? "hide-motion" : ""}`}
        src={fallbackUrl}
        alt="阀门执行器三维模型与运动关系"
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          if (target.src.endsWith("/valve-actuator-viewport.png")) return;
          target.src = "/valve-actuator-viewport.png";
        }}
      />
      <div className="axis-labels" aria-label="三维坐标轴">
        <span className="axis-z">Z</span>
        <span className="axis-y">Y</span>
        <span className="axis-x">X</span>
      </div>
      <div className="viewport-caption">
        <Sparkle size={16} weight="fill" />
        {activeTool}工具已启用
      </div>
    </section>
  );
}

function ScenePanel({
  treeItems,
  selectedPart,
  hiddenParts,
  onSelectPart,
  onToggleVisibility,
}: {
  treeItems: TreeItem[];
  selectedPart: string;
  hiddenParts: string[];
  onSelectPart: (name: string) => void;
  onToggleVisibility: (name: string) => void;
}) {
  const [rightTab, setRightTab] = useState<"scene" | "properties">("scene");
  return (
    <aside className="scene-panel">
      <div className="scene-tabs" role="tablist" aria-label="编辑器侧栏">
        <button
          type="button"
          role="tab"
          aria-selected={rightTab === "scene"}
          onClick={() => setRightTab("scene")}
        >
          场景
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={rightTab === "properties"}
          onClick={() => setRightTab("properties")}
        >
          属性
        </button>
      </div>
      <div className="scene-search">
        <MagnifyingGlass size={17} />
        <input aria-label="搜索对象" placeholder="搜索对象" />
        <button type="button" aria-label="筛选对象">
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {rightTab === "scene" ? (
        <section className="model-tree-section">
          <div className="tree-root">
            <CaretDown size={14} />
            <strong>阀门执行器</strong>
          </div>
          <div role="tree" aria-label="模型树" className="model-tree">
            {treeItems.map((item) => {
              const visible = !hiddenParts.includes(item.name);
              return (
                <div
                  className="tree-row"
                  key={item.name}
                  style={{ paddingLeft: 10 + item.depth * 18 }}
                >
                  <button
                    type="button"
                    role="treeitem"
                    aria-label={item.name}
                    aria-selected={selectedPart === item.name}
                    className={selectedPart === item.name ? "is-selected" : ""}
                    onClick={() => onSelectPart(item.name)}
                  >
                    {item.depth === 0 ? <CaretRight size={13} /> : <span className="tree-indent" />}
                    {item.name}
                  </button>
                  <button
                    type="button"
                    aria-label={`${visible ? "隐藏" : "显示"}${item.name}`}
                    onClick={() => onToggleVisibility(item.name)}
                  >
                    {visible ? <Eye size={16} /> : <EyeSlash size={16} />}
                  </button>
                  <Lock size={15} />
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="scene-summary">
          <SquaresFour size={26} />
          <strong>场景属性</strong>
          <p>单位：毫米 · 坐标系：右手系 · 帧率：30 FPS</p>
        </section>
      )}

      <section className="property-inspector">
        <div className="property-title">
          <Cube size={18} weight="duotone" />
          <h2>{selectedPart}属性</h2>
        </div>
        <label>
          名称<input value={selectedPart} readOnly />
        </label>
        <label className="toggle-row">
          可见
          <input
            type="checkbox"
            checked={!hiddenParts.includes(selectedPart)}
            onChange={() => onToggleVisibility(selectedPart)}
          />
        </label>
        <label className="toggle-row">
          锁定<input type="checkbox" />
        </label>
        <fieldset>
          <legend>变换</legend>
          <span>位置 (mm)</span>
          <div className="vector-fields">
            <label>X<input value="0.00" readOnly /></label>
            <label>Y<input value="0.00" readOnly /></label>
            <label>Z<input value="115.20" readOnly /></label>
          </div>
          <span>旋转 (°)</span>
          <div className="vector-fields">
            <label>X<input value="0.00" readOnly /></label>
            <label>Y<input value="0.00" readOnly /></label>
            <label>Z<input value="0.00" readOnly /></label>
          </div>
          <span>缩放</span>
          <div className="vector-fields">
            <label>X<input value="1.00" readOnly /></label>
            <label>Y<input value="1.00" readOnly /></label>
            <label>Z<input value="1.00" readOnly /></label>
          </div>
        </fieldset>
      </section>
    </aside>
  );
}

function AgentEditorPage({
  definition,
  draft,
  modelUrl,
  thumbnailUrl,
}: {
  definition: EditorDefinition;
  draft: EditorDraft;
  modelUrl: string;
  thumbnailUrl?: string | null;
}) {
  const [direction, setDirection] = useState<"A" | "B">("A");
  const [selectedPart, setSelectedPart] = useState<string>("阀杆");
  const [hiddenParts, setHiddenParts] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState("选择");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(4);
  const [activeRail, setActiveRail] = useState<RailPanel>("agent");

  const isModelAsset = (url: string) => /\.(glb|gltf)$/i.test(url);
  const fallbackUrl =
    thumbnailUrl ||
    (modelUrl && !isModelAsset(modelUrl) ? modelUrl : null) ||
    "/valve-actuator-viewport.svg";
  const [previewImageSrc, setPreviewImageSrc] = useState(fallbackUrl);
  useEffect(() => {
    setPreviewImageSrc(fallbackUrl);
  }, [fallbackUrl]);
  const handlePreviewImageError = useCallback(() => {
    setPreviewImageSrc("/valve-actuator-viewport.svg");
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setCurrentTime((value) => {
        if (value >= 9.9) {
          setIsPlaying(false);
          return 10;
        }
        return Math.round((value + 0.1) * 10) / 10;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const timelineLeft = `${Math.min(100, currentTime * 10)}%`;
  const currentTimeLabel = useMemo(
    () =>
      `00:${String(Math.floor(currentTime)).padStart(2, "0")}:${String(
        Math.floor((currentTime % 1) * 10),
      ).padEnd(2, "0")}`,
    [currentTime],
  );

  const treeItems: TreeItem[] = definition.nodes
    .filter((n) => n.name !== "材质")
    .map((n) => {
      const parent = definition.nodes.find((p) => p.id === n.parentId);
      const depth = parent ? 1 : 0;
      return { name: n.name, depth };
    });

  function toggleVisibility(part: string) {
    setHiddenParts((items) =>
      items.includes(part)
        ? items.filter((item) => item !== part)
        : [...items, part],
    );
  }

  function continueWorkflow() {
    setActiveStep(5);
    setNotice("已进入检测与优化");
  }

  const stepDescriptions = [
    "已解析网格拓扑与层级",
    "已标记 13 个独立机械构件",
    "定义阀杆与手轮旋转约束",
    "验证干涉与运动范围",
    "计算关键帧与运动轨迹",
    "准备高保真 3D 资产",
  ];

  return (
    <div className="editor-page">
      <header className="editor-topbar">
        <Link className="editor-brand" to="/">
          <Cube size={25} weight="duotone" />
          <strong>PARTICLE SPACE</strong>
        </Link>
        <div className="editor-context">
          <button type="button" aria-label="切换项目">
            {definition.projectName}
            <CaretDown size={14} />
          </button>
          <button type="button" aria-label="切换输入素材">
            <ImageSquare size={19} />
            {definition.sourceLabel}
            <CaretDown size={14} />
          </button>
        </div>
        <span className="editor-save-status">
          <CheckCircle size={17} weight="fill" />
          自动保存 · 12:48:32
        </span>
        <div className="editor-top-actions">
          <button
            type="button"
            className="editor-preview-button"
            onClick={() => setPreviewOpen(true)}
          >
            <Play size={17} />
            预览
          </button>
          <button
            type="button"
            className="editor-publish-button"
            onClick={() => setNotice("发布成功：演示链接已生成")}
          >
            发布
          </button>
          <button type="button" aria-label="通知" className="editor-icon-button">
            <Bell size={20} />
          </button>
          <button type="button" aria-label="用户" className="editor-icon-button">
            <UserCircle size={24} weight="duotone" />
          </button>
        </div>
      </header>

      <div className="editor-workspace">
        <nav className="editor-tool-rail" aria-label="编辑器导航">
          <div>
            {railItems.slice(0, 5).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={activeRail === id ? "is-active" : ""}
                aria-label={label}
                aria-pressed={activeRail === id}
                onClick={() => setActiveRail(id)}
              >
                <Icon size={23} />
              </button>
            ))}
          </div>
          <div>
            {railItems.slice(5).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={activeRail === id ? "is-active" : ""}
                aria-label={label}
                aria-pressed={activeRail === id}
                onClick={() => setActiveRail(id)}
              >
                <Icon size={23} />
              </button>
            ))}
          </div>
        </nav>

        {activeRail === "agent" ? (
        <aside className="agent-guide-panel">
          <div className="agent-panel-heading">
            <h1>Agent 引导</h1>
            <span>AI</span>
          </div>

          <ol className="agent-step-list">
            {definition.steps.map((step, index) => {
              const stepNumber = index + 1;
              const completed = stepNumber < activeStep;
              const active = stepNumber === activeStep;
              return (
                <li
                  key={step.id}
                  className={`${completed ? "is-completed" : ""} ${active ? "is-active" : ""}`}
                >
                  <span className="agent-step-marker">
                    {completed ? <Check size={13} weight="bold" /> : stepNumber}
                  </span>
                  <div>
                    <strong>
                      {stepNumber} {step.title}
                    </strong>
                    <p>{stepDescriptions[index] ?? step.description}</p>
                  </div>
                  {completed ? (
                    <CheckCircle className="agent-step-check" size={18} weight="fill" />
                  ) : null}

                  {active && activeStep === 4 ? (
                    <div className="agent-active-detail">
                      <div className="agent-task-summary">
                        <span>任务</span>
                        <p>为可动部件生成运动关系与动画效果。</p>
                        <span>说明</span>
                        <p>正在定义阀杆旋转轴与运动范围，并生成与手轮的联动关系。</p>
                      </div>
                      <dl>
                        <div>
                          <dt>已用时间</dt>
                          <dd>00:00:24</dd>
                        </div>
                        <div>
                          <dt>影响对象</dt>
                          <dd>
                            <span>阀杆</span>
                            <span>手轮</span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>

          {activeStep === 4 ? (
            <section className="direction-card" aria-label="确认阀杆旋转轴方向">
              <div className="direction-heading">
                <Question size={18} weight="fill" />
                <div>
                  <strong>确认阀杆旋转轴方向？</strong>
                  <small>系统已检测到 2 种可能方向</small>
                </div>
              </div>
              <label className={direction === "A" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="direction"
                  value="A"
                  aria-label="方向 A"
                  checked={direction === "A"}
                  onChange={() => setDirection("A")}
                />
                <span>
                  <strong>方向 A（推荐）</strong>
                  <small>沿 Z 轴正方向旋转</small>
                </span>
                <ArrowCounterClockwise size={23} />
              </label>
              <label className={direction === "B" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="direction"
                  value="B"
                  aria-label="方向 B"
                  checked={direction === "B"}
                  onChange={() => setDirection("B")}
                />
                <span>
                  <strong>方向 B</strong>
                  <small>沿 Z 轴负方向旋转</small>
                </span>
                <ArrowCounterClockwise size={23} />
              </label>
              <button type="button" className="continue-generation" onClick={continueWorkflow}>
                继续生成动态效果
              </button>
            </section>
          ) : (
            <section className="optimization-card" aria-live="polite">
              <CheckCircle size={24} weight="fill" />
              <div>
                <strong>已进入检测与优化</strong>
                <p>正在检查阀杆与手轮的联动关系。</p>
              </div>
            </section>
          )}

          <form className="agent-prompt" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="agent-message">告诉 Agent 你的想法或需求...</label>
            <textarea id="agent-message" aria-label="告诉 Agent 你的想法或需求" rows={2} />
            <div>
              <button type="button">
                <ImageSquare size={17} />
                图片
              </button>
              <button type="button">
                <File size={17} />
                文件
              </button>
              <button type="button">
                <Sparkle size={17} />
                指令库
              </button>
              <button type="submit" aria-label="发送给 Agent">
                <PaperPlaneTilt size={20} />
              </button>
            </div>
          </form>
        </aside>
        ) : RAIL_PLACEHOLDER_PANELS.has(activeRail) ? (
          <aside className="agent-guide-panel rail-placeholder" aria-live="polite">
            <div className="agent-panel-heading">
              <h1>{railItems.find((item) => item.id === activeRail)?.label}</h1>
              <span>AI</span>
            </div>
            <p>该功能开发中，敬请期待。</p>
          </aside>
        ) : null}

        <main className="editor-stage-column">
          {activeRail === "model" ? (
            <section className="editor-viewport" aria-label="三维模型查看">
              {fallbackUrl.endsWith(".glb") ? (
                <model-viewer
                  src={fallbackUrl}
                  alt={thumbnailUrl ?? "阀门执行器三维模型"}
                  camera-controls
                  auto-rotate
                  shadow-intensity="1"
                  style={{ width: "100%", height: "100%", background: "transparent" }}
                >
                  <img
                    slot="poster"
                    src={thumbnailUrl ?? "/valve-actuator-viewport.png"}
                    alt="阀门执行器三维模型与运动关系"
                  />
                </model-viewer>
              ) : (
                <img
                  className="editor-model-image"
                  src={fallbackUrl}
                  alt="阀门执行器三维模型与运动关系"
                />
              )}
            </section>
          ) : (
          <EditorViewport
            modelUrl={modelUrl}
            thumbnailUrl={thumbnailUrl}
            selectedPart={selectedPart}
            hiddenParts={hiddenParts}
            activeTool={activeTool}
            onSelectPart={(p) => {
              if (toolButtons.some((t) => t.label === p)) setActiveTool(p);
              else setSelectedPart(p);
            }}
            onToggleVisibility={toggleVisibility}
          />
          )}

          <section className="timeline-panel" aria-label="动画时间轴">
            <div className="timeline-controls">
              <button
                type="button"
                aria-label={isPlaying ? "暂停动画" : "播放动画"}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
              </button>
              <button type="button" aria-label="回到开始" onClick={() => setCurrentTime(0)}>
                <SkipBack size={17} />
              </button>
              <button type="button" aria-label="跳到结束" onClick={() => setCurrentTime(10)}>
                <SkipForward size={17} />
              </button>
              <span>{currentTimeLabel} / 00:10:00</span>
              <div className="timeline-controls-spacer" />
              <button type="button" aria-label="添加轨道">
                ＋ 轨道
              </button>
              <button type="button" aria-label="时间轴设置">
                <GearSix size={18} />
              </button>
              <button type="button" aria-label="展开时间轴">
                <CornersOut size={18} />
              </button>
            </div>
            <div className="timeline-ruler">
              {[0, 2, 4, 6, 8, 10].map((second) => (
                <span key={second}>00:{String(second).padStart(2, "0")}</span>
              ))}
            </div>
            <div className="timeline-tracks">
              <div className="timeline-playhead" style={{ left: timelineLeft }} />
              <div className="track-row">
                <span>
                  <Eye size={15} />
                  阀杆旋转
                </span>
                <div className="track-bar track-bar-blue">
                  <i />
                  <i />
                  <i />
                </div>
                <button type="button" aria-label="阀杆旋转轨道菜单">
                  •••
                </button>
              </div>
              <div className="track-row">
                <span>
                  <Eye size={15} />
                  手轮联动
                </span>
                <div className="track-bar track-bar-cyan">
                  <i />
                  <i />
                  <i />
                </div>
                <button type="button" aria-label="手轮联动轨道菜单">
                  •••
                </button>
              </div>
            </div>
          </section>
        </main>

        <ScenePanel
          treeItems={treeItems}
          selectedPart={selectedPart}
          hiddenParts={hiddenParts}
          onSelectPart={setSelectedPart}
          onToggleVisibility={toggleVisibility}
        />
      </div>

      {notice ? (
        <div className="editor-toast" role="status">
          {notice}
        </div>
      ) : null}

      {previewOpen ? (
        <div className="preview-backdrop" role="presentation">
          <section
            className="editor-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="动态效果预览"
          >
            <div className="preview-dialog-heading">
              <div>
                <span>动态效果预览</span>
                <small>阀杆旋转 · 手轮联动 · 10 秒</small>
              </div>
              <button type="button" aria-label="关闭预览" onClick={() => setPreviewOpen(false)}>
                <X size={21} />
              </button>
            </div>
            <img
              src={previewImageSrc}
              alt="阀门执行器动态效果预览"
              onError={handlePreviewImageError}
              loading="eager"
            />
            <button
              type="button"
              className="preview-play"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" />}
              {isPlaying ? "暂停" : "播放动态效果"}
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function EditorPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<GenerationTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const definition = useMemo(
    () => (taskId ? getEditorDefinition(taskId) : null),
    [taskId],
  );

  useEffect(() => {
    if (!taskId) {
      setError("无法读取编辑器任务");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    let timer: number | undefined;

    const pollTask = async () => {
      try {
        const data = await getTask(taskId);
        if (!active) return;
        setTask(data);
        if (loading) setLoading(false);
        if (data.status !== "completed" && data.status !== "failed") {
          timer = window.setTimeout(pollTask, 800);
        }
      } catch {
        if (active) {
          setError("无法读取编辑器任务");
          setLoading(false);
        }
      }
    };

    pollTask();

    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [taskId]);

  if (loading) {
    return (
      <div className="editor-loading-state">
        正在加载编辑器...
      </div>
    );
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
    return (
      <div className="editor-loading-state" role="status" aria-live="polite">
        任务正在生成（{task.progress ?? 0}%）· {task.stageLabel ?? "请稍候"}
      </div>
    );
  }

  if (!definition) {
    return (
      <div className="editor-error-state">
        <p>无法加载编辑器定义</p>
        <Link to="/">返回首页</Link>
      </div>
    );
  }

  return (
    <AgentEditorPage
      definition={definition}
      draft={{} as EditorDraft}
      modelUrl={task.modelUrl ?? ""}
      thumbnailUrl={task.thumbnailUrl}
    />
  );
}
