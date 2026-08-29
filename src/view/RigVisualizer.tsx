import React, { useEffect } from 'react';
import { useRigStore } from '../state/rigStore';

export function RigVisualizer() {
  const nodes = useRigStore((state) => Object.values(state.nodes));

  return (
    <>
      {nodes.map((node) => {

        const { position, rotation, scale } = node.offset;


        const length = scale.y;

        // Read dynamic visual parameters
        const params = node.meshParameters || {
          jointRadius: 1,
          jointThickness: 1,
          armRadius: 0.5,
          color: "#aaaaaa"
        };

        const isBender = node.constraint === "bender";

        // Bender joints look like hinges 
        // Spinner joints look like twisting segments 
        const jointRotation = isBender ? [Math.PI / 2, 0, 0] as [number, number, number] : [0, 0, 0] as [number, number, number];

        return (
          <group
            key={node.id}
            position={[position.x, position.y, position.z]}
            rotation={[rotation.x, rotation.y, rotation.z]}
          >
            {/* The Joint (Pivot point) */}
            <mesh rotation={jointRotation}>
              <cylinderGeometry args={[params.jointRadius, params.jointRadius, params.jointThickness, 32]} />
              <meshStandardMaterial color="#4488ff" />
            </mesh>

            {/* The Link (Arm segment) - offset by half its length so its base sits exactly on the joint */}
            <mesh position={[0, length / 2, 0]}>
              <cylinderGeometry args={[params.armRadius, params.armRadius, length, 16]} />
              <meshStandardMaterial color={params.color} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
