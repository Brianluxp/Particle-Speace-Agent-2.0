import { beforeEach, describe, expect, test } from "vitest";
import { getEditorDefinition } from "../mocks/editorMockData";
import {
  createDefaultEditorDraft,
  loadEditorDraft,
  saveEditorDraft,
} from "./editorDraftStore";

beforeEach(() => localStorage.clear());

describe("editorDraftStore", () => {
  test("isolates drafts by task id", () => {
    const definition = getEditorDefinition("task-valve");
    const draft = createDefaultEditorDraft(definition);
    saveEditorDraft("task-valve", { ...draft, rotationAxis: "axis-b" });

    expect(loadEditorDraft("task-valve", definition).rotationAxis).toBe("axis-b");
    expect(loadEditorDraft("task-engine", definition).rotationAxis).toBe("axis-a");
  });

  test("restores defaults when stored JSON is malformed", () => {
    const definition = getEditorDefinition("task-valve");
    localStorage.setItem("particle-space:editor-draft:task-valve", "not-json");

    expect(loadEditorDraft("task-valve", definition)).toEqual(
      createDefaultEditorDraft(definition),
    );
  });

  test("clamps invalid timeline values", () => {
    const definition = getEditorDefinition("task-valve");
    const draft = createDefaultEditorDraft(definition);
    saveEditorDraft("task-valve", { ...draft, timelineSeconds: 99 });

    expect(loadEditorDraft("task-valve", definition).timelineSeconds).toBe(10);
  });
});
