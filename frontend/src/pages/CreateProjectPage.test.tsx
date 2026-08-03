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
import { createProject } from "../services/projectApi";

vi.mock("../services/projectApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../services/projectApi")>();

  return {
    ...actual,
    createProject: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function LocationDisplay() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderCreatePage(path = "/projects/new") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

describe("CreateProjectPage", () => {
  test("preselects the input type from the URL and shows its formats", () => {
    renderCreatePage("/projects/new?type=image");

    expect(screen.getByLabelText("输入类型")).toHaveValue("image");
    expect(screen.getByText("支持 PNG、JPG、JPEG、WEBP")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回工作台" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  test("blocks submission until a file is selected", () => {
    renderCreatePage();

    expect(screen.getByText("请选择要上传的文件")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(screen.getByRole("button", { name: "创建并开始生成" })).toBeDisabled();
  });

  test("provides stable form names and autocomplete behavior", () => {
    renderCreatePage();

    expect(screen.getByLabelText("项目名称")).toHaveAttribute(
      "name",
      "projectName",
    );
    expect(screen.getByLabelText("项目名称")).toHaveAttribute(
      "autocomplete",
      "off",
    );
    expect(screen.getByLabelText("输入类型")).toHaveAttribute(
      "name",
      "inputType",
    );
    expect(screen.getByLabelText("选择文件")).toHaveAttribute(
      "name",
      "projectFile",
    );
  });

  test("creates a project and opens its task", async () => {
    vi.mocked(createProject).mockResolvedValue({
      id: "task-created",
      projectId: "project-created",
      inputType: "cad",
      status: "queued",
      progress: 0,
      stageLabel: "排队中",
      createdAt: "2026-07-28T12:00:00.000Z",
      errorMessage: null,
      modelUrl: null,
      thumbnailUrl: null,
    });
    renderCreatePage("/projects/new?type=cad");

    fireEvent.change(screen.getByLabelText("项目名称"), {
      target: { value: "阀门执行器" },
    });
    fireEvent.change(screen.getByLabelText("选择文件"), {
      target: {
        files: [
          new File(["drawing"], "valve.dxf", {
            type: "application/dxf",
          }),
        ],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "创建并开始生成" }));

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith({
        name: "阀门执行器",
        inputType: "cad",
        file: expect.objectContaining({ name: "valve.dxf" }),
      });
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/tasks/task-created",
      );
    });
  });
});
