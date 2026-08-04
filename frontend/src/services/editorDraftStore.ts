import type { EditorDefinition, EditorDraft } from "../types/editor";

const KEY_PREFIX = "particle-space:editor-draft:";

export function createDefaultEditorDraft(
  definition: EditorDefinition,
): EditorDraft {
  const parentNodeIds = new Set(
    definition.nodes
      .filter((node) => definition.nodes.some((child) => child.parentId === node.id))
      .map((node) => node.id),
  );

  return {
    version: 1,
    activeStepId: "motion",
    rotationAxis: "axis-a",
    selectedNodeId: definition.nodes[0].id,
    expandedNodeIds: definition.nodes
      .filter((node) => node.parentId === null || parentNodeIds.has(node.id))
      .map((node) => node.id),
    hiddenNodeIds: [],
    lockedNodeIds: [],
    timelineSeconds: 0,
    messages: [],
  };
}

export function saveEditorDraft(taskId: string, draft: EditorDraft): void {
  localStorage.setItem(`${KEY_PREFIX}${taskId}`, JSON.stringify(draft));
}

export function loadEditorDraft(
  taskId: string,
  definition: EditorDefinition,
): EditorDraft {
  const fallback = createDefaultEditorDraft(definition);
  const raw = localStorage.getItem(`${KEY_PREFIX}${taskId}`);
  if (!raw) return fallback;

  try {
    const value = JSON.parse(raw) as Partial<EditorDraft>;
    if (value.version !== 1) return fallback;
    const nodeIds = new Set(definition.nodes.map((node) => node.id));
    return {
      version: 1,
      activeStepId:
        typeof value.activeStepId === "string"
          ? value.activeStepId
          : fallback.activeStepId,
      rotationAxis: value.rotationAxis === "axis-b" ? "axis-b" : "axis-a",
      selectedNodeId: nodeIds.has(value.selectedNodeId ?? "")
        ? value.selectedNodeId!
        : fallback.selectedNodeId,
      timelineSeconds: Math.min(10, Math.max(0, value.timelineSeconds ?? 0)),
      expandedNodeIds: (value.expandedNodeIds ?? []).filter((id) => nodeIds.has(id)),
      hiddenNodeIds: (value.hiddenNodeIds ?? []).filter((id) => nodeIds.has(id)),
      lockedNodeIds: (value.lockedNodeIds ?? []).filter((id) => nodeIds.has(id)),
      messages: (value.messages ?? []).filter((message) => typeof message === "string"),
    };
  } catch {
    localStorage.removeItem(`${KEY_PREFIX}${taskId}`);
    return fallback;
  }
}
