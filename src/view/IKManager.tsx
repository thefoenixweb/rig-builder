import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import { IKSolver } from '../ik/IKSolver';
import { useRigStore } from '../state/rigStore';

export function IKManager() {
  const solver = useMemo(() => new IKSolver(), []);

  useFrame(() => {
    // We only want to solve if we have an active end effector target and follow is true
    // This allows the solver to smoothly interpolate per frame
    solver.solve(5); // Run 5 iterations per frame for a smooth but stable approach
  });

  return null; // This component has no visuals, it only runs math in the render loop
}
