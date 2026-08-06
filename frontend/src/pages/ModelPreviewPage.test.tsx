import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import { App } from "../App";
import { getTask } from "../services/projectApi";
import type { GenerationTask, TaskStatus } from "../types/task";

vi.mock("../services/projectApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../services/projectApi")>();

  return {
    ...actual,
    getTask: vi.fn(),
  };
});

function makeTask(
  status: TaskStatus,
  modelUrl: string | null,
): GenerationTask {
  return {
    id: "task-preview",
    projectId: "project-preview",
    inputType: "model",
    status,
    progress: status === "completed" ? 100 : 65,
    stageLabel: status === "completed" ? "生成完成" : "3D 生成中",
    createdAt: "2026-07-29T09:00:00.000Z",
    errorMessage: null,
    modelUrl,
    thumbnailUrl: null,
  };
}

function LocationDisplay() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderPreview() {
  return render(
    <MemoryRouter initialEntries={["/models/task-preview"]}>
      <App />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ModelPreviewPage", () => {
  test("renders model-viewer with the completed task model URL", async () => {
    vi.mocked(getTask).mockResolvedValue(
      makeTask("completed", "https://example.com/valve.glb"),
    );
    const { container } = renderPreview();

    await screen.findByRole("heading", { name: "3D 模型预览" });
    const viewer = container.querySelector("model-viewer");

    expect(viewer).toHaveAttribute(
      "src",
      "https://example.com/valve.glb",
    );
    expect(viewer).toHaveAttribute("camera-controls");
    expect(viewer).toHaveAttribute("auto-rotate");
    expect(viewer).toHaveAttribute("shadow-intensity", "1");
    expect(viewer).toHaveAttribute("alt", "粒子空间代理生成的 3D 模型");
    expect(screen.getByRole("link", { name: "下载模型" })).toHaveAttribute(
      "download",
      "particle-model.glb",
    );
    expect(screen.getByRole("link", { name: "下载模型" })).toHaveAttribute(
      "href",
      "https://example.com/valve.glb",
    );
  });

  test("opens the model stage in fullscreen", async () => {
    vi.mocked(getTask).mockResolvedValue(
      makeTask("completed", "https://example.com/valve.glb"),
    );
    const { container } = renderPreview();

    await screen.findByRole("heading", { name: "3D 模型预览" });
    const stage = container.querySelector(".model-stage") as HTMLDivElement;
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(stage, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });

    fireEvent.click(screen.getByRole("button", { name: "全屏预览" }));

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  test("shows an explicit empty state when the completed task has no model URL", async () => {
    vi.mocked(getTask).mockResolvedValue(makeTask("completed", null));
    renderPreview();

    expect(
      await screen.findByText("模型文件暂不可用"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回任务详情" })).toHaveAttribute(
      "href",
      "/tasks/task-preview",
    );
  });

  test("returns an unfinished task to its task detail route", async () => {
    vi.mocked(getTask).mockResolvedValue(makeTask("generating", null));
    renderPreview();

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/tasks/task-preview",
      );
    });
    expect(document.querySelector("model-viewer")).not.toBeInTheDocument();
  });

  test("falls back to the SVG placeholder when the poster image fails", async () => {
    vi.mocked(getTask).mockResolvedValue(
      makeTask("completed", "https://example.com/valve.glb"),
    );
    const { container } = renderPreview();

    await screen.findByRole("heading", { name: "3D 模型预览" });
    const poster = container.querySelector('img[slot="poster"]') as HTMLImageElement;
    expect(poster).not.toBeNull();
    fireEvent.error(poster);

    await waitFor(() => {
      expect(poster.getAttribute("src")).toBe("/valve-actuator-viewport.svg");
    });
  });

  test("shows a Chinese error state when the model fails to load", async () => {
    vi.mocked(getTask).mockResolvedValue(
      makeTask("completed", "https://example.com/broken.glb"),
    );
    const { container } = renderPreview();

    await screen.findByRole("heading", { name: "3D 模型预览" });
    fireEvent.error(container.querySelector("model-viewer")!);

    expect(screen.getByText("模型加载失败")).toBeInTheDocument();
    expect(
      screen.getByText("无法显示当前模型，请返回任务详情后重试。"),
    ).toBeInTheDocument();
  });
});
