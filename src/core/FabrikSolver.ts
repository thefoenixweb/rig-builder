import { Vector3 } from "three";
import type { IVector3 } from "../types";

/**
 * Solves a multi-bone IK chain using the FABRIK algorithm.
 * 
 * @param positions The current absolute world positions of all joints (Root to Effector). Length = n + 1
 * @param lengths The lengths of the bones connecting the joints. Length = n
 * @param target The target absolute world position for the end effector
 * @param tolerance The acceptable distance error for convergence (default 0.01)
 * @param maxIterations The maximum number of solver passes (default 10)
 * @returns An array of new absolute world positions for all joints
 */
export function solveFABRIK(
  positions: IVector3[],
  lengths: number[],
  target: IVector3,
  tolerance: number = 0.01,
  maxIterations: number = 10
): IVector3[] {
  if (positions.length === 0 || lengths.length === 0) return positions;

  const points = positions.map(p => new Vector3(p.x, p.y, p.z));
  const t = new Vector3(target.x, target.y, target.z);

  const root = points[0]!.clone();
  const numPoints = points.length;

  // 1. Find total length of the chain
  const totalLength = lengths.reduce((sum, len) => sum + len, 0);

  // 2. Check if the target is reachable
  const distanceToTarget = root.distanceTo(t);

  if (distanceToTarget >= totalLength - 0.0001) {
    // Unreachable or max extension: stretch out in a straight line towards the target
    for (let i = 0; i < numPoints - 1; i++) {
      const r = t.distanceTo(points[i]!);
      const lambda = lengths[i]! / r;

      points[i + 1]!.lerpVectors(points[i]!, t, lambda);
    }
  } else {
    // Reachable: Run iterative FABRIK passes
    const base = root.clone();

    for (let iter = 0; iter < maxIterations; iter++) {
      // Check if we are close enough
      if (points[numPoints - 1]!.distanceTo(t) <= tolerance) {
        break;
      }

      // STAGE 1: FORWARD REACHING (from effector to root)
      points[numPoints - 1]!.copy(t);

      for (let i = numPoints - 2; i >= 0; i--) {
        const r = points[i + 1]!.distanceTo(points[i]!);
        const lambda = lengths[i]! / r;

        points[i]!.lerpVectors(points[i + 1]!, points[i]!, lambda);
      }

      // STAGE 2: BACKWARD REACHING (from root to effector)
      points[0]!.copy(base);

      for (let i = 0; i < numPoints - 1; i++) {
        const r = points[i]!.distanceTo(points[i + 1]!);
        const lambda = lengths[i]! / r;

        points[i + 1]!.lerpVectors(points[i]!, points[i + 1]!, lambda);
      }
    }
  }

  // Convert back to simple JSON interface
  return points.map(p => ({ x: p.x, y: p.y, z: p.z }));
}

