import { describe, it, expect } from "vitest";
import { solveFABRIK } from "./FabrikSolver";
import type { IVector3 } from "../types";

describe("FabrikSolver", () => {
  it("should solve an unconstrained 2-bone chain exactly to the target", () => {
    // 3 joints (Root, Elbow, Wrist), 2 bones (Length 10, Length 10)
    const initialPositions: IVector3[] = [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 10, z: 0 },
      { x: 0, y: 20, z: 0 },
    ];
    const boneLengths = [10, 10];

    // Target is exactly 20 units away on the X axis instead of Y
    const target: IVector3 = { x: 20, y: 0, z: 0 };

    // Increase iterations since it's perfectly extending from Y-axis to X-axis
    const solvedPositions = solveFABRIK(initialPositions, boneLengths, target, 0.001, 100);

    // Root should stay at origin
    expect(solvedPositions[0]!.x).toBeCloseTo(0);
    expect(solvedPositions[0]!.y).toBeCloseTo(0);

    // Effector should be at target
    expect(solvedPositions[2]!.x).toBeCloseTo(20);
    expect(solvedPositions[2]!.y).toBeCloseTo(0);

    // Middle joint should be at (10, 0, 0)
    expect(solvedPositions[1]!.x).toBeCloseTo(10);
    expect(solvedPositions[1]!.y).toBeCloseTo(0);
  });

  it("should stretch in a straight line if the target is unreachable", () => {
    const initialPositions: IVector3[] = [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 10, z: 0 },
      { x: 0, y: 20, z: 0 },
    ];
    const boneLengths = [10, 10];

    // Target is 100 units away, but max length is 20
    const target: IVector3 = { x: 100, y: 0, z: 0 };

    const solvedPositions = solveFABRIK(initialPositions, boneLengths, target, 0.01, 10);

    // Root stays at origin
    expect(solvedPositions[0]!.x).toBeCloseTo(0);

    // Stretches fully toward X (max reach is 20)
    expect(solvedPositions[2]!.x).toBeCloseTo(20);
    expect(solvedPositions[2]!.y).toBeCloseTo(0);
  });
});

