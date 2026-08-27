/**
 * Clamps an angle (or any number) between a minimum and maximum value.
 */
export function clampAngle(angle: number, min: number, max: number): number {
  if (angle < min) return min;
  if (angle > max) return max;
  return angle;
}

