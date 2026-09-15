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

    // fkDirty processing moved to RigVisualizer useEffect to guarantee React props are flushed

    if (followTarget && !state.isFkDragging) {
      // Run 5 iterations per frame for a smooth but stable approach
      solver.solve(5, scene); 
    }

  });

  return null; // This component has no visuals, it only runs math in the render loop
}
