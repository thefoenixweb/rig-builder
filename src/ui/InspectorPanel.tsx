import React, { useEffect } from 'react';
import { useRigStore } from '../state/rigStore';

export function InspectorPanel() {
  const nodes = useRigStore(state => state.nodes);
  const setNodeRotation = useRigStore(state => state.setNodeRotation);
  const setConstraintType = useRigStore(state => state.setConstraintType);
  const selectedId = useRigStore(state => state.selectedNodeId);
  const setSelectedId = useRigStore(state => state.setSelectedNode);

  const nodeList = Object.values(nodes);

  // Auto-select logic removed to allow deselection (empty state)

  if (nodeList.length === 0) return null;

  const node = nodes[selectedId ?? ''];

  return (
    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, background: '#333', color: 'white', padding: 20, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 15, maxHeight: '80vh', overflowY: 'auto', minWidth: 250 }}>
      <h3 style={{ margin: 0 }}>Inspector (FK)</h3>
      <hr style={{ width: '100%', borderColor: '#555', margin: 0 }} />

      <select
        style={{ color: 'black', padding: '5px', borderRadius: '4px' }}
        value={selectedId || ""}
        onChange={e => setSelectedId(e.target.value)}
      >
        <option value="" disabled>Select a node...</option>
        {nodeList.map(n => (
          <option key={n.id} value={n.id}>{n.name}</option>
        ))}
      </select>

      {node && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 10, background: '#222', borderRadius: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Constraint:</strong>
            <select
              style={{ color: 'black', fontSize: 12 }}
              value={node.constraint}
              onChange={e => setConstraintType(node.id, e.target.value as any)}
            >
              <option value="none">None</option>
              <option value="bender">Bender (Z-Hinge)</option>
              <option value="spinner">Spinner (Y-Twist)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 5 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: node.constraint === 'spinner' || node.constraint === 'bender' ? 0.3 : 1 }}>
              <span>X: {(node.rotation.rotation.x * 180 / Math.PI).toFixed(1)}°</span>
              <input
                type="range"
                min={node.min} max={node.max} step={0.01}
                value={node.rotation.rotation.x}
                onChange={e => setNodeRotation(node.id, 'x', parseFloat(e.target.value))}
                disabled={node.constraint === 'spinner' || node.constraint === 'bender'}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: node.constraint === 'bender' ? 0.3 : 1 }}>
              <span>Y: {(node.rotation.rotation.y * 180 / Math.PI).toFixed(1)}°</span>
              <input
                type="range"
                min={node.min} max={node.max} step={0.01}
                value={node.rotation.rotation.y}
                onChange={e => setNodeRotation(node.id, 'y', parseFloat(e.target.value))}
                disabled={node.constraint === 'bender'}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: node.constraint === 'spinner' ? 0.3 : 1 }}>
              <span>Z: {(node.rotation.rotation.z * 180 / Math.PI).toFixed(1)}°</span>
              <input
                type="range"
                min={node.min} max={node.max} step={0.01}
                value={node.rotation.rotation.z}
                onChange={e => setNodeRotation(node.id, 'z', parseFloat(e.target.value))}
                disabled={node.constraint === 'spinner'}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
