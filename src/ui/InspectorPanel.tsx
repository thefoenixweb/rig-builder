import React, { useEffect } from 'react';
import { useRigStore } from '../state/rigStore';

export function InspectorPanel() {
  const nodes = useRigStore(state => state.nodes);
  const setNodeRotation = useRigStore(state => state.setNodeRotation);
  const setConstraintType = useRigStore(state => state.setConstraintType);
  const selectedNodeId = useRigStore(state => state.selectedNodeId);
  const selectedTargetId = useRigStore(state => state.selectedTargetId);
  const setSelectedNode = useRigStore(state => state.setSelectedNode);
  const setSelectedTarget = useRigStore(state => state.setSelectedTarget);
  const targets = useRigStore(state => state.targets);
  const assignTarget = useRigStore(state => state.assignTarget);
  const setTargetPosition = useRigStore(state => state.setTargetPosition);
  const setTargetRotation = useRigStore(state => state.setTargetRotation);

  const nodeList = Object.values(nodes);
  const targetList = Object.values(targets);

  // Auto-select logic removed to allow deselection (empty state)

  if (nodeList.length === 0 && targetList.length === 0) return null;

  const node = nodes[selectedNodeId ?? ''];
  const target = targets[selectedTargetId ?? ''];

  return (
    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, background: '#333', color: 'white', padding: 20, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 15, maxHeight: '80vh', overflowY: 'auto', minWidth: 250 }}>
      <h3 style={{ margin: 0 }}>Inspector (FK)</h3>
      <hr style={{ width: '100%', borderColor: '#555', margin: 0 }} />

      <select
        style={{ color: 'black', padding: '5px', borderRadius: '4px' }}
        value={selectedNodeId || selectedTargetId || ""}
        onChange={e => {
          const val = e.target.value;
          if (nodes[val]) setSelectedNode(val);
          else if (targets[val]) setSelectedTarget(val);
        }}
      >
        <option value="" disabled>Select an object...</option>
        <optgroup label="Nodes">
          {nodeList.map(n => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </optgroup>
        <optgroup label="Targets">
          {targetList.map(t => (
            <option key={t.id} value={t.id}>{t.id}</option>
          ))}
        </optgroup>
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

          <div style={{ marginTop: 10, padding: 10, background: '#444', borderRadius: 4 }}>
            <strong style={{ fontSize: 12, display: 'block', marginBottom: 5 }}>IK Target Assignment:</strong>
            <select
              style={{ width: '100%', padding: 4, borderRadius: 4, color: 'black' }}
              value={targetList.find(t => t.endEffectorId === node.id)?.id || ""}
              onChange={e => {
                const targetId = e.target.value;
                if (targetId) {
                  assignTarget(targetId, node.id);
                } else {
                  // Unassign from all targets that currently point to this node
                  targetList.forEach(t => {
                    if (t.endEffectorId === node.id) assignTarget(t.id, null as any); // Type safety override, need to allow null in assignTarget
                  });
                }
              }}
            >
              <option value="">None (Not an End Effector)</option>
              {targetList.map(t => (
                <option key={t.id} value={t.id}>{t.id}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {target && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 10, background: '#222', borderRadius: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Target Offset (Position):</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 5, fontSize: 12 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>X: {target.position.x.toFixed(2)}</span>
              <input type="range" min={-50} max={50} step={0.1} value={target.position.x} onChange={e => setTargetPosition(target.id, { ...target.position, x: parseFloat(e.target.value) })} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Y: {target.position.y.toFixed(2)}</span>
              <input type="range" min={-50} max={50} step={0.1} value={target.position.y} onChange={e => setTargetPosition(target.id, { ...target.position, y: parseFloat(e.target.value) })} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Z: {target.position.z.toFixed(2)}</span>
              <input type="range" min={-50} max={50} step={0.1} value={target.position.z} onChange={e => setTargetPosition(target.id, { ...target.position, z: parseFloat(e.target.value) })} />
            </label>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <strong>Target Rotation:</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 5, fontSize: 12 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>X: {(target.rotation.x * 180 / Math.PI).toFixed(1)}°</span>
              <input type="range" min={-Math.PI} max={Math.PI} step={0.01} value={target.rotation.x} onChange={e => setTargetRotation(target.id, 'x', parseFloat(e.target.value))} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Y: {(target.rotation.y * 180 / Math.PI).toFixed(1)}°</span>
              <input type="range" min={-Math.PI} max={Math.PI} step={0.01} value={target.rotation.y} onChange={e => setTargetRotation(target.id, 'y', parseFloat(e.target.value))} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Z: {(target.rotation.z * 180 / Math.PI).toFixed(1)}°</span>
              <input type="range" min={-Math.PI} max={Math.PI} step={0.01} value={target.rotation.z} onChange={e => setTargetRotation(target.id, 'z', parseFloat(e.target.value))} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
