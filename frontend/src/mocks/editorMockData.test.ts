import { describe, expect, test } from "vitest";
import { getEditorDefinition } from "./editorMockData";

describe("getEditorDefinition", () => {
  test("returns valve-specific parts for the valve demo task", () => {
    const definition = getEditorDefinition("task-valve");

    expect(definition.projectName).toBe("阀门执行器");
    expect(definition.nodes.map((node) => node.name)).toContain("阀杆");
    expect(definition.tracks).toHaveLength(2);
  });

  test("returns generic metadata for unrelated tasks", () => {
    const definition = getEditorDefinition("task-engine");

    expect(definition.nodes.map((node) => node.name)).toEqual([
      "模型根节点",
      "模型主体",
      "材质",
    ]);
    expect(definition.nodes.map((node) => node.name)).not.toContain("阀杆");
    expect(definition.structureNotice).toBe("当前模型暂无部件级结构数据");
  });
});
