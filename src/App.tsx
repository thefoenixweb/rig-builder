import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { RigVisualizer } from './view/RigVisualizer';
import { useRigStore } from './state/rigStore';
import { useEffect } from 'react';

import { HierarchyTree } from './ui/HierarchyTree';
import { InspectorPanel } from './ui/InspectorPanel';
import { Toolbar } from './ui/Toolbar';
import { RigTargetView } from './view/RigTargetView';
import { IKManager } from './view/IKManager';

export default function App() {
  // Inject mock nodes to prove the visualizer works
  useEffect(() => {
    // Global fail-safe to prevent isDragging from getting permanently stuck 
    // if the user releases the mouse outside the canvas!
    const handlePointerUp = () => {
      if (useRigStore.getState().isDragging) {
        useRigStore.getState().setIsDragging(false);
      }
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  return (
    <>
      <Toolbar />
      <HierarchyTree />
      <InspectorPanel />
      <Canvas 
        camera={{ position: [20, 20, 20], fov: 45 }} 
        style={{ width: '100vw', height: '100vh', display: 'block' }}
        onPointerMissed={() => {
          if (!useRigStore.getState().isDragging) {
            useRigStore.getState().setSelectedNode(null);
            useRigStore.getState().setSelectedTarget(null);
          }
        }}
      >
        <color attach="background" args={['#1a1a1a']} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />

        <Grid
          infiniteGrid
          fadeDistance={200}
          sectionColor="#444444"
          cellColor="#222222"
        />

        <RigVisualizer />
        <IKManager />
        <RigTargetView />

        <OrbitControls makeDefault />
      </Canvas>
    </>
  );
}
