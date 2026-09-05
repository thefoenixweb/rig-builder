import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import { Vector3 } from 'three';
import { IKSolver } from '../ik/IKSolver';
import { useRigStore } from '../state/rigStore';

export function IKManager() {
  const solver = useMemo(() => new IKSolver(), []);
  const { scene } = useThree();
  const tempVec = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const state = useRigStore.getState();
    const isDragging = state.isDragging;
    const followTarget = state.followTarget;
    const targets = Object.values(state.targets);

    if (followTarget) {
      // Run 5 iterations per frame for a smooth but stable approach
      solver.solve(5, scene); 
    }

    // FK Snap Logic (Arm drives target when IK is OFF)
    if (!followTarget && !isDragging) {
      let needsUpdate = false;
      const setTargetPosition = useRigStore.getState().setTargetPosition;
      
      targets.forEach(target => {
        if (!target.endEffectorId) return;

        // Find the actual physical tip of the arm in the scene
        const tipObj = scene.getObjectByName(`tip-${target.endEffectorId}`);
        if (tipObj) {
          tipObj.getWorldPosition(tempVec);
          
          // Check if it actually moved to avoid unnecessary state updates
          const dist = tempVec.distanceTo(new Vector3(target.position.x, target.position.y, target.position.z));
          if (dist > 0.001) {
            setTargetPosition(target.id, { x: tempVec.x, y: tempVec.y, z: tempVec.z });
          }
        }
      });
    }
  });

  return null; // This component has no visuals, it only runs math in the render loop
}
