import type { EditorDefinition, EditorDraft, EditorNode } from "../../types/editor";

interface SceneInspectorProps {
  definition: EditorDefinition;
  draft: EditorDraft;
  onSelect: (nodeId: string) => void;
  onToggleExpanded: (nodeId: string) => void;
  onToggleHidden: (nodeId: string) => void;
  onToggleLocked: (nodeId: string) => void;
}

export function SceneInspector({
  definition,
  draft,
  onSelect,
  onToggleExpanded,
  onToggleHidden,
  onToggleLocked,
}: SceneInspectorProps) {
  const selectedNode =
    definition.nodes.find((n) => n.id === draft.selectedNodeId) ??
    definition.nodes[0];

  const renderNodeItem = (node: EditorNode, level = 0) => {
    const isSelected = node.id === draft.selectedNodeId;
    const isHidden = draft.hiddenNodeIds.includes(node.id);
    const isLocked = draft.lockedNodeIds.includes(node.id);
    const isExpanded = draft.expandedNodeIds.includes(node.id);
    const children = definition.nodes.filter((n) => n.parentId === node.id);
    const hasChildren = children.length > 0;

    return (
      <div key={node.id} className="tree-node-wrapper">
        <div
          className={`tree-node-item ${isSelected ? "selected" : ""}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasChildren ? (
            <button
              className="tree-toggle-btn"
              type="button"
              aria-label={isExpanded ? `折叠${node.name}` : `展开${node.name}`}
              onClick={() => onToggleExpanded(node.id)}
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          ) : (
            <span className="tree-indent-spacer" />
          )}

          <button
            className="tree-select-btn"
            type="button"
            aria-label={`选择${node.name}`}
            onClick={() => onSelect(node.id)}
          >
            <span className="node-icon">📦</span>
            <span className="node-name">{node.name}</span>
          </button>

          <div className="tree-node-actions">
            <button
              type="button"
              className={`node-action-btn ${isHidden ? "active" : ""}`}
              aria-label={isHidden ? `显示${node.name}` : `隐藏${node.name}`}
              onClick={() => onToggleHidden(node.id)}
            >
              {isHidden ? "🙈" : "👁"}
            </button>
            <button
              type="button"
              className={`node-action-btn ${isLocked ? "active" : ""}`}
              aria-label={isLocked ? `解锁${node.name}` : `锁定${node.name}`}
              onClick={() => onToggleLocked(node.id)}
            >
              {isLocked ? "🔒" : "🔓"}
            </button>
          </div>
        </div>

        {hasChildren && isExpanded ? (
          <div className="tree-children">
            {children.map((child) => renderNodeItem(child, level + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  const rootNodes = definition.nodes.filter((n) => n.parentId === null);

  return (
    <aside className="editor-inspector">
      <div className="inspector-section scene-tree-section">
        <div className="inspector-section-header">
          <h3>对象大纲树</h3>
          <span className="node-count">{definition.nodes.length} 部件</span>
        </div>

        {definition.structureNotice ? (
          <div className="structure-notice">{definition.structureNotice}</div>
        ) : null}

        <div className="scene-tree-container">
          {rootNodes.map((rootNode) => renderNodeItem(rootNode, 0))}
        </div>
      </div>

      <div className="inspector-section properties-section">
        <div className="inspector-section-header">
          <h3>变换与属性</h3>
        </div>

        {selectedNode ? (
          <div className="properties-content">
            <h4 role="heading" aria-level={4}>
              {selectedNode.name}
            </h4>
            <div className="property-group">
              <label>位置 (Position)</label>
              <div className="vector-inputs">
                <input
                  type="text"
                  readOnly
                  value={selectedNode.transform.position[0].toFixed(2)}
                />
                <input
                  type="text"
                  readOnly
                  value={selectedNode.transform.position[1].toFixed(2)}
                />
                <input
                  type="text"
                  readOnly
                  value={selectedNode.transform.position[2].toFixed(2)}
                />
              </div>
            </div>

            <div className="property-group">
              <label>旋转 (Rotation)</label>
              <div className="vector-inputs">
                <input
                  type="text"
                  readOnly
                  value={selectedNode.transform.rotation[0].toFixed(2)}
                />
                <input
                  type="text"
                  readOnly
                  value={selectedNode.transform.rotation[1].toFixed(2)}
                />
                <input
                  type="text"
                  readOnly
                  value={selectedNode.transform.rotation[2].toFixed(2)}
                />
              </div>
            </div>

            <div className="property-group">
              <label>缩放 (Scale)</label>
              <div className="vector-inputs">
                <input
                  type="text"
                  readOnly
                  value={selectedNode.transform.scale[0].toFixed(2)}
                />
                <input
                  type="text"
                  readOnly
                  value={selectedNode.transform.scale[1].toFixed(2)}
                />
                <input
                  type="text"
                  readOnly
                  value={selectedNode.transform.scale[2].toFixed(2)}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="no-selection">无选中节点</p>
        )}
      </div>
    </aside>
  );
}
