import { Vector3, Quaternion, Matrix4, Euler } from "three";
import type { ITransform, IVector3 } from "../types";

/**
 * Converts our ITransform into a Three.js Matrix4
 */
function getMatrixFromTransform(t: ITransform): Matrix4 {
  const position = new Vector3(t.position.x, t.position.y, t.position.z);
  const quaternion = new Quaternion().setFromEuler(
    new Euler(t.rotation.x, t.rotation.y, t.rotation.z, "XYZ")
  );
  const scale = new Vector3(t.scale.x, t.scale.y, t.scale.z);

  const matrix = new Matrix4();
  matrix.compose(position, quaternion, scale);
  return matrix;
}

/**
 * Extracts our ITransform from a Three.js Matrix4
 */
function getTransformFromMatrix(matrix: Matrix4): ITransform {
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();

  matrix.decompose(position, quaternion, scale);
  const euler = new Euler().setFromQuaternion(quaternion, "XYZ");

  return {
    position: { x: position.x, y: position.y, z: position.z },
    rotation: { x: euler.x, y: euler.y, z: euler.z },
    scale: { x: scale.x, y: scale.y, z: scale.z },
  };
}

/**
 * Calculates the absolute world transform of a child, given its local transform and its parent`s world transform.
 * (Equivalent to computing the world matrix of a child node in a hierarchy)
 */
export function cascadeTransform(parentWorld: ITransform, childLocal: ITransform): ITransform {
  const parentMatrix = getMatrixFromTransform(parentWorld);
  const childLocalMatrix = getMatrixFromTransform(childLocal);

  // World = ParentWorld * Local
  const childWorldMatrix = new Matrix4().multiplyMatrices(parentMatrix, childLocalMatrix);

  return getTransformFromMatrix(childWorldMatrix);
}

/**
 * Calculates the local offset transform of a child, given its world transform and its parent`s world transform.
 * (Equivalent to finding the local transform needed to place a child at a specific world position)
 */
export function calculateLocalOffset(parentWorld: ITransform, childWorld: ITransform): ITransform {
  const parentMatrix = getMatrixFromTransform(parentWorld);
  const childWorldMatrix = getMatrixFromTransform(childWorld);

  // Local = Inverse(ParentWorld) * World
  const parentInverse = new Matrix4().copy(parentMatrix).invert();
  const childLocalMatrix = new Matrix4().multiplyMatrices(parentInverse, childWorldMatrix);

  return getTransformFromMatrix(childLocalMatrix);
}

