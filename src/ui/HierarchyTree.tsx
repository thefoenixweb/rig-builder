import React, { useState } from 'react';
import { useRigStore } from '../state/rigStore';

export function HierarchyTree() {
  const nodes = useRigStore(state => state.nodes);
  const addNode = useRigStore(state => state.addNode);
  const removeNode = useRigStore(state => state.removeNode);
  const parentNode = useRigStore(state => state.parentNode);
  const unparentNode = useRigStore(state => state.unparentNode);
  const selectedId = useRigStore(state => state.selectedNodeId);
  const setSelectedId = useRigStore(state => state.setSelectedNode);

  const [constraint, setConstraint] = useState<'bender' | 'spinner'>('bender');

  const handleAddNode = () => {
    const id = `node_${Date.now().toString().slice(-4)}`;
    const nodeCount = Object.keys(nodes).length;
    addNode(id, { x: nodeCount * 5, y: 0, z: 0 });

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

  const nodeList = Object.values(nodes);

  return (
    <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: '#333', color: 'white', padding: 20, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 15, maxHeight: '80vh', overflowY: 'auto', minWidth: 250 }}>
      <h3 style={{ margin: 0 }}>Hierarchy Tree</h3>
      <hr style={{ width: '100%', borderColor: '#555', margin: 0 }} />
      
      <div style={{ display: 'flex', gap: 10 }}>
        <select style={{ color: 'black' }} value={constraint} onChange={e => setConstraint(e.target.value as any)}>
          <option value="bender">Bender</option>
          <option value="spinner">Spinner</option>
        </select>
        <button onClick={handleAddNode} style={{ color: 'black', cursor: 'pointer' }}>Spawn Node</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
        {nodeList.map(node => (
          <div 
            key={node.id} 
            style={{ 
              background: selectedId === node.id ? '#555' : '#222', 
              padding: 10, 
              borderRadius: 4,
              border: selectedId === node.id ? '1px solid #ffaa00' : '1px solid transparent',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedId(node.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{node.name}</strong>
              <button 
                onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
                style={{ color: 'white', background: '#d32f2f', border: 'none', borderRadius: 3, padding: '2px 8px', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
            
            <div style={{ marginTop: 8, fontSize: 12 }}>
              {node.parentId ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Child of: <strong>{nodes[node.parentId]?.name || node.parentId}</strong></span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); unparentNode(node.id); }}
                    style={{ color: 'black', background: '#ccc', border: 'none', borderRadius: 3, padding: '2px 8px', cursor: 'pointer' }}
                  >
                    Unlink
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>Parent to:</span>
                  <select 
                    style={{ color: 'black', flex: 1 }}
                    value=""
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.value) parentNode(node.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="" disabled>Select parent...</option>
                    {nodeList.filter(n => n.id !== node.id).map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}
        {nodeList.length === 0 && <div style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }}>No nodes in scene</div>}
      </div>
    </div>
  );
}
