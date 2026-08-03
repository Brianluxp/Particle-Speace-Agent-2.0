import { describe, expect, test } from "vitest";
import { DEFAULT_MODEL_TASK_ID } from "../mocks/projects";
import type { Project, TaskStatus } from "../types/task";
import { resolveNavigationTargets } from "./navigationTargets";

function makeProject(
  taskId: string,
  status: TaskStatus,
  createdAt: string,
): Project {
  return {
    id: `project-${taskId}`,
    name: taskId,
    inputType: "model",
    taskId,
    status,
    createdAt,
  };
}

const projects = [
  makeProject("task-completed-older", "completed", "2026-08-01T10:00:00.000Z"),
  makeProject("task-newest", "generating", "2026-08-03T10:00:00.000Z"),
  makeProject("task-completed-newest", "completed", "2026-08-02T10:00:00.000Z"),
];

describe("resolveNavigationTargets", () => {
  test("selects the newest task and newest completed model", () => {
    expect(resolveNavigationTargets(projects, "/")).toEqual({
      taskId: "task-newest",
      modelTaskId: "task-completed-newest",
    });
  });

  test("keeps the current task while using the newest completed model", () => {
    expect(resolveNavigationTargets(projects, "/tasks/task-current")).toEqual({
      taskId: "task-current",
      modelTaskId: "task-completed-newest",
    });
  });

  test("keeps the current model as both navigation targets", () => {
    expect(resolveNavigationTargets(projects, "/models/task-current-model")).toEqual({
      taskId: "task-current-model",
      modelTaskId: "task-current-model",
    });
  });

  test("uses the default model task when there are no recent projects", () => {
    expect(resolveNavigationTargets([], "/")).toEqual({
      taskId: DEFAULT_MODEL_TASK_ID,
      modelTaskId: DEFAULT_MODEL_TASK_ID,
    });
  });
});
