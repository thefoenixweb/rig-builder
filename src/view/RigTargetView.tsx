import React from 'react';
import { useRigStore } from '../state/rigStore';
import { TransformControls } from '@react-three/drei';

export function RigTargetView() {
  const targets = useRigStore(state => state.targets);
  const setTargetPosition = useRigStore(state => state.setTargetPosition);

  return (
    <>
      {Object.values(targets).map((target) => (
        <TransformControls
          key={target.id}
          mode="translate"
          position={[target.position.x, target.position.y, target.position.z]}
          onMouseUp={(e) => {
            const targetObj = e?.target as any;
            const newPos = targetObj?.object?.position || targetObj?.position;
            if (newPos) {
              setTargetPosition(target.id, { x: newPos.x, y: newPos.y, z: newPos.z });
            }
          }}
        >
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} transparent opacity={0.8} />
          </mesh>
        </TransformControls>
      ))}
    </>
  );
}
