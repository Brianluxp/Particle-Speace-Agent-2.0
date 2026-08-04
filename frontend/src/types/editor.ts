export type EditorStepState = "completed" | "active" | "waiting";
export type RotationAxis = "axis-a" | "axis-b";

export interface EditorStep {
  id: string;
  index: number;
  title: string;
  description: string;
  state: EditorStepState;
}

export interface EditorTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface EditorNode {
  id: string;
  parentId: string | null;
  name: string;
  transform: EditorTransform;
}

export interface EditorTrack {
  id: string;
  label: string;
  color: "blue" | "teal";
  keyframes: number[];
}

export interface EditorDefinition {
  projectName: string;
  sourceLabel: string;
  steps: EditorStep[];
  nodes: EditorNode[];
  tracks: EditorTrack[];
  structureNotice: string | null;
}

export interface EditorDraft {
  version: 1;
  activeStepId: string;
  rotationAxis: RotationAxis;
  selectedNodeId: string;
  expandedNodeIds: string[];
  hiddenNodeIds: string[];
  lockedNodeIds: string[];
  timelineSeconds: number;
  messages: string[];
}
