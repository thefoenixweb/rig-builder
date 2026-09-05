import React from 'react';
import { useRigStore } from '../state/rigStore';
import { v4 as uuidv4 } from 'uuid';

export function Toolbar() {
  const followTarget = useRigStore(state => state.followTarget);
  const setFollowTarget = useRigStore(state => state.setFollowTarget);
  const addTarget = useRigStore(state => state.addTarget);

  const handleSpawnTarget = () => {
    const id = `target-${uuidv4().substring(0, 4)}`;
    addTarget(id, { x: 5, y: 5, z: 0 });
  };

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10,
      background: '#333',
      color: 'white',
      padding: '10px 20px',
      borderRadius: 8,
      display: 'flex',
      gap: 20,
      alignItems: 'center'
    }}>
      <button 
        onClick={handleSpawnTarget}
        style={{ padding: '8px 16px', background: '#444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        Spawn IK Target
      </button>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input 
          type="checkbox" 
          checked={followTarget} 
          onChange={(e) => setFollowTarget(e.target.checked)} 
        />
        Follow Target (IK)
      </label>
    </div>
  );
}
