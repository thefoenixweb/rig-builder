import React, { useEffect } from 'react';
import { useRigStore } from '../state/rigStore';
import { TransformControls } from '@react-three/drei';
import type { INode } from '../types';

const RigNodeView = ({ node, allNodes }: { node: INode, allNodes: INode[] }) => {
  const stateSelectedId = useRigStore(state => state.selectedNodeId);
  const setNodePosition = useRigStore(state => state.setNodePosition);

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

  const isSelected = stateSelectedId === node.id;
  const canTranslate = node.parentId === null;

  const children = allNodes.filter(n => n.parentId === node.id);

  const nodeGroup = (
    <group
      key={node.id}
      {...(canTranslate ? (!isSelected ? { position: [position.x, position.y, position.z] } : {}) : { position: [0, 0, 0] })}
      rotation={totalRotation}
      onClick={(e) => {
        e.stopPropagation();
        useRigStore.getState().setSelectedNode(node.id);
      }}
    >
      {/* The Joint (Pivot point) */}
      <mesh rotation={jointRotation}>
        <cylinderGeometry args={[params.jointRadius, params.jointRadius, params.jointThickness, 32]} />
        <meshStandardMaterial color={isSelected ? "#ffaa00" : "#4488ff"} />
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

      {/* Render children at the TIP of the arm so they are mechanically attached */}
      <group position={[0, length, 0]}>
        {children.map(child => (
          <RigNodeView key={child.id} node={child} allNodes={allNodes} />
        ))}
      </group>
    </group>
  );

  if (isSelected && canTranslate) {
    return (
      <TransformControls 
        key={`tc-${node.id}`} 
        mode="translate"
        position={[position.x, position.y, position.z]}
        onMouseUp={(e) => {
          const target = e?.target as any;
          const newPos = target?.object?.position || target?.position;
          if (newPos) {
            setNodePosition(node.id, { x: newPos.x, y: newPos.y, z: newPos.z });
          }
        }}
      >
        {nodeGroup}
      </TransformControls>
    );
  }

  return nodeGroup;
}

export function RigVisualizer() {
  const nodes = useRigStore((state) => Object.values(state.nodes));
  const rootNodes = nodes.filter(n => n.parentId === null);

  return (
    <>
      {rootNodes.map((node) => (
        <RigNodeView key={node.id} node={node} allNodes={nodes} />
      ))}
    </>
  );
}
