import type { GenerationTask, Project } from "../types/task";

export const FAILED_TASK_ID = "task-failed";

export const recentProjects: Project[] = [
  {
    id: "project-valve",
    name: "\u9600\u95E8\u6267\u884C\u5668",
    inputType: "image",
    taskId: "task-valve",
    status: "generating",
    createdAt: "2026-07-29T04:48:00.000Z",
  },
  {
    id: "project-engine",
    name: "\u56DB\u51B2\u7A0B\u53D1\u52A8\u673A",
    inputType: "cad",
    taskId: "task-engine",
    status: "completed",
    createdAt: "2026-07-28T10:20:00.000Z",
  },
  {
    id: "project-bmx",
    name: "BMX\u8F66\u67B6",
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
  {
    id: "task-valve",
    projectId: "project-valve",
    inputType: "image",
    status: "generating",
    progress: 68,
    stageLabel: "\u52A8\u6001\u6548\u679C\u751F\u6210\u4E2D",
    createdAt: "2026-07-29T04:48:00.000Z",
    errorMessage: null,
    modelUrl: null,
    thumbnailUrl: "/valve-actuator-viewport.png",
  },
  {
    id: "task-engine",
    projectId: "project-engine",
    inputType: "cad",
    status: "completed",
    progress: 100,
    stageLabel: "3D\u6A21\u578B\u5DF2\u751F\u6210",
    createdAt: "2026-07-28T10:20:00.000Z",
    errorMessage: null,
    modelUrl: import.meta.env.VITE_DEMO_GLB_URL ?? null,
    thumbnailUrl: null,
  },
  {
    id: "task-bmx",
    projectId: "project-bmx",
    inputType: "image",
    status: "queued",
    progress: 42,
    stageLabel: "\u7B49\u5F85\u53C2\u6570\u786E\u8BA4",
    createdAt: "2026-07-26T09:30:00.000Z",
    errorMessage: null,
    modelUrl: null,
    thumbnailUrl: null,
  },
];
