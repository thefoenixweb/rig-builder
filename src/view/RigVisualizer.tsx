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

        // Combine the static structural offset with the dynamic FK rotation
        const dynamicRot = node.rotation.rotation;
        const totalRotation: [number, number, number] = [
          rotation.x + dynamicRot.x,
          rotation.y + dynamicRot.y,
          rotation.z + dynamicRot.z
        ];

        return (
          <group
            key={node.id}
            position={[position.x, position.y, position.z]}
            rotation={totalRotation}
          >
            {/* The Joint (Pivot point) */}
            <mesh rotation={jointRotation}>
              <cylinderGeometry args={[params.jointRadius, params.jointRadius, params.jointThickness, 32]} />
              <meshStandardMaterial color="#4488ff" />
            </mesh>

            {/* The Link (Arm segment) - offset by half its length so its base sits exactly on the joint */}
            <group position={[0, length / 2, 0]}>
              <mesh>
                <cylinderGeometry args={[params.armRadius, params.armRadius, length, 16]} />
                <meshStandardMaterial color={params.color} />
              </mesh>
              
              {/* Visual Indicator: A small protrusion to make spinning (twisting) visible */}
              <mesh position={[params.armRadius, 0, 0]}>
                <boxGeometry args={[params.armRadius, length * 0.8, params.armRadius / 2]} />
                <meshStandardMaterial color="#333333" />
              </mesh>
            </group>
          </group>
        );
      })}
    </>
  );
}
