import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, test } from "vitest";
import { App } from "../App";

afterEach(cleanup);

function LocationDisplay() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderWorkspace() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

describe("WorkspacePage", () => {
  test("shows the workbench hero and primary create action", () => {
    renderWorkspace();

    expect(
      screen.getByText(/Agent 3D 制作工作台/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "把图纸和图片，变成可运行的3D" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "创建新项目" })).toHaveAttribute("href", "/projects/new");
  });

  test("shows the prototype valve visual as an image", () => {
    renderWorkspace();

    expect(screen.getByAltText("阀门执行器三维模型")).toHaveAttribute(
      "src",
      "/valve-actuator-viewport.png",
    );
    expect(screen.getByText("AI结构识别")).toBeInTheDocument();
    expect(screen.getByText("运动关系")).toBeInTheDocument();
  });

  test("shows the three supported 3D input cards", () => {
    renderWorkspace();

    expect(
      screen.getByRole("link", { name: /CAD 图纸生成 3D/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /产品图片生成3D/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /导入现有3D模型/ }),
    ).toBeInTheDocument();
  });

  test.each([
    ["CAD 图纸生成 3D", "/projects/new?type=cad"],
    ["产品图片生成3D", "/projects/new?type=image"],
    ["导入现有3D模型", "/projects/new?type=model"],
  ])("opens the matching create flow from %s", (cardName, destination) => {
    renderWorkspace();

    fireEvent.click(screen.getByRole("link", { name: new RegExp(cardName) }));

    expect(screen.getByTestId("location")).toHaveTextContent(destination);
  });

  test("shows the seeded recent projects with metadata", async () => {
    const { container } = renderWorkspace();

    expect(await screen.findByText("阀门执行器")).toBeInTheDocument();
    expect(screen.getByText("四冲程发动机")).toBeInTheDocument();
    expect(screen.getByText("BMX车架")).toBeInTheDocument();
    expect(screen.getByText("动态效果生成中")).toBeInTheDocument();
    expect(screen.getByText("3D模型已生成")).toBeInTheDocument();
    expect(screen.getByText("等待参数确认")).toBeInTheDocument();
    expect(container.querySelectorAll("time")).toHaveLength(3);
  });
});
