import { describe, it, expect } from "vitest";
import { cascadeTransform, calculateLocalOffset } from "./TransformSystem";
import { ITransform } from "../types";

describe("TransformSystem", () => {
  const identityTransform: ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  };

  describe("cascadeTransform", () => {
    it("should correctly translate a child relative to a translated parent", () => {
      const parent: ITransform = {
        position: { x: 10, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      };
      const childLocal: ITransform = {
        position: { x: 5, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      };
      
      const childWorld = cascadeTransform(parent, childLocal);
      expect(childWorld.position.x).toBeCloseTo(15);
      expect(childWorld.position.y).toBeCloseTo(0);
      expect(childWorld.position.z).toBeCloseTo(0);
    });

    it("should correctly translate a child relative to a rotated parent", () => {
      const parent: ITransform = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: Math.PI / 2 }, // 90 degrees around Z
        scale: { x: 1, y: 1, z: 1 },
      };
      const childLocal: ITransform = {
        position: { x: 10, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      };
      
      const childWorld = cascadeTransform(parent, childLocal);
      // Because parent is rotated 90deg on Z, a local +X translation should result in a world +Y translation
      expect(childWorld.position.x).toBeCloseTo(0);
      expect(childWorld.position.y).toBeCloseTo(10);
      expect(childWorld.position.z).toBeCloseTo(0);
      expect(childWorld.rotation.z).toBeCloseTo(Math.PI / 2);
    });
  });

  describe("calculateLocalOffset", () => {
    it("should correctly calculate the local offset of a child relative to a parent", () => {
      const parentWorld: ITransform = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: Math.PI / 2 },
        scale: { x: 1, y: 1, z: 1 },
      };
      const childWorld: ITransform = {
        position: { x: 0, y: 10, z: 0 },
        rotation: { x: 0, y: 0, z: Math.PI / 2 },
        scale: { x: 1, y: 1, z: 1 },
      };
      
      const localOffset = calculateLocalOffset(parentWorld, childWorld);
      // The child is at world +Y, and the parent is rotated 90deg Z. So the child should be at local +X.
      expect(localOffset.position.x).toBeCloseTo(10);
      expect(localOffset.position.y).toBeCloseTo(0);
      expect(localOffset.position.z).toBeCloseTo(0);
      expect(localOffset.rotation.x).toBeCloseTo(0);
      expect(localOffset.rotation.y).toBeCloseTo(0);
      expect(localOffset.rotation.z).toBeCloseTo(0);
    });
  });
});

