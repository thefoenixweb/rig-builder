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
  setTargetPosition: (targetId: string, position: IVector3) => void;
  setFollowTarget: (follow: boolean) => void;
  setMultipleNodeRotations: (updates: Record<string, IVector3>) => void;
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

      let newMin = child.min;
      let newMax = child.max;
      
      // If it's a bender, apply limits when parented
      if (child.constraint === "bender") {
        newMin = -Math.PI / 2;
        newMax = Math.PI / 2;
      }

      const clampedRotation = {
        x: Math.max(newMin, Math.min(newMax, child.rotation.rotation.x)),
        y: Math.max(newMin, Math.min(newMax, child.rotation.rotation.y)),
        z: Math.max(newMin, Math.min(newMax, child.rotation.rotation.z)),
      };

      return {
        nodes: {
          ...state.nodes,
          [childId]: { 
            ...child, 
            parentId, 
            min: newMin, 
            max: newMax,
            rotation: {
              ...child.rotation,
              rotation: clampedRotation
            }
          },
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
          [nodeId]: { ...node, parentId: null, min: -Math.PI, max: Math.PI },
        },
      };
    }),

  setConstraintType: (nodeId: string, constraint: "spinner" | "bender" | "none") =>
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node) return state;

      let newMin = node.min;
      let newMax = node.max;

      // Apply limits if it's parented and becoming a bender
      if (node.parentId !== null && constraint === "bender") {
        newMin = -Math.PI / 2;
        newMax = Math.PI / 2;
      } else if (node.parentId === null || constraint !== "bender") {
        newMin = -Math.PI;
        newMax = Math.PI;
      }

      const clampedRotation = {
        x: Math.max(newMin, Math.min(newMax, node.rotation.rotation.x)),
        y: Math.max(newMin, Math.min(newMax, node.rotation.rotation.y)),
        z: Math.max(newMin, Math.min(newMax, node.rotation.rotation.z)),
      };

      return {
        nodes: {
          ...state.nodes,
          [nodeId]: { 
            ...node, 
            constraint, 
            min: newMin, 
            max: newMax,
            rotation: {
              ...node.rotation,
              rotation: clampedRotation
            }
          },
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

  setTargetPosition: (targetId: string, position: IVector3) =>
    set((state) => {
      const target = state.targets[targetId];
      if (!target) return state;
      return {
        targets: {
          ...state.targets,
          [targetId]: { ...target, position },
        },
      };
    }),

  setFollowTarget: (follow: boolean) => set({ followTarget: follow }),

  setMultipleNodeRotations: (updates: Record<string, IVector3>) =>
    set((state) => {
      const newNodes = { ...state.nodes };
      for (const [id, newRotation] of Object.entries(updates)) {
        if (newNodes[id]) {
          newNodes[id] = {
            ...newNodes[id],
            rotation: {
              ...newNodes[id].rotation,
              rotation: newRotation,
            },
          };
        }
      }
      return { nodes: newNodes };
    }),

  reset: () => set(() => initialState),
}));

