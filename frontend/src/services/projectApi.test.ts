import { describe, expect, test } from "vitest";
import { DEFAULT_MODEL_URL, FAILED_TASK_ID } from "../mocks/projects";
import type { InputType } from "../types/task";
import {
  createProject,
  getRecentProjects,
  getTask,
  retryTask,
} from "./projectApi";

describe("projectApi", () => {
  test.each(
    [
      ["cad", "valve.dxf"],
      ["image", "valve.png"],
      ["model", "valve.glb"],
    ] satisfies Array<[InputType, string]>,
  )("creates a queued %s generation task", async (inputType, fileName) => {
    const file = new File(["input"], fileName);

    const task = await createProject({
      name: "阀门执行器",
      inputType,
      file,
    });

    expect(task).toMatchObject({
      projectId: expect.any(String),
      inputType,
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
    expect(completed.modelUrl).toBe(
      import.meta.env.VITE_DEMO_GLB_URL ?? DEFAULT_MODEL_URL,
    );
  });

  test("adds a newly created project to recent projects", async () => {
    const task = await createProject({
      name: "新建项目",
      inputType: "cad",
      file: new File(["cad"], "part.dxf"),
    });

    expect((await getRecentProjects())[0]).toMatchObject({
      name: "新建项目",
      taskId: task.id,
      status: "queued",
    });
  });

  test("synchronizes a recent project while its task advances", async () => {
    const task = await createProject({
      name: "状态同步项目",
      inputType: "model",
      file: new File(["model"], "part.glb"),
    });

    await getTask(task.id);

    expect((await getRecentProjects())[0]).toMatchObject({
      taskId: task.id,
      status: "parsing",
    });
  });

  test("synchronizes a recent project when its task is retried", async () => {
    const task = await createProject({
      name: "重试状态项目",
      inputType: "image",
      file: new File(["image"], "part.png"),
    });
    await getTask(task.id);

    await retryTask(task.id);

    expect((await getRecentProjects())[0]).toMatchObject({
      taskId: task.id,
      status: "queued",
    });
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

    expect(projects.map((project) => project.name)).toEqual(
      expect.arrayContaining(["阀门执行器", "四冲程发动机", "BMX车架"]),
    );
  });
});
