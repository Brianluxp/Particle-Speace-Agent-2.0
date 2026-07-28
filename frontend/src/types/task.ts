export type InputType = "cad" | "image" | "model";

export type TaskStatus =
  | "queued"
  | "parsing"
  | "generating"
  | "completed"
  | "failed";

export interface Project {
  id: string;
  name: string;
  inputType: InputType;
  taskId: string;
  status: TaskStatus;
  createdAt: string;
}

export interface GenerationTask {
  id: string;
  projectId: string;
  inputType: InputType;
  status: TaskStatus;
  progress: number;
  stageLabel: string;
  createdAt: string;
  errorMessage: string | null;
  modelUrl: string | null;
  thumbnailUrl: string | null;
}

export interface CreateProjectInput {
  name: string;
  inputType: InputType;
  file: File;
}
