import { describe, expect, test } from "vitest";
import { FAILED_TASK_ID } from "../mocks/projects";
import {
  createProject,
  getRecentProjects,
  getTask,
  retryTask,
} from "./projectApi";

describe("projectApi", () => {
  test("creates a queued generation task", async () => {
    const file = new File(["drawing"], "valve.dxf", {
      type: "application/dxf",
    });

    const task = await createProject({
      name: "阀门执行器",
      inputType: "cad",
      file,
    });

    expect(task).toMatchObject({
      projectId: expect.any(String),
      inputType: "cad",
      status: "queued",
      progress: 0,
      stageLabel: "排队中",
      errorMessage: null,
      modelUrl: null,
      thumbnailUrl: null,
    });
  });

  test("advances task status in order with monotonic progress", async () => {
    const task = await createProject({
      name: "四冲程发动机",
      inputType: "image",
      file: new File(["image"], "engine.png", { type: "image/png" }),
    });

    const parsing = await getTask(task.id);
    const generating = await getTask(task.id);
    const completed = await getTask(task.id);

    expect([parsing.status, generating.status, completed.status]).toEqual([
      "parsing",
      "generating",
      "completed",
    ]);
    expect([parsing.progress, generating.progress, completed.progress]).toEqual([
      25, 65, 100,
    ]);
    expect(completed.modelUrl).toBe(import.meta.env.VITE_DEMO_GLB_URL ?? null);
  });

  test("retries the seeded failed task from the queued state", async () => {
    const failedTask = await getTask(FAILED_TASK_ID);
    expect(failedTask.status).toBe("failed");

    const retriedTask = await retryTask(FAILED_TASK_ID);

    expect(retriedTask).toMatchObject({
      status: "queued",
      progress: 0,
      stageLabel: "排队中",
      errorMessage: null,
      modelUrl: null,
    });
  });

  test("returns the seeded recent projects", async () => {
    const projects = await getRecentProjects();

    expect(projects.map((project) => project.name)).toEqual([
      "阀门执行器",
      "四冲程发动机",
      "BMX 车架",
    ]);
  });
});
