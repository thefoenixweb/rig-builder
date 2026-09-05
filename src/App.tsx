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
    const store = useRigStore.getState();
    if (Object.keys(store.nodes).length === 0) {
      store.addNode('root', { x: 0, y: 0, z: 0 });

      // We will just artificially set the link scale of the root so it draws a 10 unit arm
      useRigStore.setState(state => {
        const rootNode = state.nodes['root'];
        if (!rootNode) return state;
        return {
          nodes: {
            ...state.nodes,
            'root': {
              ...rootNode,
              offset: {
                ...rootNode.offset,
                scale: { x: 1, y: 5, z: 1 }
              }
            }
          }
        };
      });
    }
  }, []);

  return (
    <>
      <Toolbar />
      <HierarchyTree />
      <InspectorPanel />
      <Canvas 
        camera={{ position: [20, 20, 20], fov: 45 }} 
        style={{ width: '100vw', height: '100vh', display: 'block' }}
        onPointerMissed={() => useRigStore.getState().setSelectedNode(null)}
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
        <RigTargetView />
        <IKManager />

        <OrbitControls makeDefault />
      </Canvas>
    </>
  );
}
