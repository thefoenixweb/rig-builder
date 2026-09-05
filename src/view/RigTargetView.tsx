import React from 'react';
import { useRigStore } from '../state/rigStore';
import { TransformControls } from '@react-three/drei';

import type { ITarget } from '../types';

export function RigTargetView() {
  const allTargets = useRigStore(state => state.targets);
  const setTargetPosition = useRigStore(state => state.setTargetPosition);
  const setTargetRotation = useRigStore(state => state.setTargetRotation);
  const selectedTargetId = useRigStore(state => state.selectedTargetId);
  const setSelectedTarget = useRigStore(state => state.setSelectedTarget);
  const controlMode = useRigStore(state => state.controlMode);
  const controlSpace = useRigStore(state => state.controlSpace);
  const setIsDragging = useRigStore(state => state.setIsDragging);

  const targetsToRender = Object.values(allTargets);

  return (
    <>
      {targetsToRender.map((target) => {
        const isSelected = selectedTargetId === target.id;
        
        if (isSelected) {
          return (
            <TransformControls
              key={target.id}
              mode={controlMode}
              space={controlSpace}
              position={[target.position.x, target.position.y, target.position.z]}
              rotation={[target.rotation.x, target.rotation.y, target.rotation.z]}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={(e) => {
                setIsDragging(false);
                const targetObj = e?.target as any;
                const newPos = targetObj?.object?.position;
                const newRot = targetObj?.object?.rotation;
                if (newPos && controlMode === 'translate') {
                  setTargetPosition(target.id, { x: newPos.x, y: newPos.y, z: newPos.z });
                }
                if (newRot && controlMode === 'rotate') {
                  setTargetRotation(target.id, 'x', newRot.x);
                  setTargetRotation(target.id, 'y', newRot.y);
                  setTargetRotation(target.id, 'z', newRot.z);
                }
              }}
            >
              <mesh 
                name={target.id} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!useRigStore.getState().isDragging) {
                    setSelectedTarget(target.id);
                  }
                }}
              >
                <sphereGeometry args={[0.5, 16, 16]} />
                <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.8} transparent opacity={0.8} />
              </mesh>
            </TransformControls>
          );
        }

        return (
          <mesh 
            key={target.id}
            name={target.id} 
            position={[target.position.x, target.position.y, target.position.z]}
            rotation={[target.rotation.x, target.rotation.y, target.rotation.z]}
            onClick={(e) => {
              e.stopPropagation();
              if (!useRigStore.getState().isDragging) {
                setSelectedTarget(target.id);
              }
            }}
          >
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} transparent opacity={0.8} />
          </mesh>
        );
      })}
    </>
  );
}
