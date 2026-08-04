import { DEFAULT_MODEL_TASK_ID } from "../mocks/projects";
import type { Project } from "../types/task";

export interface NavigationTargets {
  taskId: string;
  editorTaskId: string;
  modelTaskId: string;
}

export function resolveNavigationTargets(
  projects: Project[],
  pathname: string,
): NavigationTargets {
  const currentMatch = pathname.match(/^\/(tasks|models|editor)\/([^/]+)$/);
  const sortedProjects = [...projects].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
  const latestTaskId = sortedProjects[0]?.taskId ?? DEFAULT_MODEL_TASK_ID;
  const latestModelTaskId =
    sortedProjects.find((project) => project.status === "completed")?.taskId ??
    DEFAULT_MODEL_TASK_ID;

  return {
    taskId: currentMatch?.[2] ?? latestTaskId,
    editorTaskId: currentMatch?.[2] ?? latestTaskId,
    modelTaskId:
      currentMatch?.[1] === "models" || currentMatch?.[1] === "editor"
        ? currentMatch[2]
        : latestModelTaskId,
  };
}
