import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test } from "vitest";
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
});

test.each([
  ["/", "工作台"],
  ["/projects/new", "导入"],
  ["/tasks/task-failed", "任务"],
  ["/models/task-engine", "模型"],
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
