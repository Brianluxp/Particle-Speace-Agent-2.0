import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import { App } from "../App";
import type { ModelViewerElement } from "../model-viewer";
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
  vi.useRealTimers();
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

describe("EditorPage Interactions", () => {
  test("selects a valve node and shows its properties", async () => {
    renderCompletedValveEditor();

    fireEvent.click(await screen.findByRole("button", { name: "选择阀杆" }));

    expect(screen.getByRole("heading", { name: "阀杆" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("115.20")).toHaveAttribute("readonly");
  });

  test("stores the selected rotation axis and advances the demo step", async () => {
    renderCompletedValveEditor();

    fireEvent.click(await screen.findByLabelText("方向 B"));
    fireEvent.click(screen.getByRole("button", { name: "继续生成动态效果" }));

    expect(screen.getByText("检查与优化")).toHaveAttribute("data-state", "active");
    expect(screen.getByText("演示草稿已保存")).toBeInTheDocument();
    expect(screen.getByText("仅保存在当前浏览器，未写入模型文件")).toBeInTheDocument();
  });

  test("does not show valve parts for a generic task", async () => {
    renderCompletedGenericEditor();

    expect(await screen.findByText("当前模型暂无部件级结构数据")).toBeInTheDocument();
    expect(screen.queryByText("阀杆")).not.toBeInTheDocument();
  });

  test("records an agent demo message without claiming model changes", async () => {
    renderCompletedValveEditor();

    fireEvent.change(await screen.findByLabelText("告诉 Agent 你的想法或需求"), {
      target: { value: "让阀杆旋转更慢" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送需求" }));

    expect(screen.getByText("需求已记录，真实 Agent 服务尚未接入")).toBeInTheDocument();
  });
});

describe("EditorViewport Controls", () => {
  test("uses the task model URL and exposes real viewport controls", async () => {
    const { container } = renderCompletedValveEditor();
    const viewer = await waitFor(() => {
      const el = container.querySelector("model-viewer");
      expect(el).not.toBeNull();
      return el!;
    });

    expect(viewer).toHaveAttribute("src", "/models/valve.glb");
    expect(viewer).toHaveAttribute("camera-controls");
    expect(screen.getByRole("button", { name: "重置视角" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "全屏视口" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "导出视口截图" })).toBeEnabled();
  });

  test("keeps the editor shell visible when the model fails", async () => {
    const { container } = renderCompletedValveEditor();
    const viewer = await waitFor(() => {
      const el = container.querySelector("model-viewer");
      expect(el).not.toBeNull();
      return el!;
    });
    fireEvent.error(viewer);

    expect(screen.getByText("模型加载失败")).toBeInTheDocument();
    expect(screen.getByText("Agent 引导")).toBeInTheDocument();
  });

  test("reports screenshot errors in Chinese", async () => {
    const { container } = renderCompletedValveEditor();
    const viewer = await waitFor(() => {
      const el = container.querySelector("model-viewer") as ModelViewerElement;
      expect(el).not.toBeNull();
      return el;
    });
    viewer.toBlob = vi.fn().mockRejectedValue(new Error("capture failed"));

    fireEvent.click(screen.getByRole("button", { name: "导出视口截图" }));

    expect(await screen.findByText("当前浏览器无法导出视口截图")).toBeInTheDocument();
  });
});

describe("AnimationTimeline", () => {
  test("plays, pauses, and stops the demo timeline at ten seconds", async () => {
    renderCompletedValveEditor();
    await screen.findByText("动画轨道演示，不会修改模型文件");

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "播放时间轴" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(screen.getByTestId("timeline-time")).toHaveTextContent("00:02");

    fireEvent.click(screen.getByRole("button", { name: "暂停时间轴" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(screen.getByTestId("timeline-time")).toHaveTextContent("00:02");

    fireEvent.click(screen.getByRole("button", { name: "播放时间轴" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(screen.getByTestId("timeline-time")).toHaveTextContent("00:10");
    expect(screen.getByRole("button", { name: "播放时间轴" })).toBeEnabled();
    vi.useRealTimers();
  });

  test("scrubs and resets the timeline", async () => {
    renderCompletedValveEditor();
    const range = await screen.findByLabelText("时间轴位置");

    fireEvent.change(range, { target: { value: "6" } });
    expect(screen.getByTestId("timeline-time")).toHaveTextContent("00:06");
    fireEvent.click(screen.getByRole("button", { name: "复位时间轴" }));
    expect(screen.getByTestId("timeline-time")).toHaveTextContent("00:00");
  });
});

describe("Editor Shell Controls", () => {
  test("links preview and task navigation to the current task", async () => {
    renderCompletedValveEditor();

    expect(await screen.findByRole("link", { name: "预览" })).toHaveAttribute(
      "href",
      "/models/task-valve",
    );
    expect(screen.getByRole("link", { name: "返回任务" })).toHaveAttribute(
      "href",
      "/tasks/task-valve",
    );
  });

  test("does not fake publishing or unavailable tools", async () => {
    renderCompletedValveEditor();

    fireEvent.click(await screen.findByRole("button", { name: "发布" }));
    expect(screen.getByText("真实发布服务尚未接入")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "图片" }));
    expect(screen.getByText("1.0 暂未接入")).toBeInTheDocument();
  });

  test("renders the five-region desktop editor layout", async () => {
    const { container } = renderCompletedValveEditor();
    await screen.findByText("Agent 引导");

    expect(container.querySelector(".editor-topbar")).toBeInTheDocument();
    expect(container.querySelector(".editor-rail")).toBeInTheDocument();
    expect(container.querySelector(".editor-guide")).toBeInTheDocument();
    expect(container.querySelector(".editor-main")).toBeInTheDocument();
    expect(container.querySelector(".editor-inspector")).toBeInTheDocument();
  });
});
