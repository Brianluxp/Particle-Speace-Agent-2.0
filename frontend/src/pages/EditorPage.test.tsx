import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import { App } from "../App";
import type { GenerationTask, TaskStatus } from "../types/task";
import { getTask } from "../services/projectApi";

vi.mock("../services/projectApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/projectApi")>();
  return {
    ...actual,
    getTask: vi.fn(),
    getRecentProjects: vi.fn().mockResolvedValue([]),
  };
});

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

export function makeTask(
  id: string,
  status: TaskStatus,
  modelUrl: string | null,
): GenerationTask {
  return {
    id,
    projectId: `project-${id}`,
    inputType: "model",
    status,
    progress: status === "completed" ? 100 : 65,
    stageLabel: status === "completed" ? "生成完成" : "任务处理中",
    createdAt: "2026-08-04T09:00:00.000Z",
    errorMessage: status === "failed" ? "生成失败" : null,
    modelUrl,
    thumbnailUrl: null,
  };
}

export function renderEditor(path = "/editor/task-editor") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

export function renderCompletedValveEditor() {
  vi.mocked(getTask).mockResolvedValue(
    makeTask("task-valve", "completed", "/models/valve.glb"),
  );
  return renderEditor("/editor/task-valve");
}

export function renderCompletedGenericEditor() {
  vi.mocked(getTask).mockResolvedValue(
    makeTask("task-engine", "completed", "/models/default.glb"),
  );
  return renderEditor("/editor/task-engine");
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

describe("EditorPage Gate", () => {
  test("renders a completed task with its real model URL", async () => {
    const { container } = renderCompletedValveEditor();

    expect(await screen.findByText("阀门执行器")).toBeInTheDocument();
    expect(container.querySelector("model-viewer")).toHaveAttribute(
      "src",
      "/models/valve.glb",
    );
  });

  test.each(["queued", "parsing", "generating", "failed"] as TaskStatus[])(
    "redirects %s tasks to task details",
    async (status) => {
      vi.mocked(getTask).mockResolvedValue(makeTask("task-editor", status, null));
      renderEditor();

      await waitFor(() => {
        expect(screen.getByTestId("location")).toHaveTextContent(
          "/tasks/task-editor",
        );
      });
    },
  );

  test("shows an empty state when a completed task has no model URL", async () => {
    vi.mocked(getTask).mockResolvedValue(makeTask("task-editor", "completed", null));
    renderEditor();

    expect(await screen.findByText("模型文件暂不可用")).toBeInTheDocument();
  });

  test("shows a Chinese error when the task cannot be loaded", async () => {
    vi.mocked(getTask).mockRejectedValue(new Error("missing"));
    renderEditor();

    expect(await screen.findByText("无法读取编辑器任务")).toBeInTheDocument();
  });
});
