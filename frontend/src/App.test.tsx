import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import { App } from "./App";

afterEach(cleanup);

test("显示粒子空间应用框架", () => {
  render(
    <MemoryRouter initialEntries={["/projects/new"]}>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "粒子空间" })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "主导航" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "导入" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.queryByText("已保存")).not.toBeInTheDocument();
});

test.each([
  ["/", "工作台"],
  ["/projects/new", "导入"],
])("在 %s 路由标记 %s 导航", (route, label) => {
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: label })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("没有任务上下文时禁用任务和模型入口", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("button", { name: "任务：请先选择项目" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "模型：请先选择项目" }),
  ).toBeDisabled();
});

test("任务路由使用当前任务生成上下文导航", () => {
  render(
    <MemoryRouter initialEntries={["/tasks/task-failed"]}>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "任务" })).toHaveAttribute(
    "href",
    "/tasks/task-failed",
  );
  expect(screen.getByRole("link", { name: "模型" })).toHaveAttribute(
    "href",
    "/models/task-failed",
  );
});

test("模型路由使用当前任务并标记模型入口", () => {
  render(
    <MemoryRouter initialEntries={["/models/task-engine"]}>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "任务" })).toHaveAttribute(
    "href",
    "/tasks/task-engine",
  );
  expect(screen.getByRole("link", { name: "模型" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("项目入口定位到最近项目", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "项目" })).toHaveAttribute(
    "href",
    "/#recent-projects",
  );
  expect(screen.getByRole("region", { name: "最近项目" })).toHaveAttribute(
    "id",
    "recent-projects",
  );
});

test("通过项目锚点进入工作台时滚动到最近项目", () => {
  const scrollIntoView = vi.fn();
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });

  render(
    <MemoryRouter initialEntries={["/#recent-projects"]}>
      <App />
    </MemoryRouter>,
  );

  expect(scrollIntoView).toHaveBeenCalledWith({
    behavior: "smooth",
    block: "start",
  });

  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: originalScrollIntoView,
  });
});

test("通知按钮显示明确的空状态", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("button", { name: "通知" }));

  expect(
    screen.getByRole("dialog", { name: "通知" }),
  ).toHaveTextContent("暂无通知");
});

test("帮助按钮显示当前版本使用说明", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("button", { name: "帮助" }));

  expect(
    screen.getByRole("dialog", { name: "使用帮助" }),
  ).toHaveTextContent("创建项目");
  expect(screen.getByRole("dialog", { name: "使用帮助" })).toHaveTextContent(
    "模型预览",
  );
});

test("未开放的历史版本和账号入口不可操作", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole("button", { name: "历史版本暂未开放" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "账号功能暂未开放" })).toBeDisabled();
});
