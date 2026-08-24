import { describe, it, expect, beforeEach } from "vitest";
import { useRigStore } from "./rigStore.ts";

describe("rigStore (Base Nodes)", () => {
  beforeEach(() => {
    useRigStore.getState().reset();
  });

  it("should add a new node to the store", () => {
    useRigStore.getState().addNode("node-1", { x: 0, y: 10, z: 0 });
    const nodes = useRigStore.getState().nodes;

    expect(nodes["node-1"]).toBeDefined();
    expect(nodes["node-1"]!.id).toBe("node-1");
    expect(nodes["node-1"]!.parentId).toBeNull();
    expect(nodes["node-1"]!.offset.position.y).toBe(10);
  });

  it("should parent a node correctly", () => {
    useRigStore.getState().addNode("parent-1", { x: 0, y: 0, z: 0 });
    useRigStore.getState().addNode("child-1", { x: 0, y: 5, z: 0 });

    useRigStore.getState().parentNode("child-1", "parent-1");

    const nodes = useRigStore.getState().nodes;
    expect(nodes["child-1"]!.parentId).toBe("parent-1");
  });

  it("should unparent a node", () => {
    useRigStore.getState().addNode("parent-1", { x: 0, y: 0, z: 0 });
    useRigStore.getState().addNode("child-1", { x: 0, y: 5, z: 0 });

    useRigStore.getState().parentNode("child-1", "parent-1");
    useRigStore.getState().unparentNode("child-1");

    const nodes = useRigStore.getState().nodes;
    expect(nodes["child-1"]!.parentId).toBeNull();
  });

  it("should set constraint type on a node", () => {
    useRigStore.getState().addNode("node-1", { x: 0, y: 0, z: 0 });
    
    useRigStore.getState().setConstraintType("node-1", "spinner");
    
    let nodes = useRigStore.getState().nodes;
    expect(nodes["node-1"]!.constraint).toBe("spinner");

    useRigStore.getState().setConstraintType("node-1", "bender");
    nodes = useRigStore.getState().nodes;
    expect(nodes["node-1"]!.constraint).toBe("bender");
  });

  it("should add, assign, and remove targets", () => {
    // Add nodes first
    useRigStore.getState().addNode("node-1", { x: 0, y: 0, z: 0 });
    useRigStore.getState().addNode("node-2", { x: 0, y: 5, z: 0 });

    // Add target
    useRigStore.getState().addTarget("target-1", { x: 5, y: 5, z: 0 });
    let targets = useRigStore.getState().targets;
    
    expect(targets["target-1"]).toBeDefined();
    expect(targets["target-1"]!.id).toBe("target-1");
    expect(targets["target-1"]!.position.x).toBe(5);
    expect(targets["target-1"]!.endEffectorId).toBeNull();

    // Assign target to an end-effector
    useRigStore.getState().assignTarget("target-1", "node-2");
    targets = useRigStore.getState().targets;
    expect(targets["target-1"]!.endEffectorId).toBe("node-2");

    // Remove target
    useRigStore.getState().removeTarget("target-1");
    targets = useRigStore.getState().targets;
    expect(targets["target-1"]).toBeUndefined();
  });
});

