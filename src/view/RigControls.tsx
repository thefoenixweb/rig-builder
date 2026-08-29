import React, { useState } from 'react';
import { useRigStore } from '../state/rigStore';

export function RigControls() {
  const nodes = useRigStore(state => state.nodes);
  const addNode = useRigStore(state => state.addNode);

  const [constraint, setConstraint] = useState<'bender' | 'spinner'>('bender');

  const handleAddNode = () => {
    const id = `node_${Date.now().toString().slice(-4)}`;
    // Spawn spaced out along the X axis so they don't overlay
    const nodeCount = Object.keys(nodes).length;
    addNode(id, { x: nodeCount * 5, y: 0, z: 0 });

    // Randomize length 
    useRigStore.setState(state => {
      const newNode = state.nodes[id];
      if (!newNode) return state;
      return {
        nodes: {
          ...state.nodes,
          [id]: {
            ...newNode,
            offset: {
              ...newNode.offset,
              scale: { x: 1, y: 3 + Math.random() * 4, z: 1 }
            },
            constraint
          }
        }
      };
    });
  };

  return (
    <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: '#333', color: 'white', padding: 20, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0 }}>Rig Controls</h3>

      <div style={{ display: 'flex', gap: 10 }}>
        <select style={{ color: 'black' }} value={constraint} onChange={e => setConstraint(e.target.value as any)}>
          <option value="bender">Bender (Hinge)</option>
          <option value="spinner">Spinner (Twist)</option>
        </select>
        <button onClick={handleAddNode} style={{ color: 'black' }}>Spawn Rogue Node</button>
      </div>
    </div>
  );
}

