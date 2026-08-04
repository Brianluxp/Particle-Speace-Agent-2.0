import { useState } from "react";
import type { EditorDefinition, EditorDraft, RotationAxis } from "../../types/editor";

interface AgentGuidePanelProps {
  definition: EditorDefinition;
  draft: EditorDraft;
  onAxisChange: (axis: RotationAxis) => void;
  onContinue: () => void;
  onMessage: (message: string) => void;
  onUnavailableAction: (label: string) => void;
}

export function AgentGuidePanel({
  definition,
  draft,
  onAxisChange,
  onContinue,
  onMessage,
  onUnavailableAction,
}: AgentGuidePanelProps) {
  const [inputMessage, setInputMessage] = useState("");

  const activeIndex = definition.steps.findIndex(
    (step) => step.id === draft.activeStepId,
  );
  const effectiveIndex = activeIndex >= 0 ? activeIndex : 2;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    onMessage(inputMessage.trim());
    setInputMessage("");
  };

  return (
    <aside className="editor-guide">
      <div className="guide-header">
        <h2>Agent 引导</h2>
        <span className="guide-subtitle">三维机械运动生成辅助</span>
      </div>

      <div className="guide-steps">
        {definition.steps.map((step, idx) => {
          let state = step.state;
          if (idx < effectiveIndex) {
            state = "completed";
          } else if (idx === effectiveIndex) {
            state = "active";
          } else {
            state = "waiting";
          }

          return (
            <div
              className={`guide-step-card step-${state}`}
              key={step.id}
              data-state={state}
            >
              <div className="step-badge">{idx + 1}</div>
              <div className="step-content">
                <div className="step-title" data-state={state}>
                  {step.title}
                </div>
                <div className="step-desc">{step.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="guide-controls">
        <h3>旋转与运动参数设置</h3>
        <p>选择主运动关节点运动方向：</p>
        <div className="axis-options">
          <label className="axis-label">
            <input
              type="radio"
              name="rotationAxis"
              value="axis-a"
              checked={draft.rotationAxis === "axis-a"}
              onChange={() => onAxisChange("axis-a")}
            />
            方向 A
          </label>
          <label className="axis-label">
            <input
              type="radio"
              name="rotationAxis"
              value="axis-b"
              checked={draft.rotationAxis === "axis-b"}
              onChange={() => onAxisChange("axis-b")}
            />
            方向 B
          </label>
        </div>

        <button
          className="editor-btn primary-btn continue-btn"
          type="button"
          onClick={onContinue}
        >
          继续生成动态效果
        </button>
      </div>

      <form className="agent-chat-form" onSubmit={handleSendMessage}>
        <label htmlFor="agent-input-field">告诉 Agent 你的想法或需求</label>
        <div className="chat-input-wrapper">
          <textarea
            id="agent-input-field"
            value={inputMessage}
            placeholder="如：让阀杆旋转速度减慢，在 5 秒时停止…"
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button
            className="editor-btn send-btn"
            type="submit"
            disabled={!inputMessage.trim()}
          >
            发送需求
          </button>
        </div>
        <div className="chat-quick-actions">
          <button
            type="button"
            className="quick-btn"
            onClick={() => onUnavailableAction("1.0 暂未接入")}
          >
            图片
          </button>
          <button
            type="button"
            className="quick-btn"
            onClick={() => onUnavailableAction("1.0 暂未接入")}
          >
            文件
          </button>
          <button
            type="button"
            className="quick-btn"
            onClick={() => onUnavailableAction("1.0 暂未接入")}
          >
            指令库
          </button>
        </div>
      </form>
    </aside>
  );
}
