import type { EditorDefinition } from "../types/editor";

const valveDefinition: EditorDefinition = {
  projectName: "阀门执行器",
  sourceLabel: "CAD 物理模型导入",
  structureNotice: null,
  steps: [
    {
      id: "import",
      index: 1,
      title: "模型导入与准备",
      description: "已解析网格拓扑与层级",
      state: "completed",
    },
    {
      id: "parts",
      index: 2,
      title: "部件拆分与识别",
      description: "已标记 13 个独立机械构件",
      state: "completed",
    },
    {
      id: "motion",
      index: 3,
      title: "联动关系建立",
      description: "定义阀杆与手轮旋转约束",
      state: "active",
    },
    {
      id: "optimize",
      index: 4,
      title: "检查与优化",
      description: "验证干涉与运动范围",
      state: "waiting",
    },
    {
      id: "animation",
      index: 5,
      title: "生成动态效果",
      description: "计算关键帧与运动轨迹",
      state: "waiting",
    },
    {
      id: "export",
      index: 6,
      title: "导出与发布",
      description: "准备高保真 3D 资产",
      state: "waiting",
    },
  ],
  nodes: [
    {
      id: "node-root",
      parentId: null,
      name: "根节点",
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "node-body",
      parentId: "node-root",
      name: "阀体",
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "node-actuator",
      parentId: "node-root",
      name: "执行器",
      transform: { position: [0, 120, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "node-cylinder",
      parentId: "node-actuator",
      name: "气缸体",
      transform: { position: [0, 140, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "node-cap",
      parentId: "node-cylinder",
      name: "端盖",
      transform: { position: [0, 200, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "node-piston",
      parentId: "node-cylinder",
      name: "活塞组件",
      transform: { position: [0, 160, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "node-stem",
      parentId: "node-actuator",
      name: "阀杆",
      transform: { position: [0, 115.2, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "node-handwheel",
      parentId: "node-actuator",
      name: "手轮",
      transform: { position: [0, 240, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "node-limit-unit",
      parentId: "node-actuator",
      name: "限位组件",
      transform: { position: [45, 180, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "node-limit-switch",
      parentId: "node-limit-unit",
      name: "限位开关",
      transform: { position: [50, 195, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "node-bracket",
      parentId: "node-actuator",
      name: "支架",
      transform: { position: [0, 90, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "node-linkage",
      parentId: "node-bracket",
      name: "连接杆",
      transform: { position: [15, 100, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "node-material",
      parentId: "node-root",
      name: "材质",
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
  ],
  tracks: [
    { id: "valve-rotation", label: "阀杆旋转", color: "blue", keyframes: [0, 5, 10] },
    { id: "wheel-linkage", label: "手轮联动", color: "teal", keyframes: [0, 5, 10] },
  ],
};

const genericDefinition: EditorDefinition = {
  projectName: "通用 3D 模型",
  sourceLabel: "演示网格节点",
  structureNotice: "当前模型暂无部件级结构数据",
  steps: [
    {
      id: "import",
      index: 1,
      title: "模型导入与准备",
      description: "简单网格解析完成",
      state: "completed",
    },
    {
      id: "parts",
      index: 2,
      title: "部件拆分与识别",
      description: "保持单一网格结构",
      state: "active",
    },
    {
      id: "motion",
      index: 3,
      title: "运动分配",
      description: "等待自定义节点",
      state: "waiting",
    },
  ],
  nodes: [
    {
      id: "gen-root",
      parentId: null,
      name: "模型根节点",
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "gen-body",
      parentId: "gen-root",
      name: "模型主体",
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
    {
      id: "gen-material",
      parentId: "gen-root",
      name: "材质",
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    },
  ],
  tracks: [],
};

const editorDefinitions: Record<string, EditorDefinition> = {
  "task-valve": valveDefinition,
};

export function getEditorDefinition(taskId: string): EditorDefinition {
  return structuredClone(editorDefinitions[taskId] ?? genericDefinition);
}
