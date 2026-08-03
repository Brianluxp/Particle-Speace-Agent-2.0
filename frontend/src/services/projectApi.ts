import type {
  CreateProjectInput,
  GenerationTask,
  Project,
} from "../types/task";
import {
  DEFAULT_MODEL_URL,
  initialTasks,
  recentProjects,
} from "../mocks/projects";

const tasks = new Map(
  initialTasks.map((task) => [task.id, structuredClone(task)]),
);
const projects = structuredClone(recentProjects);

let nextTaskId = 1;

const demoModelUrl = import.meta.env.VITE_DEMO_GLB_URL ?? DEFAULT_MODEL_URL;

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
  projects.unshift({
    id: task.projectId,
    name: input.name,
    inputType: input.inputType,
    taskId: task.id,
    status: task.status,
    createdAt: task.createdAt,
  });
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

  syncProjectStatus(task);
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

  syncProjectStatus(task);
  return cloneTask(task);
}

export async function getRecentProjects(): Promise<Project[]> {
  return structuredClone(projects).sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

function syncProjectStatus(task: GenerationTask): void {
  const project = projects.find((item) => item.taskId === task.id);

  if (project) {
    project.status = task.status;
  }
}

function requireTask(taskId: string): GenerationTask {
  const task = tasks.get(taskId);

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  return task;
}
