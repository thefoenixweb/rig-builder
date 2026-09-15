import { Object3D, Vector3, Matrix4, Quaternion, Euler, Scene } from 'three';
import { useRigStore } from '../state/rigStore';
import type { IRigState, INode, IVector3 } from '../types';

/**
 * A headless FK/IK engine 
 * running CCD without touching the React render cycle.
 */
export class IKSolver {
  // use Three.js Object3D as a headless math graph
  private rootObjects: Map<string, Object3D> = new Map();
  private nodeObjects: Map<string, Object3D> = new Map();
  // We use a dummy tip object to represent the actual end effector position
  private tipObjects: Map<string, Object3D> = new Map();
  private lastUpdateTime: number = 0;
  // Accumulates uncommitted rotations so the solver doesn't reset when we throttle React
  private internalRotations: Map<string, IVector3> = new Map();

  public clearInternalRotations() {
    this.internalRotations.clear();
  }

  private buildVirtualGraph(state: IRigState) {
    this.rootObjects.clear();
    this.nodeObjects.clear();
    this.tipObjects.clear();

    const nodes = Object.values(state.nodes);

    nodes.forEach(node => {
      const obj = new Object3D();
      obj.name = node.id;
      this.nodeObjects.set(node.id, obj);

      const tipObj = new Object3D();
      tipObj.position.set(0, node.offset.scale.y, 0);
      obj.add(tipObj);
      this.tipObjects.set(node.id, tipObj);
    });

    nodes.forEach(node => {
      const obj = this.nodeObjects.get(node.id)!;

      if (node.parentId) {
        const parentTip = this.tipObjects.get(node.parentId);
        if (parentTip) {
          parentTip.add(obj);
          obj.position.set(0, 0, 0);
        }
      } else {
        obj.position.set(node.offset.position.x, node.offset.position.y, node.offset.position.z);
        this.rootObjects.set(node.id, obj);
      }

      // Apply initial rotation
      const rot = node.rotation.rotation;
      const off = node.offset.rotation;
      obj.rotation.set(rot.x + off.x, rot.y + off.y, rot.z + off.z, "XYZ");
    });

    this.rootObjects.forEach(root => root.updateMatrixWorld(true));
  }

  public solve(iterations: number = 10, scene?: Scene) {
    const state = useRigStore.getState();
    if (!state.followTarget) return;

    const targets = Object.values(state.targets);
    if (targets.length === 0) return;

    this.buildVirtualGraph(state);

    let anyUpdates = false;
    const finalRotations: Record<string, IVector3> = {};

    targets.forEach(target => {
      if (!target.endEffectorId) return;

      const effectorObj = this.tipObjects.get(target.endEffectorId);
      if (!effectorObj) return;

      let targetPos = new Vector3(target.position.x, target.position.y, target.position.z);
      
      if (scene && state.isDragging) {
        const targetMesh = scene.getObjectByName(target.id);
        if (targetMesh) {
          targetMesh.getWorldPosition(targetPos);
        }
      }

      const chain: string[] = [];
      let currentId: string | null = target.endEffectorId;
      while (currentId) {
        chain.push(currentId);
        currentId = state.nodes[currentId]?.parentId || null;
      }

      const endEffectorWorldPos = new Vector3();
      const jointWorldPos = new Vector3();

      for (let i = 0; i < iterations; i++) {
        for (const nodeId of chain) {
          const jointObj = this.nodeObjects.get(nodeId);
          if (!jointObj) continue;

          const nodeState = state.nodes[nodeId];
          if (!nodeState || nodeState.constraint === "none") continue;

          effectorObj.getWorldPosition(endEffectorWorldPos);
          jointObj.getWorldPosition(jointWorldPos);

          const effectorVec = endEffectorWorldPos.clone().sub(jointWorldPos).normalize();
          const targetVec = targetPos.clone().sub(jointWorldPos).normalize();

          let localAxis = new Vector3();
          if (nodeState.constraint === "spinner") {
            localAxis.set(0, 1, 0);
          } else if (nodeState.constraint === "bender") {
            localAxis.set(0, 0, 1);
          }

          // Transform local axis to world direction
          const worldAxis = localAxis.clone().transformDirection(jointObj.matrixWorld).normalize();

          // Project vectors onto the plane perpendicular to the rotation axis
          const effectorProjected = effectorVec.clone().sub(worldAxis.clone().multiplyScalar(effectorVec.dot(worldAxis)));
          const targetProjected = targetVec.clone().sub(worldAxis.clone().multiplyScalar(targetVec.dot(worldAxis)));

          if (effectorProjected.lengthSq() < 0.0001 || targetProjected.lengthSq() < 0.0001) {
            continue;
          }

          effectorProjected.normalize();
          targetProjected.normalize();

          const y = new Vector3().crossVectors(effectorProjected, targetProjected).dot(worldAxis);
          const x = effectorProjected.dot(targetProjected);
          const angleDelta = Math.atan2(y, x);

          if (Math.abs(angleDelta) < 0.001) continue;

          let rotX = nodeState.rotation.rotation.x;
          let rotY = jointObj.rotation.y - nodeState.offset.rotation.y;
          let rotZ = jointObj.rotation.z - nodeState.offset.rotation.z;

          const applyBoundedRotation = (current: number, delta: number, min: number, max: number) => {
            let next = current + delta;
            // Check if unwinding 360 degrees puts us in bounds
            if (next > max && next - 2 * Math.PI >= min) {
              next -= 2 * Math.PI;
            } else if (next < min && next + 2 * Math.PI <= max) {
              next += 2 * Math.PI;
            }
            return Math.max(min, Math.min(max, next));
          };

          if (nodeState.constraint === "spinner") {
            rotY = applyBoundedRotation(rotY, angleDelta, nodeState.min, nodeState.max);
            rotZ = nodeState.rotation.rotation.z;
          } else if (nodeState.constraint === "bender") {
            rotZ = applyBoundedRotation(rotZ, angleDelta, nodeState.min, nodeState.max);
            rotY = nodeState.rotation.rotation.y;
          }

          jointObj.rotation.set(
            rotX + nodeState.offset.rotation.x,
            rotY + nodeState.offset.rotation.y,
            rotZ + nodeState.offset.rotation.z,
            "XYZ"
          );

          jointObj.updateMatrixWorld(true);

          const dx = Math.abs(rotX - nodeState.rotation.rotation.x);
          const dy = Math.abs(rotY - nodeState.rotation.rotation.y);
          const dz = Math.abs(rotZ - nodeState.rotation.rotation.z);
          
          if (dx > 0.001 || dy > 0.001 || dz > 0.001) {
            finalRotations[nodeId] = { x: rotX, y: rotY, z: rotZ };
            anyUpdates = true;
          }
        }
      }
    });

    if (anyUpdates) {
      useRigStore.getState().setMultipleNodeRotations(finalRotations);
    }
  }
}
