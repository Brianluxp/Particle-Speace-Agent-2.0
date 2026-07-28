import type {
  CreateProjectInput,
  GenerationTask,
  Project,
} from "../types/task";
import { initialTasks, recentProjects } from "../mocks/projects";

const tasks = new Map(
  initialTasks.map((task) => [task.id, structuredClone(task)]),
);

let nextTaskId = 1;

const demoModelUrl = import.meta.env.VITE_DEMO_GLB_URL ?? null;

function cloneTask(task: GenerationTask): GenerationTask {
  return structuredClone(task);
}

export async function createProject(
  input: CreateProjectInput,
): Promise<GenerationTask> {
  const sequence = nextTaskId++;
  const task: GenerationTask = {
    id: `task-${sequence}`,
    projectId: `project-${sequence}`,
    inputType: input.inputType,
    status: "queued",
    progress: 0,
    stageLabel: "\u6392\u961F\u4E2D",
    createdAt: new Date().toISOString(),
    errorMessage: null,
    modelUrl: null,
    thumbnailUrl: null,
  };

  tasks.set(task.id, task);
  return cloneTask(task);
}

export async function getTask(taskId: string): Promise<GenerationTask> {
  const task = requireTask(taskId);

  if (task.status === "queued") {
    Object.assign(task, {
      status: "parsing",
      progress: 25,
      stageLabel: "\u7ED3\u6784\u89E3\u6790\u4E2D",
    });
  } else if (task.status === "parsing") {
    Object.assign(task, {
      status: "generating",
      progress: 65,
      stageLabel: "3D \u751F\u6210\u4E2D",
    });
  } else if (task.status === "generating") {
    Object.assign(task, {
      status: "completed",
      progress: 100,
      stageLabel: "\u751F\u6210\u5B8C\u6210",
      modelUrl: demoModelUrl,
    });
  }

  return cloneTask(task);
}

export async function retryTask(taskId: string): Promise<GenerationTask> {
  const task = requireTask(taskId);

  Object.assign(task, {
    status: "queued",
    progress: 0,
    stageLabel: "\u6392\u961F\u4E2D",
    errorMessage: null,
    modelUrl: null,
    thumbnailUrl: null,
  });

  return cloneTask(task);
}

export async function getRecentProjects(): Promise<Project[]> {
  return structuredClone(recentProjects);
}

function requireTask(taskId: string): GenerationTask {
  const task = tasks.get(taskId);

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  return task;
}
