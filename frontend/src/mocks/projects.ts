import type { GenerationTask, Project } from "../types/task";

export const FAILED_TASK_ID = "task-failed";

export const recentProjects: Project[] = [
  {
    id: "project-valve",
    name: "\u9600\u95E8\u6267\u884C\u5668",
    inputType: "image",
    taskId: FAILED_TASK_ID,
    status: "failed",
    createdAt: "2026-07-28T12:48:00.000Z",
  },
  {
    id: "project-engine",
    name: "\u56DB\u51B2\u7A0B\u53D1\u52A8\u673A",
    inputType: "cad",
    taskId: "task-engine",
    status: "completed",
    createdAt: "2026-07-27T18:20:00.000Z",
  },
  {
    id: "project-bmx",
    name: "BMX \u8F66\u67B6",
    inputType: "image",
    taskId: "task-bmx",
    status: "queued",
    createdAt: "2026-07-26T09:30:00.000Z",
  },
];

export const initialTasks: GenerationTask[] = [
  {
    id: FAILED_TASK_ID,
    projectId: "project-valve",
    inputType: "image",
    status: "failed",
    progress: 42,
    stageLabel: "\u751F\u6210\u5931\u8D25",
    createdAt: "2026-07-28T12:48:00.000Z",
    errorMessage: "\u6A21\u578B\u751F\u6210\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528",
    modelUrl: null,
    thumbnailUrl: null,
  },
];
