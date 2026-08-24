import { create } from "zustand";
import type { IRigState, INode, IVector3 } from "../types.ts";

interface RigActions {
  addNode: (id: string, position: IVector3) => void;
  parentNode: (childId: string, parentId: string) => void;
  unparentNode: (nodeId: string) => void;
  setConstraintType: (nodeId: string, constraint: "spinner" | "bender" | "none") => void;
  addTarget: (id: string, position: IVector3) => void;
  assignTarget: (targetId: string, endEffectorId: string) => void;
  removeTarget: (targetId: string) => void;
  reset: () => void;
}

const initialState: IRigState = {
  nodes: {},
  targets: {},
  followTarget: true,
  controlMode: "translate",
  controlSpace: "world",
  eulerRingsVisible: true,
  controlVisible: true,
};

export const useRigStore = create<IRigState & RigActions>((set) => ({
  ...initialState,

  addNode: (id: string, position: IVector3) =>
    set((state) => {
      const newNode: INode = {
        id,
        name: id,
        parentId: null,
        offset: { position, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        rotation: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        constraint: "none",
        min: -Math.PI,
        max: Math.PI,
      };
      return { nodes: { ...state.nodes, [id]: newNode } };
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

