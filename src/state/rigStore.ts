import { create } from "zustand";
import type { IRigState, INode, IVector3 } from "../types.ts";

interface RigActions {
  addNode: (id: string, position: IVector3) => void;
  removeNode: (nodeId: string) => void;
  parentNode: (childId: string, parentId: string) => void;
  unparentNode: (nodeId: string) => void;
  setConstraintType: (nodeId: string, constraint: "spinner" | "bender" | "none") => void;
  setNodeRotation: (nodeId: string, axis: "x" | "y" | "z", value: number) => void;
  setNodePosition: (nodeId: string, position: IVector3) => void;
  setSelectedNode: (id: string | null) => void;
  addTarget: (id: string, position: IVector3) => void;
  assignTarget: (targetId: string, endEffectorId: string) => void;
  removeTarget: (targetId: string) => void;
  reset: () => void;
}

const initialState: IRigState & { selectedNodeId: string | null } = {
  nodes: {},
  targets: {},
  followTarget: true,
  controlMode: "translate",
  controlSpace: "world",
  eulerRingsVisible: true,
  controlVisible: true,
  selectedNodeId: null,
};

export const useRigStore = create<IRigState & { selectedNodeId: string | null } & RigActions>((set) => ({
  ...initialState,

  addNode: (id: string, position: IVector3) =>
    set((state) => {
      const newNode: INode = {
        id,
        name: id,
        parentId: null,
        offset: { position, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        rotation: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        constraint: "bender", // Default to bender
        min: -Math.PI,
        max: Math.PI,
        meshParameters: {
          jointRadius: 1,
          jointThickness: 1,
          armRadius: 0.5,
          color: "#aaaaaa"
        }
      };
      return { nodes: { ...state.nodes, [id]: newNode } };
    }),

  removeNode: (nodeId: string) =>
    set((state) => {
      const newNodes = { ...state.nodes };
      delete newNodes[nodeId];

      // Unparent any children that had this node as a parent
      for (const id in newNodes) {
        const node = newNodes[id];
        if (node && node.parentId === nodeId) {
          newNodes[id] = { ...node, parentId: null };
        }
      }

      const newSelectedNodeId = state.selectedNodeId === nodeId ? null : state.selectedNodeId;

      return { 
        nodes: newNodes,
        selectedNodeId: newSelectedNodeId
      };
    }),

  parentNode: (childId: string, parentId: string) =>
    set((state) => {
      const child = state.nodes[childId];
      if (!child) return state;
      return {
        nodes: {
          ...state.nodes,
          [childId]: { ...child, parentId },
        },
      };
    }),

  unparentNode: (nodeId: string) =>
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node) return state;
      return {
        nodes: {
          ...state.nodes,
          [nodeId]: { ...node, parentId: null },
        },
      };
    }),

  setConstraintType: (nodeId: string, constraint: "spinner" | "bender" | "none") =>
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node) return state;
      return {
        nodes: {
          ...state.nodes,
          [nodeId]: { ...node, constraint },
        },
      };
    }),

  setNodeRotation: (nodeId: string, axis: "x" | "y" | "z", value: number) =>
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node) return state;

      // Enforce axis constraints
      let allowed = true;
      if (node.constraint === "spinner" && axis !== "y") allowed = false;
      if (node.constraint === "bender" && axis !== "z") allowed = false; 

      if (!allowed) return state;

      // Clamp value between min and max
      const clampedValue = Math.max(node.min, Math.min(node.max, value));

      return {
        nodes: {
          ...state.nodes,
          [nodeId]: {
            ...node,
            rotation: {
              ...node.rotation,
              rotation: {
                ...node.rotation.rotation,
                [axis]: clampedValue,
              },
            },
          },
        },
      };
    }),

  setNodePosition: (nodeId: string, position: IVector3) =>
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node) return state;
      return {
        nodes: {
          ...state.nodes,
          [nodeId]: {
            ...node,
            offset: {
              ...node.offset,
              position
            }
          }
        }
      }
    }),

  setSelectedNode: (id: string | null) => set({ selectedNodeId: id }),

  addTarget: (id: string, position: IVector3) =>
    set((state) => {
      const newTarget = {
        id,
        position,
        rotation: { x: 0, y: 0, z: 0 },
        endEffectorId: null,
      };
      return { targets: { ...state.targets, [id]: newTarget } };
    }),

  assignTarget: (targetId: string, endEffectorId: string) =>
    set((state) => {
      const target = state.targets[targetId];
      if (!target) return state;
      return {
        targets: {
          ...state.targets,
          [targetId]: { ...target, endEffectorId },
        },
      };
    }),

  removeTarget: (targetId: string) =>
    set((state) => {
      const newTargets = { ...state.targets };
      delete newTargets[targetId];
      return { targets: newTargets };
    }),

  reset: () => set(() => initialState),
}));

