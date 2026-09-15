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

          const angle = effectorVec.angleTo(targetVec);
          if (angle < 0.001) continue;

          const cross = new Vector3().crossVectors(effectorVec, targetVec).normalize();
          const rotationQuat = new Quaternion().setFromAxisAngle(cross, angle);

          const parentQuat = new Quaternion();
          if (jointObj.parent) {
            jointObj.parent.getWorldQuaternion(parentQuat);
          }
          const parentQuatInv = parentQuat.clone().invert();
          const qNewLocal = parentQuatInv.multiply(rotationQuat).multiply(parentQuat).multiply(jointObj.quaternion);
          jointObj.quaternion.copy(qNewLocal);

          const localEuler = new Euler().setFromQuaternion(jointObj.quaternion, "XYZ");

          let rotX = localEuler.x - nodeState.offset.rotation.x;
          let rotY = localEuler.y - nodeState.offset.rotation.y;
          let rotZ = localEuler.z - nodeState.offset.rotation.z;

          if (nodeState.constraint === "spinner") {
            rotX = nodeState.rotation.rotation.x;
            rotZ = nodeState.rotation.rotation.z;
            rotY = Math.max(nodeState.min, Math.min(nodeState.max, rotY));
          } else if (nodeState.constraint === "bender") {
            rotX = nodeState.rotation.rotation.x;
            rotY = nodeState.rotation.rotation.y;
            rotZ = Math.max(nodeState.min, Math.min(nodeState.max, rotZ));
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
