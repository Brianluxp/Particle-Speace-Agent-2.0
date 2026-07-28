import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { App } from "../App";
import { getTask, retryTask } from "../services/projectApi";
import type { GenerationTask, TaskStatus } from "../types/task";

vi.mock("../services/projectApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../services/projectApi")>();

  return {
    ...actual,
    getTask: vi.fn(),
    retryTask: vi.fn(),
  };
});

const POLL_INTERVAL = 1_000;

function makeTask(
  status: TaskStatus,
  progress: number,
  overrides: Partial<GenerationTask> = {},
): GenerationTask {
  return {
    id: "task-monitor",
    projectId: "project-monitor",
    inputType: "cad",
    status,
    progress,
    stageLabel: "排队中",
    createdAt: "2026-07-28T12:00:00.000Z",
    errorMessage: null,
    modelUrl: null,
    thumbnailUrl: null,
    ...overrides,
  };
}

function LocationDisplay() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderTaskPage() {
  return render(
    <MemoryRouter initialEntries={["/tasks/task-monitor"]}>
      <App />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

async function flushRequest() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(getTask).mockReset();
  vi.mocked(retryTask).mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("TaskPage", () => {
  test("advances queued, parsing and generating stages on the polling timer", async () => {
    vi.mocked(getTask)
      .mockResolvedValueOnce(makeTask("queued", 0))
      .mockResolvedValueOnce(
        makeTask("parsing", 25, { stageLabel: "结构解析中" }),
      )
      .mockResolvedValueOnce(
        makeTask("generating", 65, { stageLabel: "3D 生成中" }),
      );
    renderTaskPage();

    await flushRequest();
    expect(screen.getByText("任务已进入处理队列")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL);
    });
    expect(screen.getByText("正在解析输入文件")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL);
    });
    expect(screen.getByText("正在生成三维结构")).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(
      screen.getByText("正在生成预览，非最终模型"),
    ).toBeInTheDocument();
  });

  test("shows the completed action and navigates to the model route", async () => {
    vi.mocked(getTask)
      .mockResolvedValueOnce(
        makeTask("generating", 65, { stageLabel: "3D 生成中" }),
      )
      .mockResolvedValueOnce(
        makeTask("completed", 100, { stageLabel: "生成完成" }),
      );
    renderTaskPage();

    await flushRequest();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL);
    });
    fireEvent.click(screen.getByRole("link", { name: "查看 3D 模型" }));

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/models/task-monitor",
    );
    expect(getTask).toHaveBeenCalledTimes(2);
  });

  test("retries a failed task and returns it to queued", async () => {
    vi.mocked(getTask)
      .mockResolvedValueOnce(
        makeTask("failed", 42, {
          stageLabel: "生成失败",
          errorMessage: "模型生成服务暂时不可用",
        }),
      )
      .mockResolvedValueOnce(
        makeTask("parsing", 25, { stageLabel: "结构解析中" }),
      );
    vi.mocked(retryTask).mockResolvedValue(makeTask("queued", 0));
    renderTaskPage();

    await flushRequest();
    expect(screen.getByText("模型生成服务暂时不可用")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重新尝试" }));
    await flushRequest();

    expect(retryTask).toHaveBeenCalledWith("task-monitor");
    expect(screen.getByText("任务已进入处理队列")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL);
    });
    expect(screen.getByText("正在解析输入文件")).toBeInTheDocument();
  });

  test("clears the polling timer when unmounted", async () => {
    vi.mocked(getTask).mockResolvedValue(makeTask("queued", 0));
    const view = renderTaskPage();

    await flushRequest();
    view.unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL * 3);
    });

    expect(getTask).toHaveBeenCalledTimes(1);
  });
});
