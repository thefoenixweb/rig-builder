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
});

