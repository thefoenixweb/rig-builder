import { useEffect, useRef } from 'react';
import { useRigStore } from '../state/rigStore';

interface ActionState {
  index: number;
  startTime: number;
  startPos?: { x: number; y: number; z: number };
  startRot?: { x: number; y: number; z: number };
  startGrip?: number;
  targetGripNodeId?: string | null;
}

export function AnimationManager() {
  const requestRef = useRef<number>();
  const activeActions = useRef<Record<string, ActionState>>({});

  useEffect(() => {
    const animate = (time: number) => {
      const state = useRigStore.getState();
      const targets = state.targets;

      for (const targetId in targets) {
        const target = targets[targetId];
        if (!target) continue;

        if (target.isAnimating && target.actions.length > 0) {
          const currentIndex = target.currentActionIndex;
          const action = target.actions[currentIndex];
          if (!action) continue;

          let actionState = activeActions.current[targetId];

          // If we just started a new action (index changed or starting fresh)
          if (!actionState || actionState.index !== currentIndex) {

            let targetGripNodeId: string | null = null;
            if (action.type === 'grip' && target.endEffectorId) {
              const effectorNode = state.nodes[target.endEffectorId];
              if (effectorNode?.type === "gripper") {
                targetGripNodeId = effectorNode.id;
              } else {
                for (const node of Object.values(state.nodes)) {
                  if (node.parentId === target.endEffectorId && node.type === "gripper") {
                    targetGripNodeId = node.id;
                    break;
                  }
                }
              }
            }

            const newActionState: ActionState = {
              index: currentIndex,
              startTime: time,
              startPos: { ...target.position },
              startRot: { ...target.rotation },
              startGrip: targetGripNodeId ? (state.nodes[targetGripNodeId]?.gripAmount ?? 0) : 0,
              targetGripNodeId
            };
            activeActions.current[targetId] = newActionState;
            actionState = newActionState;
          }

          let isComplete = false;

          if (action.type === "move") {
            // Let's say a move takes 2000ms by default (we can configure speed later)
            const moveDuration = 2000;
            let t = (time - actionState.startTime) / moveDuration;
            if (t >= 1) {
              t = 1;
              isComplete = true;
            }
            if (actionState.startPos && action.position) {
              const newPos = {
                x: actionState.startPos.x + (action.position.x - actionState.startPos.x) * t,
                y: actionState.startPos.y + (action.position.y - actionState.startPos.y) * t,
                z: actionState.startPos.z + (action.position.z - actionState.startPos.z) * t,
              };
              state.setTargetPosition(targetId, newPos);
            }
          } else if (action.type === "grip") {
            const gripDuration = 500;
            let t = (time - actionState.startTime) / gripDuration;
            if (t >= 1) {
              t = 1;
              isComplete = true;
            }
            if (actionState.startGrip !== undefined && action.gripAmount !== undefined && actionState.targetGripNodeId) {
              const newGrip = actionState.startGrip + (action.gripAmount - actionState.startGrip) * t;
              state.setGripAmount(actionState.targetGripNodeId, newGrip);
            }
          }

          if (isComplete) {
            // Go to next action
            const nextIndex = (currentIndex + 1) % target.actions.length;
            state.setTargetActionIndex(targetId, nextIndex);
            // Delete action state so it re-initializes on the next frame
            delete activeActions.current[targetId];
          }

        } else {
          if (activeActions.current[targetId]) {
            delete activeActions.current[targetId];
          }
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return null;
}
